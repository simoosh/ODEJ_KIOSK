import { useState } from 'react';
import type { Establishment, KioskData } from '../types';
import { titleOf, type Indexes } from '../data/model';
import { useI18n } from '../i18n/I18n';
import { distanceKm, toDms } from '../lib/geo';
import { Icon } from './Icon';
import { MediaGallery } from './MediaGallery';
import { QrCode } from './QrCode';

interface Props {
  data: KioskData;
  idx: Indexes;
  est: Establishment;
  orbiting: boolean;
  onBack(): void;
  onSelect(id: string): void;
  onShow(): void;
  onOrbit(on: boolean): void;
}

export function EstablishmentDetail({ data, idx, est, orbiting, onBack, onSelect, onShow, onOrbit }: Props) {
  const { t, tx, locale } = useI18n();
  const [brokenCover, setBrokenCover] = useState<string | null>(null);
  const cover = est.media?.cover && est.media.cover.src !== brokenCover ? est.media.cover : null;
  const cat = idx.categories.get(est.category);
  const place = est.placeId ? idx.places.get(est.placeId) : undefined;
  const acts = idx.activitiesOf(est);
  const fromType = !(est.activities && est.activities.length);
  const here: [number, number] = [est.location.lng, est.location.lat];
  const nearby = data.establishments
    .filter((e) => e.id !== est.id)
    .map((e) => ({ e, d: distanceKm(here, [e.location.lng, e.location.lat]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  const description = tx(est.description);
  const fmtKm = (d: number) => t('km', { d: d < 10 ? d.toFixed(1) : Math.round(d) });

  return (
    <article className="detail" style={{ ['--c' as string]: cat?.color }}>
      <button type="button" className="back-btn" onClick={onBack}>
        <Icon name="back" className="flip-rtl" />
        {t('back')}
      </button>

      <div className="detail-scroll">
        <header className="detail-head">
          <span className="pill">
            <Icon name={cat?.icon ?? 'star'} size="1em" />
            {tx(cat?.label)}
          </span>
          <h2 className="display detail-name">{tx(titleOf(est))}</h2>
          {est.honoree && <p className="detail-alt">{tx(est.honoree)}</p>}
          {locale === 'en' && titleOf(est).ar && <p className="detail-alt" lang="ar" dir="rtl">{titleOf(est).ar}</p>}
          <p className="detail-place">
            <Icon name="pin" size="1.05em" />
            {place ? tx(place.name) : t('placeUnknown')}
            <span className="muted"> · {tx(data.wilaya.name)}</span>
          </p>
        </header>

        {cover ? (
          <img
            className={`photo ${cover.fit === 'contain' ? 'is-contain' : ''}`}
            src={cover.src}
            alt={tx(cover.caption) || tx(titleOf(est))}
            onError={() => setBrokenCover(cover.src)}
          />
        ) : (
          <div className="photo is-slot">
            <Icon name="frame" size="2em" />
            <span>{t('photoSlot')}</span>
          </div>
        )}

        <p className={`detail-desc ${description ? '' : 'is-pending'}`}>{description || t('descriptionPending')}</p>

        {!!est.media?.gallery.length && <MediaGallery key={est.id} items={est.media.gallery} title={t('gallery')} />}

        {acts.length > 0 && (
          <section className="detail-block">
            <h3>{t('activities')}</h3>
            <div className="chip-row wrap">
              {acts.map((a) => (
                <span key={a} className="chip is-static">
                  {tx(data.activities.find((x) => x.id === a)?.label)}
                </span>
              ))}
            </div>
            {fromType && <p className="note">{t('activitiesByType')}</p>}
          </section>
        )}

        <div className="detail-actions">
          <button type="button" className="btn" onClick={onShow}>
            <Icon name="pin" />
            {t('showOnMap')}
          </button>
          <button type="button" className={`btn ${orbiting ? 'is-on' : ''}`} onClick={() => onOrbit(!orbiting)}>
            <Icon name="orbit" />
            {orbiting ? t('stopOrbit') : t('orbit')}
          </button>
        </div>

        {(est.contact?.phone || est.contact?.address || est.openingHours) && (
          <section className="detail-block">
            <h3>{t('contact')}</h3>
            <dl className="coords">
              {est.contact?.phone && (
                <>
                  <dt>{t('phone')}</dt>
                  <dd dir="ltr">{est.contact.phone}</dd>
                </>
              )}
              {est.contact?.address && (
                <>
                  <dt>{t('address')}</dt>
                  <dd dir="ltr">{est.contact.address}</dd>
                </>
              )}
              {est.openingHours && (
                <>
                  <dt>{t('openingHours')}</dt>
                  <dd>{tx(est.openingHours)}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        <section className="detail-grid">
          {est.contact?.facebook && (
            <div className="qr-card">
              <QrCode value={est.contact.facebook} label={t('facebook')} />
              <div>
                <strong>
                  <Icon name="facebook" size="1em" /> {t('facebook')}
                </strong>
                <span>{t('scanHint')}</span>
              </div>
            </div>
          )}
          <dl className="coords">
            <dt>{t('coordinates')}</dt>
            <dd dir="ltr">
              {toDms(est.location.lat, 'lat')}
              <br />
              {toDms(est.location.lng, 'lng')}
            </dd>
            <dd className="muted" dir="ltr">
              {est.location.lat.toFixed(5)}, {est.location.lng.toFixed(5)}
            </dd>
          </dl>
        </section>

        <section className="detail-block">
          <h3>{t('nearby')}</h3>
          <ul className="nearby">
            {nearby.map(({ e, d }) => {
              const c = idx.categories.get(e.category);
              return (
                <li key={e.id}>
                  <button type="button" className="item compact" onClick={() => onSelect(e.id)}>
                    <span className="badge sm" style={{ ['--c' as string]: c?.color }}>
                      <Icon name={c?.icon ?? 'star'} size="1em" />
                    </span>
                    <span className="item-text">
                      <strong>{tx(titleOf(e))}</strong>
                    </span>
                    <span className="dist">{fmtKm(d)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
}
