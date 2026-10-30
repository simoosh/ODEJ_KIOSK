import type { KioskData } from '../types';
import { useI18n } from '../i18n/I18n';
import { Icon } from './Icon';
import { FlagRule, MotifBand } from './Motifs';

interface Props {
  data: KioskData;
  leaving: boolean;
  onStart(): void;
  onToggleLang(): void;
}

export function Landing({ data, leaving, onStart, onToggleLang }: Props) {
  const { t, tx } = useI18n();
  const facts = [
    { value: data.establishments.length, label: t('statEstablishments'), strong: true },
    ...(data.wilaya.facts ?? []).map((f) => ({ value: f.value, label: tx(f.label), strong: false })),
  ];

  return (
    <section className={`landing ${leaving ? 'is-leaving' : ''}`} aria-hidden={leaving}>
      <div className="landing-veil" />
      <MotifBand className="landing-motifs" />

      <div className="landing-inner">
        <header className="landing-head">
          <div className="brand">
            {data.organization.logo ? (
              <img className="brand-logo" src={data.organization.logo} alt="" />
            ) : (
              <span className="brand-logo is-slot">{t('logoSlot')}</span>
            )}
            <span className="brand-text">
              <strong>{tx(data.organization.shortName)}</strong>
              <span>{tx(data.wilaya.name)}</span>
            </span>
          </div>
          <button type="button" className="lang-btn" onClick={onToggleLang}>
            {t('language')}
          </button>
        </header>

        <div className="landing-body">
          <p className="eyebrow">
            <FlagRule />
            <span>{t('eventLine')}</span>
            <span className="eyebrow-date">{t('eventDate')}</span>
          </p>
          <h1 className="display landing-title">{t('landingTitle')}</h1>
          <p className="landing-lead">{tx(data.organization.intro)}</p>

          <div className="wilaya-card">
            <h2>{t('wilayaHeading')}</h2>
            <p>{tx(data.wilaya.description)}</p>
            <dl className="facts">
              {facts.map((f) => (
                <div key={f.label} className={f.strong ? 'is-strong' : ''}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="cta-row">
            <button type="button" className="cta" onClick={onStart}>
              <span>{t('cta')}</span>
              <Icon name="arrow" className="flip-rtl" size="1.3em" />
            </button>
            <span className="cta-hint">
              <span className="pulse" aria-hidden="true" />
              {t('ctaHint')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
