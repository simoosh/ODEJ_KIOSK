import { useMemo, useRef, useState } from 'react';
import type { Establishment, KioskData } from '../types';
import { useI18n } from '../i18n/I18n';
import { featuredEstablishments, search, titleOf, topPlaces, type Indexes } from '../data/model';
import { Icon } from './Icon';
import { VirtualKeyboard } from './VirtualKeyboard';

export type SearchPick =
  | { kind: 'establishment'; id: string }
  | { kind: 'place'; id: string }
  | { kind: 'category'; id: string }
  | { kind: 'activity'; id: string };

interface Props {
  data: KioskData;
  idx: Indexes;
  virtualKeyboard: boolean;
  onPick(pick: SearchPick): void;
  onOpenChange?(open: boolean): void;
}

export function SearchBox({ data, idx, virtualKeyboard, onPick, onOpenChange }: Props) {
  const { t, tx } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpenState] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setOpen = (v: boolean) => {
    setOpenState(v);
    onOpenChange?.(v);
  };

  const results = useMemo(() => search(data, idx, query), [data, idx, query]);
  const suggestions = useMemo(() => topPlaces(data, 6), [data]);
  const featured = useMemo(() => featuredEstablishments(data.establishments), [data]);
  const empty = query.trim() === '';
  const nothing = !empty && !results.establishments.length && !results.places.length && !results.types.length;

  const pick = (p: SearchPick) => {
    onPick(p);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const countFor = (kind: 'category' | 'activity', id: string) =>
    data.establishments.filter((e) => (kind === 'category' ? e.category === id : idx.activitiesOf(e).includes(id))).length;

  const establishmentRow = (e: Establishment) => {
    const c = idx.categories.get(e.category);
    const p = e.placeId ? idx.places.get(e.placeId) : undefined;
    return (
      <button key={e.id} type="button" className="sr-item" onClick={() => pick({ kind: 'establishment', id: e.id })}>
        <span className="badge" style={{ ['--c' as string]: c?.color }}>
          <Icon name={c?.icon ?? 'star'} size="1.1em" />
        </span>
        <span className="sr-text">
          <strong>{tx(titleOf(e))}</strong>
          <small>{e.honoree ? tx(e.honoree) : `${tx(c?.label)}${p ? ` · ${tx(p.name)}` : ''}`}</small>
        </span>
      </button>
    );
  };

  return (
    <div className={`search ${open ? 'is-open' : ''}`}>
      <label className="search-field">
        <Icon name="search" className="search-icon" />
        <input
          ref={inputRef}
          id="kiosk-search"
          type="search"
          inputMode={virtualKeyboard ? 'none' : 'search'}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && results.establishments[0]) pick({ kind: 'establishment', id: results.establishments[0].id });
          }}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label={t('searchClear')}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setQuery('')}
          >
            <Icon name="close" />
          </button>
        )}
      </label>

      {open && (
        <>
          <button type="button" className="search-scrim" aria-label={t('keyboardHide')} onClick={() => setOpen(false)} />
          <div className="search-results" role="listbox">
            {empty && featured.length > 0 && (
              <div className="sr-group">
                <h3>{t('standBadge')}</h3>
                {featured.map(establishmentRow)}
              </div>
            )}

            {empty && (
              <div className="sr-group">
                <h3>{t('searchSuggestions')}</h3>
                <div className="chip-row wrap">
                  {data.categories
                    .filter((c) => countFor('category', c.id) > 0 && c.id !== 'youth-facility')
                    .map((c) => (
                      <button key={c.id} type="button" className="chip" style={{ ['--c' as string]: c.color }} onClick={() => pick({ kind: 'category', id: c.id })}>
                        <span className="chip-dot" />
                        {tx(c.label)}
                      </button>
                    ))}
                  {suggestions.map(([id, n]) => {
                    const p = idx.places.get(id);
                    return p ? (
                      <button key={id} type="button" className="chip is-place" onClick={() => pick({ kind: 'place', id })}>
                        <Icon name="pin" size="1em" />
                        {tx(p.name)}
                        <span className="chip-count">{n}</span>
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {results.establishments.length > 0 && (
              <div className="sr-group">
                <h3>{t('searchEstablishments')}</h3>
                {results.establishments.map((h) => establishmentRow(data.establishments.find((x) => x.id === h.id)!))}
              </div>
            )}

            {results.places.length > 0 && (
              <div className="sr-group">
                <h3>{t('searchPlaces')}</h3>
                <div className="chip-row wrap">
                  {results.places.map((h) => (
                    <button key={h.id} type="button" className="chip is-place" onClick={() => pick({ kind: 'place', id: h.id })}>
                      <Icon name="pin" size="1em" />
                      {tx(idx.places.get(h.id)?.name)}
                      <span className="chip-count">{h.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {results.types.length > 0 && (
              <div className="sr-group">
                <h3>{t('searchCategories')}</h3>
                <div className="chip-row wrap">
                  {results.types.map((h) => {
                    const label = h.kind === 'category' ? idx.categories.get(h.id)?.label : data.activities.find((a) => a.id === h.id)?.label;
                    const color = h.kind === 'category' ? idx.categories.get(h.id)?.color : undefined;
                    return (
                      <button key={h.kind + h.id} type="button" className="chip" style={color ? { ['--c' as string]: color } : undefined} onClick={() => pick({ kind: h.kind, id: h.id })}>
                        {color && <span className="chip-dot" />}
                        {tx(label)}
                        <span className="chip-count">{h.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {nothing && (
              <div className="sr-empty">
                <strong>{t('searchNoResult', { q: query.trim() })}</strong>
                <span>{t('searchNoResultHint')}</span>
              </div>
            )}
          </div>

          {virtualKeyboard && (
            <VirtualKeyboard
              onKey={(k) => setQuery((q) => q + k)}
              onBackspace={() => setQuery((q) => q.slice(0, -1))}
              onClose={() => {
                setOpen(false);
                inputRef.current?.blur();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
