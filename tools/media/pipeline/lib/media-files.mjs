// Chemins du dépôt et parcours de public/media.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
export const appDir = resolve(repoRoot, 'APP/odej-kiosk');
export const defaultMediaDir = resolve(appDir, 'public/media');

/** Valeur de --name valeur dans la ligne de commande. */
export const argValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

export const establishmentIds = (mediaDir) =>
  readdirSync(mediaDir)
    .filter((id) => /^odej-\d{3}$/.test(id))
    .sort();

/** Tous les fichiers d'un établissement, chemins relatifs à public/media avec des /. */
export function listFiles(mediaDir, id) {
  return readdirSync(resolve(mediaDir, id), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const path = resolve(entry.parentPath, entry.name).slice(resolve(mediaDir).length + 1).replaceAll('\\', '/');
      return { path, bytes: statSync(resolve(mediaDir, path)).size };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function readMedia(mediaDir, id) {
  const file = resolve(mediaDir, id, 'media.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { cover: null, gallery: [] };
}

/** Ce que media.json référence : images (photos, posters) et vidéos. */
export function references(media) {
  const items = [media.cover, ...media.gallery].filter(Boolean);
  const images = items.filter((item) => item.kind !== 'video').map((item) => item.src);
  const posters = items.map((item) => item.poster).filter(Boolean);
  const videos = items.filter((item) => item.kind === 'video').map((item) => item.src);
  return { photos: images, posters, videos, all: [...images, ...posters, ...videos] };
}
