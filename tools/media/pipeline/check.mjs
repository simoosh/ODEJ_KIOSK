// npm run media:check : contrôle public/media/odej-* selon teamwork/README.md, section 4.
// Options : --hash compare les sha256 à docs/media/odej-NNN.json ; --root <dossier> remplace public/media.
// Sort en erreur sur une limite dure. Les plafonds par établissement ne sont que des avertissements.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { isFaststart } from './lib/mp4.mjs';
import { appDir, argValue, defaultMediaDir, establishmentIds, listFiles, readMedia, references } from './lib/media-files.mjs';
import {
  budgetWarnings,
  fileErrors,
  photoErrors,
  referenceErrors,
  totalWarnings,
  videoErrors,
  videoWarnings,
} from './lib/rules.mjs';

const run = promisify(execFile);
const mediaDir = argValue('--root') ? resolve(argValue('--root')) : defaultMediaDir;
const LISTED = 8;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('media:check: sharp is missing. Run: npm ci --prefix ../../tools/media/pipeline');
  process.exit(1);
}

async function probeVideo(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  const { streams, format } = JSON.parse(stdout);
  const video = streams.find((s) => s.codec_type === 'video');
  const audio = streams.find((s) => s.codec_type === 'audio');
  return {
    width: video?.width,
    codec: video?.codec_name,
    pixelFormat: video?.pix_fmt,
    audioCodec: audio?.codec_name ?? null,
    seconds: Number(format.duration),
    faststart: isFaststart(file),
  };
}

function sha256(file) {
  return new Promise((done, fail) => {
    const hash = createHash('sha256');
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => done(hash.digest('hex')))
      .on('error', fail);
  });
}

async function hashErrors(id) {
  const trace = resolve(appDir, 'docs/media', `${id}.json`);
  if (!existsSync(trace)) return [`${id}: no traceability file docs/media/${id}.json`];
  const errors = [];
  for (const { file, sha256: expected } of JSON.parse(readFileSync(trace, 'utf8')).files) {
    const path = file.replace(/^media\//, '');
    const local = resolve(mediaDir, path);
    if (existsSync(local) && (await sha256(local)) !== expected) errors.push(`${path}: sha256 differs from docs/media`);
  }
  return errors;
}

async function checkEstablishment(id) {
  const media = readMedia(mediaDir, id);
  const refs = references(media);
  const files = listFiles(mediaDir, id).filter(({ path }) => !path.endsWith('/media.json') && !path.includes('/thumbs/'));
  const present = new Set(files.map((f) => f.path));
  const errors = [...files.flatMap(({ path, bytes }) => fileErrors(path, bytes))];
  const warnings = [];

  errors.push(...referenceErrors(files.map((f) => f.path), refs.all));
  for (const path of [...refs.photos, ...refs.posters].filter((p) => present.has(p))) {
    const { width } = await sharp(resolve(mediaDir, path)).metadata();
    errors.push(...photoErrors(path, width));
  }
  for (const path of refs.videos.filter((p) => present.has(p))) {
    const probe = await probeVideo(resolve(mediaDir, path));
    errors.push(...videoErrors(path, probe));
    warnings.push(...videoWarnings(path, probe.seconds));
  }
  if (process.argv.includes('--hash')) errors.push(...(await hashErrors(id)));

  const bytes = files.reduce((sum, f) => sum + f.bytes, 0);
  // Comme les entrées CHANGE de teamwork/Update.md : la couverture n'est pas comptée
  const photos = refs.photos.length - (media.cover ? 1 : 0);
  warnings.push(...budgetWarnings(id, { photos, videos: refs.videos.length, bytes }));
  return { id, photos, videos: refs.videos.length, count: files.length, bytes, errors, warnings };
}

function printList(label, lines) {
  for (const line of lines.slice(0, LISTED)) console.log(`  ${label} ${line}`);
  if (lines.length > LISTED) console.log(`  ${label} ... and ${lines.length - LISTED} more`);
}

const reports = [];
try {
  for (const id of establishmentIds(mediaDir)) reports.push(await checkEstablishment(id));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.error('media:check: ffprobe not found. Install ffmpeg: winget install ffmpeg');
  process.exit(1);
}

for (const r of reports) {
  console.log(`${r.id}: ${r.photos} photos, ${r.videos} videos, ${r.count} files on disk, ${(r.bytes / 1024 / 1024).toFixed(1)} MiB`);
  printList('ERROR', r.errors);
  printList('warn ', r.warnings);
}

const totalFiles = reports.reduce((sum, r) => sum + r.count, 0);
const totalBytes = reports.reduce((sum, r) => sum + r.bytes, 0);
const overall = totalWarnings(totalFiles, totalBytes);
for (const line of overall) console.log(`warn  ${line}`);

const errorCount = reports.reduce((sum, r) => sum + r.errors.length, 0);
const warningCount = reports.reduce((sum, r) => sum + r.warnings.length, overall.length);
console.log(`media:check: ${errorCount} error(s), ${warningCount} warning(s), ${totalFiles} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`);
if (errorCount > 0) process.exit(1);
