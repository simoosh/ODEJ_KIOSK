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

/** u, v : position dans l'image, de 0 à 1. */
export function maskHit(mask: AlphaMask | null | undefined, u: number, v: number) {
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
  if (!mask) return true;
  return mask.alpha[Math.floor(v * mask.height) * mask.width + Math.floor(u * mask.width)] >= ALPHA_HIT;
}
