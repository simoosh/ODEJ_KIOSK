import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type {
  CalculateTileZoomFunction,
  GeoJSONSource,
  LngLat as MlLngLat,
  Map as MlMap,
  Marker,
  PaddingOptions,
  TransformConstrainFunction,
  VectorTileSource,
} from 'maplibre-gl';
import type { BasemapId, Boundary, KioskData, Locale } from '../types';
import { CONFIG, QUALITY, type QualityLevel } from '../config';
import { titleOf } from '../data/model';
import { PLAN_SOURCE, SATELLITE_TILES, styleFor, SKY, TERRAIN_SPEC, terrainTemplate } from './basemaps';
import { addFogLayers, buildFogImage, type FogImage } from './fog';
import { preloadUrls, startPreload } from './preload';
import {
  addMarkerLayers,
  MARKER_LAYER,
  MARKER_SOURCE,
  markerCollection,
  pickMarker,
  placeEstablishments,
  rasterizeMarkers,
  scaleMarkerLayers,
  selectedLabelOffset,
  syncMarkerLayers,
  TOUCH_LAYERS,
  type MarkerImages,
  type PlacedEstablishment,
} from './markers';
import { boundaryPoints, bounds, distanceKm, expandBounds, frameCamera, type LngLat } from '../lib/geo';

export interface MapHandle {
  /** Pour le panneau ?debug=1 */
  getMap(): MlMap | null;
  /** Animation d'entrée : de la vue d'attente à la wilaya en 3D, ou directement à un établissement */
  enter(id?: string): void;
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

/**
 * Seul le centre est limité : maxBounds contraint tout l'écran et interdit le zoom qui montre la wilaya entière.
 * Une contrainte personnalisée remplace celle de MapLibre : c'est donc elle qui doit appliquer le zoom minimal et maximal.
 */
const centerInside =
  (map: MlMap, [[w, s], [e, n]]: [LngLat, LngLat]): TransformConstrainFunction =>
  (center: MlLngLat, zoom: number) => ({
    center: new maplibregl.LngLat(Math.min(e, Math.max(w, center.lng)), Math.min(n, Math.max(s, center.lat))),
    zoom: Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), zoom)),
  });

/** Valeurs par défaut de MapLibre */
const SATELLITE_LOD = [9.314, 3] as const;

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
  /** Invalide la rotation ou l'animation programmées si une autre animation démarre entre-temps */
  const moveSeq = useRef(0);
  const fogRef = useRef<FogImage | null>(null);
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
        center: wilayaCenter(live.current),
        zoom: CONFIG.minZoom + 2,
        pitch: CONFIG.orbit.pitch,
        maxPitch: CONFIG.maxPitch,
        minZoom: CONFIG.minZoom,
        attributionControl: { compact: true, customAttribution: 'Données : ODEJ Béjaïa' },
        fadeDuration: 0,
        cancelPendingTileRequestsWhileZooming: false,
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
    map.setTransformConstrain(centerInside(map, CONFIG.maxBounds));
    if (live.current.boundary) fogRef.current = buildFogImage(live.current.boundary);

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
      keepSatelliteDetail(map);
    });

    // Sur l'accueil, personne ne regarde : on prépare les tuiles que la carte demandera
    let stopPreload: (() => void) | undefined;
    const beginPreload = () => {
      const plan = (map.getSource(PLAN_SOURCE) as VectorTileSource | undefined)?.tiles?.[0];
      if (!plan || stopPreload) return;
      map.off('sourcedata', beginPreload);
      const { boundary, data } = live.current;
      const points = data.establishments.map((e) => [e.location.lng, e.location.lat] as LngLat);
      const wilaya = bounds(boundary ? boundaryPoints(boundary) : points);
      const sources = { plan, satellite: SATELLITE_TILES, terrain: terrainTemplate() };
      stopPreload = startPreload(preloadUrls(sources, wilaya, points), () => !live.current.markersVisible);
    };
    map.on('sourcedata', beginPreload);

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
        { layers: TOUCH_LAYERS },
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
    for (const layer of TOUCH_LAYERS) {
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

    // Une carte figée sur la borne ne se répare pas toute seule : sans contexte WebGL, on repart de l'accueil
    let reload = 0;
    map.on('webglcontextlost', () => {
      reload = window.setTimeout(() => location.reload(), CONFIG.contextLostReloadMs);
    });
    map.on('webglcontextrestored', () => window.clearTimeout(reload));

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
      stopPreload?.();
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
    map.setTransformConstrain(centerInside(map, expandBounds(bounds(boundaryPoints(props.boundary)), CONFIG.boundsMargin)));
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

  /* ------------------------------------------------------------ dézoom max */
  // Suit la place que laisse le panneau ; l'accueil, plus haut, reprend sa limite à la fin de l'entrée
  useEffect(() => {
    const map = mapRef.current;
    if (map) map.setMinZoom(props.markersVisible ? mapMinZoom(map) : landingZoom(map));
  }, [props.padding.top, props.padding.right, props.padding.bottom, props.padding.left]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --------------------------------------------------------------- accueil */
  useEffect(() => {
    const map = mapRef.current;
    if (map && !props.markersVisible && rotation.current) map.easeTo({ padding: landingPadding(map), duration: 600 });
  }, [props.locale, props.padding.top, props.padding.bottom]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (fogRef.current) addFogLayers(map, fogRef.current);
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

  function focusCamera(map: MlMap, placed: PlacedEstablishment) {
    return { center: placed.position, zoom: CONFIG.focusZoom, pitch: CONFIG.focusPitch, bearing: map.getBearing() - 20 };
  }

  /** Assez pour voir la wilaya entière, pas au-delà. */
  function mapMinZoom(map: MlMap) {
    return wilayaCamera(map).zoom - CONFIG.zoomOutMargin;
  }

  function landingZoom(map: MlMap) {
    return mapMinZoom(map) - CONFIG.orbit.zoomOut;
  }

  /** Les nuages couvrent le haut de l'accueil : la wilaya tourne dans le bas de l'écran, centrée. */
  function landingPadding(map: MlMap) {
    const { clientWidth, clientHeight } = map.getCanvas();
    const top = clientHeight * (clientHeight > clientWidth ? CONFIG.landingMapTopPortrait : CONFIG.landingMapTop);
    return { top, right: 0, bottom: 0, left: 0 };
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
    enter(id) {
      const map = mapRef.current;
      if (!map) return;
      moveSeq.current++;
      stopRotation();
      const target = placedRef.current.find((p) => p.est.id === id);
      const cam = target ? focusCamera(map, target) : wilayaCamera(map);
      framedRef.current = !target;
      map.once('moveend', () => map.setMinZoom(mapMinZoom(map)));
      map.flyTo({
        ...cam,
        padding: live.current.padding,
        duration: reducedMotion() ? 0 : CONFIG.enterFlightMs,
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
      const map = mapRef.current;
      if (!map) return;
      stopRotation();
      framedRef.current = false;
      const my = ++moveSeq.current;
      map.once('moveend', () => {
        if (moveSeq.current === my) startRotation(CONFIG.orbit.degreesPerSecond);
      });
      const zoom = landingZoom(map);
      map.setMinZoom(zoom);
      map.easeTo({
        center: wilayaCenter(live.current),
        zoom,
        pitch: CONFIG.orbit.pitch,
        padding: landingPadding(map),
        duration: reducedMotion() ? 0 : CONFIG.orbit.flightMs,
        essential: true,
      });
    },
    focus(id) {
      const map = mapRef.current;
      const placed = placedRef.current.find((p) => p.est.id === id);
      if (!map || !placed) return;
      framedRef.current = false;
      moveSeq.current++;
      stopRotation();
      map.flyTo({
        ...focusCamera(map, placed),
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

function wilayaCenter({ boundary, data }: Pick<Props, 'boundary' | 'data'>): LngLat {
  const points = boundary ? boundaryPoints(boundary) : data.establishments.map((e) => [e.location.lng, e.location.lat] as LngLat);
  const [[w, s], [e, n]] = bounds(points);
  return [(w + e) / 2, (s + n) / 2];
}

/**
 * Au loin, MapLibre charge des zooms plus bas. Sur Esri, sous le zoom 12, c'est une autre imagerie, d'une autre couleur :
 * la carte paraît coupée en deux. On garde le détail partout dans le champ.
 */
function keepSatelliteDetail(map: MlMap) {
  if (!map.getSource('satellite')) return;
  map.setSourceTileLodParams(SATELLITE_LOD[0], SATELLITE_LOD[1], 'satellite');
  // calculateTileZoom n'est pas dans le type public des sources : c'est lui que setSourceTileLodParams vient de poser
  const source = map.getSource('satellite') as unknown as { calculateTileZoom: CalculateTileZoomFunction };
  const lod = source.calculateTileZoom;
  source.calculateTileZoom = (...args) => Math.max(lod(...args), CONFIG.satelliteDetailZoom);
}

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
