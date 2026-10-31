import { describe, expect, it } from 'vitest';
import { bounds, distanceKm, graticule, toDms } from '../../src/lib/geo';

describe('distanceKm', () => {
  it('vaut 0 pour un même point', () => {
    expect(distanceKm([5.07, 36.75], [5.07, 36.75])).toBe(0);
  });

  it('donne environ 111,19 km pour un degré de latitude', () => {
    expect(distanceKm([0, 0], [0, 1])).toBeCloseTo(111.19, 2);
  });

  it('est symétrique', () => {
    const a: [number, number] = [5.07, 36.75];
    const b: [number, number] = [4.52, 36.5];
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 9);
  });
});

describe('bounds', () => {
  it("renvoie l'emprise sud-ouest / nord-est", () => {
    expect(
      bounds([
        [5, 36],
        [4, 37],
        [4.5, 36.5],
      ]),
    ).toEqual([
      [4, 36],
      [5, 37],
    ]);
  });
});

describe('toDms', () => {
  it('formate une latitude nord', () => {
    expect(toDms(36.6910753, 'lat')).toBe('36°41′28″ N');
  });

  it('formate les hémisphères sud et ouest', () => {
    expect(toDms(-36.5, 'lat')).toBe('36°30′00″ S');
    expect(toDms(-4.5, 'lng')).toBe('4°30′00″ W');
  });
});

describe('graticule', () => {
  it('produit des méridiens et des parallèles, avec les lignes majeures tous les 0,5°', () => {
    const { features } = graticule(0.5, 4, 36, 5, 37);
    expect(features).toHaveLength(6);
    expect(features.every((f) => f.geometry.type === 'LineString')).toBe(true);
    expect(features.every((f) => f.properties?.major === true)).toBe(true);
  });
});
