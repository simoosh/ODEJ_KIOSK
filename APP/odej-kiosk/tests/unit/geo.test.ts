import { describe, expect, it } from 'vitest';
import { bounds, distanceKm, graticule, toDms } from '../../src/lib/geo';
import { boundaryPoints, expandBounds, frameCamera, type LngLat } from '../../src/lib/geo';

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

describe('cadrage de la wilaya', () => {
  const square: LngLat[] = [
    [4, 36],
    [6, 36],
    [6, 37],
    [4, 37],
  ];

  it('agrandit une emprise de chaque côté', () => {
    expect(expandBounds([[4, 36], [6, 37]], 0.25)).toEqual([[3.5, 35.75], [6.5, 37.25]]);
  });

  it('lit tous les points d\'un contour', () => {
    const coordinates = [[[[1, 2], [3, 4]]], [[[5, 6]]]];
    const boundary = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates } }] };
    expect(boundaryPoints(boundary as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>)).toEqual([[1, 2], [3, 4], [5, 6]]);
  });

  it('centre sur les points, avec ou sans orientation', () => {
    const flat = frameCamera(square, 0, 0, 1000, 1000);
    const turned = frameCamera(square, 0, 40, 1000, 1000);
    expect(flat.center[0]).toBeCloseTo(5);
    expect(flat.center[1]).toBeCloseTo(36.5, 1);
    expect(turned.center[0]).toBeCloseTo(5);
    expect(turned.center[1]).toBeCloseTo(36.5, 1);
  });

  it('dézoome pour une zone plus étroite', () => {
    expect(frameCamera(square, 55, -18, 500, 1000).zoom).toBeLessThan(frameCamera(square, 55, -18, 1000, 1000).zoom);
  });
});
