// npm run media:verify : contrôle les URL publiées à partir de public/media/index.json.
// Attend 200 et le bon Content-Type ; sur une vidéo, une requête Range doit répondre 206.
// Base : VITE_MEDIA_BASE_URL, ou --base <url>.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { argValue, defaultMediaDir, references } from './lib/media-files.mjs';

const CONCURRENCY = 8;
const base = argValue('--base') ?? process.env.VITE_MEDIA_BASE_URL;
if (!base) {
  console.error('media:verify: set VITE_MEDIA_BASE_URL or pass --base <url>');
  process.exit(1);
}
const root = base.endsWith('/') ? base : `${base}/`;

const indexFile = resolve(defaultMediaDir, 'index.json');
if (!existsSync(indexFile)) {
  console.error('media:verify: public/media/index.json is missing. Run: node scripts/build-media-index.mjs');
  process.exit(1);
}

const paths = Object.values(JSON.parse(readFileSync(indexFile, 'utf8'))).flatMap((media) => references(media).all);

async function verify(path) {
  const url = root + path;
  const isVideo = path.endsWith('.mp4');
  const head = await fetch(url, { method: 'HEAD' });
  if (head.status !== 200) return `${path}: HEAD ${head.status}`;
  const type = head.headers.get('content-type') ?? '';
  if (!type.startsWith(isVideo ? 'video/mp4' : 'image/webp')) return `${path}: Content-Type ${type}`;
  if (isVideo) {
    const range = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
    await range.body?.cancel();
    if (range.status !== 206) return `${path}: Range ${range.status}, expected 206`;
  }
  return null;
}

const failures = [];
const queue = [...paths];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const path = queue.shift();
      const failure = await verify(path).catch((error) => `${path}: ${error.message}`);
      if (failure) failures.push(failure);
    }
  }),
);

for (const failure of failures.slice(0, 20)) console.error(`  - ${failure}`);
if (failures.length > 20) console.error(`  ... and ${failures.length - 20} more`);
console.log(`media:verify: ${paths.length - failures.length}/${paths.length} OK on ${root}`);
if (failures.length > 0) process.exit(1);
