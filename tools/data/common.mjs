// Chemins et lecture / écriture partagés par les scripts de tools/data.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
export const appDir = resolve(repoRoot, 'APP/odej-kiosk');
export const dataPath = resolve(appDir, 'public/data/odej-bejaia.json');
export const mediaDir = resolve(appDir, 'public/media');
export const resourcesDir = resolve(repoRoot, 'RESOURCES/ODEJ-Media');

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
export const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

/** Ajoute une issue absente, puis remet le statut d'accord avec la liste. */
export function addIssue(est, code, message) {
  est.verification ??= { status: 'ok', issues: [] };
  if (!est.verification.issues.some((i) => i.code === code && i.message === message)) {
    est.verification.issues.push({ code, message });
  }
  syncStatus(est);
}

export function removeIssues(est, code) {
  if (!est.verification) return;
  est.verification.issues = est.verification.issues.filter((i) => i.code !== code);
  syncStatus(est);
}

function syncStatus(est) {
  est.verification.status = est.verification.issues.length > 0 ? 'to_check' : 'ok';
}
