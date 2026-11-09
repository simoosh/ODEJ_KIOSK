// npm run media:landing -- "<dossier>" : prépare les paysages détourés de l'accueil dans public/media/landing/.
// Le dossier contient les PNG transparents du propriétaire, nommés comme dans SOURCES. Ne modifie jamais une source.
// Option : --root <dossier> remplace public/media.
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { argValue, defaultMediaDir, LANDING_DIR } from './lib/media-files.mjs';
import { LIMITS } from './lib/rules.mjs';

// Fichier du propriétaire, puis nom publié (src/config.ts, landingScenes)
const SOURCES = [
  ['haut gauche.png', 'top-left.webp'],
  ['haut droite.png', 'top-right.webp'],
  ['bas gauche.png', 'bottom-left.webp'],
  ['bas droite.png', 'bottom-right.webp'],
];
// Côté le plus long : la borne est au plus en 1080p, et la marge laisse un agrandissement à l'écran
const LONG_SIDE = 1400;

const sourceDir = process.argv[2] && !process.argv[2].startsWith('--') ? resolve(process.argv[2]) : null;
const mediaDir = argValue('--root') ? resolve(argValue('--root')) : defaultMediaDir;
if (!sourceDir || !existsSync(sourceDir)) {
  console.error('media:landing: give the folder of the PNG files: npm run media:landing -- "<folder>"');
  process.exit(1);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('media:landing: sharp is missing. Run: npm ci --prefix ../../tools/media/pipeline');
  process.exit(1);
}

const outDir = resolve(mediaDir, LANDING_DIR);
mkdirSync(outDir, { recursive: true });
let failed = false;
for (const [source, name] of SOURCES) {
  const input = resolve(sourceDir, source);
  if (!existsSync(input)) {
    console.error(`media:landing: missing ${source}`);
    failed = true;
    continue;
  }
  const output = resolve(outDir, name);
  // Les marges transparentes sont retirées : la place de l'image à l'écran suit son contenu
  const trimmed = await sharp(input).ensureAlpha().trim({ threshold: 1 }).toBuffer();
  const info = await sharp(trimmed)
    .resize({ width: LONG_SIDE, height: LONG_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(output);
  if (info.width > LIMITS.photoWidth) failed = true;
  console.log(`  ${name}: ${info.width}x${info.height}, ${(statSync(output).size / 1024).toFixed(0)} KiB`);
}
process.exit(failed ? 1 : 0);
