import { CONFIG } from '../config';
import { perfCounters } from '../lib/perf';
import { expandBounds, mercator, type LngLat } from '../lib/geo';

export interface PreloadSources {
  plan: string;
  /** Plusieurs serveurs : même répartition que MapLibre, sinon le cache ne servirait pas */
  satellite: string[];
  terrain: string;
}

function tileUrl(templates: string | string[], z: number, x: number, y: number) {
  const template = Array.isArray(templates) ? templates[(x + y) % templates.length] : templates;
  return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

/** Tuiles [x, y] qui couvrent une emprise à un zoom donné. */
export function tileRange([[west, south], [east, north]]: [LngLat, LngLat], zoom: number): [number, number][] {
  const n = 2 ** zoom;
  const [x0, y0] = mercator([west, north]);
  const [x1, y1] = mercator([east, south]);
  const tiles: [number, number][] = [];
  for (let x = Math.floor(x0 * n); x <= Math.floor(x1 * n); x++) {
    for (let y = Math.floor(y0 * n); y <= Math.floor(y1 * n); y++) tiles.push([x, y]);
  }
  return tiles;
}

/** Du plus utile au moins utile : sous-couche satellite, vue d'ensemble, puis les abords de chaque établissement. */
export function preloadUrls(sources: PreloadSources, wilaya: [LngLat, LngLat], establishments: LngLat[]) {
  const { terrainZooms, planZooms, satelliteZooms, planDetailZooms, satelliteDetailZooms, aroundPlanZooms, aroundSatelliteZooms, radiusDegrees } =
    CONFIG.preload;
  const whole = (template: string | string[], zooms: readonly number[], area: [LngLat, LngLat]) =>
    zooms.flatMap((z) => tileRange(area, z).map(([x, y]) => tileUrl(template, z, x, y)));
  const around = (template: string | string[], zooms: readonly number[]) =>
    zooms.flatMap((z) =>
      establishments.flatMap(([lng, lat]) => {
        const area: [LngLat, LngLat] = [
          [lng, lat],
          [lng, lat],
        ];
        return whole(template, [z], expandFixed(area, radiusDegrees));
      }),
    );
  const terrainArea: [LngLat, LngLat] = [
    [CONFIG.terrainBounds[0], CONFIG.terrainBounds[1]],
    [CONFIG.terrainBounds[2], CONFIG.terrainBounds[3]],
  ];
  const satelliteArea: [LngLat, LngLat] = [
    [CONFIG.satelliteBounds[0], CONFIG.satelliteBounds[1]],
    [CONFIG.satelliteBounds[2], CONFIG.satelliteBounds[3]],
  ];
  const area = expandBounds(wilaya, CONFIG.preload.wilayaMargin);
  return [
    ...new Set([
      ...whole(sources.satellite, [CONFIG.satelliteUnderlayZoom], satelliteArea),
      ...whole(sources.terrain, terrainZooms, terrainArea),
      ...whole(sources.plan, planZooms, area),
      ...whole(sources.satellite, satelliteZooms, area),
      ...whole(sources.plan, planDetailZooms, area),
      ...whole(sources.satellite, satelliteDetailZooms, area),
      ...around(sources.plan, aroundPlanZooms),
      ...around(sources.satellite, aroundSatelliteZooms),
    ]),
  ];
}

function expandFixed([[west, south], [east, north]]: [LngLat, LngLat], degrees: number): [LngLat, LngLat] {
  return [
    [west - degrees, south - degrees],
    [east + degrees, north + degrees],
  ];
}

const wait = (ms: number) => new Promise((done) => window.setTimeout(done, ms));

/**
 * Remplit le cache HTTP du navigateur pendant que personne ne touche la carte : la carte retrouve ensuite ces tuiles sans réseau.
 * S'arrête tout seul sans internet. Renvoie la fonction d'arrêt.
 */
export function startPreload(urls: string[], shouldRun: () => boolean) {
  const { concurrency, maxFailures, pauseMs } = CONFIG.preload;
  let next = 0;
  let failures = 0;
  let stopped = false;
  const worker = async () => {
    while (!stopped && next < urls.length) {
      if (!shouldRun()) {
        await wait(pauseMs);
        continue;
      }
      const url = urls[next++];
      try {
        await (await fetch(url)).arrayBuffer();
        failures = 0;
        perfCounters.preloaded += 1;
      } catch {
        failures += 1;
        if (failures >= maxFailures) stopped = true;
      }
    }
  };
  for (let i = 0; i < concurrency; i++) void worker();
  return () => {
    stopped = true;
  };
}
