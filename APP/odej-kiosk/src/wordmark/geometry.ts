/** Géométrie et couleurs du titre animé, et sa mise à jour sans React (la borne). Partagé avec tools/motion. */
import { fragmentAt, fragments, irisAt, irisOrigin, PHASES, TITLES, type Lang } from './timeline';

/** Vert et rouge du drapeau algérien. */
export const FLAG = { green: '#006233', red: '#D21034', white: '#ffffff' } as const;
export const NEUTRAL = '#8b918e';
/** Encre du titre pendant sa reconstruction sur l'accueil, avant que le cercle n'y verse les couleurs */
export const INK = '#14211b';

/** Marge autour du titre dans le viewBox, pour le halo et les morceaux qui tournent. */
const PAD = 14;

export const viewBoxOf = (lang: Lang) => {
  const [x0, y0, x1, y1] = TITLES[lang].box;
  return [x0 - PAD, y0 - PAD, x1 - x0 + 2 * PAD, y1 - y0 + 2 * PAD] as const;
};

export const PARTS = { ar: fragments(TITLES.ar), en: fragments(TITLES.en) };

/** Étendue horizontale du mot au dégradé du drapeau : une période du dégradé par mot. */
export function flagSpan(lang: Lang): [number, number] {
  const boxes = TITLES[lang].words
    .filter((w) => w.fill === 'flag')
    .flatMap((w) => w.glyphs.flatMap((g) => g.pieces.map((p) => p.box)));
  if (!boxes.length) return [0, 1];
  return [Math.min(...boxes.map((b) => b[0])), Math.max(...boxes.map((b) => b[2]))];
}

/** Rayon du cercle de couleur sur l'accueil : plein avant la reconstruction, nul pendant, puis ouvert depuis le dernier point. */
export function revealRadius(lang: Lang, t: number) {
  const [vx, vy, vw, vh] = viewBoxOf(lang);
  const [ox, oy] = irisOrigin(TITLES[lang]);
  const far = Math.max(
    ...[
      [vx, vy],
      [vx + vw, vy],
      [vx, vy + vh],
      [vx + vw, vy + vh],
    ].map(([x, y]) => Math.hypot(x - ox, y - oy)),
  );
  if (t < PHASES.assemble) return far;
  return far * irisAt(t);
}

/** Met un titre déjà dessiné à l'instant `t`, sans React : la borne l'appelle à chaque image de l'animation seulement. */
export function paintWordmark(svg: SVGSVGElement, lang: Lang, t: number) {
  const parts = PARTS[lang];
  svg.querySelectorAll<SVGPathElement>('[data-frag]').forEach((path) => {
    const i = Number(path.dataset.frag);
    const state = fragmentAt(parts[i], i, parts.length, t);
    path.setAttribute('stroke-dashoffset', (1 - state.draw).toFixed(4));
    path.setAttribute('fill-opacity', state.fill.toFixed(3));
    path.setAttribute('stroke-opacity', state.draw > 0 ? '1' : '0');
  });
  svg.querySelector('[data-iris]')?.setAttribute('r', revealRadius(lang, t).toFixed(1));
}
