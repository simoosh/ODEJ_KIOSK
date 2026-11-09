// Dessin vectoriel du titre animé de l'accueil (« ديوان مؤسسات الشباب » et « ODEJ of Béjaia »).
// HarfBuzz met le texte en forme (liaisons arabes comprises), puis chaque lettre est découpée en morceaux : son corps
// (avec ses contre-formes) et ses points ou signes. Sortie : APP/odej-kiosk/src/wordmark/glyphs.json, lu par la borne et
// par Remotion. Les polices viennent des paquets @fontsource (licence OFL) : seuls les contours sont écrits.
//
// Police principale : Tajawal ExtraBold, choisie par le propriétaire. « of » : Great Vibes. « Béjaia » : Dancing Script.
// Usage : npm run wordmark
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import * as hb from 'harfbuzzjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = resolve(root, '../../APP/odej-kiosk/src/wordmark/glyphs.json');
const fontsource = (pkg, file) => join(root, 'node_modules/@fontsource', pkg, 'files', file);

/** WOFF 1 → police OpenType brute (les paquets @fontsource ne livrent que du WOFF). */
function woffToSfnt(woff) {
  if (woff.toString('latin1', 0, 4) !== 'wOFF') return woff;
  const numTables = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const at = 44 + i * 20;
    const [offset, compLength, origLength] = [woff.readUInt32BE(at + 4), woff.readUInt32BE(at + 8), woff.readUInt32BE(at + 12)];
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({ tag: woff.subarray(at, at + 4), checksum: woff.readUInt32BE(at + 16), data: compLength < origLength ? inflateSync(raw) : raw });
  }
  const head = Buffer.alloc(12 + 16 * numTables);
  woff.copy(head, 0, 4, 8);
  head.writeUInt16BE(numTables, 4);
  let offset = head.length;
  const chunks = [head];
  tables.forEach((table, i) => {
    const at = 12 + i * 16;
    table.tag.copy(head, at);
    head.writeUInt32BE(table.checksum, at + 4);
    head.writeUInt32BE(offset, at + 8);
    head.writeUInt32BE(table.data.length, at + 12);
    const padded = Buffer.alloc((table.data.length + 3) & ~3);
    table.data.copy(padded);
    chunks.push(padded);
    offset += padded.length;
  });
  return Buffer.concat(chunks);
}

function loadFont(file) {
  const data = woffToSfnt(readFileSync(file));
  const face = new hb.Face(new hb.Blob(data.buffer.slice(data.byteOffset, data.byteOffset + data.length)));
  return { font: new hb.Font(face), upem: face.upem, file };
}

const FONTS = {
  mainAr: loadFont(fontsource('tajawal', 'tajawal-arabic-800-normal.woff')),
  mainLat: loadFont(fontsource('tajawal', 'tajawal-latin-800-normal.woff')),
  script: loadFont(fontsource('great-vibes', 'great-vibes-latin-400-normal.woff')),
  cursive: loadFont(fontsource('dancing-script', 'dancing-script-latin-700-normal.woff')),
};

/** Les deux titres, mot par mot. size : en em de la police principale. fill : rôle de couleur (Wordmark.tsx). */
const TITLES = {
  ar: {
    dir: 'rtl',
    words: [
      { text: 'ديوان', font: 'mainAr', size: 1, fill: 'green' },
      { text: 'مؤسسات', font: 'mainAr', size: 1, fill: 'green' },
      { text: 'الشباب', font: 'mainAr', size: 1, fill: 'red' },
    ],
  },
  en: {
    dir: 'ltr',
    words: [
      { text: 'O', font: 'mainLat', size: 1, fill: 'red', join: true },
      { text: 'DEJ', font: 'mainLat', size: 1, fill: 'green' },
      { text: 'of', font: 'script', size: 0.62, fill: 'neutral' },
      { text: 'Béjaia', font: 'cursive', size: 0.92, fill: 'flag' },
    ],
  },
};
const SCALE = 100; // 1 em de la police principale = 100 unités
const SPACE = 0.26; // espace entre deux mots, en em

/** Contours d'un chemin SVG absolu (M L Q C Z), transformés. */
function contours(path, transform) {
  const out = [];
  let current = null;
  for (const [, cmd, args] of path.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
    const nums = args.trim() ? args.trim().split(/[\s,]+/).map(Number) : [];
    if (cmd === 'M') out.push((current = { d: [], pts: [] }));
    if (cmd === 'Z') {
      current.d.push('Z');
      continue;
    }
    const pts = [];
    for (let i = 0; i < nums.length; i += 2) pts.push(transform(nums[i], nums[i + 1]));
    current.d.push(cmd + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' '));
    current.pts.push(...pts);
  }
  return out;
}

const area = (pts) => pts.reduce((sum, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length];
  return sum + x * ny - nx * y;
}, 0) / 2;
const bbox = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
const inside = (a, b) => a[0] >= b[0] - 0.5 && a[1] >= b[1] - 0.5 && a[2] <= b[2] + 0.5 && a[3] <= b[3] + 0.5;
const round = (box) => box.map((v) => Math.round(v * 10) / 10);

/** Morceaux d'une lettre : chaque contour extérieur avec les trous qu'il contient. */
function pieces(list) {
  if (!list.length) return [];
  const items = list.map((c) => ({ ...c, area: area(c.pts), box: bbox(c.pts) }));
  const sign = Math.sign(items.reduce((a, b) => (Math.abs(b.area) > Math.abs(a.area) ? b : a)).area);
  const outers = items.filter((c) => Math.sign(c.area) === sign);
  const groups = outers.map((o) => ({ outer: o, holes: [] }));
  for (const hole of items.filter((c) => Math.sign(c.area) !== sign)) {
    const host = groups.filter((g) => inside(hole.box, g.outer.box)).sort((a, b) => Math.abs(a.outer.area) - Math.abs(b.outer.area))[0];
    if (host) host.holes.push(hole);
  }
  return groups.map(({ outer, holes }) => ({
    d: [outer, ...holes].map((c) => c.d.join('')).join(''),
    box: round(outer.box),
    area: Math.round(Math.abs(outer.area)),
  }));
}

function shapeWord(word) {
  const { font, upem } = FONTS[word.font];
  const buffer = new hb.Buffer();
  buffer.addText(word.text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const k = (SCALE * word.size) / upem;
  let pen = 0;
  const glyphs = [];
  buffer.getGlyphInfos().forEach((info, i) => {
    const pos = buffer.getGlyphPositions()[i];
    const x0 = pen + pos.xOffset;
    const y0 = pos.yOffset;
    const list = contours(font.glyphToPath(info.codepoint), (x, y) => [(x0 + x) * k, -(y0 + y) * k]);
    const parts = pieces(list);
    if (parts.length) glyphs.push({ pieces: parts });
    pen += pos.xAdvance;
  });
  return { glyphs, width: pen * k };
}

function layout({ dir, words }) {
  const shaped = words.map((w) => ({ ...w, ...shapeWord(w) }));
  // Ordre visuel de gauche à droite
  const visual = dir === 'rtl' ? [...shaped].reverse() : shaped;
  let x = 0;
  const placed = visual.map((w, i) => {
    const dx = x;
    x += w.width + (w.join || i === visual.length - 1 ? 0 : SPACE * SCALE);
    const shift = (d) => d.replace(/([MLQC])([^MLQCZ]*)/g, (_, c, args) => c + args.trim().split(/\s+/).map((v, j) => (j % 2 ? v : (Number(v) + dx).toFixed(1))).join(' '));
    return {
      text: w.text,
      fill: w.fill,
      glyphs: w.glyphs.map((g) => ({ pieces: g.pieces.map((p) => ({ ...p, d: shift(p.d), box: round([p.box[0] + dx, p.box[1], p.box[2] + dx, p.box[3]]) })) })),
    };
  });
  // Les mots restent dans l'ordre de lecture
  const ordered = dir === 'rtl' ? [...placed].reverse() : placed;
  const boxes = ordered.flatMap((w) => w.glyphs.flatMap((g) => g.pieces.map((p) => p.box)));
  return { dir, box: round([Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))]), words: ordered };
}

const result = {
  font: 'Tajawal ExtraBold',
  ar: layout(TITLES.ar),
  en: layout(TITLES.en),
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result) + '\n');
for (const lang of ['ar', 'en']) {
  const count = result[lang].words.reduce((n, w) => n + w.glyphs.reduce((m, g) => m + g.pieces.length, 0), 0);
  console.log(`wordmark ${lang}: ${result[lang].words.length} mots, ${count} morceaux, boîte ${result[lang].box.join(' ')}`);
}
console.log(`police principale : ${result.font} → ${out}`);
