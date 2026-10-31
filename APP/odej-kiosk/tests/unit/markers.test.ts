import { describe, expect, it } from 'vitest';
import { forcedQuality, nextQuality } from '../../src/config';
import { markerCollection, pickMarker, placeEstablishments } from '../../src/map/markers';
import type { Category, Establishment } from '../../src/types';

const est = (id: string, category = 'youth-centre'): Establishment => ({
  id,
  name: { ar: `اسم ${id}`, en: `Name ${id}` },
  category,
  placeId: null,
  location: { lat: 36.7, lng: 5 },
});
const categories = [{ id: 'youth-centre' }, { id: 'youth-facility' }] as Category[];

describe('placeEstablishments', () => {
  it('décale les établissements aux mêmes coordonnées', () => {
    const [a, b] = placeEstablishments([est('a'), est('b')], categories);
    expect(a.position).toEqual([5, 36.7]);
    expect(b.position[0]).toBeCloseTo(5.00018);
  });

  it('prend la dernière catégorie pour une catégorie inconnue', () => {
    expect(placeEstablishments([est('a', 'inconnue')], categories)[0].image).toBe('mk-youth-facility');
  });
});

describe('markerCollection', () => {
  it('porte le titre dans la langue demandée', () => {
    const placed = placeEstablishments([est('a')], categories);
    expect(markerCollection(placed, 'en').features[0].properties?.title).toBe('Name a');
    expect(markerCollection(placed, 'ar').features[0].properties?.title).toBe('اسم a');
  });
});

describe('pickMarker', () => {
  it('renvoie null sans marqueur touché', () => {
    expect(pickMarker([], null)).toBeNull();
  });

  it('prend le plus proche du toucher', () => {
    expect(pickMarker([{ id: 'loin', distance: 30 }, { id: 'proche', distance: 2 }], null)).toBe('proche');
  });

  it('atteint tour à tour les marqueurs superposés', () => {
    const hits = [{ id: 'odej-010', distance: 3 }, { id: 'odej-032', distance: 5 }];
    expect(pickMarker(hits, null)).toBe('odej-010');
    expect(pickMarker(hits, 'odej-010')).toBe('odej-032');
    expect(pickMarker(hits, 'odej-032')).toBe('odej-010');
  });
});

describe('niveaux de qualité', () => {
  it('garde le niveau à 40 FPS et plus', () => {
    expect(nextQuality('high', 40)).toBe('high');
  });

  it('descend d\'un niveau sous 40 FPS', () => {
    expect(nextQuality('high', 39)).toBe('medium');
    expect(nextQuality('medium', 39)).toBe('low');
  });

  it('passe à low sous 25 FPS', () => {
    expect(nextQuality('high', 24)).toBe('low');
  });

  it('lit ?quality= et refuse une valeur inconnue', () => {
    expect(forcedQuality('?quality=low')).toBe('low');
    expect(forcedQuality('?quality=ultra')).toBeNull();
    expect(forcedQuality('')).toBeNull();
  });
});
