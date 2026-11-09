// Logo animé de l'ODEJ : découpe le SVG du logo (vectorisé automatiquement, très lourd) en groupes animables et
// l'allège. Sortie : APP/odej-kiosk/src/logo/logo.json, lu par la borne et par Remotion.
// Groupes : anneau extérieur, arcs rouges et verts, anneau intérieur, texte du haut, texte du bas, emblème du centre.
//
// Usage : npm run logo -- "<chemin du SVG>"   (le SVG source reste hors du dépôt)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../../APP/odej-kiosk/src/logo/logo.json');
const input = process.argv[2];
if (!input) {
  console.error('logo : donner le chemin du SVG du logo');
  process.exit(1);
}
const svg = readFileSync(input, 'utf8');
const size = Number(svg.match(/viewBox="0 0 ([\d.]+)/)?.[1] ?? 1088);

/** Tolérance de simplification, en unités du logo (1088 de côté) */
const TOLERANCE = 0.35;
/** Taches de vectorisation ignorées : plus petites que ça, en unités */
const SPECK = 5;

/** Points d'un sous-chemin M … Q … Z (les extrémités des courbes, très serrées dans ce fichier). */
function points(sub) {
  const nums = sub.match(/-?[\d.]+/g).map(Number);
  const pts = [[nums[0], nums[1]]];
  // Q cx cy x y : on garde l'extrémité
  for (let i = 2; i + 3 < nums.length; i += 4) pts.push([nums[i + 2], nums[i + 3]]);
  return pts;
}

/** Ramer-Douglas-Peucker sur une ligne ouverte */
function simplifyOpen(pts) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1;
    let at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
      if (d > far) [far, at] = [d, i];
    }
    if (far > TOLERANCE) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Ligne fermée : coupée au point le plus loin du départ, chaque moitié simplifiée à part (sinon tout s'efface) */
function simplify(pts) {
  let far = 0;
  pts.forEach(([x, y], i) => {
    if (Math.hypot(x - pts[0][0], y - pts[0][1]) > Math.hypot(pts[far][0] - pts[0][0], pts[far][1] - pts[0][1])) far = i;
  });
  if (far === 0) return pts;
  return [...simplifyOpen(pts.slice(0, far + 1)), ...simplifyOpen(pts.slice(far)).slice(1)];
}

const box = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
const fmt = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;

const subpaths = [...svg.matchAll(/<path fill="([^"]+)"[^>]*d="([^"]+)"/g)].flatMap(([, fill, d]) =>
  d
    .split(/(?=M)/)
    .map((s) => points(s))
    .filter((pts) => {
      const [x0, y0, x1, y1] = box(pts);
      return Math.max(x1 - x0, y1 - y0) >= SPECK;
    })
    .map((pts) => ({ fill, pts: simplify(pts), box: box(pts) })),
);

// Centre et rayon de l'anneau intérieur : le cercle brun moyen
const brown = subpaths.filter((s) => s.fill === '#ae662e');
const width = (s) => s.box[2] - s.box[0];
const outer = brown.filter((s) => width(s) > size * 0.7);
const inner = brown.filter((s) => !outer.includes(s) && width(s) > size * 0.38);
const [ix0, iy0, ix1, iy1] = inner[0].box;
const [cx, cy, r] = [(ix0 + ix1) / 2, (iy0 + iy1) / 2, (ix1 - ix0) / 2];
// Dans l'anneau intérieur : le centre du morceau y est (les textes sont tous dehors)
const insideInner = (s) => Math.hypot((s.box[0] + s.box[2]) / 2 - cx, (s.box[1] + s.box[3]) / 2 - cy) < r;
const rest = brown.filter((s) => !outer.includes(s) && !inner.includes(s));

const groups = [
  { id: 'outer', color: '#ae662e', parts: outer },
  { id: 'arcs-red', color: '#cb2229', parts: subpaths.filter((s) => s.fill === '#cb2229') },
  { id: 'arcs-green', color: '#057339', parts: subpaths.filter((s) => s.fill === '#057339') },
  { id: 'inner', color: '#ae662e', parts: inner },
  { id: 'text-top', color: '#ae662e', parts: rest.filter((s) => !insideInner(s) && s.box[3] < cy) },
  { id: 'text-bottom', color: '#ae662e', parts: rest.filter((s) => !insideInner(s) && s.box[3] >= cy) },
  { id: 'emblem', color: '#ae662e', parts: rest.filter(insideInner) },
].map(({ id, color, parts }) => ({
  id,
  color,
  // De gauche à droite et de haut en bas : l'ordre dans lequel le trait parcourt le groupe
  d: [...parts].sort((a, b) => a.box[0] - b.box[0]).map((s) => fmt(s.pts)).join(''),
}));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ size, groups }) + '\n');
const kb = (JSON.stringify({ groups }).length / 1024).toFixed(0);
console.log(`logo : ${groups.map((g) => `${g.id} ${g.d.split('M').length - 1}`).join(', ')} ; ${kb} Kio → ${out}`);
