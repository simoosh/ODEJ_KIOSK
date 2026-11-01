import { useEffect, useRef } from 'react';
import { paintClouds } from '../lib/clouds';

const LAYERS = ['back-left', 'back-right', 'front-left', 'front-right'];

/** Nuages de l'accueil : quatre plans qui s'écartent à des vitesses différentes à la sortie (voir .clouds dans app.css). */
export function LandingClouds({ portrait }: { portrait: boolean }) {
  const canvases = useRef<Record<string, HTMLCanvasElement>>({});

  useEffect(() => {
    paintClouds(canvases.current, portrait);
  }, [portrait]);

  return (
    <div className="clouds" aria-hidden="true">
      {LAYERS.map((layer) => (
        <canvas
          key={layer}
          className={`cloud-layer cloud-${layer}`}
          ref={(canvas) => {
            if (canvas) canvases.current[layer] = canvas;
          }}
        />
      ))}
    </div>
  );
}
