// Transforme un info.json (RESOURCES/ODEJ-Media/NNN-nom/info.json) en entrée de public/data/details.json.
// Rien n'est inventé : un champ absent ou douteux est simplement omis.

const MONTHS = {
  يناير: 1,
  جانفي: 1,
  فبراير: 2,
  فيفري: 2,
  مارس: 3,
  أبريل: 4,
  ابريل: 4,
  أفريل: 4,
  مايو: 5,
  ماي: 5,
  يونيو: 6,
  جوان: 6,
  يوليو: 7,
  جويلية: 7,
  أغسطس: 8,
  اغسطس: 8,
  أوت: 8,
  سبتمبر: 9,
  أكتوبر: 10,
  اكتوبر: 10,
  نوفمبر: 11,
  ديسمبر: 12,
};

const hasArabic = (text) => /\p{Script=Arabic}/u.test(text ?? '');
const clean = (value) => (typeof value === 'string' && value.trim() ? value.trim().replace(/\s+/g, ' ') : null);

/** « 30 أبريل 2026 » donne « 2026-04-30 ». Un format inconnu donne null. */
export function parseDate(text) {
  const m = /(\d{1,2})\s+(\S+)\s+(\d{4})/.exec(text ?? '');
  const month = m && MONTHS[m[2]];
  if (!m || !month) return null;
  const day = Number(m[1]);
  if (day < 1 || day > 31) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** « 01 أكتوبر 2025 — 31 يوليو 2027 · الرياضة الترفيهية » : les dates, puis le thème. */
export function parseProgramme(activity) {
  const title = clean(activity?.title);
  if (!title) return null;
  const [range, ...rest] = (activity.dates ?? '').split('·');
  const [from, to] = range.split('—');
  return { title, from: parseDate(from), to: parseDate(to), theme: clean(rest.join('·')) };
}

/** Une adresse qui est en fait un lien ou un mot de page n'est pas une adresse. */
const usableAddress = (value) => {
  const text = clean(value);
  return text && !/https?:|google\.|^coordonn[ée]es$/i.test(text) ? text : null;
};

/** Entrée de details.json pour un info.json, ou null s'il n'y a rien à afficher. */
export function buildDetail(info) {
  const programme = (info.activities ?? []).map(parseProgramme).filter(Boolean);
  const entry = {
    phone: clean(info.phone),
    email: clean(info.email),
    address: usableAddress(info.address),
    description: hasArabic(info.description) ? clean(info.description) : null,
    foundedYear: Number.isInteger(info.foundedYear) ? info.foundedYear : null,
    capacity: Number.isInteger(info.capacity) && info.capacity > 0 ? info.capacity : null,
    // Youth Connect dit seulement quand l'accès est prévu : l'absence ne veut pas dire « non »
    accessible: info.accessible === true ? true : null,
    programme: programme.length ? programme : null,
  };
  const kept = Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== null));
  return Object.keys(kept).length ? kept : null;
}

/** « 017-الشهيد… » donne « odej-017 ». */
export const idOfFolder = (name) => (/^(\d{3})-/.test(name) ? `odej-${name.slice(0, 3)}` : null);
