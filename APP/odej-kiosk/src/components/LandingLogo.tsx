import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { useI18n } from '../i18n/I18n';
import { OdejLogo } from '../logo/OdejLogo';
import { paintLogo } from '../logo/paint';
import { LOGO_END } from '../logo/timeline';

/** Moment où le logo a fini de se dessiner et part vers son coin : le titre commence alors son tracé (ms). */
export const LOGO_DONE_MS = CONFIG.logoDelayMs + LOGO_END * 1000;

/**
 * Logo de l'ODEJ. À chaque arrivée sur l'accueil et changement de langue (l'en-tête est alors redessiné), il se dessine
 * en grand à la place du titre, puis glisse en rapetissant vers sa place dans l'en-tête, pendant que le titre se trace.
 * Le vol est une transition CSS sur transform ; la boucle requestAnimationFrame ne tourne que pendant le dessin.
 */
export function LandingLogo() {
  const { t } = useI18n();
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = host.current;
    const svg = el?.querySelector('svg');
    if (!el || !svg) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      paintLogo(svg, LOGO_END);
      return;
    }
    // Départ : centré sur le titre, à CONFIG.logoIntroShare de la hauteur de l'accueil. Mesuré à sa place, sans transform
    el.style.transition = 'none';
    el.style.transform = '';
    const slot = el.getBoundingClientRect();
    const title = el.closest('.landing')?.querySelector('.landing-title')?.getBoundingClientRect();
    const screen = el.closest('.landing')?.getBoundingClientRect();
    if (title && screen && slot.width) {
      const scale = (screen.height * CONFIG.logoIntroShare) / slot.height;
      const dx = title.left + title.width / 2 - (slot.left + slot.width / 2);
      const dy = title.top + title.height / 2 - (slot.top + slot.height / 2);
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const at = (now - start) / 1000;
        paintLogo(svg, Math.min(at, LOGO_END));
        if (at < LOGO_END) {
          raf = requestAnimationFrame(step);
          return;
        }
        // Dessiné : il rejoint sa place en ralentissant
        el.style.transition = `transform ${CONFIG.logoFlyMs}ms cubic-bezier(0.55, 0, 0.2, 1)`;
        el.style.transform = '';
      };
      raf = requestAnimationFrame(step);
    }, CONFIG.logoDelayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      el.style.transition = 'none';
      el.style.transform = '';
    };
  }, []);

  return (
    <span ref={host} className="brand-logo is-drawn">
      <OdejLogo t={0} title={t('logoSlot')} />
    </span>
  );
}
