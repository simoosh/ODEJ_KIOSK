// Valide public/data/odej-bejaia.json et les public/media/odej-NNN/media.json : schémas, puis cohérence interne.
// Usage : node scripts/validate-data.mjs [chemin du fichier de données] [chemin du dossier des médias]
// Ne vérifie pas l'existence des fichiers média : ils ne sont pas dans git (voir media:check, étape 2b).
// L'emprise des coordonnées est portée par le schéma (location.lat et location.lng).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const dataDir = fileURLToPath(new URL('../public/data/', import.meta.url));
const dataPath = process.argv[2] ? resolve(process.argv[2]) : resolve(dataDir, 'odej-bejaia.json');
const mediaDir = process.argv[3] ? resolve(process.argv[3]) : fileURLToPath(new URL('../public/media/', import.meta.url));

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function compileSchema(name) {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  return ajv.compile(readJson(resolve(dataDir, name)));
}

function schemaErrors(validator, value, label) {
  if (validator(value)) return [];
  return validator.errors.map((e) => `${label}: ${e.instancePath || '/'} ${e.message}`);
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
    if ('media' in est) errors.push(`${est.id}: media belongs in public/media/${est.id}/media.json`);
    for (const activity of est.activities ?? []) {
      if (!activities.has(activity)) errors.push(`${est.id}: unknown activity ${activity}`);
    }
  }
  return errors;
}

function mediaFileErrors(validator, id, ids) {
  const file = resolve(mediaDir, id, 'media.json');
  const label = `${id}/media.json`;
  let media;
  try {
    media = readJson(file);
  } catch (error) {
    return [`${label}: ${error.message}`];
  }

  const errors = schemaErrors(validator, media, label);
  if (!ids.has(id)) errors.push(`${label}: no establishment with this id`);
  if (errors.length > 0) return errors;

  const items = [media.cover, ...media.gallery, ...(media.activities ?? []).flatMap((a) => [a.cover, ...a.gallery])];
  for (const item of items.filter(Boolean)) {
    for (const path of [item.src, item.poster].filter(Boolean)) {
      if (!path.startsWith(`${id}/`)) errors.push(`${label}: ${path} is outside this folder`);
    }
  }
  return errors;
}

function mediaErrors(data) {
  if (!existsSync(mediaDir)) return [];
  const validator = compileSchema('media.schema.json');
  const ids = new Set(data.establishments.map((e) => e.id));
  return readdirSync(mediaDir)
    .filter((id) => /^odej-\d{3}$/.test(id) && existsSync(resolve(mediaDir, id, 'media.json')))
    .flatMap((id) => mediaFileErrors(validator, id, ids));
}

function validate(data) {
  const errors = schemaErrors(compileSchema('odej-bejaia.schema.json'), data, 'schema');
  if (errors.length > 0) return errors;
  return [
    ...duplicates(data.establishments, 'establishment'),
    ...duplicates(data.categories, 'category'),
    ...duplicates(data.activities, 'activity'),
    ...duplicates(data.places, 'place'),
    ...referenceErrors(data),
    ...mediaErrors(data),
  ];
}

let data;
try {
  data = readJson(dataPath);
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
