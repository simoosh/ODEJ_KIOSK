import type { Establishment, KioskData } from '../types';
import type { Filters, Indexes } from '../data/model';
import { useI18n } from '../i18n/I18n';
import { Icon } from './Icon';

interface Props {
  data: KioskData;
  idx: Indexes;
  items: Establishment[];
  filters: Filters;
  onFilters(f: Filters): void;
  onSelect(id: string): void;
}

export function EstablishmentList({ data, idx, items, filters, onFilters, onSelect }: Props) {
  const { t, tx } = useI18n();
  const counts = new Map<string, number>();
  for (const e of data.establishments) {
    if (filters.place && e.placeId !== filters.place) continue;
    if (filters.activity && !idx.activitiesOf(e).includes(filters.activity)) continue;
    counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  }
  const place = filters.place ? idx.places.get(filters.place) : undefined;
  const activity = filters.activity ? data.activities.find((a) => a.id === filters.activity) : undefined;

  return (
    <div className="list">
      <div className="list-head">
        <div className="list-title">
          <h2>{t('panelTitle')}</h2>
          <span className="count">{t('panelCount', { n: items.length })}</span>
        </div>
        <div className="chip-row scroll" role="toolbar">
          <button type="button" className={`chip ${!filters.category ? 'is-on' : ''}`} onClick={() => onFilters({ ...filters, category: null })}>
            {t('filterAll')}
          </button>
          {data.categories
            .filter((c) => (counts.get(c.id) ?? 0) > 0)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${filters.category === c.id ? 'is-on' : ''}`}
                style={{ ['--c' as string]: c.color }}
                onClick={() => onFilters({ ...filters, category: filters.category === c.id ? null : c.id })}
              >
                <span className="chip-dot" />
                {tx(c.label)}
                <span className="chip-count">{counts.get(c.id)}</span>
              </button>
            ))}
        </div>
        {(place || activity) && (
          <div className="chip-row wrap">
            {place && (
              <button type="button" className="chip is-active-filter" onClick={() => onFilters({ ...filters, place: null })} aria-label={t('clearFilter')}>
                <Icon name="pin" size="1em" />
                {tx(place.name)}
                <Icon name="close" size="0.9em" />
              </button>
            )}
            {activity && (
              <button type="button" className="chip is-active-filter" onClick={() => onFilters({ ...filters, activity: null })} aria-label={t('clearFilter')}>
                {tx(activity.label)}
                <Icon name="close" size="0.9em" />
              </button>
            )}
          </div>
        )}
      </div>

      <ul className="list-items">
        {items.map((e) => {
          const c = idx.categories.get(e.category);
          const p = e.placeId ? idx.places.get(e.placeId) : undefined;
          return (
            <li key={e.id}>
              <button type="button" className="item" onClick={() => onSelect(e.id)}>
                <span className="badge" style={{ ['--c' as string]: c?.color }}>
                  <Icon name={c?.icon ?? 'star'} size="1.15em" />
                </span>
                <span className="item-text">
                  <strong>{tx(e.name)}</strong>
                  <small>
                    {tx(c?.label)}
                    {p ? <> · {tx(p.name)}</> : null}
                  </small>
                </span>
                <Icon name="back" className="item-go flip-ltr" size="1.1em" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
