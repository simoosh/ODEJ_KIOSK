import { CONFIG } from '../config';

export interface CarouselPose {
  transform: string;
  opacity: number;
  /** Voile sombre sur les cartes de côté (0 à 1) */
  shade: number;
  z: number;
}

/**
 * Place d'une carte à `o` crans de la photo courante (fractionnaire pendant le glissement).
 * La suivante est du côté où l'on lit : à droite en anglais, à gauche en arabe.
 */
export function carouselPose(o: number, rtl: boolean): CarouselPose {
  const { radius } = CONFIG.carousel;
  const d = rtl ? -1 : 1;
  const a = Math.min(Math.abs(o), radius);
  const s = Math.sign(o);
  const near = Math.min(a, 1);
  // Au premier cran, la carte glisse de 70 % de sa largeur ; au-delà, elles s'empilent plus serrées.
  // Les cartes de côté regardent le centre : leur bord extérieur vient vers l'avant
  const x = d * s * (near * 70 + Math.max(0, a - 1) * 16);
  return {
    transform: `translate3d(${x.toFixed(2)}%, 0, ${(-a * 7).toFixed(2)}rem) rotateY(${(-d * s * near * 48).toFixed(2)}deg)`,
    opacity: a <= radius - 1 ? 1 : Math.max(0, radius - a),
    shade: Math.min(a, 1.4) * 0.38,
    z: 100 - Math.round(a * 10),
  };
}
