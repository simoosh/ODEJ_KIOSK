import { useState } from 'react';
import type { KioskData } from '../types';
import { featuredEstablishments, titleOf } from '../data/model';
import { useI18n } from '../i18n/I18n';
import { CONFIG } from '../config';
import { CountUp } from './CountUp';
import { Icon } from './Icon';
import { LandingBand } from './LandingBand';
import { LandingClouds } from './LandingClouds';
import { LandingIntroLogo } from './LandingIntroLogo';
import { LandingLogo } from './LandingLogo';
import { LandingScenes } from './LandingScenes';
import { LandingTitle } from './LandingTitle';

interface Props {
  data: KioskData;
  leaving: boolean;
  portrait: boolean;
  onStart(id?: string): void;
  onToggleLang(): void;
}

export function Landing({ data, leaving, portrait, onStart, onToggleLang }: Props) {
  const { locale, t, tx } = useI18n();
  // Chaque retour sur l'accueil, et chaque changement de langue, redessine son contenu : ses animations d'entrée rejouent
  const [visit, setVisit] = useState(0);
  const [wasLeaving, setWasLeaving] = useState(leaving);
  if (leaving !== wasLeaving) {
    setWasLeaving(leaving);
    if (!leaving) setVisit((v) => v + 1);
  }
  const replay = `${locale}-${visit}`;
  const facts = [
    { value: data.establishments.length, label: t('statEstablishments'), strong: true },
    ...(data.wilaya.facts ?? []).map((f) => ({ value: f.value, label: tx(f.label), strong: false })),
  ];

  const featured = featuredEstablishments(data.establishments)[0];

  return (
    <section className={`landing ${leaving ? 'is-leaving' : ''}`} aria-hidden={leaving}>
      <div className="landing-sky" aria-hidden="true" />
      <LandingBand />
      <LandingScenes leaving={leaving} />
      <div className="landing-haze" aria-hidden="true" />
      <div className="landing-wisp" aria-hidden="true" />
      <LandingClouds portrait={portrait} />

      <div className="landing-inner">
        <header key={`head-${replay}`} className="landing-head">
          <div className="brand">
            {data.organization.logo ? (
              <img className="brand-logo" src={`${import.meta.env.BASE_URL}${data.organization.logo}`} alt="" />
            ) : (
              <LandingLogo />
            )}
            <span className="brand-text">
              <strong>{tx(data.organization.shortName)}</strong>
            </span>
          </div>
          <button type="button" className="lang-btn" onClick={onToggleLang}>
            {t('language')}
          </button>
        </header>

        <div key={`body-${replay}`} className="landing-body">
          {!data.organization.logo && <LandingIntroLogo />}
          <LandingTitle leaving={leaving} />
          <p className="landing-lead">{tx(data.organization.intro)}</p>

          <dl className="facts">
            {facts.map((f, i) => (
              <div key={f.label} className={f.strong ? 'is-strong' : ''}>
                <dt>{f.label}</dt>
                <dd>
                  <CountUp value={f.value} run={!leaving} delay={CONFIG.countUpDelayMs + i * CONFIG.countUpStepMs} />
                </dd>
              </div>
            ))}
          </dl>

          <div className="cta-row">
            <button type="button" className="cta" onClick={() => onStart()}>
              <span>{t('cta')}</span>
              <Icon name="arrow" className="flip-rtl" size="1.3em" />
            </button>
            {featured && (
              <button type="button" className="cta-featured" onClick={() => onStart(featured.id)}>
                <Icon name="star" size="1.15em" />
                <span>{t('standInvite', { name: tx(titleOf(featured)) })}</span>
              </button>
            )}
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
