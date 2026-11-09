import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { useI18n } from '../i18n/I18n';
import { OdejLogo } from '../logo/OdejLogo';
import { paintLogo } from '../logo/paint';
import { LOGO_END } from '../logo/timeline';

/**
 * Logo de l'ODEJ dans l'en-tête de l'accueil : ses traits se dessinent puis l'emblème apparaît. Il rejoue à chaque
 * arrivée sur l'accueil et changement de langue (l'en-tête est alors redessiné). La boucle requestAnimationFrame ne
 * tourne que pendant le dessin.
 */
export function LandingLogo() {
  const { t } = useI18n();
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const svg = host.current?.querySelector('svg');
    if (!svg) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      paintLogo(svg, LOGO_END);
      return;
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const t = (now - start) / 1000;
        paintLogo(svg, Math.min(t, LOGO_END));
        if (t < LOGO_END) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, CONFIG.logoDelayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span ref={host} className="brand-logo is-drawn">
      <OdejLogo t={0} title={t('logoSlot')} />
    </span>
  );
}
