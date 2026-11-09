import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';

/** Départ vif, arrivée très lente : le compteur se pose sur sa valeur */
const easeOut = (u: number) => (u >= 1 ? 1 : 1 - 2 ** (-10 * u));

/**
 * Nombre qui monte de 0 à sa valeur, comme un compteur, chaque fois que `run` passe à vrai. Le texte est écrit
 * directement dans le DOM : pas de rendu React à chaque image, et la boucle s'arrête une fois la valeur atteinte.
 */
export function CountUp({ value, run, delay = 0 }: { value: number; run: boolean; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !run) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(value);
      return;
    }
    el.textContent = '0';
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const u = Math.min(1, (now - start) / CONFIG.countUpMs);
        el.textContent = String(Math.round(value * easeOut(u)));
        if (u < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, run, delay]);

  return <span ref={ref}>{value}</span>;
}
