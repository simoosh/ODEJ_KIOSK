import { describe, expect, it } from 'vitest';
import { mediaUrl, resolveMediaBase } from '../../src/config';

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
