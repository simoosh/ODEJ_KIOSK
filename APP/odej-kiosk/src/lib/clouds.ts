import { CONFIG } from '../config';
import { canvasContext, fractalNoise, smoothstep } from './noise';

export type CloudSide = 'left' | 'right';

/** Hauteur (0 à 1) jusqu'à laquelle les nuages sont opaques : plus basse au centre, comme un rideau. */
export function cloudEdge(u: number, portrait: boolean) {
  const { side, center } = portrait ? CONFIG.clouds.portrait : CONFIG.clouds.landscape;
  const distance = 2 * u - 1;
  return side + (center - side) * (1 - distance * distance);
}

/** Opacité du nuage en (u, v) : pleine au-dessus du bord, puis elle s'efface vers le bas. */
export function cloudOpacity(u: number, v: number, noise: number, portrait: boolean) {
  const { fade, tear } = CONFIG.clouds;
  return 1 - smoothstep(0, fade, v - cloudEdge(u, portrait) + (noise - 0.5) * tear);
}

/**
 * Le rideau s'ouvre par le milieu : chaque pixel revient à la moitié gauche, à la droite, ou aux deux sur la couture.
 * La droite passe au-dessus : ses opacités sont calculées pour que l'ensemble donne exactement `alpha` au repos.
 */
export function splitOpacity(alpha: number, leftShare: number): [number, number] {
  const left = alpha * leftShare;
  return [left, left >= 1 ? 0 : (alpha - left) / (1 - left)];
}

function leftShareAt(u: number, noise: number) {
  const { seam } = CONFIG.clouds;
  return 1 - smoothstep(0.5 - seam, 0.5 + seam, u + (noise - 0.5) * seam * 3);
}

function paint(canvas: HTMLCanvasElement, side: CloudSide, width: number, height: number, noises: Uint8ClampedArray[], portrait: boolean, wisps: boolean) {
  const ctx = canvasContext(canvas, width, height);
  const image = ctx.createImageData(width, height);
  const [body, detail] = noises;
  const { light, shadow, wispLow, wispHigh, wispDrop } = CONFIG.clouds;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const u = x / width;
      const v = y / height;
      const n = body[i] / 255;
      const m = detail[i] / 255;
      let alpha = cloudOpacity(u, v - (wisps ? wispDrop : 0), n, portrait);
      if (wisps) alpha *= smoothstep(wispLow, wispHigh, m);
      const [left, right] = splitOpacity(alpha, leftShareAt(u, m));
      image.data[i + 3] = (side === 'left' ? left : right) * 255;
      const shade = smoothstep(0.3, 0.75, n * 0.6 + m * 0.4);
      for (let channel = 0; channel < 3; channel++) image.data[i + channel] = shadow[channel] + (light[channel] - shadow[channel]) * shade;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Peint une fois : petite résolution, l'agrandissement CSS ajoute au flou des nuages. */
export function paintClouds(canvases: Record<string, HTMLCanvasElement>, portrait: boolean) {
  const [long, short] = CONFIG.clouds.canvas;
  const [width, height] = portrait ? [short, long] : [long, short];
  const { noiseCells } = CONFIG.clouds;
  const noises = [fractalNoise(width, height, 1962, noiseCells), fractalNoise(width, height, 54, noiseCells)];
  (['left', 'right'] as const).forEach((side) => {
    paint(canvases[`back-${side}`], side, width, height, noises, portrait, false);
    paint(canvases[`front-${side}`], side, width, height, [...noises].reverse(), portrait, true);
  });
}
