import type { Map as MlMap } from 'maplibre-gl';
import type { Boundary } from '../types';
import { CONFIG } from '../config';
import { boundaryPoints, bounds, distanceKm, expandBounds, mercator, type LngLat } from '../lib/geo';

const FOG_LAYER = 'fog';
const OUTSIDE_LAYER = 'fog-outside';
const CANVAS_WIDTH = 1024;
const NOISE_CELLS = [96, 48, 24, 12];

export interface FogImage {
  canvas: HTMLCanvasElement;
  region: [LngLat, LngLat];
}

function smoothstep(from: number, to: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** Opacité du brouillard : coverage vaut 1 dans la wilaya et 0 loin d'elle ; noise (0 à 1) déchire le bord. */
export function fogOpacity(coverage: number, noise: number) {
  const { opaqueAt, clearAt, noiseStrength } = CONFIG.fog;
  return 1 - smoothstep(opaqueAt, clearAt, coverage + (noise - 0.5) * noiseStrength);
}

/** Générateur à graine : le brouillard a le même aspect à chaque démarrage. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function context(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2D indisponible');
  return { canvas, ctx };
}

/** Couverture floutée de la wilaya, dans le canal alpha. */
function drawCoverage(boundary: Boundary, region: [LngLat, LngLat], width: number, height: number) {
  const { ctx } = context(width, height);
  const [[west, south], [east, north]] = region;
  const [x0, y0] = mercator([west, north]);
  const [x1, y1] = mercator([east, south]);
  const spanKm = distanceKm([west, (south + north) / 2], [east, (south + north) / 2]);
  ctx.filter = `blur(${(CONFIG.fog.blurKm * width) / spanKm}px)`;
  ctx.beginPath();
  for (const polygon of boundary.features.flatMap((f) => f.geometry.coordinates)) {
    polygon[0].forEach((point, index) => {
      const [x, y] = mercator(point as LngLat);
      const px = ((x - x0) / (x1 - x0)) * width;
      const py = ((y - y0) / (y1 - y0)) * height;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
  }
  ctx.fill();
  return ctx.getImageData(0, 0, width, height).data;
}

/** Bruit fractal : des grilles aléatoires agrandies et superposées, sans calcul par pixel. */
function drawNoise(width: number, height: number) {
  const random = seededRandom(1962);
  const { ctx } = context(width, height);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  NOISE_CELLS.forEach((cells, octave) => {
    const small = context(cells, Math.ceil((cells * height) / width));
    const image = small.ctx.createImageData(small.canvas.width, small.canvas.height);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.floor(random() * 256);
      image.data.set([value, value, value, 255], i);
    }
    small.ctx.putImageData(image, 0, 0);
    ctx.globalAlpha = 0.7 / (octave + 1);
    ctx.drawImage(small.canvas, 0, 0, width, height);
  });
  return ctx.getImageData(0, 0, width, height).data;
}

/** Peint une fois au démarrage : aucun fichier image, et le brouillard suit toujours le contour. */
export function buildFogImage(boundary: Boundary): FogImage {
  const region = expandBounds(bounds(boundaryPoints(boundary)), CONFIG.fog.regionMargin);
  const [x0, y0] = mercator([region[0][0], region[1][1]]);
  const [x1, y1] = mercator([region[1][0], region[0][1]]);
  const width = CANVAS_WIDTH;
  const height = Math.round((width * (y1 - y0)) / (x1 - x0));
  const coverage = drawCoverage(boundary, region, width, height);
  const noise = drawNoise(width, height);
  const { canvas, ctx } = context(width, height);
  const image = ctx.createImageData(width, height);
  const [red, green, blue] = CONFIG.fog.rgb;
  for (let i = 0; i < image.data.length; i += 4) {
    const n = noise[i] / 255;
    const alpha = fogOpacity(coverage[i + 3] / 255, n);
    // Le relief des nuages n'existe que sur le bord : au loin, la teinte unie rejoint la couche extérieure
    const shade = 1 - CONFIG.fog.shade * (1 - n) * 4 * alpha * (1 - alpha);
    image.data[i] = red * shade;
    image.data[i + 1] = green * shade;
    image.data[i + 2] = blue * shade;
    image.data[i + 3] = alpha * 255;
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, region };
}

/** Monde troué par la zone peinte : au-delà du canevas, le brouillard reste opaque. */
export function outsideFog([[west, south], [east, north]]: [LngLat, LngLat]): GeoJSON.Feature<GeoJSON.Polygon> {
  const world = [
    [-60, -10],
    [80, -10],
    [80, 75],
    [-60, 75],
    [-60, -10],
  ];
  const hole = [
    [west, south],
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [world, hole] } };
}

/** À ajouter avant les marqueurs : le brouillard couvre le fond et ses libellés, jamais les établissements. */
export function addFogLayers(map: MlMap, { canvas, region }: FogImage) {
  const [[west, south], [east, north]] = region;
  map.addSource(FOG_LAYER, {
    type: 'canvas',
    canvas,
    animate: false,
    coordinates: [
      [west, north],
      [east, north],
      [east, south],
      [west, south],
    ],
  });
  map.addSource(OUTSIDE_LAYER, { type: 'geojson', data: outsideFog(region) });
  map.addLayer({ id: FOG_LAYER, type: 'raster', source: FOG_LAYER, paint: { 'raster-fade-duration': 0 } });
  map.addLayer({ id: OUTSIDE_LAYER, type: 'fill', source: OUTSIDE_LAYER, paint: { 'fill-color': CONFIG.fog.color } });
}
