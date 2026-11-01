import type { Map as MlMap } from 'maplibre-gl';
import type { Boundary } from '../types';
import { CONFIG } from '../config';
import { boundaryPoints, bounds, distanceKm, expandBounds, mercator, type LngLat } from '../lib/geo';
import { canvasContext, fractalNoise, smoothstep } from '../lib/noise';

const FOG_LAYER = 'fog';
const OUTSIDE_LAYER = 'fog-outside';
const CANVAS_WIDTH = 1024;
const DIAGONAL = Math.SQRT2;

export interface FogImage {
  canvas: HTMLCanvasElement;
  region: [LngLat, LngLat];
}

/** Opacité à distanceKm du contour : nulle au bord, elle monte doucement ; noise (0 à 1) ne joue qu'en cours de montée. */
export function fogOpacity(distance: number, noise: number) {
  const { clearKm, opaqueKm, noiseStrength } = CONFIG.fog;
  const base = smoothstep(clearKm, opaqueKm, distance);
  return Math.max(0, Math.min(1, base + (noise - 0.5) * noiseStrength * 4 * base * (1 - base)));
}

/** Distance de chaque case à la case intérieure la plus proche, en cases (chanfrein en deux passes). */
export function distanceField(inside: Uint8Array, width: number, height: number) {
  const field = new Float32Array(width * height);
  for (let i = 0; i < field.length; i++) field[i] = inside[i] ? 0 : Infinity;
  const relax = (i: number, x: number, y: number, dx: number, dy: number, cost: number) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
    field[i] = Math.min(field[i], field[ny * width + nx] + cost);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      relax(i, x, y, -1, 0, 1);
      relax(i, x, y, 0, -1, 1);
      relax(i, x, y, -1, -1, DIAGONAL);
      relax(i, x, y, 1, -1, DIAGONAL);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      relax(i, x, y, 1, 0, 1);
      relax(i, x, y, 0, 1, 1);
      relax(i, x, y, 1, 1, DIAGONAL);
      relax(i, x, y, -1, 1, DIAGONAL);
    }
  }
  return field;
}

/** Cases dans la wilaya. */
function drawInside(boundary: Boundary, region: [LngLat, LngLat], width: number, height: number) {
  const ctx = canvasContext(document.createElement('canvas'), width, height);
  const [[west, south], [east, north]] = region;
  const [x0, y0] = mercator([west, north]);
  const [x1, y1] = mercator([east, south]);
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
  const pixels = ctx.getImageData(0, 0, width, height).data;
  return Uint8Array.from({ length: width * height }, (_, i) => (pixels[i * 4 + 3] > 127 ? 1 : 0));
}

/** Peint une fois au démarrage : aucun fichier image, et le brouillard suit toujours le contour. */
export function buildFogImage(boundary: Boundary): FogImage {
  const region = expandBounds(bounds(boundaryPoints(boundary)), CONFIG.fog.regionMargin);
  const [[west, south], [east, north]] = region;
  const [x0, y0] = mercator([west, north]);
  const [x1, y1] = mercator([east, south]);
  const width = CANVAS_WIDTH;
  const height = Math.round((width * (y1 - y0)) / (x1 - x0));
  const kmPerCell = distanceKm([west, (south + north) / 2], [east, (south + north) / 2]) / width;
  const distance = distanceField(drawInside(boundary, region, width, height), width, height);
  const noise = fractalNoise(width, height, 1962);
  const canvas = document.createElement('canvas');
  const ctx = canvasContext(canvas, width, height);
  const image = ctx.createImageData(width, height);
  const [red, green, blue] = CONFIG.fog.rgb;
  for (let cell = 0; cell < distance.length; cell++) {
    const i = cell * 4;
    const n = noise[i] / 255;
    const alpha = fogOpacity(distance[cell] * kmPerCell, n);
    // Le relief des nuages n'existe qu'en cours de montée : au loin, la teinte unie rejoint la couche extérieure
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
