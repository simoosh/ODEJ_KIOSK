import { Easing, interpolate, spring } from 'remotion';

/** Courbe douce par défaut : départ franc, arrivée lente. */
export const EASE_OUT = Easing.bezier(0.16, 0.8, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.55, 0, 0.25, 1);

/** 0 → 1 entre `start` et `start + duration` (en images), bloqué aux deux bouts. */
export function progress(frame: number, start: number, duration: number, easing = EASE_OUT) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** Ressort amorti, sans rebond visible : pour les entrées de texte et de formes. */
export function settle(frame: number, fps: number, delay = 0, durationInFrames?: number) {
  return spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames });
}

/** Retard de l'élément `index` d'une série qui entre l'un après l'autre. */
export const stagger = (index: number, step: number, offset = 0) => offset + index * step;

/** Fondu de sortie sur les `duration` dernières images d'une séquence de `total` images. */
export function fadeOut(frame: number, total: number, duration: number) {
  return interpolate(frame, [total - duration, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
