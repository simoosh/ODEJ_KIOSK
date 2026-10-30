import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../types';
import { useI18n } from '../i18n/I18n';
import { Icon } from './Icon';

/** Photos et vidéos d'un établissement : vignettes dans la fiche, plein écran au toucher. */
export function MediaGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const { t, tx, dir } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : items[open];
  const caption = current ? tx(current.caption) : '';

  return (
    <>
      <div className="gallery">
        {items.map((item, i) => (
          <button key={item.src} type="button" className="gallery-thumb" onClick={() => setOpen(i)} aria-label={`${title} ${i + 1}`}>
            <img src={item.kind === 'video' ? item.poster : item.src} alt="" loading="lazy" />
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
            <div className="viewer-stage">
              {current.kind === 'video' ? (
                <video key={current.src} src={current.src} poster={current.poster} controls autoPlay playsInline />
              ) : (
                <img src={current.src} alt={caption || title} />
              )}
            </div>
            {caption && <p className="viewer-caption">{caption}</p>}
            <div className="viewer-nav">
              <button type="button" onClick={() => setOpen(open! - 1)} disabled={open === 0} aria-label={t('previous')}>
                <Icon name="back" className="flip-rtl" />
              </button>
              <span dir="ltr">
                {open! + 1} / {items.length}
              </span>
              <button type="button" onClick={() => setOpen(open! + 1)} disabled={open === items.length - 1} aria-label={t('next')}>
                <Icon name="arrow" className="flip-rtl" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
