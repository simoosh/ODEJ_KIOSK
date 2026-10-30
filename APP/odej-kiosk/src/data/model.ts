import type { Category, Establishment, KioskData, Locale, Place } from '../types';
import { matchScore, normalize } from '../lib/text';

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
  return [...list].sort(
    (a, b) => collator.compare(placeName(a), placeName(b)) || collator.compare(a.name[locale] ?? '', b.name[locale] ?? ''),
  );
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
      const nameScore = best([e.name.ar, e.name.en]);
      const placeScore = best([place?.name.ar, place?.name.en]);
      return { kind: 'establishment' as const, id: e.id, score: nameScore * 2 + placeScore };
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
