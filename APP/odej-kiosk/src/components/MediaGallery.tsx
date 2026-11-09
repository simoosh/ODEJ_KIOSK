import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../types';
import { CONFIG, thumbUrl } from '../config';
import { useI18n } from '../i18n/I18n';
import { carouselPose } from '../lib/carousel';
import { swipeAction } from '../lib/swipe';
import { Icon } from './Icon';

/**
 * Photos et vidéos d'un établissement : carrousel 3D dans la fiche, plein écran au toucher de la photo du centre.
 * Le carrousel charge les vignettes, avec repli sur l'image pleine si la vignette manque.
 * Un média en erreur est masqué. Sans aucun média affichable, le bloc entier disparaît.
 *
 * Pendant le glissement, les positions s'écrivent directement dans le DOM (aucun setState par image) ;
 * React ne rend que les cartes proches de la photo courante.
 */
const VIDEO_CONTROLS_HEIGHT = 72;
const { radius: WINDOW, dragThreshold, flingMs, rubber } = CONFIG.carousel;

export function MediaGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const { t, tx, dir } = useI18n();
  const rtl = dir === 'rtl';
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [step, setStep] = useState<'next' | 'previous' | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [noThumb, setNoThumb] = useState<ReadonlySet<string>>(new Set());
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const cards = useRef(new Map<number, HTMLElement>());
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; pos: number; live: boolean; last: number; lastT: number; v: number } | null>(null);
  const dragged = useRef(false);
  const markFailed = (item: MediaItem) => setFailed((prev) => new Set(prev).add(item.src));
  const preview = (item: MediaItem) => (item.kind === 'video' ? item.poster : item.src) ?? item.src;

  const visible = items.filter((item) => !failed.has(item.src));
  const count = visible.length;
  const current = count ? Math.min(index, count - 1) : 0;
  const viewing = open === null || count === 0 ? null : Math.min(open, count - 1);
  const shown = viewing === null ? null : visible[viewing];
  const caption = shown ? tx(shown.caption) : '';

  /** Écrit la pose de chaque carte rendue ; `animate` laisse la transition CSS faire le chemin. */
  const layout = useCallback(
    (pos: number, animate: boolean) => {
      cards.current.forEach((el, i) => {
        const pose = carouselPose(i - pos, rtl);
        // Une carte qui vient d'apparaître se pose sans transition : elle ne traverse pas la scène
        const fresh = el.dataset.placed !== '1';
        el.style.transition = animate && !fresh ? '' : 'none';
        el.style.transform = pose.transform;
        el.style.opacity = String(pose.opacity);
        el.style.zIndex = String(pose.z);
        el.style.setProperty('--shade', pose.shade.toFixed(3));
        el.dataset.placed = '1';
      });
    },
    [rtl],
  );

  useLayoutEffect(() => {
    layout(current, true);
  }, [current, count, layout]);

  if (count === 0) return null;

  const go = (i: number) => {
    const next = Math.max(0, Math.min(count - 1, i));
    layout(next, true);
    setIndex(next);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, pos: current, live: false, last: current, lastT: e.timeStamp, v: 0 };
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.live) {
      if (Math.abs(dy) > dragThreshold && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // défilement vertical de la fiche
        return;
      }
      if (Math.abs(dx) < dragThreshold) return;
      g.live = true;
      dragged.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const width = stageRef.current?.clientWidth ?? 1;
    let pos = g.pos - ((rtl ? -1 : 1) * dx) / (width * 0.42);
    // Élastique aux deux bouts
    if (pos < 0) pos *= rubber;
    if (pos > count - 1) pos = count - 1 + (pos - (count - 1)) * rubber;
    const dt = Math.max(1, e.timeStamp - g.lastT);
    g.v = (pos - g.last) / dt;
    g.last = pos;
    g.lastT = e.timeStamp;
    layout(pos, false);
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    drag.current = null;
    if (!g || g.id !== e.pointerId || !g.live) return;
    // Un geste vif emporte la carte suivante même si le doigt a peu bougé
    const target = Math.round(g.last + g.v * flingMs);
    go(Math.max(current - 3, Math.min(current + 3, target)));
  };

  const onCancel = () => {
    if (drag.current?.live) layout(current, true);
    drag.current = null;
  };

  const onCard = (i: number) => {
    if (dragged.current) return;
    if (i === current) {
      setStep(null);
      setOpen(i);
    } else go(i);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) go(current + 1);
    if (e.key === backward) go(current - 1);
  };

  const view = (i: number | null) => {
    if (i === null) {
      if (viewing !== null) go(viewing);
      setOpen(null);
      return;
    }
    setStep(viewing !== null && i < viewing ? 'previous' : 'next');
    setOpen(i);
  };

  const onSwipeStart = (e: PointerEvent<HTMLDivElement>) => {
    const { bottom } = e.currentTarget.getBoundingClientRect();
    // La barre de la vidéo garde ses gestes : on y déplace la lecture
    swipeStart.current = shown?.kind === 'video' && e.clientY > bottom - VIDEO_CONTROLS_HEIGHT ? null : { x: e.clientX, y: e.clientY };
  };

  const onSwipeEnd = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || viewing === null) return;
    const action = swipeAction(e.clientX - start.x, e.clientY - start.y, rtl);
    if (action === 'close') view(null);
    if (action === 'next' && viewing < count - 1) view(viewing + 1);
    if (action === 'previous' && viewing > 0) view(viewing - 1);
  };

  return (
    <section className="detail-block">
      <h3 className="carousel-title">
        {title}
        <span className="carousel-count" dir="ltr">
          {current + 1} / {count}
        </span>
      </h3>
      <div
        className="carousel"
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={title}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onKeyDown={onKey}
      >
        <div className="carousel-track">
          {visible.map((item, i) =>
            Math.abs(i - current) > WINDOW ? null : (
              <button
                key={item.src}
                type="button"
                className={`carousel-card ${i === current ? 'is-current' : ''}`}
                ref={(el) => {
                  if (el) cards.current.set(i, el);
                  else cards.current.delete(i);
                }}
                onClick={() => onCard(i)}
                tabIndex={i === current ? 0 : -1}
                aria-label={`${title} ${i + 1}`}
                aria-current={i === current}
              >
                <img
                  src={noThumb.has(item.src) ? preview(item) : thumbUrl(preview(item))}
                  alt=""
                  draggable={false}
                  decoding="async"
                  onError={() => (noThumb.has(item.src) ? markFailed(item) : setNoThumb((prev) => new Set(prev).add(item.src)))}
                />
                {item.kind === 'video' && <span className="gallery-play" aria-hidden="true" />}
              </button>
            ),
          )}
        </div>
        {count > 1 && (
          <>
            <button type="button" className="carousel-nav is-prev" onClick={() => go(current - 1)} disabled={current === 0} aria-label={t('previous')}>
              <Icon name="chevronStart" className="flip-rtl" />
            </button>
            <button type="button" className="carousel-nav is-next" onClick={() => go(current + 1)} disabled={current === count - 1} aria-label={t('next')}>
              <Icon name="chevronStart" className="flip-ltr" />
            </button>
          </>
        )}
      </div>
      {count > 1 && count <= CONFIG.carousel.maxDots && (
        <div className="carousel-dots" aria-hidden="true">
          {visible.map((item, i) => (
            <span key={item.src} className={i === current ? 'is-on' : ''} />
          ))}
        </div>
      )}

      {shown &&
        createPortal(
          <div className="viewer" dir={dir} role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" className="viewer-close" onClick={() => view(null)} aria-label={t('close')}>
              <Icon name="close" />
            </button>
            <div className="viewer-stage" onPointerDown={onSwipeStart} onPointerUp={onSwipeEnd}>
              <div key={shown.src} className={`viewer-slide ${step ? `is-${step}` : 'is-open'}`}>
                {shown.kind === 'video' ? (
                  <video src={shown.src} poster={shown.poster} preload="metadata" controls autoPlay playsInline onError={() => markFailed(shown)} />
                ) : (
                  <img src={shown.src} alt={caption || title} draggable={false} onError={() => markFailed(shown)} />
                )}
              </div>
            </div>
            {caption && <p className="viewer-caption">{caption}</p>}
            <div className="viewer-nav">
              <button type="button" onClick={() => view(viewing! - 1)} disabled={viewing === 0} aria-label={t('previous')}>
                <Icon name="chevronStart" className="flip-rtl" />
              </button>
              <span dir="ltr">
                {viewing! + 1} / {count}
              </span>
              <button type="button" onClick={() => view(viewing! + 1)} disabled={viewing === count - 1} aria-label={t('next')}>
                <Icon name="chevronStart" className="flip-ltr" />
              </button>
            </div>
          </div>,
          // Dans .kiosk : la visionneuse suit l'écran simulé, la langue et la direction
          document.querySelector('.kiosk') ?? document.body,
        )}
    </section>
  );
}
