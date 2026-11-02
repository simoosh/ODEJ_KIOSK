import { describe, expect, it } from 'vitest';
import { mediaUrl, resolveMediaBase, thumbUrl } from '../../src/config';
import { swipeAction } from '../../src/lib/swipe';

describe('resolveMediaBase', () => {
  it('prend le CDN quand il est défini et garantit la barre finale', () => {
    expect(resolveMediaBase('https://odej-media.pages.dev', '/')).toBe('https://odej-media.pages.dev/');
    expect(resolveMediaBase('https://odej-media.pages.dev/', '/')).toBe('https://odej-media.pages.dev/');
  });

  it('retombe sur le site lui-même', () => {
    expect(resolveMediaBase(undefined, '/')).toBe('/media/');
    expect(resolveMediaBase('', '/sous-dossier/')).toBe('/sous-dossier/media/');
  });
});

describe('mediaUrl', () => {
  it('ajoute la racine des médias', () => {
    expect(mediaUrl('odej-003/cover.webp', 'https://cdn.test/')).toBe('https://cdn.test/odej-003/cover.webp');
  });

  it("tolère l'ancien préfixe media/", () => {
    expect(mediaUrl('media/odej-003/cover.webp', '/media/')).toBe('/media/odej-003/cover.webp');
  });
});

describe('thumbUrl', () => {
  it('pointe vers le dossier thumbs, photo comme poster', () => {
    expect(thumbUrl('https://cdn/odej-003/gallery/gallery-01.webp')).toBe('https://cdn/odej-003/thumbs/gallery-01-480.webp');
    expect(thumbUrl('/media/odej-003/videos/video-01-poster.webp')).toBe('/media/odej-003/thumbs/video-01-poster-480.webp');
  });
});

describe('swipeAction', () => {
  it('suit le sens de lecture', () => {
    expect(swipeAction(120, 0, true)).toBe('next');
    expect(swipeAction(-120, 0, true)).toBe('previous');
    expect(swipeAction(-120, 0, false)).toBe('next');
    expect(swipeAction(120, 0, false)).toBe('previous');
  });

  it('ferme vers le bas et ignore les petits gestes', () => {
    expect(swipeAction(10, 120, true)).toBe('close');
    expect(swipeAction(20, 10, true)).toBeNull();
    expect(swipeAction(5, -120, true)).toBeNull();
  });
});
