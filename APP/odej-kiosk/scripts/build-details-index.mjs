// Assemble tous les RESOURCES/ODEJ-Media/NNN-nom/info.json en public/data/details.json (généré, ignoré par git).
// Lancé par predev et prebuild. Un établissement sans info.json n'a pas de détails : ce n'est pas une erreur,
// et sans dossier RESOURCES (build isolé) l'index est simplement vide.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDetail, idOfFolder } from './details-lib.mjs';

const resourcesDir = fileURLToPath(new URL('../../../RESOURCES/ODEJ-Media/', import.meta.url));
const outDir = fileURLToPath(new URL('../public/data/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const index = {};
if (existsSync(resourcesDir)) {
  for (const entry of readdirSync(resourcesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.isDirectory() ? idOfFolder(entry.name) : null;
    const file = id && resolve(resourcesDir, entry.name, 'info.json');
    if (!file || !existsSync(file)) continue;
    const detail = buildDetail(JSON.parse(readFileSync(file, 'utf8')));
    if (detail) index[id] = detail;
  }
}

writeFileSync(resolve(outDir, 'details.json'), JSON.stringify(index));
console.log(`build-details-index: ${Object.keys(index).length} establishments`);
