// Retire de dist/media/ tout ce qui n'est pas index.json : aucun média ne doit partir sur Netlify.
// Lancé par postbuild, sauf pour le pack de la borne (KIOSK_PACK=1).
// Usage : node scripts/prune-media.mjs [chemin de dist/media]
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const mediaDir = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../dist/media/', import.meta.url));

if (process.env.KIOSK_PACK === '1') {
  console.log('prune-media: skipped (KIOSK_PACK=1)');
} else if (existsSync(mediaDir)) {
  const entries = readdirSync(mediaDir).filter((name) => name !== 'index.json');
  for (const name of entries) rmSync(resolve(mediaDir, name), { recursive: true, force: true });
  console.log(`prune-media: ${entries.length} entries removed from dist/media`);
}
