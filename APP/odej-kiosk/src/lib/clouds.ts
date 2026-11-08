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

/** Bouffées données dans le cadre d'un paysage, ramenées au canevas qui déborde ce cadre de `margin` de chaque côté. */
export function framePuffs(puffs: readonly Puff[], margin: number): Puff[] {
  const span = 1 + 2 * margin;
  return puffs.map((puff) => ({ ...puff, x: (puff.x + margin) / span, y: (puff.y + margin) / span, w: puff.w / span, h: puff.h / span }));
}

export function paintPuffs(canvas: HTMLCanvasElement, puffs: readonly Puff[], width: number, height: number, noises: Uint8ClampedArray[]) {
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
