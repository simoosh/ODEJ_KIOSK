// npm run kiosk:pack : produit kiosk-pack/, dossier autonome à copier sur le PC de la borne.
// Médias locaux compris. À lancer sur le poste qui a tous les médias : ceux qui manquent sont listés.
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appDir, defaultMediaDir, establishmentIds, readMedia, references, repoRoot } from './lib/media-files.mjs';

const kioskDir = fileURLToPath(new URL('./kiosk/', import.meta.url));
const pack = resolve(repoRoot, 'kiosk-pack');

const missing = establishmentIds(defaultMediaDir)
  .flatMap((id) => references(readMedia(defaultMediaDir, id)).all)
  .filter((path) => !existsSync(resolve(defaultMediaDir, path)));

const { status } = spawnSync('npm', ['run', 'build'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, KIOSK_PACK: '1', VITE_MEDIA_BASE_URL: '/media/' },
});
if (status !== 0) process.exit(status ?? 1);

rmSync(pack, { recursive: true, force: true });
mkdirSync(pack);
cpSync(resolve(appDir, 'dist'), resolve(pack, 'app'), { recursive: true });
for (const file of ['serve.mjs', 'start-kiosk.bat', 'LISEZMOI.txt']) copyFileSync(resolve(kioskDir, file), resolve(pack, file));

// dist/ contient maintenant tous les médias : on le retire pour qu'il ne parte jamais dans un déploiement
rmSync(resolve(appDir, 'dist'), { recursive: true, force: true });

console.log(`kiosk:pack: ${pack}`);
if (missing.length > 0) {
  console.log(`kiosk:pack: WARNING, ${missing.length} media files are missing from this pack:`);
  for (const path of missing.slice(0, 8)) console.log(`  - ${path}`);
  if (missing.length > 8) console.log(`  ... and ${missing.length - 8} more`);
}
