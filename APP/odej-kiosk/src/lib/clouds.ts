import { CONFIG } from '../config';
import { canvasContext, fractalNoise, smoothstep } from './noise';

/** Bouffée de nuage : centre x, y et taille w, h en part de l'écran. */
export interface Puff {
  x: number;
  y: number;
  w: number;
  h: number;
  front?: boolean;
}

export type CloudLayer = 'back-left' | 'back-right' | 'front-left' | 'front-right';

/** Calque de la bouffée : elle part du côté de son centre, et le plan avant plus vite et plus loin. */
export function puffLayer(puff: Puff): CloudLayer {
  return `${puff.front ? 'front' : 'back'}-${puff.x < 0.5 ? 'left' : 'right'}`;
}

/** Opacité d'une bouffée en (u, v) : pleine au cœur, effilochée par le bruit vers son bord. */
export function puffOpacity(puff: Puff, u: number, v: number, noise: number) {
  const { core, tear } = CONFIG.clouds;
  const dx = (u - puff.x) / (puff.w / 2);
  const dy = (v - puff.y) / (puff.h / 2);
  return 1 - smoothstep(core, 1, Math.hypot(dx, dy) + (noise - 0.5) * tear);
}

type Point = readonly [number, number];

/**
 * Nuage d'un seul tenant qui suit le bord d'un paysage : points dans son cadre (0 à 1), width en part de sa largeur.
 * core : part opaque de sa demi-largeur, CONFIG.clouds.core par défaut.
 */
export interface CloudBand {
  points: readonly Point[];
  width: number;
  core?: number;
}

/** Distance d'un point à une ligne brisée. */
export function polylineDistance(points: readonly Point[], x: number, y: number) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}

/**
 * Peint les nuages des bords d'un paysage sur un canevas qui déborde son cadre de `margin` de chaque côté.
 * Le canevas a les proportions du cadre : la distance se mesure en pixels, la même dans les deux sens.
 * Deux nuages qui se touchent ne font qu'une masse : chaque pixel prend le plus opaque des deux.
 */
export function paintBands(canvas: HTMLCanvasElement, bands: readonly CloudBand[], margin: number, width: number, height: number, noises: Uint8ClampedArray[]) {
  const ctx = canvasContext(canvas, width, height);
  const image = ctx.createImageData(width, height);
  const [body, detail] = noises;
  const { light, shadow, tear, underside } = CONFIG.clouds;
  const span = 1 + 2 * margin;
  const shapes = bands.map((band) => ({
    core: band.core ?? CONFIG.clouds.core,
    points: band.points.map(([x, y]): Point => [((x + margin) / span) * width, ((y + margin) / span) * height]),
    half: ((band.width / span) * width) / 2,
  }));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = body[i] / 255;
      // Le bruit gonfle et creuse le bord : une seule masse aux contours irréguliers
      let alpha = 0;
      for (const { core, points, half } of shapes) {
        alpha = Math.max(alpha, 1 - smoothstep(core, 1, polylineDistance(points, x, y) / half + (n - 0.5) * tear));
      }
      if (alpha <= 0) continue;
      const shade = smoothstep(0.3, 0.75, n * 0.6 + (detail[i] / 255) * 0.4) * (1 - underside * 0.5 * (1 - alpha));
      for (let channel = 0; channel < 3; channel++) image.data[i + channel] = shadow[channel] + (light[channel] - shadow[channel]) * shade;
      image.data[i + 3] = alpha * 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function paintPuffs(canvas: HTMLCanvasElement, puffs: readonly Puff[], width: number, height: number, noises: Uint8ClampedArray[]) {
  const ctx = canvasContext(canvas, width, height);
  const image = ctx.createImageData(width, height);
  const [body, detail] = noises;
  const { light, shadow, underside, tear } = CONFIG.clouds;
  // Seul le cadre de chaque bouffée est parcouru, élargi de ce que le bruit peut ajouter
  const reach = 1 + tear / 2;
  for (const puff of puffs) {
    const x0 = Math.max(0, Math.floor((puff.x - (puff.w / 2) * reach) * width));
    const x1 = Math.min(width, Math.ceil((puff.x + (puff.w / 2) * reach) * width));
    const y0 = Math.max(0, Math.floor((puff.y - (puff.h / 2) * reach) * height));
    const y1 = Math.min(height, Math.ceil((puff.y + (puff.h / 2) * reach) * height));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * width + x) * 4;
        const n = body[i] / 255;
        const alpha = puffOpacity(puff, x / width, y / height, n);
        if (alpha <= 0) continue;
        const below = smoothstep(-0.2, 1, (y / height - puff.y) / (puff.h / 2));
        const shade = smoothstep(0.3, 0.75, n * 0.6 + (detail[i] / 255) * 0.4) * (1 - underside * below);
        // Superposition « par-dessus » : deux bouffées qui se touchent se fondent
        const before = image.data[i + 3] / 255;
        const out = alpha + before * (1 - alpha);
        for (let channel = 0; channel < 3; channel++) {
          const color = shadow[channel] + (light[channel] - shadow[channel]) * shade;
          image.data[i + channel] = (color * alpha + image.data[i + channel] * before * (1 - alpha)) / out;
        }
        image.data[i + 3] = out * 255;
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Peint une fois : petite résolution, l'agrandissement CSS ajoute au flou des nuages. */
export function paintClouds(canvases: Record<string, HTMLCanvasElement>, portrait: boolean) {
  const [long, short] = CONFIG.clouds.canvas;
  const [width, height] = portrait ? [short, long] : [long, short];
  const puffs: readonly Puff[] = portrait ? CONFIG.clouds.portrait : CONFIG.clouds.landscape;
  const { noiseCells } = CONFIG.clouds;
  const noises = [fractalNoise(width, height, 1962, noiseCells), fractalNoise(width, height, 54, noiseCells)];
  for (const [layer, canvas] of Object.entries(canvases)) {
    const own = puffs.filter((puff) => puffLayer(puff) === layer);
    paintPuffs(canvas, own, width, height, layer.startsWith('front') ? [...noises].reverse() : noises);
  }
}
