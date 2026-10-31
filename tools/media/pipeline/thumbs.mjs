// npm run media:thumbs : crée thumbs/<nom>-480.webp pour chaque photo et chaque poster.
// Idempotent, ne modifie jamais une source. Option : --root <dossier> remplace public/media.
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { argValue, defaultMediaDir, establishmentIds, readMedia, references } from './lib/media-files.mjs';

const WIDTH = 480;
const mediaDir = argValue('--root') ? resolve(argValue('--root')) : defaultMediaDir;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('media:thumbs: sharp is missing. Run: npm ci --prefix ../../tools/media/pipeline');
  process.exit(1);
}

let created = 0;
let upToDate = 0;
let missing = 0;

for (const id of establishmentIds(mediaDir)) {
  const refs = references(readMedia(mediaDir, id));
  const dir = resolve(mediaDir, id, 'thumbs');
  for (const path of [...refs.photos, ...refs.posters]) {
    const source = resolve(mediaDir, path);
    if (!existsSync(source)) {
      missing += 1;
      continue;
    }
    const target = resolve(dir, `${basename(path, '.webp')}-${WIDTH}.webp`);
    if (existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs) {
      upToDate += 1;
      continue;
    }
    mkdirSync(dir, { recursive: true });
    await sharp(source).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(target);
    created += 1;
  }
}

console.log(`media:thumbs: ${created} created, ${upToDate} up to date, ${missing} sources missing`);
