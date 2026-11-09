/**
 * Animation du titre de l'accueil : il s'efface, puis chaque lettre se dessine comme à la main dans le sens de lecture
 * (son contour se trace, puis elle se remplit), et un cercle s'ouvre depuis son dernier point (référence « Sable »). Tout est une fonction du temps, sans
 * état : la borne et Remotion (tools/motion) calculent la même image au même instant.
 * Ce module ne dépend ni de React ni de la config de la borne, pour que Remotion puisse l'importer tel quel.
 */
import glyphs from './glyphs.json';

export type Lang = 'ar' | 'en';
export type Fill = 'green' | 'red' | 'neutral' | 'flag';
type Box = [number, number, number, number];

interface Piece {
  d: string;
  box: Box;
  area: number;
}
interface Word {
  text: string;
  fill: Fill;
  glyphs: { pieces: Piece[] }[];
}
export interface Title {
  dir: 'rtl' | 'ltr';
  box: Box;
  words: Word[];
}

export const TITLES = glyphs as unknown as { font: string; ar: Title; en: Title };

/** Déroulé d'un cycle, en secondes. */
export const TIMING = {
  /** Titre complet au début du cycle */
  hold: 0.4,
  /** Effacement : le remplissage s'en va, puis le trait se retire */
  collapse: 0.5,
  /** Vide entre l'effacement et le tracé */
  gap: 0.15,
  /** Fenêtre de départ des lettres, de la première à la dernière */
  spread: 1.1,
  /** Tracé d'une lettre, contour puis remplissage */
  piece: 0.8,
  /** Ouverture du cercle depuis le dernier point */
  iris: 0.5,
  /** Titre complet en fin de cycle */
  rest: 0.9,
} as const;

export const PHASES = (() => {
  const { hold, collapse, gap, spread, piece, iris, rest } = TIMING;
  const assemble = hold + collapse + gap;
  const irisStart = assemble + spread + piece - 0.1;
  return { collapse: hold, assemble, irisStart, irisEnd: irisStart + iris, cycle: irisStart + iris + rest };
})();

export interface Fragment {
  /** Mot d'origine */
  word: number;
  /** Contour de la lettre (ou de son point, de son accent) */
  d: string;
  fill: Fill;
  /** Centre horizontal, pour l'ordre de lecture */
  cx: number;
  /** Départ du tracé, en secondes depuis le début de la reconstruction */
  delay: number;
}

/** Lettres et signes d'un titre, dans l'ordre où la main les trace : de droite à gauche en arabe. */
export function fragments(title: Title): Fragment[] {
  const list = title.words.flatMap((word, w) =>
    word.glyphs.flatMap((g) =>
      g.pieces.map((p) => ({ word: w, d: p.d, fill: word.fill, cx: (p.box[0] + p.box[2]) / 2 })),
    ),
  );
  const order = [...list].sort((a, b) => (title.dir === 'rtl' ? b.cx - a.cx : a.cx - b.cx));
  return order.map((f, i) => ({ ...f, delay: order.length > 1 ? (i / (order.length - 1)) * TIMING.spread : 0 }));
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const easeOut = (u: number) => 1 - (1 - u) ** 3;
const easeIn = (u: number) => u * u * u;

export interface FrameState {
  /** Part du contour déjà tracée, de 0 à 1 */
  draw: number;
  /** Opacité du remplissage */
  fill: number;
}

/** Part du tracé d'une lettre consacrée au contour ; le remplissage vient ensuite */
const OUTLINE = 0.65;

/** État d'une lettre à l'instant `t` du cycle (secondes). */
export function fragmentAt(f: Fragment, index: number, count: number, t: number): FrameState {
  const { collapse, assemble } = PHASES;
  if (t < collapse) return { draw: 1, fill: 1 };
  if (t < assemble) {
    // Effacement, de la dernière lettre à la première : le remplissage s'en va, puis le trait se retire
    const span = TIMING.collapse;
    const start = collapse + ((count - 1 - index) / Math.max(1, count - 1)) * span * 0.4;
    const u = clamp((t - start) / (span * 0.6));
    return { draw: 1 - easeInOut(clamp((u - 0.35) / 0.65)), fill: 1 - clamp(u / 0.35) };
  }
  const u = clamp((t - assemble - f.delay) / TIMING.piece);
  return { draw: easeInOut(clamp(u / OUTLINE)), fill: easeOut(clamp((u - OUTLINE * 0.8) / (1 - OUTLINE * 0.8))) };
}

/** Point d'où s'ouvre le cercle : le plus petit morceau du dernier mot, au bout de la lecture. */
export function irisOrigin(title: Title): [number, number] {
  const last = title.words[title.words.length - 1];
  const pieces = last.glyphs.flatMap((g) => g.pieces);
  const small = pieces.filter((p) => p.area < Math.max(...pieces.map((q) => q.area)) * 0.2);
  const pool = small.length ? small : pieces;
  const end = (p: Piece) => (title.dir === 'rtl' ? -p.box[0] : p.box[2]);
  const pick = pool.reduce((a, b) => (end(b) > end(a) ? b : a));
  return [(pick.box[0] + pick.box[2]) / 2, (pick.box[1] + pick.box[3]) / 2];
}

/** Ouverture du cercle, de 0 à 1 (1 hors de l'ouverture : écran déjà révélé). */
export function irisAt(t: number) {
  const { irisStart, irisEnd } = PHASES;
  if (t < irisStart) return 0;
  return easeIn(clamp((t - irisStart) / (irisEnd - irisStart)));
}

/** Fermeture du cercle pendant le repli : de 1 (ouvert) à 0. */
export function irisCloseAt(t: number) {
  const { collapse, assemble } = PHASES;
  return 1 - easeOut(clamp((t - collapse) / (assemble - collapse - TIMING.gap)));
}

/** Décalage du dégradé du drapeau (rouge, blanc, vert), de 0 à 1, en boucle de `period` secondes. */
export const flagShift = (t: number, period = 3) => (((t % period) + period) % period) / period;
