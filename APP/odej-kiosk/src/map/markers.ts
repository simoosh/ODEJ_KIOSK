import type { ExpressionSpecification, FilterSpecification, Map as MlMap } from 'maplibre-gl';
import type { Boundary, Category, Establishment, Locale } from '../types';
import { titleOf } from '../data/model';
import { CATEGORY_ICONS, svgString } from '../components/icons';
import type { LngLat } from '../lib/geo';

export const MARKER_SOURCE = 'establishments';
export const MARKER_LAYER = 'est-markers';
export const SELECTED_LAYER = 'est-selected';
const LABEL_LAYER = 'est-labels';
const MASK_SOURCE = 'wilaya-mask';
const LINE_SOURCE = 'wilaya-line';
const MASK_COLOR = '#F7F6F1';
const MASK_OPACITY = 0.45;
const LINE_COLOR = '#1E6B3C';

/** Dessin en pixels CSS, rasterisé à 2× */
const SCALE = 2;
const WIDTH = 64;
const HEIGHT = 76;
const PIN_RADIUS = 21.5;
const RING_RADIUS = 29;
const STEM_HEIGHT = 18;
/** Centre de la pastille au-dessus du point d'ancrage */
const PIN_CENTER = 6 + STEM_HEIGHT + PIN_RADIUS;
const MAX_SIZE = 1.08;
const LABEL_SIZE = 14;

const DIM_OPACITY = 0.25;
const SELECTED_SIZE = 1.3;
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

function drawMarker(icon: HTMLImageElement, color: string, selected: boolean): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE;
  canvas.height = HEIGHT * SCALE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2D indisponible');
  ctx.scale(SCALE, SCALE);

  const x = WIDTH / 2;
  const y = HEIGHT - 6 - STEM_HEIGHT - PIN_RADIUS;

  ctx.fillStyle = 'rgba(20, 33, 27, 0.32)';
  ctx.beginPath();
  ctx.ellipse(x, HEIGHT - 3, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(x - 1.75, y + PIN_RADIUS - 2, 3.5, STEM_HEIGHT);

  if (selected) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, RING_RADIUS - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowColor = 'rgba(20, 33, 27, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, PIN_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, PIN_RADIUS - 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(icon, x - 10, y - 10, 20, 20);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Rasterise une fois, au démarrage, une image normale et une image sélectionnée par catégorie. */
export async function rasterizeMarkers(categories: Category[]): Promise<MarkerImages> {
  const images: MarkerImages = new Map();
  await Promise.all(
    categories.map(async (cat) => {
      const inner = CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS.star;
      // Hors du DOM, un SVG exige son espace de noms
      const svg = svgString(inner, 40).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace('stroke="currentColor"', 'stroke="#fff"');
      const icon = await loadSvg(svg);
      images.set(`mk-${cat.id}`, drawMarker(icon, cat.color, false));
      images.set(`mk-${cat.id}-sel`, drawMarker(icon, cat.color, true));
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
        properties: { id: est.id, image, title: title[locale] ?? title.ar ?? '' },
      };
    }),
  };
}

/** Toute l'interface est en rem : les marqueurs suivent la taille de base de l'écran. */
const remScale = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;

/** Même progression que l'ancien marqueur DOM : 0,6 au zoom 8, 1,08 à partir du zoom 13,6. */
const markerSize = (factor: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 8, 0.6 * factor, 13.65, MAX_SIZE * factor];

/** À rappeler quand la taille de base change (rotation de l'écran, simulateur). */
export function scaleMarkerLayers(map: MlMap) {
  if (!map.getLayer(MARKER_LAYER)) return;
  const rem = remScale();
  map.setLayoutProperty(MARKER_LAYER, 'icon-size', markerSize(rem));
  map.setLayoutProperty(SELECTED_LAYER, 'icon-size', markerSize(SELECTED_SIZE * rem));
  if (!map.getLayer(LABEL_LAYER)) return;
  const size = LABEL_SIZE * rem;
  map.setLayoutProperty(LABEL_LAYER, 'text-size', size);
  map.setLayoutProperty(LABEL_LAYER, 'text-offset', [0, -((PIN_CENTER + PIN_RADIUS) * MAX_SIZE * rem + 6) / size]);
}

/** Décalage de l'étiquette HTML du sélectionné, au-dessus de son anneau (px). */
export function selectedLabelOffset(): [number, number] {
  return [0, -((PIN_CENTER + RING_RADIUS) * MAX_SIZE * SELECTED_SIZE * remScale() + 6)];
}

/** Monde troué par la wilaya : la couche de masque atténue tout ce qui est autour. */
export function outsideMask(boundary: Boundary): GeoJSON.Feature<GeoJSON.Polygon> {
  const world = [
    [-30, 10],
    [40, 10],
    [40, 60],
    [-30, 60],
    [-30, 10],
  ];
  const holes = boundary.features.flatMap((f) => f.geometry.coordinates.map((polygon) => polygon[0]));
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [world, ...holes] } };
}

/** Masque et contour, sous les marqueurs. */
export function addBoundaryLayers(map: MlMap, boundary: Boundary) {
  map.addSource(MASK_SOURCE, { type: 'geojson', data: outsideMask(boundary) });
  map.addSource(LINE_SOURCE, { type: 'geojson', data: boundary });
  map.addLayer({ id: MASK_SOURCE, type: 'fill', source: MASK_SOURCE, paint: { 'fill-color': MASK_COLOR, 'fill-opacity': MASK_OPACITY } });
  map.addLayer({ id: LINE_SOURCE, type: 'line', source: LINE_SOURCE, paint: { 'line-color': LINE_COLOR, 'line-width': 2 } });
}

export function addMarkerLayers(map: MlMap, images: MarkerImages) {
  images.forEach((image, name) => {
    if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: SCALE });
  });
  map.addSource(MARKER_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  const icon = { 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true } as const;
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
      paint: { 'text-color': '#14211B', 'text-halo-color': '#fff', 'text-halo-width': 1.6 },
    });
  }
  map.addLayer({
    id: SELECTED_LAYER,
    type: 'symbol',
    source: MARKER_SOURCE,
    filter: ['==', ['get', 'id'], ''],
    layout: { ...icon, 'icon-image': ['concat', ['get', 'image'], '-sel'] },
  });
  scaleMarkerLayers(map);
}

/** Le sélectionné passe dans sa couche ; ceux qu'un filtre écarte sont atténués et perdent leur étiquette. */
export function syncMarkerLayers(map: MlMap, selectedId: string | null, highlightIds: Set<string> | null) {
  if (!map.getLayer(MARKER_LAYER)) return;
  const id = selectedId ?? '';
  const others: FilterSpecification = ['!=', ['get', 'id'], id];
  map.setFilter(MARKER_LAYER, others);
  map.setFilter(SELECTED_LAYER, ['==', ['get', 'id'], id]);
  const highlighted: ExpressionSpecification = ['in', ['get', 'id'], ['literal', [...(highlightIds ?? [])]]];
  map.setPaintProperty(MARKER_LAYER, 'icon-opacity', highlightIds ? ['case', highlighted, 1, DIM_OPACITY] : 1);
  if (map.getLayer(LABEL_LAYER)) map.setFilter(LABEL_LAYER, highlightIds ? ['all', others, highlighted] : others);
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
