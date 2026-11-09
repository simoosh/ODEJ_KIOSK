import { AbsoluteFill } from 'remotion';
import { COLORS } from '../theme';

/** Fond clair de l'accueil : ciel bleu en haut qui pâlit vers le bas. */
export function Sky() {
  return <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${COLORS.sky} 0%, ${COLORS.skyPale} 45%, ${COLORS.paper} 100%)` }} />;
}
