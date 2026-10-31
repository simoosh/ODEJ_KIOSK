// Assemble tous les public/media/odej-NNN/media.json en public/media/index.json (généré, ignoré par git).
// Lancé par predev et prebuild. Un établissement sans media.json n'a pas de médias : ce n'est pas une erreur.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mediaDir = fileURLToPath(new URL('../public/media/', import.meta.url));
mkdirSync(mediaDir, { recursive: true });

const index = {};
for (const id of readdirSync(mediaDir).sort()) {
  const file = resolve(mediaDir, id, 'media.json');
  if (!/^odej-\d{3}$/.test(id) || !existsSync(file)) continue;
  index[id] = JSON.parse(readFileSync(file, 'utf8'));
  delete index[id].$schema;
}

writeFileSync(resolve(mediaDir, 'index.json'), JSON.stringify(index));
console.log(`build-media-index: ${Object.keys(index).length} establishments`);
