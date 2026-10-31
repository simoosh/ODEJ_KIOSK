// Applique les corrections de l'audit des pages Facebook à odej-bejaia.json. Idempotent.
// Usage, depuis la racine du dépôt : node tools/data/apply-audit.mjs [chemin du fichier de corrections]
// Par défaut : ../sidecontent/data-corrections-from-audit.json (hors du dépôt).
import { resolve } from 'node:path';
import { addIssue, dataPath, readJson, removeIssues, repoRoot, writeJson } from './common.mjs';

// L'audit ne fixe pas de couleur, et le schéma en exige une. À revoir avec la refonte de l'interface.
const YOUTH_CAMP_COLOR = '#B84E16';

const correctionsPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(repoRoot, '../sidecontent/data-corrections-from-audit.json');

const corrections = readJson(correctionsPath);
const data = readJson(dataPath);
const byId = new Map(data.establishments.map((e) => [e.id, e]));

function addCategory({ id, label, icon, defaultActivities }) {
  if (data.categories.some((c) => c.id === id)) return;
  // youth-facility reste en dernier : MapView l'utilise comme catégorie de repli
  const fallback = data.categories.findIndex((c) => c.id === 'youth-facility');
  data.categories.splice(fallback, 0, { id, label, color: YOUTH_CAMP_COLOR, icon, defaultActivities });
}

function applyCategory(est, item) {
  if (![item.currentCategory, item.proposedCategory].includes(est.category)) {
    throw new Error(`${est.id}: category ${est.category} changed since the audit (${item.currentCategory})`);
  }
  est.category = item.proposedCategory;
  removeIssues(est, 'TYPE_UNKNOWN');
  addIssue(est, 'TYPE_FROM_PAGE_NAME', `Type déduit du nom de la page Facebook (« ${item.facebookPageName} »), à confirmer par l'ODEJ.`);
}

function applyNoPage(est) {
  est.contact ??= {};
  est.contact.facebook = null;
  addIssue(est, 'NO_PAGE', "Lien Facebook retiré : inaccessible ou page d'un autre établissement.");
}

/** Un lien partagé n'est plus un problème quand un seul établissement le garde. */
function dropStaleDuplicateLinks() {
  const uses = new Map();
  for (const est of data.establishments) {
    const link = est.contact?.facebook;
    if (link) uses.set(link, (uses.get(link) ?? 0) + 1);
  }
  for (const est of data.establishments) {
    if ((uses.get(est.contact?.facebook) ?? 0) < 2) removeIssues(est, 'DUPLICATE_LINK');
  }
}

addCategory(corrections.newCategory);

for (const item of corrections.items) {
  const est = byId.get(item.id);
  if (!est || est.ref !== item.ref || est.name.ar !== item.listName) {
    throw new Error(`${item.id}: join failed (ref ${item.ref}, ${item.listName})`);
  }
  if (item.proposedCategory) applyCategory(est, item);
  if (item.setFacebookNull) applyNoPage(est);
  if (item.auditNote) addIssue(est, 'AUDIT_NOTE', item.auditNote);
  if (item.featured) est.featured = true;
}

dropStaleDuplicateLinks();
writeJson(dataPath, data);

const has = (code) => data.establishments.filter((e) => e.verification?.issues.some((i) => i.code === code));
console.log(`apply-audit: TYPE_FROM_PAGE_NAME ${has('TYPE_FROM_PAGE_NAME').length}, TYPE_UNKNOWN ${has('TYPE_UNKNOWN').length}`);
console.log(`apply-audit: NO_PAGE ${has('NO_PAGE').length}, AUDIT_NOTE ${has('AUDIT_NOTE').length}, DUPLICATE_LINK ${has('DUPLICATE_LINK').length}`);
console.log(`apply-audit: featured ${data.establishments.filter((e) => e.featured).map((e) => e.id).join(' ')}`);
