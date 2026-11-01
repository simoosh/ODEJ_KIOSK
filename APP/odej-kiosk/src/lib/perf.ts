/** Mesures de performance, pour le panneau ?debug=1 et le scénario de docs/PERF.md. */
export const perfCounters = { renders: 0, preloaded: 0 };

export interface FrameStats {
  frames: number;
  medianFps: number;
  p5Fps: number;
  meanMs: number;
}

/** Durées entre deux frames (ms) vers FPS médian et FPS au 5e centile : le 5e centile est porté par les frames les plus lentes. */
export function frameStats(deltasMs: number[]): FrameStats {
  if (deltasMs.length === 0) return { frames: 0, medianFps: 0, p5Fps: 0, meanMs: 0 };
  const sorted = [...deltasMs].sort((a, b) => a - b);
  const at = (ratio: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    frames: sorted.length,
    medianFps: round(1000 / at(0.5)),
    p5Fps: round(1000 / at(0.95)),
    meanMs: round(sorted.reduce((sum, d) => sum + d, 0) / sorted.length),
  };
}
