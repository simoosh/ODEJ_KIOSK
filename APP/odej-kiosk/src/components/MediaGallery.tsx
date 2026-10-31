import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../types';
import { useI18n } from '../i18n/I18n';
import { Icon } from './Icon';

/**
 * Photos et vidéos d'un établissement : vignettes dans la fiche, plein écran au toucher.
 * Un média en erreur est masqué. Sans aucun média affichable, le bloc entier disparaît.
 */
export function MediaGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const { t, tx, dir } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const markFailed = (item: MediaItem) => setFailed((prev) => new Set(prev).add(item.src));

  const visible = items.filter((item) => !failed.has(item.src));
  const index = open === null || visible.length === 0 ? null : Math.min(open, visible.length - 1);
  const current = index === null ? null : visible[index];
  const caption = current ? tx(current.caption) : '';

  if (visible.length === 0) return null;

  return (
    <section className="detail-block">
      <h3>{title}</h3>
      <div className="gallery">
        {visible.map((item, i) => (
          <button key={item.src} type="button" className="gallery-thumb" onClick={() => setOpen(i)} aria-label={`${title} ${i + 1}`}>
            <img src={item.kind === 'video' ? item.poster : item.src} alt="" loading="lazy" onError={() => markFailed(item)} />
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
                <video key={current.src} src={current.src} poster={current.poster} controls autoPlay playsInline onError={() => markFailed(current)} />
              ) : (
                <img src={current.src} alt={caption || title} onError={() => markFailed(current)} />
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
          document.body,
        )}
    </section>
  );
}
