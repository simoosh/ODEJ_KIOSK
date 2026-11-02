import { describe, expect, it } from 'vitest';
import { buildIndexes, featuredEstablishments, search, sortForList, titleOf, videosFirst, withMedia } from '../../src/data/model';
import type { Establishment, KioskData } from '../../src/types';

const est = (id: string): Establishment => ({
  id,
  name: { ar: id, en: id },
  category: 'youth-centre',
  placeId: null,
  location: { lat: 36.7, lng: 5 },
});

const data = { establishments: [est('odej-001'), est('odej-002')] } as KioskData;

describe('titres affichés', () => {
  const named: Establishment = {
    ...est('odej-005'),
    name: { ar: 'الشهيد حماي بشير شميني', en: 'Martyr Hamai Bachir' },
    displayName: { ar: 'دار الشباب شميني', en: 'Chemini Youth Centre' },
    honoree: { ar: 'الشهيد حماي بشير', en: 'Martyr Hamai Bachir' },
  };
  const plain: Establishment = { ...est('odej-006'), name: { ar: 'بيت الشباب أقبو', en: 'Akbou Youth Hostel' } };
  const kiosk = { establishments: [named, plain], categories: [], places: [], activities: [] } as unknown as KioskData;
  const idx = buildIndexes(kiosk);

  it('préfère displayName au nom officiel', () => {
    expect(titleOf(named)).toBe(named.displayName);
    expect(titleOf(plain)).toBe(plain.name);
  });

  it('trouve un établissement par son titre, sa personne ou son nom officiel', () => {
    for (const query of ['دار الشباب', 'Chemini', 'حماي', 'الشهيد حماي بشير شميني']) {
      expect(search(kiosk, idx, query).establishments.map((h) => h.id)).toContain('odej-005');
    }
  });

  it('trie sur le titre affiché', () => {
    expect(sortForList([plain, named], idx, 'en').map((e) => e.id)).toEqual(['odej-006', 'odej-005']);
  });
});

describe('withMedia', () => {
  it('fusionne les médias par id et préfixe les chemins', () => {
    const merged = withMedia(
      data,
      {
        'odej-001': {
          cover: { src: 'odej-001/cover.webp', kind: 'image', fit: 'contain' },
          gallery: [{ src: 'odej-001/videos/video-01.mp4', kind: 'video', poster: 'odej-001/videos/video-01-poster.webp' }],
        },
      },
      '/media/',
    );
    expect(merged.establishments[0].media).toEqual({
      cover: { src: '/media/odej-001/cover.webp', kind: 'image', fit: 'contain' },
      gallery: [
        { src: '/media/odej-001/videos/video-01.mp4', kind: 'video', poster: '/media/odej-001/videos/video-01-poster.webp' },
      ],
    });
  });

  it('garde une couverture nulle', () => {
    const merged = withMedia(data, { 'odej-001': { cover: null, gallery: [] } }, '/media/');
    expect(merged.establishments[0].media?.cover).toBeNull();
  });

  it("laisse sans médias un établissement absent de l'index", () => {
    const merged = withMedia(data, {}, '/media/');
    expect(merged.establishments[1].media).toBeUndefined();
  });
});

describe('établissement phare', () => {
  const places = [{ id: 'a', name: { ar: 'أ', en: 'A' } }, { id: 'z', name: { ar: 'ي', en: 'Z' } }];
  const plain = { ...est('odej-001'), placeId: 'a', name: { ar: 'مركز', en: 'Center' } };
  const star = { ...est('odej-002'), placeId: 'z', name: { ar: 'مركز', en: 'Center' }, featured: true };
  const kiosk = { establishments: [plain, star], places, categories: [], activities: [] } as unknown as KioskData;
  const idx = buildIndexes(kiosk);

  it('suit featuredOrder', () => {
    const first = { ...est('b'), featured: true, featuredOrder: 1 };
    const second = { ...est('a'), featured: true, featuredOrder: 2 };
    expect(featuredEstablishments([second, est('c'), first]).map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('passe en tête de liste, même après les autres dans l\'alphabet', () => {
    expect(sortForList([plain, star], idx, 'en').map((e) => e.id)).toEqual(['odej-002', 'odej-001']);
  });

  it('passe en tête de la recherche à score égal', () => {
    expect(search(kiosk, idx, 'center').establishments[0].id).toBe('odej-002');
  });

  it('suit la donnée : sans featured, plus de mise en avant', () => {
    const none = { ...star, featured: false };
    expect(sortForList([plain, none], idx, 'en').map((e) => e.id)).toEqual(['odej-001', 'odej-002']);
  });

  it('montre les vidéos en premier', () => {
    const items = [{ src: 'p', kind: 'image' }, { src: 'v', kind: 'video' }] as Parameters<typeof videosFirst>[0];
    expect(videosFirst(items).map((i) => i.src)).toEqual(['v', 'p']);
  });
});
