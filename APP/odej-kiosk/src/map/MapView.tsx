import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MlMap, Marker, PaddingOptions } from 'maplibre-gl';
import type { BasemapId, Category, Establishment, KioskData, Locale } from '../types';
import { CONFIG } from '../config';
import { styleFor, SKY, TERRAIN_SPEC } from './basemaps';
import { CATEGORY_ICONS, svgString } from '../components/icons';
import { bounds, distanceKm, type LngLat } from '../lib/geo';

export interface MapHandle {
  /** Animation d'entrée : de la vue d'attente à la wilaya en 3D */
  enter(): void;
  /** Retour à la vue d'attente (accueil), rotation lente */
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

export interface CameraState {
  bearing: number;
  pitch: number;
  zoom: number;
}

interface Props {
  data: KioskData;
  locale: Locale;
  basemap: BasemapId;
  terrain: boolean;
  selectedId: string | null;
  /** Établissements mis en avant (filtre) ; les autres sont atténués. null = tous */
  highlightIds: Set<string> | null;
  padding: PaddingOptions;
  markersVisible: boolean;
  onSelect(id: string): void;
  onCamera(state: CameraState): void;
  onOrbitChange(on: boolean): void;
  onBasemapFailed(id: BasemapId): void;
}

interface MarkerEntry {
  marker: Marker;
  el: HTMLButtonElement;
  label: HTMLSpanElement;
  est: Establishment;
}

let rtlPluginRequested = false;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const MapView = forwardRef<MapHandle, Props>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const rotation = useRef<{ raf: number; speed: number; last: number; onStop?: () => void } | null>(null);
  /** Invalide la rotation d'attente programmée si une autre animation démarre entre-temps */
  const moveSeq = useRef(0);
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
      if (!maplibregl?.Map) throw new Error('MapLibre non chargé');
      if (!__ARTIFACT__ && !rtlPluginRequested && maplibregl.getRTLTextPluginStatus?.() === 'unavailable') {
        rtlPluginRequested = true;
        Promise.resolve(maplibregl.setRTLTextPlugin(CONFIG.rtlTextPluginUrl, true)).catch(() => undefined);
      }
      const first = styleFor('preview', live.current.locale);
      map = new maplibregl.Map({
        container,
        style: 'style' in first ? first.style : first.url,
        center: CONFIG.attractCamera.center,
        zoom: CONFIG.attractCamera.zoom,
        pitch: CONFIG.attractCamera.pitch,
        bearing: CONFIG.attractCamera.bearing,
        maxPitch: CONFIG.maxPitch,
        maxBounds: CONFIG.maxBounds,
        attributionControl: { compact: true, customAttribution: 'Données : ODEJ Béjaïa' },
        fadeDuration: 150,
      });
    } catch (err) {
      console.error(err);
      setFailed(true);
      return;
    }
    mapRef.current = map;

    // Relief + ciel après chaque changement de style
    map.on('style.load', () => {
      applyTerrain(map, live.current.terrain);
      try {
        const m = map as unknown as { setSky?: (s: unknown) => void };
        m.setSky?.(SKY);
      } catch {
        /* version sans ciel */
      }
    });

    // Détection d'un fond de carte inaccessible (pas d'internet, hôte bloqué)
    let errors = 0;
    let tilesOk = false;
    map.on('data', (e: any) => {
      if (e.dataType === 'source' && e.tile && e.sourceId !== 'dem') tilesOk = true;
    });
    map.on('error', (e: any) => {
      const current = live.current.basemap;
      if (current === 'preview' || tilesOk) return;
      // On ne compte que les échecs réseau (style ou tuiles), pas les avertissements de validation
      const err = e?.error;
      if (!err || !(typeof err.status === 'number' || /fetch|network|failed|load/i.test(String(err.message)))) return;
      errors += 1;
      if (errors === 4) live.current.onBasemapFailed(current);
    });
    (map as unknown as { __resetBasemapErrors: () => void }).__resetBasemapErrors = () => {
      errors = 0;
      tilesOk = false;
    };

    // Échelle des marqueurs selon le zoom + état caméra pour les contrôles
    let raf = 0;
    const onMove = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const zoom = map.getZoom();
        const s = Math.max(0.6, Math.min(1.08, 0.6 + (zoom - 8) * 0.085));
        container.style.setProperty('--mk-s', s.toFixed(3));
        container.classList.toggle('show-labels', zoom >= 13);
        live.current.onCamera({ bearing: map.getBearing(), pitch: map.getPitch(), zoom });
      });
    };
    map.on('move', onMove);
    onMove();

    // Toute interaction de l'utilisateur arrête la rotation automatique
    const stopOnUser = (e: any) => {
      if (e.originalEvent) stopRotation();
    };
    map.on('dragstart', stopOnUser);
    map.on('zoomstart', stopOnUser);
    map.on('pitchstart', stopOnUser);
    map.on('rotatestart', stopOnUser);

    // Conteneur redimensionné (simulateur d'écran, rotation portrait/paysage)
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      stopRotation();
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current.clear();
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
    if ('url' in spec) {
      map.setStyle(spec.url, { diff: false, transformStyle: (_prev, next) => spec.transform(next) });
    } else {
      map.setStyle(spec.style, { diff: false });
    }
    // la langue ne change que les libellés du plan vectoriel
  }, [props.basemap, props.basemap === 'plan' ? props.locale : null]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ----------------------------------------------------------------- relief */
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) applyTerrain(map, props.terrain);
  }, [props.terrain]);

  /* -------------------------------------------------------------- marqueurs */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const cats = new Map<string, Category>(props.data.categories.map((c) => [c.id, c]));
    const seen = new Map<string, number>();
    const entries = markersRef.current;
    entries.forEach((m) => m.marker.remove());
    entries.clear();

    for (const est of props.data.establishments) {
      const cat = cats.get(est.category) ?? props.data.categories[props.data.categories.length - 1];
      // Deux établissements aux mêmes coordonnées : léger décalage (~16 m) pour pouvoir toucher les deux
      const key = `${est.location.lat.toFixed(5)},${est.location.lng.toFixed(5)}`;
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      const pos: LngLat = [est.location.lng + n * 0.00018, est.location.lat];

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mk';
      el.style.setProperty('--c', cat.color);
      el.innerHTML =
        `<span class="mk-scale"><span class="mk-pop">` +
        `<span class="mk-label"></span>` +
        `<span class="mk-pin">${svgString(CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS.star, 20)}</span>` +
        `<span class="mk-stem"></span><span class="mk-dot"></span>` +
        `</span></span>`;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        live.current.onSelect(est.id);
      });
      const label = el.querySelector('.mk-label') as HTMLSpanElement;
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(pos).addTo(map);
      entries.set(est.id, { marker, el, label, est });
    }
    syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data]);

  useEffect(() => {
    markersRef.current.forEach(({ el, label, est }) => {
      const name = est.name[props.locale] ?? est.name.ar ?? '';
      label.textContent = name;
      el.setAttribute('aria-label', name);
    });
  }, [props.data, props.locale]);

  useEffect(() => {
    syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedId, props.highlightIds]);

  // Masqués sur l'accueil ; réaffichés par popMarkers() pendant l'animation d'entrée
  useEffect(() => {
    if (!props.markersVisible) containerRef.current?.classList.add('markers-off');
  }, [props.markersVisible]);

  /* ----------------------------------------------------------- marge carte */
  // Les animations de caméra emportent la marge avec elles ; ici on ne corrige que la vue au repos
  // (rotation portrait/paysage, changement de langue qui déplace le panneau).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.markersVisible || map.isMoving()) return;
    map.easeTo({ padding: props.padding, duration: 500 });
  }, [props.padding.top, props.padding.right, props.padding.bottom, props.padding.left]); // eslint-disable-line react-hooks/exhaustive-deps

  function syncMarkers() {
    const { selectedId, highlightIds } = live.current;
    markersRef.current.forEach(({ el, est }) => {
      const sel = est.id === selectedId;
      el.classList.toggle('mk--sel', sel);
      el.classList.toggle('mk--dim', !!highlightIds && !highlightIds.has(est.id) && !sel);
      el.setAttribute('aria-pressed', String(sel));
      el.style.zIndex = sel ? '20' : '';
    });
  }

  function popMarkers(center: LngLat) {
    const list = [...markersRef.current.values()].sort(
      (a, b) =>
        distanceKm(center, [a.est.location.lng, a.est.location.lat]) - distanceKm(center, [b.est.location.lng, b.est.location.lat]),
    );
    list.forEach(({ el }, i) => {
      el.classList.remove('mk--in');
      el.style.setProperty('--d', `${Math.min(i * 28, 1600)}ms`);
    });
    // reflow puis relance de l'animation
    void containerRef.current?.offsetWidth;
    list.forEach(({ el }) => el.classList.add('mk--in'));
    containerRef.current?.classList.remove('markers-off');
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
    enter() {
      const map = mapRef.current;
      if (!map) return;
      moveSeq.current++;
      stopRotation();
      const cam = live.current.data.wilaya.camera;
      map.flyTo({
        center: cam.center,
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
        padding: live.current.padding,
        duration: reducedMotion() ? 0 : 4200,
        curve: 1.25,
        essential: true,
      });
      const my = moveSeq.current;
      window.setTimeout(() => {
        if (moveSeq.current === my || live.current.markersVisible) popMarkers(cam.center);
      }, reducedMotion() ? 0 : 1100);
    },
    attract() {
      const map = mapRef.current;
      if (!map) return;
      stopRotation();
      const a = CONFIG.attractCamera;
      map.flyTo({
        center: a.center,
        zoom: a.zoom,
        pitch: a.pitch,
        bearing: map.getBearing(),
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        duration: 2400,
        essential: true,
      });
      const my = ++moveSeq.current;
      map.once('moveend', () => {
        if (moveSeq.current === my) startRotation(2.2);
      });
    },
    focus(id) {
      const map = mapRef.current;
      const entry = markersRef.current.get(id);
      if (!map || !entry) return;
      moveSeq.current++;
      stopRotation();
      map.flyTo({
        center: entry.marker.getLngLat(),
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
      const cam = live.current.data.wilaya.camera;
      map.flyTo({
        center: cam.center,
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
        padding: live.current.padding,
        duration: 2200,
        essential: true,
      });
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
      <div ref={containerRef} className="map markers-off" />
      {failed && <div className="map-failed">MapLibre GL n'a pas pu démarrer (WebGL indisponible ?)</div>}
    </div>
  );
});

function applyTerrain(map: MlMap, on: boolean) {
  try {
    if (on && map.getSource('dem')) map.setTerrain(TERRAIN_SPEC);
    else map.setTerrain(null);
  } catch {
    /* style sans source de relief */
  }
}
