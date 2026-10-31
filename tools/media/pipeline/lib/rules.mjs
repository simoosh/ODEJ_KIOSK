// Règles de teamwork/README.md, section 4. Sans dépendance : testé par la CI de l'application.

export const MIB = 1024 * 1024;

export const LIMITS = {
  fileBytes: 24 * MIB,
  photoWidth: 1600,
  videoWidth: 720,
  videoSeconds: 70,
  photos: 15,
  videos: 3,
  establishmentBytes: 50 * MIB,
  totalFiles: 15_000,
  totalBytes: 3 * 1024 * MIB,
};

// Établissement phare : pas de plafond par établissement, mais les limites par fichier s'appliquent
const BUDGET_EXEMPT = new Set(['odej-003']);

const mib = (bytes) => `${(bytes / MIB).toFixed(1)} MiB`;

/** Limites valables pour tout fichier. path : relatif à public/media. */
export function fileErrors(path, bytes) {
  const errors = [];
  const name = path.split('/').pop();
  if (bytes > LIMITS.fileBytes) errors.push(`${path}: ${mib(bytes)}, limit is 24 MiB`);
  if (!/\.(webp|mp4)$/.test(name)) errors.push(`${path}: only webp and mp4 are allowed`);
  if (!/^[a-z0-9._/-]+$/.test(path)) errors.push(`${path}: file names must match [a-z0-9._-]`);
  return errors;
}

export function photoErrors(path, width) {
  return width > LIMITS.photoWidth ? [`${path}: ${width} px wide, limit is ${LIMITS.photoWidth} px`] : [];
}

/** probe : { width, codec, pixelFormat, audioCodec, faststart }. audioCodec vaut null pour une vidéo muette. */
export function videoErrors(path, probe) {
  const errors = [];
  if (probe.width > LIMITS.videoWidth) errors.push(`${path}: ${probe.width} px wide, limit is ${LIMITS.videoWidth} px`);
  if (probe.codec !== 'h264') errors.push(`${path}: video codec is ${probe.codec}, must be h264`);
  if (probe.pixelFormat !== 'yuv420p') errors.push(`${path}: pixel format is ${probe.pixelFormat}, must be yuv420p`);
  if (probe.audioCodec && probe.audioCodec !== 'aac') errors.push(`${path}: audio codec is ${probe.audioCodec}, must be aac`);
  if (!probe.faststart) errors.push(`${path}: no faststart (moov must come before mdat)`);
  return errors;
}

export function videoWarnings(path, seconds) {
  return seconds > LIMITS.videoSeconds ? [`${path}: ${Math.round(seconds)} s, default limit is ${LIMITS.videoSeconds} s`] : [];
}

/** Réponse à une requête Range sur une vidéo. 200 n'est pas une erreur : faststart permet le téléchargement progressif. */
export function rangeErrors(path, status) {
  return status === 200 || status === 206 ? [] : [`${path}: Range ${status}, expected 206`];
}

export function rangeWarnings(path, status) {
  return status === 200 ? [`${path}: Range 200 with the full file, expected 206`] : [];
}

/** Compare les fichiers présents aux références de media.json. */
export function referenceErrors(files, references) {
  const present = new Set(files);
  const referenced = new Set(references);
  return [
    ...references.filter((path) => !present.has(path)).map((path) => `${path}: referenced but missing`),
    ...files.filter((path) => !referenced.has(path)).map((path) => `${path}: not referenced by media.json`),
  ];
}

/** Plafonds par défaut : un dépassement n'est jamais une erreur (décision du 31/10/2026). */
export function budgetWarnings(id, { photos, videos, bytes }) {
  if (BUDGET_EXEMPT.has(id)) return [];
  const warnings = [];
  if (photos > LIMITS.photos) warnings.push(`${id}: ${photos} photos, default limit is ${LIMITS.photos}`);
  if (videos > LIMITS.videos) warnings.push(`${id}: ${videos} videos, default limit is ${LIMITS.videos}`);
  if (bytes > LIMITS.establishmentBytes) warnings.push(`${id}: ${mib(bytes)}, default limit is 50 MiB`);
  return warnings;
}

export function totalWarnings(files, bytes) {
  const warnings = [];
  if (files > LIMITS.totalFiles) warnings.push(`${files} files in total, limit is ${LIMITS.totalFiles}`);
  if (bytes > LIMITS.totalBytes) warnings.push(`${mib(bytes)} in total, target is 3 GiB`);
  return warnings;
}

/** Raisons de refuser une publication. files : [{ path, bytes }]. */
export function publishRefusals(files) {
  const refusals = files
    .filter((file) => file.bytes > LIMITS.fileBytes)
    .map((file) => `${file.path}: ${mib(file.bytes)}, limit is 24 MiB`);
  if (files.length > LIMITS.totalFiles) refusals.push(`${files.length} files, limit is ${LIMITS.totalFiles}`);
  return refusals;
}
