import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BasemapId, Boundary, DetailsIndex, KioskData, Locale, MediaIndex } from './types';
import { CONFIG, forcedQuality, nextQuality, QUALITY, type QualityLevel } from './config';
import { I18nProvider, useI18n } from './i18n/I18n';
import { MapView, type MapHandle } from './map/MapView';
import { applyFilters, buildIndexes, sortForList, withDetails, withMedia, type Filters } from './data/model';
import { Landing } from './components/Landing';
import { SearchBox, type SearchPick } from './components/SearchBox';
import { EstablishmentList } from './components/EstablishmentList';
import { EstablishmentDetail } from './components/EstablishmentDetail';
import { MapControls } from './components/MapControls';
import { IdleOverlay } from './components/IdleOverlay';
import { ScreenSimulator } from './components/ScreenSimulator';
import { Icon } from './components/Icon';
import { useIdle, useSize } from './lib/hooks';
import { perfCounters } from './lib/perf';
import type { StringKey } from './i18n/strings';

const DebugPanel = lazy(() => import('./components/DebugPanel'));

const SIM_ENABLED = new URLSearchParams(location.search).has('sim');
const DEBUG = new URLSearchParams(location.search).has('debug');
const FORCED_QUALITY = forcedQuality(location.search);
const NO_FILTERS: Filters = { category: null, place: null, activity: null };

export default function App() {
  const [data, setData] = useState<KioskData | null>(null);
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = <T,>(url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json() as Promise<T>;
      });
    // Sans index, l'application s'affiche sans médias, et sans détails avec les seules données du JSON
    // Sans contour, la carte cadre sur les établissements, sans masque
    Promise.all([
      load<KioskData>(CONFIG.dataUrl),
      load<MediaIndex>(CONFIG.mediaIndexUrl).catch(() => ({})),
      load<DetailsIndex>(CONFIG.detailsIndexUrl).catch(() => ({})),
      load<Boundary>(CONFIG.boundaryUrl).catch(() => null),
    ])
      .then(([kiosk, media, details, outline]) => {
        setData(withDetails(withMedia(kiosk, media), details));
        setBoundary(outline);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="boot">Impossible de charger {CONFIG.dataUrl} : {error}</div>;
  if (!data) return <div className="boot" aria-busy="true" />;

  return <ScreenSimulator enabled={SIM_ENABLED}>{(size) => <Kiosk data={data} boundary={boundary} size={size} />}</ScreenSimulator>;
}

function Kiosk({ data, boundary, size }: { data: KioskData; boundary: Boundary | null; size: { w: number; h: number } }) {
  const [locale, setLocale] = useState<Locale>(data.meta.defaultLocale ?? 'ar');
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const onResetLang = useCallback(() => setLocale(data.meta.defaultLocale ?? 'ar'), [data]);

  return (
    <I18nProvider locale={locale}>
      <KioskScreen
        data={data}
        boundary={boundary}
        size={size}
        onToggleLang={() => setLocale((l) => (l === 'ar' ? 'en' : 'ar'))}
        onResetLang={onResetLang}
      />
    </I18nProvider>
  );
}

function KioskScreen({
  data,
  boundary,
  size,
  onToggleLang,
  onResetLang,
}: {
  data: KioskData;
  boundary: Boundary | null;
  size: { w: number; h: number };
  onToggleLang(): void;
  onResetLang(): void;
}) {
  const { locale, dir, t } = useI18n();
  useEffect(() => {
    if (DEBUG) perfCounters.renders += 1;
  });
  const idx = useMemo(() => buildIndexes(data), [data]);
  const mapRef = useRef<MapHandle>(null);
  const compassRef = useRef<HTMLSpanElement>(null);

  const [screen, setScreen] = useState<'landing' | 'map'>('landing');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [basemap, setBasemap] = useState<BasemapId>('plan');
  const [quality, setQuality] = useState<QualityLevel>(FORCED_QUALITY ?? 'high');
  const [terrain, setTerrain] = useState(QUALITY[quality].terrain);
  const [is3d, setIs3d] = useState(false);
  const [orbiting, setOrbiting] = useState(false);
  /** Liste masquée : glissée hors de l'écran en paysage, tiroir replié en portrait */
  const [panelHidden, setPanelHidden] = useState(false);
  /** Clé de la recherche et des contrôles : l'incrémenter vide leurs états internes */
  const [resets, setResets] = useState(0);
  const [notice, setNotice] = useState<StringKey | null>(null);

  const portrait = size.h > size.w;

  // Marges de la carte : le centre de la vue reste dans la zone visible (hors panneau / barre)
  const panelRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const panelSize = useSize(panelRef);
  const topSize = useSize(topRef);
  // (calculées en permanence : l'interface carte est rendue, invisible, derrière l'accueil)
  const padding = useMemo(() => {
    const gap = 16;
    const top = topSize.h + gap * 2;
    if (portrait) {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return { top, right: 0, bottom: panelHidden ? CONFIG.sheetPeekRem * rem : panelSize.h, left: 0 };
    }
    const side = panelHidden ? 0 : panelSize.w + gap * 2;
    return dir === 'rtl' ? { top, right: side, bottom: 0, left: 0 } : { top, right: 0, bottom: 0, left: side };
  }, [portrait, panelHidden, panelSize.w, panelSize.h, topSize.h, dir]);

  // Rotation continue derrière l'accueil
  useEffect(() => {
    const id = window.setTimeout(() => mapRef.current?.attract(), 400);
    return () => window.clearTimeout(id);
  }, []);

  const items = useMemo(() => sortForList(applyFilters(data, idx, filters), idx, locale), [data, idx, filters, locale]);
  const filtered = !!(filters.category || filters.place || filters.activity);
  const highlightIds = useMemo(() => (filtered ? new Set(items.map((e) => e.id)) : null), [filtered, items]);
  const selected = selectedId ? data.establishments.find((e) => e.id === selectedId) ?? null : null;

  const start = (id?: string) => {
    setScreen('map');
    if (id) setSelectedId(id);
    mapRef.current?.enter(id);
  };

  /**
   * Retour à l'accueil. newVisitor (inactivité) : le prochain visiteur retrouve la borne telle qu'au premier jour,
   * langue comprise. Le bouton d'accueil, lui, garde la langue choisie.
   */
  const goHome = useCallback((newVisitor = false) => {
    setScreen('landing');
    setSelectedId(null);
    setFilters(NO_FILTERS);
    setPanelHidden(false);
    setBasemap('plan');
    setTerrain(QUALITY[quality].terrain);
    setNotice(null);
    setResets((n) => n + 1);
    if (newVisitor) onResetLang();
    mapRef.current?.attract();
  }, [quality, onResetLang]);

  const idleLeft = useIdle(screen === 'map', CONFIG.idleTimeoutMs, CONFIG.idleWarningMs, () => goHome(true));

  // La liste garde l'état choisi par le visiteur : un marqueur touché ouvre d'abord sa fenêtre sur la carte
  const select = useCallback((id: string) => {
    setSelectedId(id);
    mapRef.current?.focus(id);
  }, []);

  const showPanel = useCallback(() => setPanelHidden(false), []);

  const pointsOf = (list: typeof data.establishments) => list.map((e) => [e.location.lng, e.location.lat] as [number, number]);

  const applyAndFit = useCallback(
    (f: Filters) => {
      setFilters(f);
      setSelectedId(null);
      const list = applyFilters(data, idx, f);
      if (f.category || f.place || f.activity) mapRef.current?.fitPoints(pointsOf(list));
      else mapRef.current?.whole();
    },
    [data, idx],
  );

  const onBasemapFailed = useCallback((id: BasemapId) => {
    if (id !== 'preview') {
      setBasemap('preview');
      setNotice('basemapFallback');
    }
  }, []);

  const onEntryFps = useCallback(
    (fps: number) => {
      if (FORCED_QUALITY) return;
      const next = nextQuality(quality, fps);
      if (next === quality) return;
      setQuality(next);
      setTerrain(QUALITY[next].terrain);
    },
    [quality],
  );

  const onPick = (p: SearchPick) => {
    if (p.kind === 'establishment') select(p.id);
    else if (p.kind === 'place') applyAndFit({ ...NO_FILTERS, place: p.id });
    else if (p.kind === 'category') applyAndFit({ ...NO_FILTERS, category: p.id });
    else applyAndFit({ ...NO_FILTERS, activity: p.id });
    setPanelHidden(false);
  };

  return (
    <div
      className={`kiosk ${portrait ? 'is-portrait' : 'is-landscape'} screen-${screen} quality-${quality} ${panelHidden ? 'panel-hidden' : ''}`}
      dir={dir}
      lang={locale}
      style={{ width: size.w, height: size.h }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MapView
        ref={mapRef}
        data={data}
        boundary={boundary}
        locale={locale}
        basemap={basemap}
        terrain={terrain}
        selectedId={selectedId}
        highlightIds={highlightIds}
        padding={padding}
        markersVisible={screen === 'map'}
        quality={quality}
        compass={compassRef}
        onSelect={select}
        onOpenDetails={showPanel}
        on3dChange={setIs3d}
        onOrbitChange={setOrbiting}
        onBasemapFailed={onBasemapFailed}
        onEntryFps={onEntryFps}
      />

      <div className="map-ui" aria-hidden={screen !== 'map'}>
        <div className="topbar" ref={topRef}>
          <button type="button" className="home-btn" onClick={() => goHome()} aria-label={t('home')}>
            <Icon name="home" />
            <span className="home-text">
              <strong>{data.organization.shortName[locale]}</strong>
              <small>{data.wilaya.name[locale]}</small>
            </span>
          </button>
          <SearchBox key={resets} data={data} idx={idx} virtualKeyboard onPick={onPick} />
          <button type="button" className="lang-btn" onClick={onToggleLang} aria-label={t('language')}>
            {t('language')}
          </button>
        </div>

        <div className={`panel-shell ${panelHidden ? 'is-hidden' : ''}`}>
          {!portrait && (
            <button
              type="button"
              className="panel-toggle"
              onClick={() => setPanelHidden((v) => !v)}
              aria-label={panelHidden ? t('expand') : t('collapse')}
              aria-expanded={!panelHidden}
            >
              <Icon name="chevronStart" className="flip-rtl" />
            </button>
          )}
          <aside className="panel" ref={panelRef} inert={!portrait && panelHidden}>
            {portrait && (
              <button
                type="button"
                className="sheet-handle"
                onClick={() => setPanelHidden((v) => !v)}
                aria-label={panelHidden ? t('expand') : t('collapse')}
                aria-expanded={!panelHidden}
              >
                <span />
              </button>
            )}
            {selected ? (
              <EstablishmentDetail
                key={selected.id}
                data={data}
                idx={idx}
                est={selected}
                orbiting={orbiting}
                onBack={() => {
                  setSelectedId(null);
                  mapRef.current?.orbit(false);
                }}
                onSelect={select}
                onShow={() => mapRef.current?.focus(selected.id)}
                onOrbit={(on) => mapRef.current?.orbit(on)}
              />
            ) : (
              <EstablishmentList data={data} idx={idx} items={items} filters={filters} onFilters={applyAndFit} onSelect={select} />
            )}
          </aside>
        </div>

        <MapControls
          key={resets}
          map={mapRef}
          compass={compassRef}
          is3d={is3d}
          basemap={basemap}
          terrain={terrain}
          terrainLocked={quality === 'low'}
          onBasemap={setBasemap}
          onTerrain={setTerrain}
        />

        {notice && (
          <div className="notice" role="status">
            <span>{t(notice)}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label={t('close')}>
              <Icon name="close" size="1em" />
            </button>
          </div>
        )}
      </div>

      <Landing data={data} leaving={screen === 'map'} portrait={portrait} onStart={start} onToggleLang={onToggleLang} />

      {idleLeft !== null && <IdleOverlay secondsLeft={idleLeft} onStay={() => window.dispatchEvent(new Event('pointerdown'))} />}

      {DEBUG && (
        <Suspense fallback={null}>
          <DebugPanel map={mapRef} quality={quality} />
        </Suspense>
      )}
    </div>
  );
}
