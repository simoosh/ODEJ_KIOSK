import { afterEach, describe, expect, it, vi } from 'vitest';
import { perfCounters } from '../../src/lib/perf';
import { cloudEdge, cloudOpacity, splitOpacity } from '../../src/lib/clouds';
import { distanceField, fogOpacity, outsideFog } from '../../src/map/fog';
import { preloadUrls, startPreload, tileRange } from '../../src/map/preload';
import type { LngLat } from '../../src/lib/geo';

describe('brouillard', () => {
  it('commence à zéro au bord de la wilaya, sans cassure', () => {
    expect(fogOpacity(0, 0)).toBe(0);
    expect(fogOpacity(0, 1)).toBe(0);
  });

  it('épaissit progressivement avec la distance', () => {
    const steps = [10, 20, 30, 40, 50].map((km) => fogOpacity(km, 0.5));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(fogOpacity(20, 0.5)).toBeLessThan(0.5);
  });

  it('devient opaque au loin', () => {
    expect(fogOpacity(100, 0)).toBe(1);
  });

  it('mesure la distance au contour', () => {
    const inside = new Uint8Array(25);
    inside[12] = 1;
    const field = distanceField(inside, 5, 5);
    expect(field[12]).toBe(0);
    expect(field[13]).toBe(1);
    expect(field[14]).toBe(2);
    expect(field[18]).toBeCloseTo(Math.SQRT2);
  });

  it('troue le monde sur la zone peinte', () => {
    const hole = outsideFog([[3, 35], [7, 38]]).geometry.coordinates[1];
    expect(hole).toContainEqual([3, 35]);
    expect(hole).toContainEqual([7, 38]);
  });
});

describe("nuages de l'accueil", () => {
  it('descendent plus bas au centre que sur les côtés', () => {
    expect(cloudEdge(0.5, false)).toBeGreaterThan(cloudEdge(0, false));
    expect(cloudEdge(0, false)).toBeCloseTo(cloudEdge(1, false));
  });

  it('sont opaques en haut et disparaissent en bas', () => {
    expect(cloudOpacity(0.5, 0.2, 0.5, false)).toBe(1);
    expect(cloudOpacity(0.5, 1, 0.5, false)).toBe(0);
  });

  it("s'ouvrent en deux sans changer l'image au repos", () => {
    for (const [alpha, share] of [[1, 0.5], [0.6, 0.3], [0.4, 1], [0.8, 0]]) {
      const [left, right] = splitOpacity(alpha, share);
      expect(right + left * (1 - right)).toBeCloseTo(alpha);
    }
  });
});

describe('préchargement', () => {
  const wilaya: [LngLat, LngLat] = [[4.2, 36.3], [5.6, 36.95]];
  const sources = { plan: 'p/{z}/{x}/{y}', satellite: ['s/{z}/{y}/{x}', 's/{z}/{y}/{x}'], terrain: 't/{z}/{x}/{y}?v=2' };

  afterEach(() => vi.unstubAllGlobals());

  it('couvre une emprise avec les bons numéros de tuiles', () => {
    expect(tileRange([[5.07, 36.74], [5.07, 36.74]], 14)).toEqual([[8422, 6391]]);
  });

  it('ne demande jamais deux fois la même tuile et commence par la sous-couche satellite', () => {
    const urls = preloadUrls(sources, wilaya, [[5, 36.7], [5, 36.7]]);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls[0]).toMatch(/^s\/9\//);
    expect(urls.some((url) => url.startsWith('t/8/'))).toBe(true);
    expect(urls.some((url) => url.startsWith('s/16/'))).toBe(true);
  });

  it('répartit le satellite entre les serveurs comme MapLibre', () => {
    const urls = preloadUrls({ ...sources, satellite: ['a/{z}/{y}/{x}', 'b/{z}/{y}/{x}'] }, wilaya, []);
    for (const url of urls.filter((u) => /^[ab]\//.test(u))) {
      const [host, , y, x] = url.split('/');
      expect(host).toBe((Number(x) + Number(y)) % 2 === 0 ? 'a' : 'b');
    }
  });

  it("s'arrête après plusieurs échecs de réseau", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    startPreload(Array.from({ length: 50 }, (_, i) => `u${i}`), () => true);
    await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(5));
    await new Promise((done) => setTimeout(done, 20));
    expect(fetchMock.mock.calls.length).toBeLessThan(12);
  });

  it('compte ce qui est arrivé', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(1) }));
    const before = perfCounters.preloaded;
    startPreload(['a', 'b'], () => true);
    await vi.waitFor(() => expect(perfCounters.preloaded).toBe(before + 2));
  });
});
