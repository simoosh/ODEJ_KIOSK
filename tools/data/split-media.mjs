// Déplace les blocs media de odej-bejaia.json vers public/media/odej-NNN/media.json.
// Usage, depuis la racine du dépôt : node tools/data/split-media.mjs
// Idempotent : un établissement sans bloc media n'est pas touché, un media.json existant n'est pas écrasé.
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { dataPath, mediaDir, readJson, writeJson } from './common.mjs';

const stripPrefix = (path) => path.replace(/^media\//, '');

function relocate(item) {
  const moved = { ...item, src: stripPrefix(item.src) };
  if (item.poster) moved.poster = stripPrefix(item.poster);
  return moved;
}

const data = readJson(dataPath);
let written = 0;

for (const est of data.establishments) {
  const { media } = est;
  delete est.media;
  if (!media?.cover && !media?.gallery?.length) continue;

  const dir = resolve(mediaDir, est.id);
  const file = resolve(dir, 'media.json');
  if (existsSync(file)) throw new Error(`${file} already exists and ${est.id} still has a media block`);
  mkdirSync(dir, { recursive: true });
  writeJson(file, {
    $schema: '../../data/media.schema.json',
    cover: media.cover ? relocate(media.cover) : null,
    gallery: media.gallery.map(relocate),
  });
  written += 1;
}

writeJson(dataPath, data);
console.log(`split-media: ${written} media.json written`);
