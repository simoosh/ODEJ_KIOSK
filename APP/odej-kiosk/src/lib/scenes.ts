import { distanceField } from '../map/fog';
import { smoothstep } from './noise';

/** Masque d'opacité réduit d'un paysage détouré : un toucher ne compte que sur le paysage, pas sur son fond transparent. */
export interface AlphaMask {
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
}

const MASK_WIDTH = 96;
const ALPHA_HIT = 128;

/** null si l'image ne se lit pas (média sans en-tête CORS) : le toucher retombe alors sur son cadre. */
export function alphaMask(image: HTMLImageElement): AlphaMask | null {
  const width = MASK_WIDTH;
  const height = Math.max(1, Math.round((MASK_WIDTH * image.naturalHeight) / image.naturalWidth));
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    const alpha = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
    return { width, height, alpha };
  } catch {
    return null;
  }
}

/** Côté du cadre d'un paysage. */
export type Side = 'left' | 'right' | 'top' | 'bottom';

const FEATHER_WIDTH = 256;

/**
 * Distance de chaque pixel au fond transparent le plus proche, en pixels du masque. Le dehors du cadre compte comme
 * transparent, sauf sur les côtés `solid` : ceux qui touchent le bord de l'écran ne s'effacent pas.
 */
export function edgeDistance(alpha: Uint8ClampedArray, width: number, height: number, solid: readonly Side[]) {
  const w = width + 2;
  const h = height + 2;
  const clear = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const side: Side | null = x === 0 ? 'left' : x === w - 1 ? 'right' : y === 0 ? 'top' : y === h - 1 ? 'bottom' : null;
      clear[y * w + x] = side ? Number(!solid.includes(side)) : Number(alpha[(y - 1) * width + (x - 1)] < ALPHA_HIT);
    }
  }
  const padded = distanceField(clear, w, h);
  const field = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) field[y * width + x] = padded[(y + 1) * w + x + 1];
  return field;
}

/**
 * Masque de fondu d'un paysage, en data URL pour mask-image : opaque au cœur, il s'efface lentement jusqu'au bord
 * découpé, sur `reach` (part du petit côté). Le paysage sort de la brume au lieu d'être collé. null si l'image ne se
 * lit pas (CORS) : il reste alors net.
 */
export function featherMask(image: HTMLImageElement, solid: readonly Side[], reach: number): string | null {
  const width = FEATHER_WIDTH;
  const height = Math.max(1, Math.round((FEATHER_WIDTH * image.naturalHeight) / image.naturalWidth));
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    const alpha = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels.data[i * 4 + 3];
    const distance = edgeDistance(alpha, width, height, solid);
    const span = reach * Math.min(width, height);
    for (let i = 0; i < alpha.length; i++) {
      pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255;
      pixels.data[i * 4 + 3] = smoothstep(0, span, distance[i]) * 255;
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** u, v : position dans l'image, de 0 à 1. */
export function maskHit(mask: AlphaMask | null | undefined, u: number, v: number) {
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
  if (!mask) return true;
  return mask.alpha[Math.floor(v * mask.height) * mask.width + Math.floor(u * mask.width)] >= ALPHA_HIT;
}
