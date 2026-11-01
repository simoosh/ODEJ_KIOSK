import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { GeoJSONSource, LngLat as MlLngLat, Map as MlMap, Marker, PaddingOptions, TransformConstrainFunction } from 'maplibre-gl';
import type { BasemapId, Boundary, KioskData, Locale } from '../types';
import { CONFIG, QUALITY, type QualityLevel } from '../config';
import { titleOf } from '../data/model';
import { styleFor, SKY, TERRAIN_SPEC } from './basemaps';
import {
  addBoundaryLayers,
  addMarkerLayers,
  MARKER_LAYER,
  MARKER_SOURCE,
  markerCollection,
  pickMarker,
  placeEstablishments,
  rasterizeMarkers,
  scaleMarkerLayers,
  SELECTED_LAYER,
  selectedLabelOffset,
  syncMarkerLayers,
  type MarkerImages,
  type PlacedEstablishment,
} from './markers';
import { boundaryPoints, bounds, distanceKm, expandBounds, frameCamera, type LngLat } from '../lib/geo';

export interface MapHandle {
  /** Pour le panneau ?debug=1 */
  getMap(): MlMap | null;
  /** Animation d'entrée : de la vue d'attente à la wilaya en 3D */
  enter(): void;
  /** Retour à la vue d'attente (accueil) */
  attract(): void;
  focus(id: string): void;
  fitPoints(points: LngLat[]): void;
  whole(): void;
  zoomBy(delta: number): void;
  tiltBy(delta: number): void;
  rotateBy(delta: number): void;
  resetNorth(): void;
  toggle3d(): void;
  orbit(on: boolean): void;
}

interface Props {
  data: KioskData;
  boundary: Boundary | null;
  locale: Locale;
  basemap: BasemapId;
  terrain: boolean;
  selectedId: string | null;
  /** Établissements mis en avant (filtre) ; les autres sont atténués. null = tous */
  highlightIds: Set<string> | null;
  padding: PaddingOptions;
  markersVisible: boolean;
  quality: QualityLevel;
  /** Élément de la boussole : tourné directement, sans passer par React */
  compass: RefObject<HTMLElement | null>;
  onSelect(id: string): void;
  on3dChange(on: boolean): void;
  onOrbitChange(on: boolean): void;
  onBasemapFailed(id: BasemapId): void;
  /** FPS mesuré pendant l'entrée sur la carte */
  onEntryFps(fps: number): void;
}

// Avec un bundler, MapLibre ne trouve pas son worker tout seul
maplibregl.setWorkerUrl(workerUrl);

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pixelRatioFor = (quality: QualityLevel) => Math.min(window.devicePixelRatio, QUALITY[quality].maxPixelRatio);

/** Seul le centre est limité : maxBounds contraint tout l'écran et interdit le zoom qui montre la wilaya entière. */
const centerInside =
  ([[w, s], [e, n]]: [LngLat, LngLat]): TransformConstrainFunction =>
  (center: MlLngLat, zoom: number) => ({
    center: new maplibregl.LngLat(Math.min(e, Math.max(w, center.lng)), Math.min(n, Math.max(s, center.lat))),
    zoom,
  });

const POP_BATCH = 6;
const POP_INTERVAL_MS = 120;

export const MapView = memo(forwardRef<MapHandle, Props>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const placedRef = useRef<PlacedEstablishment[]>([]);
  /** Nombre de marqueurs affichés, dans l'ordre de placedRef */
  const shownRef = useRef(0);
  const popTimer = useRef(0);
  const imagesRef = useRef<MarkerImages | null>(null);
  const labelRef = useRef<Marker | null>(null);
  const rotation = useRef<{ raf: number; speed: number; last: number; onStop?: () => void } | null>(null);
  /** Invalide le tour ou l'animation programmés si une autre animation démarre entre-temps */
  const moveSeq = useRef(0);
  const tourTimer = useRef(0);
  /** La vue d'ensemble se recadre quand le panneau change de place ; pas une vue choisie par l'utilisateur */
  const framedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  // Les callbacks changent à chaque rendu : on les garde dans une ref pour les écouteurs de la carte.
  const live = useRef(props);
  live.current = props;

  /* ------------------------------------------------------------------ init */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MlMap;
    try {
      const first = styleFor('preview', live.current.locale);
      map = new maplibregl.Map({
        container,
        style: 'style' in first ? first.style : first.url,
        ...CONFIG.tourViewpoints[0],
        maxPitch: CONFIG.maxPitch,
        minZoom: CONFIG.minZoom,
        transformConstrain: centerInside(CONFIG.maxBounds),
        attributionControl: { compact: true, customAttribution: 'Données : ODEJ Béjaïa' },
        fadeDuration: 0,
        pixelRatio: pixelRatioFor(live.current.quality),
        canvasContextAttributes: { antialias: false },
        maxTileCacheSize: CONFIG.maxTileCacheSize,
      });
    } catch (err) {
      console.error(err);
      setFailed(true);
      return;
    }
    mapRef.current = map;

    // Relief, ciel et marqueurs après chaque changement de style
    map.on('style.load', () => {
      applyTerrain(map, live.current.terrain);
      try {
        const m = map as unknown as { setSky?: (s: unknown) => void };
        m.setSky?.(SKY);
      } catch {
        /* version sans ciel */
      }
      installMarkers();
    });

    rasterizeMarkers(live.current.data.categories)
      .then((images) => {
        imagesRef.current = images;
        installMarkers();
      })
      .catch((err) => console.error(err));

    // Détection d'un fond de carte inaccessible (pas d'internet, hôte bloqué)
    let errors = 0;
    map.on('data', (e: any) => {
      if (e.dataType === 'source' && e.tile && e.sourceId !== 'dem' && e.sourceId !== MARKER_SOURCE) errors = 0;
    });
    map.on('error', (e: any) => {
      const current = live.current.basemap;
      if (current === 'preview') return;
      // On ne compte que les échecs réseau (style ou tuiles), pas les avertissements de validation
      const err = e?.error;
      if (!err || !(typeof err.status === 'number' || /fetch|network|failed|load/i.test(String(err.message)))) return;
      errors += 1;
      // Sans couche de marqueurs, c'est le style lui-même qui n'a pas chargé : la carte resterait vide
      if (errors === CONFIG.basemapMaxErrors || !map.getLayer(MARKER_LAYER)) live.current.onBasemapFailed(current);
    });
    (map as unknown as { __resetBasemapErrors: () => void }).__resetBasemapErrors = () => {
      errors = 0;
    };

    // Jamais de setState ici : la boussole s'écrit dans le DOM, l'état 2D/3D attend la fin du mouvement
    let bearing = 0;
    map.on('move', () => {
      const next = map.getBearing();
      if (next === bearing) return;
      bearing = next;
      const compass = live.current.compass.current;
      if (compass) compass.style.transform = `rotate(${-next}deg)`;
    });
    map.on('moveend', () => live.current.on3dChange(map.getPitch() > 5));

    // Zone de toucher d'au moins 44 × 44 px autour du doigt
    map.on('click', (e) => {
      if (!map.getLayer(MARKER_LAYER)) return;
      const { x, y } = e.point;
      const features = map.queryRenderedFeatures(
        [
          [x - CONFIG.touchRadius, y - CONFIG.touchRadius],
          [x + CONFIG.touchRadius, y + CONFIG.touchRadius],
        ],
        { layers: [MARKER_LAYER, SELECTED_LAYER] },
      );
      const hits = features.map((feature) => {
        const id = String(feature.properties.id);
        const position = placedRef.current.find((p) => p.est.id === id)?.position;
        const point = position ? map.project(position) : e.point;
        return { id, distance: point.dist(e.point) };
      });
      const id = pickMarker(hits, live.current.selectedId);
      if (id) live.current.onSelect(id);
    });
    for (const layer of [MARKER_LAYER, SELECTED_LAYER]) {
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
      });
    }

    // Toute interaction de l'utilisateur arrête la rotation automatique
    const stopOnUser = (e: any) => {
      if (!e.originalEvent) return;
      framedRef.current = false;
      stopRotation();
    };
    map.on('dragstart', stopOnUser);
    map.on('zoomstart', stopOnUser);
    map.on('pitchstart', stopOnUser);
    map.on('rotatestart', stopOnUser);

    // Conteneur redimensionné (simulateur d'écran, rotation portrait/paysage)
    const ro = new ResizeObserver(() => {
      map.resize();
      scaleMarkerLayers(map);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      stopRotation();
      window.clearTimeout(popTimer.current);
      window.clearTimeout(tourTimer.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------- fond de carte */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map as unknown as { __resetBasemapErrors?: () => void }).__resetBasemapErrors?.();
    const spec = styleFor(props.basemap, props.locale);
    // Le relief de l'ancien style fait planter le rendu tant que le nouveau charge : style.load le remet
    applyTerrain(map, false);
    map.setMaxZoom(props.basemap === 'satellite' ? CONFIG.satelliteMaxZoom : null);
    if ('url' in spec) {
      map.setStyle(spec.url, { diff: false, transformStyle: (_prev, next) => spec.transform(next) });
    } else {
      map.setStyle(spec.style, { diff: false });
    }
    // Un serveur qui ne répond jamais ne déclenche aucune erreur
    const timeout = window.setTimeout(() => {
      if (props.basemap !== 'preview' && !map.getLayer(MARKER_LAYER)) live.current.onBasemapFailed(props.basemap);
    }, CONFIG.basemapTimeoutMs);
    return () => window.clearTimeout(timeout);
    // la langue ne change que les libellés du plan vectoriel
  }, [props.basemap, props.basemap === 'plan' ? props.locale : null]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ----------------------------------------------------------------- relief */
  useEffect(() => {
    const map = mapRef.current;
    if (map) applyTerrain(map, props.terrain);
  }, [props.terrain]);

  /* ---------------------------------------------------------------- contour */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.boundary) return;
    map.setTransformConstrain(centerInside(expandBounds(bounds(boundaryPoints(props.boundary)), CONFIG.boundsMargin)));
  }, [props.boundary]);

  /* --------------------------------------------------------------- qualité */
  useEffect(() => {
    mapRef.current?.setPixelRatio(pixelRatioFor(props.quality));
  }, [props.quality]);

  /* -------------------------------------------------------------- marqueurs */
  useEffect(() => {
    placedRef.current = placeEstablishments(props.data.establishments, props.data.categories);
    pushMarkers();
  }, [props.data]);

  useEffect(() => {
    pushMarkers();
    syncSelection();
  }, [props.locale]);

  useEffect(() => {
    syncSelection();
  }, [props.selectedId, props.highlightIds]);

  // Masqués sur l'accueil ; réaffichés par popMarkers() pendant l'animation d'entrée
  useEffect(() => {
    if (props.markersVisible) return;
    window.clearTimeout(popTimer.current);
    shownRef.current = 0;
    pushMarkers();
  }, [props.markersVisible]);

  /* ----------------------------------------------------------- marge carte */
  // Les animations de caméra emportent la marge avec elles ; ici on ne corrige que la vue au repos
  // (rotation portrait/paysage, changement de langue qui déplace le panneau).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.markersVisible || map.isMoving()) return;
    map.easeTo({ ...(framedRef.current ? wilayaCamera(map) : {}), padding: props.padding, duration: 500 });
  }, [props.padding.top, props.padding.right, props.padding.bottom, props.padding.left]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Sources et couches disparaissent à chaque setStyle : on les réinstalle sur le nouveau style. */
  function installMarkers() {
    const map = mapRef.current;
    const images = imagesRef.current;
    if (!map || !images || map.getSource(MARKER_SOURCE)) return;
    try {
      if (live.current.boundary) addBoundaryLayers(map, live.current.boundary);
      addMarkerLayers(map, images);
    } catch {
      // Style remplacé entre-temps : son style.load relancera l'installation
      return;
    }
    pushMarkers();
    syncSelection();
  }

  function pushMarkers() {
    const source = mapRef.current?.getSource(MARKER_SOURCE) as GeoJSONSource | undefined;
    source?.setData(markerCollection(placedRef.current.slice(0, shownRef.current), live.current.locale));
  }

  function syncSelection() {
    const map = mapRef.current;
    if (!map) return;
    const { selectedId, highlightIds, locale } = live.current;
    syncMarkerLayers(map, selectedId, highlightIds);
    labelRef.current?.remove();
    labelRef.current = null;
    const placed = placedRef.current.find((p) => p.est.id === selectedId);
    if (!placed) return;
    const title = titleOf(placed.est);
    const element = document.createElement('div');
    element.className = 'mk-label';
    element.textContent = title[locale] ?? title.ar ?? '';
    labelRef.current = new maplibregl.Marker({ element, anchor: 'bottom', offset: selectedLabelOffset() }).setLngLat(placed.position).addTo(map);
  }

  /** Ajout par lots, du centre vers l'extérieur : un seul setData à chaque lot, aucune animation par marqueur. */
  function popMarkers(center: LngLat) {
    const distance = (p: PlacedEstablishment) => distanceKm(center, p.position);
    placedRef.current = [...placedRef.current].sort((a, b) => distance(a) - distance(b));
    window.clearTimeout(popTimer.current);
    shownRef.current = reducedMotion() ? placedRef.current.length : 0;
    const step = () => {
      shownRef.current = Math.min(shownRef.current + POP_BATCH, placedRef.current.length);
      pushMarkers();
      if (shownRef.current < placedRef.current.length) popTimer.current = window.setTimeout(step, POP_INTERVAL_MS);
    };
    step();
  }

  /** FPS réel pendant les premières secondes sur la carte. Rien à conclure si l'onglet est masqué. */
  function measureEntry(map: MlMap) {
    if (reducedMotion()) return;
    let frames = 0;
    const count = () => {
      frames += 1;
    };
    map.on('render', count);
    window.setTimeout(() => {
      map.off('render', count);
      if (!document.hidden) live.current.onEntryFps(frames / (CONFIG.qualitySampleMs / 1000));
    }, CONFIG.qualitySampleMs);
  }

  /** Wilaya centrée dans la zone libre de la carte, entière malgré l'inclinaison. */
  function wilayaCamera(map: MlMap) {
    const { boundary, data, padding } = live.current;
    const points = boundary ? boundaryPoints(boundary) : data.establishments.map((e) => [e.location.lng, e.location.lat] as LngLat);
    const { pitch, bearing } = data.wilaya.camera;
    const canvas = map.getCanvas();
    const margin = CONFIG.framePadding * 2;
    const width = canvas.clientWidth - (padding.left ?? 0) - (padding.right ?? 0) - margin;
    const height = canvas.clientHeight - (padding.top ?? 0) - (padding.bottom ?? 0) - margin;
    return { ...frameCamera(points, pitch, bearing, width, height), pitch, bearing };
  }

  /** Enchaîne les points de vue. Sans mouvement si l'utilisateur l'a demandé. */
  function tour(index: number) {
    const map = mapRef.current;
    if (!map) return;
    const viewpoint = CONFIG.tourViewpoints[index % CONFIG.tourViewpoints.length];
    const padding = { top: 0, right: 0, bottom: 0, left: 0 };
    if (reducedMotion()) {
      map.jumpTo({ ...viewpoint, padding });
      return;
    }
    const my = ++moveSeq.current;
    // easeTo, pas flyTo : flyTo prend de la hauteur entre deux points et fait entrer la mer dans le cadre
    map.easeTo({ ...viewpoint, padding, duration: CONFIG.tourFlightMs, essential: true });
    map.once('moveend', () => {
      if (moveSeq.current !== my) return;
      tourTimer.current = window.setTimeout(() => {
        if (moveSeq.current === my) tour(index + 1);
      }, CONFIG.tourPauseMs);
    });
  }

  /* -------------------------------------------------------------- rotation */
  function startRotation(speedDegPerSec: number, onStop?: () => void) {
    const map = mapRef.current;
    if (!map || reducedMotion()) return;
    stopRotation();
    const state = { raf: 0, speed: speedDegPerSec, last: 0, onStop };
    const step = (t: number) => {
      if (rotation.current !== state) return;
      const dt = state.last ? Math.min(0.05, (t - state.last) / 1000) : 0;
      state.last = t;
      if (!map.isMoving()) map.setBearing(map.getBearing() + state.speed * dt);
      state.raf = requestAnimationFrame(step);
    };
    rotation.current = state;
    state.raf = requestAnimationFrame(step);
  }

  function stopRotation() {
    const r = rotation.current;
    if (!r) return;
    cancelAnimationFrame(r.raf);
    rotation.current = null;
    r.onStop?.();
  }

  /* ------------------------------------------------------------- caméra API */
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    enter() {
      const map = mapRef.current;
      if (!map) return;
      moveSeq.current++;
      window.clearTimeout(tourTimer.current);
      stopRotation();
      const cam = wilayaCamera(map);
      framedRef.current = true;
      map.flyTo({
        ...cam,
        padding: live.current.padding,
        duration: reducedMotion() ? 0 : 4200,
        curve: 1.25,
        essential: true,
      });
      const my = moveSeq.current;
      window.setTimeout(() => {
        if (moveSeq.current === my || live.current.markersVisible) popMarkers(cam.center);
      }, reducedMotion() ? 0 : 1100);
      measureEntry(map);
    },
    attract() {
      stopRotation();
      framedRef.current = false;
      tour(0);
    },
    focus(id) {
      const map = mapRef.current;
      const placed = placedRef.current.find((p) => p.est.id === id);
      if (!map || !placed) return;
      framedRef.current = false;
      moveSeq.current++;
      stopRotation();
      map.flyTo({
        center: placed.position,
        zoom: CONFIG.focusZoom,
        pitch: CONFIG.focusPitch,
        bearing: map.getBearing() - 20,
        padding: live.current.padding,
        duration: reducedMotion() ? 0 : 2600,
        essential: true,
      });
    },
    fitPoints(points) {
      const map = mapRef.current;
      if (!map || points.length === 0) return;
      framedRef.current = false;
      moveSeq.current++;
      stopRotation();
      if (points.length === 1) {
        map.flyTo({ center: points[0], zoom: 14, pitch: 55, padding: live.current.padding, duration: 2000, essential: true });
        return;
      }
      const pad = live.current.padding;
      const cam = map.cameraForBounds(bounds(points), {
        padding: { top: (pad.top ?? 0) + 60, right: (pad.right ?? 0) + 60, bottom: (pad.bottom ?? 0) + 60, left: (pad.left ?? 0) + 60 },
        bearing: map.getBearing(),
      });
      if (!cam) return;
      map.flyTo({
        center: cam.center,
        zoom: Math.min((cam.zoom ?? 12) - 0.3, 14.5),
        bearing: map.getBearing(),
        pitch: 52,
        padding: live.current.padding,
        duration: 2000,
        essential: true,
      });
    },
    whole() {
      const map = mapRef.current;
      if (!map) return;
      moveSeq.current++;
      stopRotation();
      framedRef.current = true;
      map.flyTo({ ...wilayaCamera(map), padding: live.current.padding, duration: 2200, essential: true });
    },
    zoomBy(d) {
      const map = mapRef.current;
      map?.easeTo({ zoom: map.getZoom() + d, duration: 350 });
    },
    tiltBy(d) {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ pitch: Math.max(0, Math.min(CONFIG.maxPitch, map.getPitch() + d)), duration: 400 });
    },
    rotateBy(d) {
      const map = mapRef.current;
      map?.easeTo({ bearing: map.getBearing() + d, duration: 450 });
    },
    resetNorth() {
      mapRef.current?.easeTo({ bearing: 0, duration: 700 });
    },
    toggle3d() {
      const map = mapRef.current;
      if (!map) return;
      if (map.getPitch() > 5) map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      else map.easeTo({ pitch: 58, bearing: -18, duration: 800 });
    },
    orbit(on) {
      const map = mapRef.current;
      if (!map) return;
      moveSeq.current++;
      if (!on) {
        stopRotation();
        return;
      }
      if (map.getPitch() < 50) map.easeTo({ pitch: 62, duration: 800 });
      live.current.onOrbitChange(true);
      startRotation(9, () => live.current.onOrbitChange(false));
    },
  }));

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map" />
      {failed && <div className="map-failed">MapLibre GL n'a pas pu démarrer (WebGL indisponible ?)</div>}
    </div>
  );
}));

/** Relief et ombrage ne se cumulent pas : l'ombrage ne sert que sur la carte à plat. */
function applyTerrain(map: MlMap, on: boolean) {
  try {
    if (on && map.getSource('dem')) map.setTerrain(TERRAIN_SPEC);
    else map.setTerrain(null);
    if (map.getLayer('hillshade')) map.setLayoutProperty('hillshade', 'visibility', on ? 'none' : 'visible');
  } catch {
    /* style sans source de relief */
  }
}
