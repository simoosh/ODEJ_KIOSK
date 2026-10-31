// Valide public/data/odej-bejaia.json : schéma JSON, puis cohérence interne.
// Usage : node scripts/validate-data.mjs [chemin du fichier de données]
// Ne vérifie pas l'existence des fichiers média : ils ne sont pas dans git (voir media:check, étape 2b).
// L'emprise des coordonnées est portée par le schéma (location.lat et location.lng).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const dataDir = fileURLToPath(new URL('../public/data/', import.meta.url));
const dataPath = process.argv[2] ? resolve(process.argv[2]) : resolve(dataDir, 'odej-bejaia.json');
const schemaPath = resolve(dataDir, 'odej-bejaia.schema.json');

function schemaErrors(data) {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  if (validate(data)) return [];
  return validate.errors.map((e) => `schema: ${e.instancePath || '/'} ${e.message}`);
}

function duplicates(items, label) {
  const seen = new Set();
  const errors = [];
  for (const { id } of items) {
    if (seen.has(id)) errors.push(`duplicate ${label} id: ${id}`);
    seen.add(id);
  }
  return errors;
}

function referenceErrors(data) {
  const categories = new Set(data.categories.map((c) => c.id));
  const activities = new Set(data.activities.map((a) => a.id));
  const places = new Map(data.places.map((p) => [p.id, p]));
  const errors = [];

  for (const place of data.places) {
    if (place.communeId && places.get(place.communeId)?.kind !== 'commune') {
      errors.push(`place ${place.id}: unknown commune ${place.communeId}`);
    }
  }
  for (const category of data.categories) {
    for (const activity of category.defaultActivities ?? []) {
      if (!activities.has(activity)) errors.push(`category ${category.id}: unknown activity ${activity}`);
    }
  }
  for (const est of data.establishments) {
    if (!categories.has(est.category)) errors.push(`${est.id}: unknown category ${est.category}`);
    if (est.placeId && !places.has(est.placeId)) errors.push(`${est.id}: unknown place ${est.placeId}`);
    for (const activity of est.activities ?? []) {
      if (!activities.has(activity)) errors.push(`${est.id}: unknown activity ${activity}`);
    }
  }
  return errors;
}

function validate(data) {
  const errors = schemaErrors(data);
  if (errors.length > 0) return errors;
  return [
    ...duplicates(data.establishments, 'establishment'),
    ...duplicates(data.categories, 'category'),
    ...duplicates(data.activities, 'activity'),
    ...duplicates(data.places, 'place'),
    ...referenceErrors(data),
  ];
}

let data;
try {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (error) {
  console.error(`validate:data: cannot read ${dataPath}: ${error.message}`);
  process.exit(1);
}

const errors = validate(data);
if (errors.length > 0) {
  console.error(`validate:data: ${errors.length} error(s) in ${dataPath}`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`validate:data: OK (${data.establishments.length} establishments)`);
