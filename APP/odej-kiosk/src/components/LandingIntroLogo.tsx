import { useEffect, useRef, type CSSProperties } from 'react';
import { CONFIG } from '../config';
import { SHARDS } from '../logo/burst';
import { OdejLogo } from '../logo/OdejLogo';
import { paintLogo } from '../logo/paint';
import { LOGO_END, LOGO_VIEWBOX } from '../logo/timeline';

/**
 * Grand logo de l'ouverture : il se dessine au-dessus du titre, puis explose en éclats qui s'envolent, et le titre se
 * trace à sa place (LandingTitle part à CONFIG.logoBurstAtMs). Il rejoue à chaque arrivée sur l'accueil et changement
 * de langue, comme tout le contenu de l'accueil. La boucle requestAnimationFrame ne tourne que pendant le dessin ;
 * l'explosion est une transition CSS sur transform et opacity, une seule fois.
 */
export function LandingIntroLogo() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const svg = el?.querySelector<SVGSVGElement>('.intro-draw');
    const parent = el?.offsetParent;
    if (!el || !svg || !parent) return;
    // Mouvement réduit : le CSS le cache, le titre est déjà complet
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Centré sur le titre, son bas aligné sur le bas du titre : il ne couvre pas le texte en dessous
    const title = parent.querySelector('.landing-title')?.getBoundingClientRect();
    const box = parent.getBoundingClientRect();
    const screen = el.closest('.landing')?.getBoundingClientRect();
    if (title && screen) {
      const size = screen.height * CONFIG.logoIntroShare;
      Object.assign(el.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${title.left + title.width / 2 - size / 2 - box.left}px`,
        top: `${title.bottom - size - box.top}px`,
        visibility: 'visible',
      });
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const at = (now - start) / 1000;
        paintLogo(svg, Math.min(at, LOGO_END));
        if (at < LOGO_END) raf = requestAnimationFrame(step);
        else el.classList.add('is-burst');
      };
      raf = requestAnimationFrame(step);
    }, CONFIG.logoDelayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={host} className="intro-logo" aria-hidden="true">
      <OdejLogo t={0} className="intro-draw" />
      {/* Les éclats remplacent le logo dessiné au moment de l'explosion */}
      <svg className="intro-shards" viewBox={LOGO_VIEWBOX}>
        {SHARDS.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill={s.color}
            fillRule="evenodd"
            style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--rot': `${s.rotate}deg` } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
