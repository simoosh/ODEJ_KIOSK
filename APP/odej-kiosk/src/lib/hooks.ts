import { useEffect, useRef, useState, type RefObject } from 'react';

export function useSize<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Inactivité sur la borne : renvoie le nombre de secondes restantes pendant la phase d'avertissement
 * (null sinon) et appelle onTimeout à zéro.
 */
export function useIdle(active: boolean, timeoutMs: number, warningMs: number, onTimeout: () => void) {
  const last = useRef(Date.now());
  const [left, setLeft] = useState<number | null>(null);
  const cb = useRef(onTimeout);
  cb.current = onTimeout;

  useEffect(() => {
    if (!active) {
      setLeft(null);
      return;
    }
    last.current = Date.now();
    const bump = () => {
      last.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true, capture: true }));
    const id = window.setInterval(() => {
      const remaining = timeoutMs - (Date.now() - last.current);
      if (remaining <= 0) {
        setLeft(null);
        cb.current();
        last.current = Date.now();
      } else if (remaining <= warningMs) {
        setLeft(Math.ceil(remaining / 1000));
      } else {
        setLeft(null);
      }
    }, 250);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
      window.clearInterval(id);
    };
  }, [active, timeoutMs, warningMs]);

  return left;
}
