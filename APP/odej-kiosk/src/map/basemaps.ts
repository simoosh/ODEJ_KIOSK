import type { StyleSpecification } from 'maplibre-gl';
import type { BasemapId, Locale } from '../types';
import { graticule } from '../lib/geo';
import { CONFIG } from '../config';

/** Relief auto-hébergé (tools/dem) : Copernicus GLO-30, surfaces sportives d'OSM aplaties. */
const demSource = () => ({
  type: 'raster-dem' as const,
  tiles: [`${location.origin}${import.meta.env.BASE_URL}${CONFIG.terrainTiles}`],
  encoding: 'mapbox' as const,
  tileSize: 512,
  minzoom: 8,
  maxzoom: 11,
  bounds: [4, 36.1, 5.9, 37.1] as [number, number, number, number],
  attribution: CONFIG.terrainAttribution,
});

/** Polices des étiquettes de marqueurs sur les fonds raster (mêmes que le plan vectoriel) */
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** Clé ArcGIS facultative, restreinte au domaine chez le fournisseur : elle reste visible côté client. */
const SATELLITE_KEY = import.meta.env.VITE_SATELLITE_KEY;
const SATELLITE_TOKEN = SATELLITE_KEY ? `?token=${encodeURIComponent(SATELLITE_KEY)}` : '';

export const SKY = {
  'sky-color': '#CFE3EE',
  'horizon-color': '#F3F1EA',
  'fog-color': '#F3F1EA',
  'sky-horizon-blend': 0.6,
  'horizon-fog-blend': 0.6,
  'fog-ground-blend': 0.8,
};

export interface BasemapDef {
  id: BasemapId;
  /** Couleurs de la vignette dans le sélecteur (pas d'image distante) */
  swatch: [string, string, string];
  /** Nécessite internet (tuiles distantes) */
  online: boolean;
  terrain: boolean;
}

export const BASEMAPS: BasemapDef[] = [
  { id: 'plan', swatch: ['#F2EFE6', '#CFE2C4', '#9CC6DD'], online: true, terrain: true },
  { id: 'satellite', swatch: ['#3D4B33', '#6E7A4F', '#20425A'], online: true, terrain: true },
  { id: 'preview', swatch: ['#ECEEE6', '#D3D9CC', '#1E6B3C'], online: false, terrain: false },
];

// Le relief (setTerrain) et le ciel (setSky) sont appliqués après le chargement du style, dans MapView :
// une propriété invalide dans l'objet style empêcherait toute la carte de se charger.
function rasterStyle(id: string, tiles: string[], attribution: string, maxzoom: number): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS_URL,
    sources: {
      [id]: { type: 'raster', tiles, tileSize: 256, maxzoom, attribution },
      dem: demSource(),
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#EEF0E8' } },
      { id, type: 'raster', source: id, paint: { 'raster-fade-duration': 0 } },
    ],
  } as StyleSpecification;
}

export function previewStyle(): StyleSpecification {
  return {
    version: 8,
    sources: { graticule: { type: 'geojson', data: graticule(0.1) } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#ECEEE6' } },
      {
        id: 'grid-minor',
        type: 'line',
        source: 'graticule',
        filter: ['!=', ['get', 'major'], true],
        paint: { 'line-color': '#D6DBCF', 'line-width': 0.8 },
      },
      {
        id: 'grid-major',
        type: 'line',
        source: 'graticule',
        filter: ['==', ['get', 'major'], true],
        paint: { 'line-color': '#B9C2B1', 'line-width': 1.4 },
      },
    ],
  } as StyleSpecification;
}

/** Plan vectoriel OpenStreetMap (OpenFreeMap, sans clé) */
export const PLAN_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Retourne soit un objet style, soit une URL + une transformation (libellés arabe/anglais, relief). */
export function styleFor(id: BasemapId, locale: Locale):
  | { style: StyleSpecification }
  | { url: string; transform: (next: StyleSpecification) => StyleSpecification } {
  switch (id) {
    case 'satellite':
      return {
        style: rasterStyle(
          'satellite',
          [`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${SATELLITE_TOKEN}`],
          'Imagerie © Esri, Maxar, Earthstar Geographics',
          CONFIG.satelliteSourceMaxZoom,
        ),
      };
    case 'preview':
      return { style: previewStyle() };
    case 'plan':
    default:
      return {
        url: PLAN_STYLE_URL,
        transform: (next) => localizePlan(next, locale),
      };
  }
}

/** Libellés dans la langue de l'interface + relief et ombrage sous les libellés. */
function localizePlan(style: StyleSpecification, locale: Locale): StyleSpecification {
  const nameExpr =
    locale === 'ar'
      ? ['coalesce', ['get', 'name:ar'], ['get', 'name']]
      : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];

  const layers = style.layers.map((layer) => {
    if (layer.type !== 'symbol' || !layer.layout || !('text-field' in layer.layout)) return layer;
    const tf = JSON.stringify(layer.layout['text-field']);
    if (!tf.includes('name')) return layer; // numéros de route, etc.
    return { ...layer, layout: { ...layer.layout, 'text-field': nameExpr } } as typeof layer;
  });

  const firstSymbol = layers.findIndex((l) => l.type === 'symbol');
  const hillshade = {
    id: 'hillshade',
    type: 'hillshade',
    source: 'dem',
    paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#5C6B55', 'hillshade-highlight-color': '#FFFFFF' },
  } as StyleSpecification['layers'][number];
  layers.splice(firstSymbol < 0 ? layers.length : firstSymbol, 0, hillshade);

  return {
    ...style,
    sources: { ...style.sources, dem: demSource() },
    layers,
  } as StyleSpecification;
}

export const TERRAIN_SPEC = { source: 'dem', exaggeration: CONFIG.terrainExaggeration };
