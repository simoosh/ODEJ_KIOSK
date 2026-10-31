// Régénère APP/odej-kiosk/docs/VERIFICATION.md à partir des données.
// Usage, depuis la racine du dépôt : node tools/data/build-verification.mjs
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { appDir, dataPath, readJson } from './common.mjs';

const TO_FIX = ['DUPLICATE_COORDS', 'PLACE_MISMATCH', 'DUPLICATE_LINK', 'DUPLICATE_NAME'];
const TO_CONFIRM = ['NEAR_DUPLICATE', 'COMMUNE_UNKNOWN', 'PLACE_MISSING', 'SPELLING', 'TYPE_FROM_LINK'];

const data = readJson(dataPath);
const { establishments } = data;
const categories = new Map(data.categories.map((c) => [c.id, c]));

const num = (value) => String(value).replace('.', ',');
const issuesOf = (e) => e.verification?.issues ?? [];
const withCode = (code) => establishments.filter((e) => issuesOf(e).some((i) => i.code === code));
const refs = (list) => list.map((e) => e.ref).join(', ');

function issueRows(codes) {
  return establishments.flatMap((e) =>
    issuesOf(e)
      .filter((i) => codes.includes(i.code))
      .map((i) => `| ${e.ref} | ${e.name.ar} | ${i.message} |`),
  );
}

const table = (head, rows) => [head, head.replace(/[^|]+/g, '---'), ...rows, ''].join('\n');

function extent(key) {
  const values = establishments.map((e) => e.location[key]);
  return `${num(Math.min(...values).toFixed(2))} → ${num(Math.max(...values).toFixed(2))}`;
}

const typeRows = withCode('TYPE_FROM_PAGE_NAME').map((e) => {
  const { message } = issuesOf(e).find((i) => i.code === 'TYPE_FROM_PAGE_NAME');
  return `| ${e.ref} | ${e.name.ar} | ${categories.get(e.category).label.ar} | ${message} |`;
});
const sameCoords = withCode('DUPLICATE_COORDS');
const noPage = withCode('NO_PAGE');
const noType = withCode('TYPE_UNKNOWN');
const featured = establishments.filter((e) => e.featured);

const doc = `# Vérification de la liste ODEJ Béjaïa

Fichier généré par \`tools/data/build-verification.mjs\`. Ne pas l'éditer à la main.

Source : liste PDF de ${establishments.length} établissements (nom, latitude, longitude, lien Facebook), puis audit des pages Facebook du 30/10/2026.
Les coordonnées et les liens ont été extraits du texte du PDF ; les noms arabes ont été relus sur les pages.

- ${establishments.length} établissements, tous situés dans l'emprise de la wilaya (lat. ${extent('lat')} ; long. ${extent('lng')}).
- ${establishments.filter((e) => issuesOf(e).length === 0).length} lignes sans remarque.
- ${noType.length} établissements sans type (lignes ${refs(noType)}) : ils apparaissent comme « ${categories.get('youth-facility').label.ar} / ${categories.get('youth-facility').label.en} ».
- Les paramètres de suivi des liens Facebook (\`mibextid\`, \`sk\`) ont été retirés.

## À corriger avant le salon

${table('| N° | Établissement | Remarque |', issueRows(TO_FIX))}
## À confirmer

${table('| N° | Établissement | Remarque |', issueRows(TO_CONFIRM))}
## Corrections issues de l'audit

Établissement phare : ${featured.map((e) => `${e.ref} (${e.name.ar})`).join(', ')}.

### Types déduits du nom de la page Facebook (${typeRows.length})

${table('| N° | Établissement | Type retenu | Origine |', typeRows)}
### Liens Facebook retirés (${noPage.length})

${table('| N° | Établissement | Remarque |', issueRows(['NO_PAGE']))}
### Notes de l'audit (${withCode('AUDIT_NOTE').length})

${table('| N° | Établissement | Note |', issueRows(['AUDIT_NOTE']))}
## Infos Facebook importées, à valider

${table('| N° | Établissement | Remarque |', issueRows(['TRANSLATION_UNVERIFIED']))}
## Questions à poser à l'ODEJ

1. Le type des lignes ${refs(noType)}, et la confirmation des ${typeRows.length} types déduits des pages Facebook.
2. Les lignes aux coordonnées identiques (${refs(sameCoords)}) : quelles sont les bonnes coordonnées ?
3. La page Facebook des lignes ${refs(noPage)}, s'il y en a une.
4. Les lignes ${refs(withCode('DUPLICATE_NAME'))} portent le même nom : l'audit indique deux établissements distincts, à confirmer.
5. La commune des lignes ${refs(withCode('PLACE_MISSING'))} et des lieux-dits (lignes ${refs(withCode('COMMUNE_UNKNOWN'))}).
6. La validation des textes et des horaires de la section « Infos Facebook importées », lignes ${refs(withCode('TRANSLATION_UNVERIFIED'))}.
7. Les graphies françaises officielles des noms (pour la version anglaise), le logo en vectoriel, et pour chaque établissement : photos, description, activités, horaires, téléphone.
`;

writeFileSync(resolve(appDir, 'docs/VERIFICATION.md'), doc);
console.log('build-verification: docs/VERIFICATION.md written');
