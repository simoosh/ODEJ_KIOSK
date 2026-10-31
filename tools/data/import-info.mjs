// Compare les info.json des bruts aux données, et importe ce que le propriétaire a validé. Idempotent.
// Usage, depuis la racine du dépôt :
//   node tools/data/import-info.mjs           écrit le rapport tools/data/out/info-report.md, sans toucher aux données
//   node tools/data/import-info.mjs --apply   importe les entrées "approved": true de tools/data/info-proposals.json
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addIssue, dataPath, readJson, resourcesDir, writeJson } from './common.mjs';

const toolDir = fileURLToPath(new URL('./', import.meta.url));
const proposals = readJson(resolve(toolDir, 'info-proposals.json'));
const data = readJson(dataPath);
const byId = new Map(data.establishments.map((e) => [e.id, e]));

const show = (value) => value ?? '—';
const hasArabic = (text) => /\p{Script=Arabic}/u.test(text ?? '');

function readInfos() {
  return readdirSync(resourcesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name))
    .map((entry) => ({
      id: `odej-${entry.name.slice(0, 3)}`,
      info: readJson(resolve(resourcesDir, entry.name, 'info.json')),
    }));
}

function reportFor({ id, info }) {
  const est = byId.get(id);
  const proposal = proposals[id];
  const rows = [
    ['description', est.description?.ar, info.description],
    ['téléphone', est.contact?.phone, info.phone],
    ['adresse', est.contact?.address, info.address],
    ['horaires', est.openingHours?.ar, info.openingHours],
  ];
  const lines = [`## ${id} : ${est.name.ar}`, '', `Page : ${info.scrapedPage.title}`, ''];
  lines.push('| Champ | Données | Facebook |', '|---|---|---|');
  for (const [field, current, source] of rows) lines.push(`| ${field} | ${show(current)} | ${show(source)} |`);
  if (info.description && !hasArabic(info.description)) lines.push('', 'La description Facebook n\'est pas en arabe.');
  lines.push('', proposal ? `Proposition (validée : ${proposal.approved ? 'oui' : 'non'}) :` : 'Aucune proposition.');
  if (proposal) lines.push('', '```json', JSON.stringify(proposal, null, 2), '```');
  return lines.join('\n');
}

function writeReport() {
  const body = readInfos().sort((a, b) => a.id.localeCompare(b.id)).map(reportFor).join('\n\n');
  const outDir = resolve(toolDir, 'out');
  mkdirSync(outDir, { recursive: true });
  const file = resolve(outDir, 'info-report.md');
  writeFileSync(file, `# Rapport info.json\n\n${body}\n`);
  console.log(`import-info: report written to ${file}`);
}

function applyApproved() {
  let applied = 0;
  for (const [id, proposal] of Object.entries(proposals)) {
    if (!proposal.approved) continue;
    const est = byId.get(id);
    if (proposal.description) est.description = proposal.description;
    if (proposal.phone) est.contact.phone = proposal.phone;
    if (proposal.address) est.contact.address = proposal.address;
    if (proposal.openingHours) est.openingHours = proposal.openingHours;
    for (const field of proposal.unverified ?? []) {
      addIssue(est, 'TRANSLATION_UNVERIFIED', `Traduction à valider par l'ODEJ : ${field}.`);
    }
    applied += 1;
  }
  writeJson(dataPath, data);
  console.log(`import-info: ${applied} approved entries applied`);
}

if (process.argv.includes('--apply')) applyApproved();
else writeReport();
