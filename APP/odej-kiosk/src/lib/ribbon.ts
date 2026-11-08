import { CONFIG } from '../config';

/** Ruban de motifs de l'accueil : deux sinusoïdes parallèles dans un repère de RIBBON.width × RIBBON.height. */
export const RIBBON = CONFIG.motifRibbon;

/** Hauteur de la ligne médiane du ruban en t (0 à 1, de gauche à droite) : là où se posent les motifs. */
export function waveY(t: number) {
  const { height, amplitude, waves, phase } = RIBBON;
  return height / 2 + amplitude * Math.sin(2 * Math.PI * waves * t + phase);
}

/** Tracé d'un bord du ruban : side -1 pour le haut, 1 pour le bas. reverse : de droite à gauche, pour fermer le ruban. */
export function ribbonPath(side: -1 | 1, reverse = false) {
  const { width, gap, samples } = RIBBON;
  const steps = Array.from({ length: samples + 1 }, (_, i) => i / samples);
  if (reverse) steps.reverse();
  return steps
    .map((t, i) => `${i ? 'L' : 'M'}${(t * width).toFixed(1)} ${(waveY(t) + (side * gap) / 2).toFixed(2)}`)
    .join(' ');
}
