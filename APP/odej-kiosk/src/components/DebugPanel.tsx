import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Map as MlMap } from 'maplibre-gl';
import type { MapHandle } from '../map/MapView';
import { frameStats, perfCounters, type FrameStats } from '../lib/perf';

interface ScenarioResult extends FrameStats {
  renders: number;
  idleFrames: number;
}

declare global {
  interface Window {
    odejPerf?: { map: MlMap; run(): Promise<ScenarioResult>; idle(): Promise<number> };
  }
}

/** Outil de mesure, jamais affiché au public : les textes restent en dur, hors de i18n/strings.ts. */
function tileCount(map: MlMap): number {
  // API privée : MapLibre n'expose pas le nombre de tuiles chargées
  const style = (map as unknown as { style?: { tileManagers?: Record<string, { getIds(): unknown[] }> } }).style;
  return Object.values(style?.tileManagers ?? {}).reduce((sum, manager) => sum + manager.getIds().length, 0);
}

const wait = (ms: number) => new Promise((done) => window.setTimeout(done, ms));

/** Frames rendues en 3 s sans rien toucher. */
async function idleFrames(map: MlMap): Promise<number> {
  let frames = 0;
  const onRender = () => {
    frames += 1;
  };
  map.on('render', onRender);
  await wait(3000);
  map.off('render', onRender);
  return frames;
}

async function ease(map: MlMap, options: Parameters<MlMap['easeTo']>[0]) {
  map.easeTo({ ...options, duration: 3000, easing: (t) => t });
  await new Promise((done) => map.once('moveend', done));
}

/** Scénario de docs/PERF.md : 3 s de panoramique, 3 s de rotation, 3 s d'inclinaison, puis 3 s sans rien toucher. */
async function runScenario(map: MlMap): Promise<ScenarioResult> {
  map.jumpTo({ center: [5.07, 36.72], zoom: 11, pitch: 60, bearing: 0 });
  await map.once('idle');

  const deltas: number[] = [];
  let last = 0;
  const onRender = () => {
    const now = performance.now();
    if (last) deltas.push(now - last);
    last = now;
  };
  map.on('render', onRender);
  const rendersBefore = perfCounters.renders;
  await ease(map, { center: [4.95, 36.66] });
  await ease(map, { bearing: 60 });
  await ease(map, { pitch: 40 });
  map.off('render', onRender);
  const stats = frameStats(deltas);
  const renders = perfCounters.renders - rendersBefore;

  await map.once('idle');
  return { ...stats, renders, idleFrames: await idleFrames(map) };
}

export default function DebugPanel({ map, quality }: { map: RefObject<MapHandle | null>; quality?: string }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const deltas = useRef<number[]>([]);

  useEffect(() => {
    const instance = map.current?.getMap();
    if (!instance) return;
    let last = 0;
    const onRender = () => {
      const now = performance.now();
      if (last) deltas.current.push(now - last);
      last = now;
    };
    instance.on('render', onRender);
    const id = window.setInterval(() => {
      const { frames, meanMs } = frameStats(deltas.current);
      deltas.current = [];
      const dpr = instance.getPixelRatio().toFixed(2);
      setText(`${frames} fps · ${meanMs} ms · ${tileCount(instance)} tuiles · dpr ${dpr}${quality ? ` · ${quality}` : ''} · ${perfCounters.renders} rendus`);
    }, 1000);
    window.odejPerf = { map: instance, run: () => runScenario(instance), idle: () => idleFrames(instance) };
    return () => {
      instance.off('render', onRender);
      window.clearInterval(id);
      delete window.odejPerf;
    };
  }, [map, quality]);

  return (
    <div className="debug-panel">
      <div>{text}</div>
      <button type="button" onClick={() => void window.odejPerf?.run().then(setResult)}>
        scénario
      </button>
      {result && <pre>{JSON.stringify(result)}</pre>}
    </div>
  );
}
