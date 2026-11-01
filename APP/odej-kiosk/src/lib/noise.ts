const FINE_CELLS = [96, 48, 24, 12];

export function smoothstep(from: number, to: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** Générateur à graine : le dessin est le même à chaque démarrage. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasContext(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2D indisponible');
  return ctx;
}

/** Bruit fractal (canal rouge) : des grilles aléatoires agrandies et superposées, sans calcul par pixel. */
export function fractalNoise(width: number, height: number, seed: number, cellCounts: readonly number[] = FINE_CELLS) {
  const random = seededRandom(seed);
  const ctx = canvasContext(document.createElement('canvas'), width, height);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  cellCounts.forEach((cells, octave) => {
    const grid = document.createElement('canvas');
    const gridCtx = canvasContext(grid, cells, Math.ceil((cells * height) / width));
    const image = gridCtx.createImageData(grid.width, grid.height);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.floor(random() * 256);
      image.data.set([value, value, value, 255], i);
    }
    gridCtx.putImageData(image, 0, 0);
    ctx.globalAlpha = 0.7 / (octave + 1);
    ctx.drawImage(grid, 0, 0, width, height);
  });
  return ctx.getImageData(0, 0, width, height).data;
}
