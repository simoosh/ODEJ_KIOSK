export type LngLat = [number, number];

export function distanceKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function bounds(points: LngLat[]): [LngLat, LngLat] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

/** 36.6910753 → 36°41′28″ N */
export function toDms(value: number, axis: 'lat' | 'lng'): string {
  const hemi = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  const v = Math.abs(value);
  const d = Math.floor(v);
  const mFloat = (v - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″ ${hemi}`;
}

/** Grille de méridiens et parallèles (fond de l'aperçu hors ligne). */
export function graticule(step = 0.1, west = 3.7, south = 35.9, east = 6.2, north = 37.3) {
  const features: GeoJSON.Feature[] = [];
  for (let x = Math.ceil(west / step) * step; x <= east; x += step) {
    const major = Math.abs(x * 2 - Math.round(x * 2)) < 1e-6;
    features.push({ type: 'Feature', properties: { major }, geometry: { type: 'LineString', coordinates: [[x, south], [x, north]] } });
  }
  for (let y = Math.ceil(south / step) * step; y <= north; y += step) {
    const major = Math.abs(y * 2 - Math.round(y * 2)) < 1e-6;
    features.push({ type: 'Feature', properties: { major }, geometry: { type: 'LineString', coordinates: [[west, y], [east, y]] } });
  }
  return { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection;
}

/** Tous les points d'un contour, tous polygones confondus. */
export function boundaryPoints(boundary: GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>): LngLat[] {
  return boundary.features.flatMap((f) => f.geometry.coordinates.flat(2) as LngLat[]);
}

/** Emprise agrandie de ratio sur chaque côté. */
export function expandBounds([[w, s], [e, n]]: [LngLat, LngLat], ratio: number): [LngLat, LngLat] {
  const dx = (e - w) * ratio;
  const dy = (n - s) * ratio;
  return [
    [w - dx, s - dy],
    [e + dx, n + dy],
  ];
}

/** L'inclinaison grossit le bord le plus proche : marge pour que la wilaya reste entière. */
const PERSPECTIVE_MARGIN = 1.12;

/**
 * Centre et zoom qui font tenir des points dans width × height, pour une orientation et une inclinaison données.
 * Calculés sur les points eux-mêmes : cameraForBounds ne tient pas compte de l'inclinaison.
 */
export function frameCamera(points: LngLat[], pitch: number, bearing: number, width: number, height: number) {
  const b = (bearing * Math.PI) / 180;
  const tilt = Math.cos((pitch * Math.PI) / 180);
  const projected = points.map(([lng, lat]) => {
    const x = (lng + 180) / 360;
    const y = (1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2;
    return [x * Math.cos(b) + y * Math.sin(b), (-x * Math.sin(b) + y * Math.cos(b)) * tilt];
  });
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY)) / PERSPECTIVE_MARGIN;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2 / tilt;
  const x = midX * Math.cos(b) - midY * Math.sin(b);
  const y = midX * Math.sin(b) + midY * Math.cos(b);
  const center: LngLat = [x * 360 - 180, (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI];
  return { center, zoom: Math.log2(scale / 512) };
}
