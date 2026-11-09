/**
 * Animation du logo de l'ODEJ : les traits se dessinent (cercles, arcs, textes), puis l'emblème du centre apparaît en
 * fondu. Tout est une fonction du temps : la borne et Remotion (tools/motion) calculent la même image.
 * Ce module ne dépend ni de React ni de la config de la borne, pour que Remotion puisse l'importer tel quel.
 */
import logo from './logo.json';

export interface LogoGroup {
  id: string;
  color: string;
  d: string;
}
export const LOGO = logo as { size: number; groups: LogoGroup[] };

/** Cadre du dessin dans le logo (le SVG source a des marges vides) */
export const LOGO_VIEWBOX = '118 118 852 852';
export const LOGO_CENTER: [number, number] = [540, 553];

/** Déroulé de chaque groupe, en secondes : tracé du contour, puis remplissage. L'emblème n'a qu'un fondu. */
const STEPS: Record<string, { draw: [number, number]; fill: [number, number] }> = {
  outer: { draw: [0, 1], fill: [0.6, 1.1] },
  'arcs-red': { draw: [0.25, 1.15], fill: [0.85, 1.3] },
  'arcs-green': { draw: [0.4, 1.25], fill: [0.95, 1.4] },
  inner: { draw: [0.5, 1.3], fill: [1, 1.45] },
  'text-top': { draw: [0.8, 1.7], fill: [1.4, 1.9] },
  'text-bottom': { draw: [0.95, 1.85], fill: [1.55, 2.05] },
  emblem: { draw: [1.5, 1.5], fill: [1.5, 2.3] },
};

/** Fin du dessin complet, en secondes */
export const LOGO_END = 2.3;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const easeOut = (u: number) => 1 - (1 - u) ** 3;
const span = (t: number, [a, b]: [number, number]) => (b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));

export interface LogoState {
  /** Part du contour tracée, de 0 à 1 */
  draw: number;
  /** Opacité du remplissage */
  fill: number;
  /** Agrandissement (l'emblème arrive en grandissant un peu) */
  scale: number;
}

export function logoGroupAt(id: string, t: number): LogoState {
  const step = STEPS[id] ?? STEPS.emblem;
  const fill = easeOut(span(t, step.fill));
  if (id === 'emblem') return { draw: 0, fill, scale: 0.9 + 0.1 * fill };
  return { draw: easeInOut(span(t, step.draw)), fill, scale: 1 };
}
