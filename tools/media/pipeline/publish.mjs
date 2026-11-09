// npm run media:publish : prépare .media-stage/ et publie sur Cloudflare Pages.
// Dry run par défaut. Avec -- --go, publie : il faut avoir fait wrangler login. Jamais depuis la CI.
// Option : --root <dossier> remplace public/media.
import { spawnSync } from 'node:child_process';
import { copyFileSync, linkSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { argValue, defaultMediaDir, establishmentIds, landingFiles, listFiles, repoRoot } from './lib/media-files.mjs';
import { publishRefusals } from './lib/rules.mjs';

const WRANGLER = 'wrangler@4.151.2';
const PROJECT = 'odej-media';
const HEADERS = `/*
  Cache-Control: public, max-age=86400
  X-Content-Type-Options: nosniff
  Access-Control-Allow-Origin: *
`;

const go = process.argv.includes('--go');
const stage = resolve(repoRoot, '.media-stage');
const mediaDir = argValue('--root') ? resolve(argValue('--root')) : defaultMediaDir;

const files = [...establishmentIds(mediaDir).flatMap((id) => listFiles(mediaDir, id)), ...landingFiles(mediaDir)]
  .filter(({ path }) => /\.(webp|mp4)$/.test(path));

const refusals = publishRefusals(files);
if (refusals.length > 0) {
  console.error(`media:publish: refused, ${refusals.length} problem(s)`);
  for (const refusal of refusals) console.error(`  - ${refusal}`);
  process.exit(1);
}

function place(source, target) {
  mkdirSync(dirname(target), { recursive: true });
  try {
    linkSync(source, target);
  } catch {
    copyFileSync(source, target);
  }
}

rmSync(stage, { recursive: true, force: true });
for (const { path } of files) place(resolve(mediaDir, path), resolve(stage, path));
writeFileSync(resolve(stage, '_headers'), HEADERS);

const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
console.log(`media:publish: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB in .media-stage`);

const args = [WRANGLER, 'pages', 'deploy', '.media-stage', '--project-name', PROJECT, '--branch', 'main'];
if (!go) {
  console.log(`media:publish: dry run, nothing sent. With --go: npx ${args.join(' ')}`);
  process.exit(0);
}

const { status } = spawnSync('npx', args, { cwd: repoRoot, stdio: 'inherit', shell: true });
process.exit(status ?? 1);
