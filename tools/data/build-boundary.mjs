// Contour de la wilaya de Béjaïa : relation OSM 1278765 (ODbL), simplifiée pour rester sous 30 Ko.
// Usage : node tools/data/build-boundary.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RELATION = 'R1278765';
const OUTPUT = fileURLToPath(new URL('../../APP/odej-kiosk/public/data/bejaia-boundary.geojson', import.meta.url));
/** Tolérance de simplification, en degrés (~110 m) */
const TOLERANCE = 0.001;
const MAX_BYTES = 30 * 1024;

function distanceToSegment([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

/** Douglas-Peucker, sans récursion : un contour réel compte des milliers de points. */
function simplify(points, tolerance) {
  const keep = new Set([0, points.length - 1]);
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let farthest = -1;
    let max = tolerance;
    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(points[i], points[first], points[last]);
      if (distance > max) {
        max = distance;
        farthest = i;
      }
    }
    if (farthest >= 0) {
      keep.add(farthest);
      stack.push([first, farthest], [farthest, last]);
    }
  }
  return [...keep].sort((a, b) => a - b).map((i) => points[i]);
}

const url = `https://nominatim.openstreetmap.org/lookup?osm_ids=${RELATION}&polygon_geojson=1&format=geojson`;
const response = await fetch(url, { headers: { 'User-Agent': 'odej-kiosk-data/1.0' } });
if (!response.ok) throw new Error(`Nominatim: ${response.status}`);
const { geometry } = (await response.json()).features[0];
const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

const round = ([lon, lat]) => [Number(lon.toFixed(4)), Number(lat.toFixed(4))];
const coordinates = polygons
  .map((rings) => [simplify(rings[0], TOLERANCE).map(round)])
  .filter(([ring]) => ring.length >= 4);

const collection = {
  type: 'FeatureCollection',
  attribution: '© OpenStreetMap contributors, ODbL',
  source: `https://www.openstreetmap.org/relation/${RELATION.slice(1)}`,
  features: [{ type: 'Feature', properties: { code: '06' }, geometry: { type: 'MultiPolygon', coordinates } }],
};
const text = `${JSON.stringify(collection)}\n`;
writeFileSync(OUTPUT, text);
console.log(`build-boundary: ${coordinates.length} polygon(s), ${coordinates.flat(2).length} points, ${(text.length / 1024).toFixed(1)} KB`);
if (text.length > MAX_BYTES) {
  console.error('build-boundary: over 30 KB, raise TOLERANCE');
  process.exit(1);
}
