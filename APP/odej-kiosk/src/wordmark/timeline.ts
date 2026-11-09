/**
 * Animation du titre de l'accueil, d'après la référence « Sable » : le titre se replie, se reconstruit morceau par
 * morceau dans le sens de lecture, puis un cercle s'ouvre depuis son dernier point. Tout est une fonction du temps, sans
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
  /** Repli : chaque morceau se ramasse sur lui-même */
  collapse: 0.35,
  /** Vide entre le repli et la reconstruction */
  gap: 0.12,
  /** Fenêtre d'entrée des morceaux, du premier au dernier */
  spread: 0.8,
  /** Durée d'entrée d'un morceau */
  piece: 0.5,
  /** Ouverture du cercle depuis le dernier point */
  iris: 0.5,
  /** Titre complet en fin de cycle */
  rest: 0.9,
} as const;

export const PHASES = (() => {
  const { hold, collapse, gap, spread, piece, iris, rest } = TIMING;
  const assemble = hold + collapse + gap;
  const irisStart = assemble + spread + piece - 0.12;
  return { collapse: hold, assemble, irisStart, irisEnd: irisStart + iris, cycle: irisStart + iris + rest };
})();

type Motion = 'spin' | 'rise' | 'slide' | 'pop';

export interface Fragment {
  /** Mot et morceau d'origine */
  word: number;
  d: string;
  fill: Fill;
  /** Moitié du morceau gardée (null : morceau entier) */
  clip: Box | null;
  motion: Motion;
  /** Point fixe de la rotation ou de l'agrandissement */
  pivot: [number, number];
  /** Sens : +1 ou -1 */
  sign: 1 | -1;
  /** Départ de l'entrée, en secondes depuis le début de la reconstruction */
  delay: number;
}

const MOTIONS: Motion[] = ['spin', 'rise', 'slide', 'spin', 'rise'];

/** Morceaux animés d'un titre : les grands sont coupés en deux moitiés qui arrivent chacune à leur façon. */
export function fragments(title: Title): Fragment[] {
  const pieces = title.words.flatMap((word, w) =>
    word.glyphs.flatMap((g) => g.pieces.map((p) => ({ ...p, word: w, fill: word.fill }))),
  );
  const largest = Math.max(...pieces.map((p) => p.area));
  const list: Omit<Fragment, 'delay'>[] = [];
  pieces.forEach((p, i) => {
    const [x0, y0, x1, y1] = p.box;
    if (p.area < largest * 0.04) {
      list.push({
        word: p.word,
        d: p.d,
        fill: p.fill,
        clip: null,
        motion: 'pop',
        pivot: [(x0 + x1) / 2, (y0 + y1) / 2],
        sign: 1,
      });
      return;
    }
    const wide = x1 - x0 >= (y1 - y0) * 0.7;
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const seam = 0.6;
    const halves: [Box, [number, number]][] = wide
      ? [
          [
            [x0 - 1, y0 - 1, mx + seam, y1 + 1],
            [mx, y1],
          ],
          [
            [mx - seam, y0 - 1, x1 + 1, y1 + 1],
            [mx, y1],
          ],
        ]
      : [
          [
            [x0 - 1, y0 - 1, x1 + 1, my + seam],
            [mx, my],
          ],
          [
            [x0 - 1, my - seam, x1 + 1, y1 + 1],
            [mx, my],
          ],
        ];
    halves.forEach(([clip, pivot], h) => {
      list.push({
        word: p.word,
        d: p.d,
        fill: p.fill,
        clip,
        motion: MOTIONS[(i * 2 + h) % MOTIONS.length],
        pivot,
        sign: (i + h) % 2 ? 1 : -1,
      });
    });
  });
  // Sens de lecture : de droite à gauche en arabe
  const center = (f: Omit<Fragment, 'delay'>) => (f.clip ? (f.clip[0] + f.clip[2]) / 2 : f.pivot[0]);
  const order = [...list].sort((a, b) => (title.dir === 'rtl' ? center(b) - center(a) : center(a) - center(b)));
  // Dans l'ordre de lecture, mais pas un par un : un écart fixe par morceau mêle les entrées sur toute la largeur
  const jitter = (i: number) => (((i * 37) % 11) / 10 - 0.5) * 0.3;
  return order.map((f, i) => ({
    ...f,
    delay: Math.min(
      TIMING.spread,
      Math.max(0, (order.length > 1 ? (i / (order.length - 1)) * TIMING.spread : 0) + jitter(i)),
    ),
  }));
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (u: number) => 1 - (1 - u) ** 3;
const easeIn = (u: number) => u * u * u;
/** Dépassement léger puis retour : l'arrivée des points */
const easeBack = (u: number) => 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2;

export interface FrameState {
  transform: string;
  opacity: number;
}

const FULL: FrameState = { transform: '', opacity: 1 };
const GONE: FrameState = { transform: 'scale(0)', opacity: 0 };

const around = ([px, py]: [number, number], inner: string) =>
  `translate(${px.toFixed(1)} ${py.toFixed(1)}) ${inner} translate(${(-px).toFixed(1)} ${(-py).toFixed(1)})`;

/** État d'un morceau à l'instant `t` du cycle (secondes). */
export function fragmentAt(f: Fragment, index: number, count: number, t: number): FrameState {
  const { collapse, assemble } = PHASES;
  if (t < collapse) return FULL;
  if (t < assemble) {
    // Repli, du dernier morceau au premier
    const start = collapse + ((count - 1 - index) / Math.max(1, count - 1)) * (TIMING.collapse * 0.45);
    const u = easeIn(clamp((t - start) / (TIMING.collapse * 0.55)));
    if (u >= 1) return GONE;
    return {
      transform: around(f.pivot, `rotate(${(f.sign * 70 * u).toFixed(1)}) scale(${(1 - u).toFixed(3)})`),
      opacity: 1 - u * u,
    };
  }
  const u = clamp((t - assemble - f.delay) / TIMING.piece);
  if (u <= 0) return GONE;
  if (u >= 1) return FULL;
  const e = easeOut(u);
  // Les morceaux sont pleins dès leur apparition, comme dans la référence
  const opacity = clamp(u * 8);
  switch (f.motion) {
    case 'pop':
      return { transform: around(f.pivot, `scale(${Math.max(0, easeBack(u)).toFixed(3)})`), opacity };
    case 'spin':
      return {
        transform: around(
          f.pivot,
          `rotate(${(f.sign * 180 * (1 - e)).toFixed(1)}) scale(${(0.15 + 0.85 * e).toFixed(3)})`,
        ),
        opacity,
      };
    case 'rise':
      return { transform: around(f.pivot, `scale(1 ${e.toFixed(3)})`), opacity };
    case 'slide':
      return { transform: `translate(${(f.sign * 110 * (1 - e)).toFixed(1)} 0)`, opacity };
  }
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
