import type { ExpressionSpecification, Map as MlMap } from 'maplibre-gl';
import type { Category, Establishment, Locale } from '../types';
import { titleOf } from '../data/model';
import { CATEGORY_ICONS, svgString } from '../components/icons';
import type { LngLat } from '../lib/geo';

export const MARKER_SOURCE = 'establishments';
export const MARKER_LAYER = 'est-markers';
export const SELECTED_LAYER = 'est-selected';
const FEATURED_LAYER = 'est-featured';
const LABEL_LAYER = 'est-labels';
const FEATURED_LABEL_LAYER = 'est-featured-label';
/** Couches qui répondent au toucher */
export const TOUCH_LAYERS = [MARKER_LAYER, FEATURED_LAYER, SELECTED_LAYER];

/** Dessin en pixels CSS, rasterisé à 2× */
const SCALE = 2;
const WIDTH = 68;
const HEIGHT = 80;
const PIN_RADIUS = 21;
const RING_RADIUS = 27;
/** Centre de la tête de la bulle, puis sa pointe, depuis le haut de l'image */
const HEAD_Y = 30;
const TIP_Y = HEIGHT - 5;
/** Centre de la tête au-dessus du point d'ancrage (bas de l'image) */
const PIN_CENTER = HEIGHT - HEAD_Y;
/** Point du sélectionné : sa fenêtre d'aperçu (MapView) le surplombe */
const DOT_SIZE = 36;
const DOT_RADIUS = 8;
const MIN_SIZE = 0.6;
const MAX_SIZE = 1.08;
const LABEL_SIZE = 14;

const DIM_OPACITY = 0.25;
const FEATURED_SIZE = 1.25;
const FEATURED_LABEL_SIZE = 1.15;
const GOLD = '#C9A227';
/** Deux marqueurs dont le centre est à moins de cet écart comptent comme superposés (px) */
const OVERLAP_PX = 12;

export type MarkerImages = Map<string, ImageData>;

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((done, fail) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = fail;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Mélange une couleur #RRGGBB avec du blanc (t > 0) ou du noir (t < 0). */
export function shade(hex: string, t: number): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const target = t > 0 ? 255 : 0;
  const mix = (c: number) => Math.round(c + (target - c) * Math.abs(t));
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

function canvas2d(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2D indisponible');
  ctx.scale(SCALE, SCALE);
  return ctx;
}

/** Contour en goutte : tête ronde, pointe sur le point exact de l'établissement. */
function bubblePath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tip: number) {
  const neck = tip - (tip - y) * 0.38;
  ctx.beginPath();
  ctx.moveTo(x, tip);
  ctx.bezierCurveTo(x - r * 0.3, neck, x - r, y + r * 0.78, x - r, y);
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.bezierCurveTo(x + r, y + r * 0.78, x + r * 0.3, neck, x, tip);
  ctx.closePath();
}

function drawMarker(icon: HTMLImageElement, color: string, ring: string | null): ImageData {
  const ctx = canvas2d(WIDTH, HEIGHT);
  const x = WIDTH / 2;
  const y = HEAD_Y;

  // Ombre portée au sol, floue
  ctx.save();
  ctx.filter = 'blur(1.5px)';
  ctx.fillStyle = 'rgba(20, 33, 27, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, TIP_Y, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (ring) {
    ctx.strokeStyle = ring;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, RING_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Corps : dégradé de la couleur de la catégorie, liseré blanc, ombre douce
  const body = ctx.createLinearGradient(0, y - PIN_RADIUS, 0, TIP_Y);
  body.addColorStop(0, shade(color, 0.28));
  body.addColorStop(0.5, color);
  body.addColorStop(1, shade(color, -0.3));
  ctx.save();
  ctx.shadowColor = 'rgba(20, 33, 27, 0.32)';
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 3;
  bubblePath(ctx, x, y, PIN_RADIUS, TIP_Y);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#fff';
  bubblePath(ctx, x, y, PIN_RADIUS, TIP_Y);
  ctx.stroke();

  // Pastille intérieure et reflet en haut : effet verre
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(x, y, PIN_RADIUS - 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  bubblePath(ctx, x, y, PIN_RADIUS - 1.5, TIP_Y - 2);
  ctx.clip();
  const gloss = ctx.createLinearGradient(0, y - PIN_RADIUS, 0, y);
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(x - 3, y - PIN_RADIUS * 0.55, PIN_RADIUS * 0.72, PIN_RADIUS * 0.42, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(icon, x - 10, y - 10, 20, 20);
  return ctx.getImageData(0, 0, WIDTH * SCALE, HEIGHT * SCALE);
}

/** Le sélectionné se réduit à un point cerclé : sa fenêtre d'aperçu prend le relais. */
function drawDot(color: string): ImageData {
  const ctx = canvas2d(DOT_SIZE, DOT_SIZE);
  const c = DOT_SIZE / 2;
  ctx.fillStyle = shade(color, 0.55).replace('rgb', 'rgba').replace(')', ', 0.55)');
  ctx.beginPath();
  ctx.arc(c, c, DOT_RADIUS + 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = 'rgba(20, 33, 27, 0.35)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c, c, DOT_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  return ctx.getImageData(0, 0, DOT_SIZE * SCALE, DOT_SIZE * SCALE);
}

/** Rasterise une fois, au démarrage, trois images par catégorie : normale, sélectionnée, phare. */
export async function rasterizeMarkers(categories: Category[]): Promise<MarkerImages> {
  const images: MarkerImages = new Map();
  await Promise.all(
    categories.map(async (cat) => {
      const inner = CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS.star;
      // Hors du DOM, un SVG exige son espace de noms
      const svg = svgString(inner, 40).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace('stroke="currentColor"', 'stroke="#fff"');
      const icon = await loadSvg(svg);
      images.set(`mk-${cat.id}`, drawMarker(icon, cat.color, null));
      images.set(`mk-${cat.id}-sel`, drawDot(cat.color));
      images.set(`mk-${cat.id}-star`, drawMarker(icon, cat.color, GOLD));
    }),
  );
  return images;
}

export interface PlacedEstablishment {
  est: Establishment;
  position: LngLat;
  image: string;
}

/** Deux établissements aux mêmes coordonnées : léger décalage (~16 m) pour distinguer les deux marqueurs. */
export function placeEstablishments(establishments: Establishment[], categories: Category[]): PlacedEstablishment[] {
  const known = new Set(categories.map((c) => c.id));
  const fallback = categories[categories.length - 1];
  const seen = new Map<string, number>();
  return establishments.map((est) => {
    const key = `${est.location.lat.toFixed(5)},${est.location.lng.toFixed(5)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return {
      est,
      position: [est.location.lng + n * 0.00018, est.location.lat],
      image: `mk-${known.has(est.category) ? est.category : fallback.id}`,
    };
  });
}

export function markerCollection(placed: PlacedEstablishment[], locale: Locale): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: placed.map(({ est, position, image }) => {
      const title = titleOf(est);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: position },
        properties: { id: est.id, image, title: title[locale] ?? title.ar ?? '', featured: !!est.featured },
      };
    }),
  };
}

/** Toute l'interface est en rem : les marqueurs suivent la taille de base de l'écran. */
const remScale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;

/** Même progression que l'ancien marqueur DOM : 0,6 au zoom 8, 1,08 à partir du zoom 13,6. */
const markerSize = (factor: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 8, MIN_SIZE * factor, 13.65, MAX_SIZE * factor];

/** À rappeler quand la taille de base change (rotation de l'écran, simulateur). */
export function scaleMarkerLayers(map: MlMap) {
  if (!map.getLayer(MARKER_LAYER)) return;
  const rem = remScale();
  map.setLayoutProperty(MARKER_LAYER, 'icon-size', markerSize(rem));
  map.setLayoutProperty(FEATURED_LAYER, 'icon-size', markerSize(FEATURED_SIZE * rem));
  map.setLayoutProperty(SELECTED_LAYER, 'icon-size', markerSize(rem));
  if (!map.getLayer(LABEL_LAYER)) return;
  const size = LABEL_SIZE * rem;
  map.setLayoutProperty(LABEL_LAYER, 'text-size', size);
  map.setLayoutProperty(LABEL_LAYER, 'text-offset', [0, -((PIN_CENTER + PIN_RADIUS) * MAX_SIZE * rem + 6) / size]);
  const featuredSize = size * FEATURED_LABEL_SIZE;
  map.setLayoutProperty(FEATURED_LABEL_LAYER, 'text-size', featuredSize);
  // Ce nom reste visible à tous les zooms : son décalage suit la taille du marqueur
  const offsetAt = (size: number): ExpressionSpecification => ['literal', [0, -((PIN_CENTER + RING_RADIUS) * size * FEATURED_SIZE * rem + 4) / featuredSize]];
  map.setLayoutProperty(FEATURED_LABEL_LAYER, 'text-offset', [
    'interpolate',
    ['linear'],
    ['zoom'],
    8,
    offsetAt(MIN_SIZE),
    13.65,
    offsetAt(MAX_SIZE),
  ]);
}

/** Décalage de la fenêtre d'aperçu du sélectionné : sa pointe touche le haut du point (px). */
export function selectedLabelOffset(): [number, number] {
  return [0, -(DOT_RADIUS + 2) * MAX_SIZE * remScale()];
}

const IS_FEATURED: ExpressionSpecification = ['==', ['get', 'featured'], true];
const NOT_FEATURED: ExpressionSpecification = ['!=', ['get', 'featured'], true];

export function addMarkerLayers(map: MlMap, images: MarkerImages) {
  images.forEach((image, name) => {
    if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: SCALE });
  });
  map.addSource(MARKER_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const icon = { 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true } as const;
  const labelPaint = { 'text-color': '#14211B', 'text-halo-color': '#fff', 'text-halo-width': 1.6 };
  map.addLayer({
    id: MARKER_LAYER,
    type: 'symbol',
    source: MARKER_SOURCE,
    layout: { ...icon, 'icon-image': ['get', 'image'] },
  });
  // Pas de glyphes dans le style hors ligne : pas d'étiquettes WebGL
  if (map.getStyle().glyphs) {
    map.addLayer({
      id: LABEL_LAYER,
      type: 'symbol',
      source: MARKER_SOURCE,
      minzoom: 13,
      layout: {
        'text-field': ['get', 'title'],
        'text-font': ['Noto Sans Regular'],
        'text-anchor': 'bottom',
        'text-max-width': 14,
      },
      paint: labelPaint,
    });
  }
  map.addLayer({
    id: FEATURED_LAYER,
    type: 'symbol',
    source: MARKER_SOURCE,
    filter: IS_FEATURED,
    layout: { ...icon, 'icon-image': ['concat', ['get', 'image'], '-star'] },
  });
  if (map.getStyle().glyphs) {
    map.addLayer({
      id: FEATURED_LABEL_LAYER,
      type: 'symbol',
      source: MARKER_SOURCE,
      filter: IS_FEATURED,
      layout: {
        'text-field': ['get', 'title'],
        'text-font': ['Noto Sans Bold'],
        'text-anchor': 'bottom',
        'text-max-width': 14,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: labelPaint,
    });
  }
  map.addLayer({
    id: SELECTED_LAYER,
    type: 'symbol',
    source: MARKER_SOURCE,
    filter: ['==', ['get', 'id'], ''],
    layout: { ...icon, 'icon-anchor': 'center', 'icon-image': ['concat', ['get', 'image'], '-sel'] },
  });
  scaleMarkerLayers(map);
}

/** Le sélectionné passe dans sa couche ; ceux qu'un filtre écarte sont atténués et perdent leur étiquette. */
export function syncMarkerLayers(map: MlMap, selectedId: string | null, highlightIds: Set<string> | null) {
  if (!map.getLayer(MARKER_LAYER)) return;
  const id = selectedId ?? '';
  const others: ExpressionSpecification = ['!=', ['get', 'id'], id];
  const highlighted: ExpressionSpecification = ['in', ['get', 'id'], ['literal', [...(highlightIds ?? [])]]];
  const opacity: ExpressionSpecification | number = highlightIds ? ['case', highlighted, 1, DIM_OPACITY] : 1;
  map.setFilter(MARKER_LAYER, ['all', others, NOT_FEATURED]);
  map.setFilter(FEATURED_LAYER, ['all', others, IS_FEATURED]);
  map.setFilter(SELECTED_LAYER, ['==', ['get', 'id'], id]);
  map.setPaintProperty(MARKER_LAYER, 'icon-opacity', opacity);
  map.setPaintProperty(FEATURED_LAYER, 'icon-opacity', opacity);
  if (!map.getLayer(LABEL_LAYER)) return;
  map.setFilter(LABEL_LAYER, highlightIds ? ['all', others, NOT_FEATURED, highlighted] : ['all', others, NOT_FEATURED]);
  map.setFilter(FEATURED_LABEL_LAYER, highlightIds ? ['all', others, IS_FEATURED, highlighted] : ['all', others, IS_FEATURED]);
}

export interface MarkerHit {
  id: string;
  /** Distance au toucher (px) */
  distance: number;
}

/** Le plus proche du toucher ; retoucher des marqueurs superposés passe au suivant, pour les atteindre tous. */
export function pickMarker(hits: MarkerHit[], selectedId: string | null): string | null {
  if (hits.length === 0) return null;
  const sorted = [...hits].sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
  const group = sorted.filter((hit) => hit.distance - sorted[0].distance < OVERLAP_PX);
  const current = group.findIndex((hit) => hit.id === selectedId);
  return group[(current + 1) % group.length].id;
}
