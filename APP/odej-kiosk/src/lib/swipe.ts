import { CONFIG } from '../config';

export type SwipeAction = 'next' | 'previous' | 'close' | null;

/** En arabe, on tourne les pages vers la droite : le suivant vient d'un glissement vers la droite. */
export function swipeAction(dx: number, dy: number, rtl: boolean): SwipeAction {
  const { swipeThreshold } = CONFIG;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) < swipeThreshold) return null;
    return dx > 0 === rtl ? 'next' : 'previous';
  }
  return dy > swipeThreshold ? 'close' : null;
}
