import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Simulateur d'écran pour l'équipe, avec ?sim=1. Absent par défaut, donc sur la borne.
 */
export const SCREEN_PRESETS = [
  { id: 'fit', label: 'Fenêtre', w: 0, h: 0 },
  { id: 'fhd-l', label: 'Paysage 16:9 · 1920×1080', w: 1920, h: 1080 },
  { id: 'fhd-p', label: 'Portrait 9:16 · 1080×1920', w: 1080, h: 1920 },
  { id: 'xga', label: 'Tablette 4:3 · 1024×768', w: 1024, h: 768 },
  { id: 'sxga', label: 'Borne 5:4 · 1280×1024', w: 1280, h: 1024 },
  { id: 'uw', label: 'Ultra-large 21:9 · 2560×1080', w: 2560, h: 1080 },
] as const;

interface Props {
  enabled: boolean;
  children: (size: { w: number; h: number }) => ReactNode;
}

export function ScreenSimulator({ enabled, children }: Props) {
  const [preset, setPreset] = useState<(typeof SCREEN_PRESETS)[number]['id']>('fit');
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled]);

  const p = SCREEN_PRESETS.find((x) => x.id === preset)!;
  const fit = !enabled || p.id === 'fit';
  const w = fit ? stage.w : p.w;
  const h = fit ? stage.h : p.h;
  const pad = fit ? 0 : 24;
  const scale = fit ? 1 : Math.min((stage.w - pad * 2) / w, (stage.h - pad * 2) / h);

  // Taille de base de l'interface, proportionnelle au plus petit côté de l'écran : tout est en rem.
  useEffect(() => {
    if (!w || !h) return;
    const fs = Math.max(14, Math.min(34, Math.min(w, h) * 0.0105 + 7));
    document.documentElement.style.fontSize = `${fs.toFixed(2)}px`;
  }, [w, h]);

  return (
    <div className={`sim ${enabled ? 'is-on' : ''}`}>
      {enabled && (
        <div className="sim-bar" dir="ltr">
          <span className="sim-title">Écran de la borne</span>
          <div className="sim-presets">
            {SCREEN_PRESETS.map((x) => (
              <button key={x.id} type="button" className={x.id === preset ? 'is-on' : ''} onClick={() => setPreset(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          {!fit && <span className="sim-scale">{Math.round(scale * 100)} %</span>}
        </div>
      )}
      <div className="sim-stage" ref={stageRef}>
        <div
          className="sim-screen"
          style={
            fit
              ? { width: '100%', height: '100%' }
              : { width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})`, position: 'absolute', left: '50%', top: '50%' }
          }
        >
          {w > 0 && h > 0 && children({ w, h })}
        </div>
      </div>
    </div>
  );
}
