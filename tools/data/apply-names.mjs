// Calcule displayName (type + commune) et honoree (décision D6). Ne modifie jamais name. Idempotent.
// Usage, depuis la racine du dépôt : node tools/data/apply-names.mjs
// Un établissement garde son nom officiel en titre si son type ou son lieu est inconnu, ou si le nom
// commence par un type (مركب رياضي جواري أدكار) : il n'y a alors pas de personne à mettre en sous-titre.
import { dataPath, readJson, writeJson } from './common.mjs';

const NAMED_AFTER_TYPE = /^(مركب رياضي|المركب الرياضي|بيت الشباب|دار الشباب|مركز الترفيه|قاعة متعددة)/;

// Graphies de la liste ODEJ qui diffèrent du nom de la commune
const LIST_SPELLINGS = {
  'tizi-nberber': 'تيزي انبربر',
  'taourirt-ighil': 'تاوريت إغيل',
  'draa-el-kaid': 'ذرع القايد',
};

const titleCase = (text) => text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

function honoreeAr(name, place) {
  const suffix = LIST_SPELLINGS[place.id] ?? place.name.ar;
  if (!name.endsWith(` ${suffix}`)) throw new Error(`${name}: does not end with ${suffix}`);
  return name.slice(0, -suffix.length - 1);
}

const data = readJson(dataPath);
const categories = new Map(data.categories.map((c) => [c.id, c]));
const places = new Map(data.places.map((p) => [p.id, p]));

let named = 0;
const kept = [];

for (const est of data.establishments) {
  const place = places.get(est.placeId);
  delete est.displayName;
  delete est.honoree;

  if (!place || est.category === 'youth-facility' || NAMED_AFTER_TYPE.test(est.name.ar)) {
    kept.push(est.ref);
    continue;
  }
  const { label } = categories.get(est.category);
  est.displayName = { ar: `${label.ar} ${place.name.ar}`, en: `${place.name.en} ${titleCase(label.en)}` };
  est.honoree = { ar: honoreeAr(est.name.ar, place), en: est.name.en };
  named += 1;
}

writeJson(dataPath, data);
console.log(`apply-names: ${named} display names, ${kept.length} keep their official name (${kept.join(' ')})`);
