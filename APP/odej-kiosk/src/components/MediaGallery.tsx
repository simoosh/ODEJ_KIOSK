import { useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../types';
import { thumbUrl } from '../config';
import { useI18n } from '../i18n/I18n';
import { swipeAction } from '../lib/swipe';
import { Icon } from './Icon';

/**
 * Photos et vidéos d'un établissement : vignettes dans la fiche, plein écran au toucher.
 * La grille charge les vignettes, avec repli sur l'image pleine si la vignette manque.
 * Un média en erreur est masqué. Sans aucun média affichable, le bloc entier disparaît.
 */
const VIDEO_CONTROLS_HEIGHT = 72;

export function MediaGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const { t, tx, dir } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [noThumb, setNoThumb] = useState<ReadonlySet<string>>(new Set());
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const markFailed = (item: MediaItem) => setFailed((prev) => new Set(prev).add(item.src));
  const preview = (item: MediaItem) => (item.kind === 'video' ? item.poster : item.src) ?? item.src;

  const visible = items.filter((item) => !failed.has(item.src));
  const index = open === null || visible.length === 0 ? null : Math.min(open, visible.length - 1);
  const current = index === null ? null : visible[index];
  const caption = current ? tx(current.caption) : '';

  if (visible.length === 0) return null;

  const onSwipeStart = (e: PointerEvent<HTMLDivElement>) => {
    const { bottom } = e.currentTarget.getBoundingClientRect();
    // La barre de la vidéo garde ses gestes : on y déplace la lecture
    swipeStart.current = current?.kind === 'video' && e.clientY > bottom - VIDEO_CONTROLS_HEIGHT ? null : { x: e.clientX, y: e.clientY };
  };

  const onSwipeEnd = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || index === null) return;
    const action = swipeAction(e.clientX - start.x, e.clientY - start.y, dir === 'rtl');
    if (action === 'close') setOpen(null);
    if (action === 'next' && index < visible.length - 1) setOpen(index + 1);
    if (action === 'previous' && index > 0) setOpen(index - 1);
  };

  return (
    <section className="detail-block">
      <h3>{title}</h3>
      <div className="gallery">
        {visible.map((item, i) => (
          <button key={item.src} type="button" className="gallery-thumb" onClick={() => setOpen(i)} aria-label={`${title} ${i + 1}`}>
            <img
              src={noThumb.has(item.src) ? preview(item) : thumbUrl(preview(item))}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => (noThumb.has(item.src) ? markFailed(item) : setNoThumb((prev) => new Set(prev).add(item.src)))}
            />
            {item.kind === 'video' && <span className="gallery-play" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {current &&
        createPortal(
          <div className="viewer" dir={dir} role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" className="viewer-close" onClick={() => setOpen(null)} aria-label={t('close')}>
              <Icon name="close" />
            </button>
            <div className="viewer-stage" onPointerDown={onSwipeStart} onPointerUp={onSwipeEnd}>
              {current.kind === 'video' ? (
                <video key={current.src} src={current.src} poster={current.poster} preload="metadata" controls autoPlay playsInline onError={() => markFailed(current)} />
              ) : (
                <img src={current.src} alt={caption || title} draggable={false} onError={() => markFailed(current)} />
              )}
            </div>
            {caption && <p className="viewer-caption">{caption}</p>}
            <div className="viewer-nav">
              <button type="button" onClick={() => setOpen(index! - 1)} disabled={index === 0} aria-label={t('previous')}>
                <Icon name="back" className="flip-rtl" />
              </button>
              <span dir="ltr">
                {index! + 1} / {visible.length}
              </span>
              <button type="button" onClick={() => setOpen(index! + 1)} disabled={index === visible.length - 1} aria-label={t('next')}>
                <Icon name="arrow" className="flip-rtl" />
              </button>
            </div>
          </div>,
          // Dans .kiosk : la visionneuse suit l'écran simulé, la langue et la direction
          document.querySelector('.kiosk') ?? document.body,
        )}
    </section>
  );
}
