import type { Category, DetailsIndex, Establishment, I18nText, KioskData, Locale, MediaIndex, MediaItem, Place } from '../types';
import { CONFIG, MEDIA_BASE, mediaUrl } from '../config';
import { matchScore, normalize } from '../lib/text';

/** Titre affiché : type + commune quand il est connu, sinon le nom officiel. */
export const titleOf = (e: Establishment): I18nText => e.displayName ?? e.name;

/** Établissements phares, dans l'ordre de featuredOrder. Tout vient des données : aucun id dans le code. */
export function featuredEstablishments(list: Establishment[]): Establishment[] {
  const order = (e: Establishment) => e.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  return list.filter((e) => e.featured).sort((a, b) => order(a) - order(b));
}

/** Les vidéos d'abord, sans changer l'ordre à l'intérieur de chaque type. */
export function videosFirst(items: MediaItem[]): MediaItem[] {
  return [...items.filter((i) => i.kind === 'video'), ...items.filter((i) => i.kind !== 'video')];
}

/** Fusionne les médias dans les établissements, par id, avec leurs URL complètes. */
export function withMedia(data: KioskData, index: MediaIndex, base: string = MEDIA_BASE): KioskData {
  const resolve = (item: MediaItem): MediaItem => ({
    ...item,
    src: mediaUrl(item.src, base),
    ...(item.poster ? { poster: mediaUrl(item.poster, base) } : {}),
  });
  return {
    ...data,
    establishments: data.establishments.map((e) => {
      const media = index[e.id];
      if (!media) return e;
      return { ...e, media: { cover: media.cover ? resolve(media.cover) : null, gallery: media.gallery.map(resolve) } };
    }),
  };
}

/**
 * Fusionne data/details.json (les info.json) dans les établissements, par id.
 * Contact : l'info.json prime, il porte la règle de source (Facebook d'abord, Youth Connect en complément).
 * Description : celle des données, relue et traduite, prime ; sinon le texte arabe de l'info.json.
 * Les horaires ne viennent jamais de là : ceux de Facebook sont des états du moment, pas un horaire.
 */
export function withDetails(data: KioskData, index: DetailsIndex): KioskData {
  return {
    ...data,
    establishments: data.establishments.map((e) => {
      const d = index[e.id];
      if (!d) return e;
      const hasText = !!(e.description?.ar || e.description?.en);
      const facts = { foundedYear: d.foundedYear, capacity: d.capacity, accessible: d.accessible };
      return {
        ...e,
        contact: {
          ...e.contact,
          phone: d.phone ?? e.contact?.phone ?? null,
          email: d.email ?? e.contact?.email ?? null,
          address: d.address ?? e.contact?.address ?? null,
        },
        ...(!hasText && d.description ? { description: { ar: d.description, en: null } } : {}),
        ...(Object.values(facts).some((v) => v !== undefined) ? { facts } : {}),
        ...(d.programme?.length ? { programme: d.programme } : {}),
      };
    }),
  };
}

export interface Indexes {
  categories: Map<string, Category>;
  places: Map<string, Place>;
  activitiesOf: (e: Establishment) => string[];
}

export function buildIndexes(data: KioskData): Indexes {
  const categories = new Map(data.categories.map((c) => [c.id, c]));
  const places = new Map(data.places.map((p) => [p.id, p]));
  const activitiesOf = (e: Establishment) =>
    e.activities && e.activities.length ? e.activities : categories.get(e.category)?.defaultActivities ?? [];
  return { categories, places, activitiesOf };
}

export interface Filters {
  category: string | null;
  place: string | null;
  activity: string | null;
}

export function applyFilters(data: KioskData, idx: Indexes, f: Filters): Establishment[] {
  return data.establishments.filter(
    (e) =>
      (!f.category || e.category === f.category) &&
      (!f.place || e.placeId === f.place) &&
      (!f.activity || idx.activitiesOf(e).includes(f.activity)),
  );
}

export function sortForList(list: Establishment[], idx: Indexes, locale: Locale): Establishment[] {
  const collator = new Intl.Collator(locale);
  const placeName = (e: Establishment) => (e.placeId ? idx.places.get(e.placeId)?.name[locale] ?? '' : '￿');
  const featured = featuredEstablishments(list);
  const rest = list
    .filter((e) => !e.featured)
    .sort((a, b) => collator.compare(placeName(a), placeName(b)) || collator.compare(titleOf(a)[locale] ?? '', titleOf(b)[locale] ?? ''));
  return [...featured, ...rest];
}

export type SearchHit =
  | { kind: 'establishment'; id: string; score: number }
  | { kind: 'place'; id: string; score: number; count: number }
  | { kind: 'category'; id: string; score: number; count: number }
  | { kind: 'activity'; id: string; score: number; count: number };

export interface SearchResults {
  establishments: Extract<SearchHit, { kind: 'establishment' }>[];
  places: Extract<SearchHit, { kind: 'place' }>[];
  types: Extract<SearchHit, { kind: 'category' | 'activity' }>[];
}

/** Recherche dans les deux langues, quelle que soit la langue de l'interface. */
export function search(data: KioskData, idx: Indexes, query: string): SearchResults {
  const q = normalize(query);
  if (!q) return { establishments: [], places: [], types: [] };

  const best = (texts: (string | null | undefined)[]) => Math.max(0, ...texts.map((t) => (t ? matchScore(t, q) : 0)));

  const establishments = data.establishments
    .map((e) => {
      const place = e.placeId ? idx.places.get(e.placeId) : undefined;
      const nameScore = best([e.name.ar, e.name.en, e.displayName?.ar, e.displayName?.en, e.honoree?.ar, e.honoree?.en]);
      const placeScore = best([place?.name.ar, place?.name.en]);
      const score = nameScore * 2 + placeScore;
      return { kind: 'establishment' as const, id: e.id, score: e.featured ? score * CONFIG.featuredSearchBoost : score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const countBy = (pred: (e: Establishment) => boolean) => data.establishments.filter(pred).length;

  const places = data.places
    .map((p) => ({ kind: 'place' as const, id: p.id, score: best([p.name.ar, p.name.en]), count: countBy((e) => e.placeId === p.id) }))
    .filter((h) => h.score > 0 && h.count > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 5);

  const cats = data.categories
    .map((c) => ({ kind: 'category' as const, id: c.id, score: best([c.label.ar, c.label.en]), count: countBy((e) => e.category === c.id) }))
    .filter((h) => h.score > 0 && h.count > 0);
  const acts = data.activities
    .map((a) => ({
      kind: 'activity' as const,
      id: a.id,
      score: best([a.label.ar, a.label.en]),
      count: countBy((e) => idx.activitiesOf(e).includes(a.id)),
    }))
    .filter((h) => h.score > 0 && h.count > 0);
  const types: SearchResults['types'] = [...cats, ...acts].sort((a, b) => b.score - a.score).slice(0, 4);

  return { establishments, places, types };
}

/** Lieux les plus représentés, pour les suggestions quand la recherche est vide. */
export function topPlaces(data: KioskData, n = 6) {
  const counts = new Map<string, number>();
  for (const e of data.establishments) if (e.placeId) counts.set(e.placeId, (counts.get(e.placeId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}
