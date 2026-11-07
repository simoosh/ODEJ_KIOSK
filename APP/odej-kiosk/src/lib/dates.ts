import type { Locale } from '../types';

/** « 2026-10-30 » dans la langue du visiteur, avec des chiffres latins. Une date illisible donne ''. */
export function formatDate(iso: string | null, locale: Locale): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return '';
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** « 30 Apr 2026 – 31 Dec 2026 », ou une seule date si l'autre manque. */
export function formatRange(from: string | null, to: string | null, locale: Locale): string {
  return [formatDate(from, locale), formatDate(to, locale)].filter(Boolean).join(' – ');
}
