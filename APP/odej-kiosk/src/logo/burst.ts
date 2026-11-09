/** Éclats du logo pour son explosion : chaque forme, avec ses trous, devient un morceau qui part loin du centre. */
import { LOGO, LOGO_CENTER } from './timeline';

export interface Shard {
  d: string;
  color: string;
  /** Déplacement et rotation de l'explosion, en unités du logo et en degrés */
  dx: number;
  dy: number;
  rotate: number;
}

type Box = [number, number, number, number];

/** Pseudo-hasard fixe : la même explosion à chaque fois */
const jitter = (i: number) => (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1;

function boxOf(d: string): Box {
  const nums = d.match(/-?[\d.]+/g)?.map(Number) ?? [];
  const xs = nums.filter((_, k) => k % 2 === 0);
  const ys = nums.filter((_, k) => k % 2 === 1);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const area = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]);
const inside = (a: Box, b: Box) => a !== b && a[0] >= b[0] && a[1] >= b[1] && a[2] <= b[2] && a[3] <= b[3];

let n = 0;
export const SHARDS: Shard[] = LOGO.groups.flatMap((group) => {
  const subs = group.d
    .split(/(?=M)/)
    .filter(Boolean)
    .map((d) => ({ d, box: boxOf(d) }));
  // Un contour contenu dans un autre est son trou (anneaux, intérieur des lettres) : il part avec lui
  const shapes = subs.filter((s) => !subs.some((o) => inside(s.box, o.box)));
  return shapes.map((shape) => {
    const holes = subs.filter((s) => s !== shape && inside(s.box, shape.box));
    const host = holes.filter(
      (h) => !shapes.some((o) => o !== shape && inside(h.box, o.box) && area(o.box) < area(shape.box)),
    );
    const [x0, y0, x1, y1] = shape.box;
    const i = n++;
    const away =
      Math.atan2((y0 + y1) / 2 - LOGO_CENTER[1], (x0 + x1) / 2 - LOGO_CENTER[0]) + (jitter(i + 7) - 0.5) * 0.6;
    const reach = 260 + jitter(i) * 420;
    return {
      d: shape.d + host.map((h) => h.d).join(''),
      color: group.color,
      dx: Math.round(Math.cos(away) * reach),
      dy: Math.round(Math.sin(away) * reach),
      rotate: Math.round((jitter(i + 31) - 0.5) * 220),
    };
  });
});
