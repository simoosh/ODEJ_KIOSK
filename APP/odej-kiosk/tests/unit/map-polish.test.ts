import { afterEach, describe, expect, it, vi } from 'vitest';
import { perfCounters } from '../../src/lib/perf';
import { fogOpacity, outsideFog } from '../../src/map/fog';
import { preloadUrls, startPreload, tileRange } from '../../src/map/preload';
import type { LngLat } from '../../src/lib/geo';

describe('brouillard', () => {
  it('laisse la wilaya dégagée et couvre le lointain', () => {
    expect(fogOpacity(1, 0.5)).toBe(0);
    expect(fogOpacity(0, 0.5)).toBe(1);
  });

  it('épaissit le bord là où le bruit est faible', () => {
    expect(fogOpacity(0.15, 0.1)).toBeGreaterThan(fogOpacity(0.15, 0.9));
  });

  it('troue le monde sur la zone peinte', () => {
    const hole = outsideFog([[3, 35], [7, 38]]).geometry.coordinates[1];
    expect(hole).toContainEqual([3, 35]);
    expect(hole).toContainEqual([7, 38]);
  });
});

describe('préchargement', () => {
  const wilaya: [LngLat, LngLat] = [[4.2, 36.3], [5.6, 36.95]];
  const sources = { plan: 'p/{z}/{x}/{y}', satellite: 's/{z}/{y}/{x}', terrain: 't/{z}/{x}/{y}?v=2' };

  afterEach(() => vi.unstubAllGlobals());

  it('couvre une emprise avec les bons numéros de tuiles', () => {
    expect(tileRange([[5.07, 36.74], [5.07, 36.74]], 14)).toEqual([[8422, 6391]]);
  });

  it('ne demande jamais deux fois la même tuile et commence par le relief', () => {
    const urls = preloadUrls(sources, wilaya, [[5, 36.7], [5, 36.7]]);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls[0]).toMatch(/^t\/8\//);
    expect(urls.some((url) => url.startsWith('s/16/'))).toBe(true);
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
