import { describe, expect, it } from 'vitest';
import { withMedia } from '../../src/data/model';
import type { Establishment, KioskData } from '../../src/types';

const est = (id: string): Establishment => ({
  id,
  name: { ar: id, en: id },
  category: 'youth-centre',
  placeId: null,
  location: { lat: 36.7, lng: 5 },
});

const data = { establishments: [est('odej-001'), est('odej-002')] } as KioskData;

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
