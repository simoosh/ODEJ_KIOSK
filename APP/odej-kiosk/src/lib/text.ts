/** Normalisation pour la recherche : on tape « اقبو » ou « akbou » et on trouve « أقبو ». */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents latins
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[''`’ʼ-]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Score simple : 3 = commence par, 2 = un mot commence par, 1 = contient, 0 = rien */
export function matchScore(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = normalize(haystack);
  if (h.startsWith(needle)) return 3;
  if (h.split(' ').some((w) => w.startsWith(needle) || (w.startsWith('ال') && w.slice(2).startsWith(needle)))) return 2;
  if (h.includes(needle)) return 1;
  return 0;
}
