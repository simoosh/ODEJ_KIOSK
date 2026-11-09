import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { LOGO_END } from '../logo/timeline';
import { useI18n } from '../i18n/I18n';
import { PHASES } from '../wordmark/timeline';
import { paintWordmark } from '../wordmark/geometry';
import { Wordmark } from '../wordmark/Wordmark';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Titre de l'accueil, dessiné en vecteurs (src/wordmark) et dont les lettres se dessinent à la main. La boucle
 * requestAnimationFrame ne tourne que pendant une construction (environ 2,5 s), puis s'arrête jusqu'à la suivante.
 */
export function LandingTitle({ leaving }: { leaving: boolean }) {
  const { locale, t } = useI18n();
  const host = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const svg = host.current?.querySelector('svg');
    if (!svg || leaving) return;
    if (reducedMotion()) {
      paintWordmark(svg, locale, PHASES.cycle - 0.01);
      return;
    }
    let raf = 0;
    let timer = 0;
    // Première construction : à partir de rien. Les suivantes : le cycle entier, repli compris
    const play = (from: number, delay: number) => {
      timer = window.setTimeout(() => {
        const start = performance.now();
        const step = (now: number) => {
          const at = from + (now - start) / 1000;
          if (at >= PHASES.irisEnd) {
            paintWordmark(svg, locale, PHASES.irisEnd);
            if (CONFIG.wordmarkRepeatMs > 0) play(PHASES.collapse, CONFIG.wordmarkRepeatMs);
            return;
          }
          paintWordmark(svg, locale, at);
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, delay);
    };
    paintWordmark(svg, locale, PHASES.assemble);
    // Le titre se trace dès que le grand logo, dessiné au-dessus de lui, explose
    play(PHASES.assemble, CONFIG.logoDelayMs + LOGO_END * 1000 + CONFIG.wordmarkDelayMs);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [leaving, locale]);

  return (
    <h1 ref={host} className="landing-title" aria-label={t('landingTitle')}>
      <Wordmark key={locale} lang={locale} t={PHASES.assemble} variant="landing" className="landing-wordmark" />
    </h1>
  );
}
