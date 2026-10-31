import { describe, expect, it } from 'vitest';
import { frameStats } from '../../src/lib/perf';

describe('frameStats', () => {
  it('renvoie des zéros sans frame', () => {
    expect(frameStats([])).toEqual({ frames: 0, medianFps: 0, p5Fps: 0, meanMs: 0 });
  });

  it('calcule la médiane et le 5e centile en FPS', () => {
    const deltas = [...Array.from({ length: 95 }, () => 20), ...Array.from({ length: 5 }, () => 100)];
    const stats = frameStats(deltas);
    expect(stats.frames).toBe(100);
    expect(stats.medianFps).toBe(50);
    expect(stats.p5Fps).toBe(10);
    expect(stats.meanMs).toBe(24);
  });
});
