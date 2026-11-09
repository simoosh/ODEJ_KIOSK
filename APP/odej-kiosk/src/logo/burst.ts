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
/** Textes et emblème : chaque forme part entière. Les cercles et arcs ont leurs propres éclats (RING_SHARDS) */
export const SHARDS: Shard[] = LOGO.groups
  .filter((group) => !['outer', 'arcs-red', 'arcs-green', 'inner'].includes(group.id))
  .flatMap((group) => {
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

/** Cercles et arcs : brisés en secteurs, chaque bout de trait part dans sa direction. */
const RING_GROUPS = ['outer', 'arcs-red', 'arcs-green', 'inner'];
const SECTORS = 30;
const VIEW_ORIGIN = 118;

export interface RingShard {
  /** Groupe du logo (son tracé entier, découpé par le secteur) */
  group: string;
  color: string;
  d: string;
  sector: number;
  dx: number;
  dy: number;
  rotate: number;
  /** Point d'appui de la rotation, en px depuis l'origine du viewBox du logo */
  origin: [number, number];
}

/** Secteurs autour du centre du logo : des triangles assez longs pour couvrir tout le logo */
export const WEDGES = Array.from({ length: SECTORS }, (_, s) => {
  const a0 = (s / SECTORS) * Math.PI * 2;
  const a1 = ((s + 1) / SECTORS) * Math.PI * 2;
  const [cx, cy] = LOGO_CENTER;
  const far = 900;
  const pt = (a: number) => `${(cx + Math.cos(a) * far).toFixed(1)},${(cy + Math.sin(a) * far).toFixed(1)}`;
  return `${cx},${cy} ${pt(a0)} ${pt(a1)}`;
});

export const RING_SHARDS: RingShard[] = LOGO.groups
  .filter((g) => RING_GROUPS.includes(g.id))
  .flatMap((group, g) => {
    const box = boxOf(group.d);
    const radius = (box[2] - box[0]) / 2;
    return Array.from({ length: SECTORS }, (_, sector) => {
      const i = g * SECTORS + sector;
      const mid = ((sector + 0.5) / SECTORS) * Math.PI * 2;
      const away = mid + (jitter(i + 3) - 0.5) * 0.9;
      const reach = 200 + jitter(i + 11) * 480;
      const ox = LOGO_CENTER[0] + Math.cos(mid) * radius - VIEW_ORIGIN;
      const oy = LOGO_CENTER[1] + Math.sin(mid) * radius - VIEW_ORIGIN;
      return {
        group: group.id,
        color: group.color,
        d: group.d,
        sector,
        dx: Math.round(Math.cos(away) * reach),
        dy: Math.round(Math.sin(away) * reach),
        rotate: Math.round((jitter(i + 47) - 0.5) * 300),
        origin: [Math.round(ox), Math.round(oy)],
      };
    });
  });
