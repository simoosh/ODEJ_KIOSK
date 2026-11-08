import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { CONFIG, mediaUrl } from '../config';
import { paintBand, type CloudBand } from '../lib/clouds';
import { fractalNoise } from '../lib/noise';
import { alphaMask, maskHit, type AlphaMask } from '../lib/scenes';

type Scene = (typeof CONFIG.landingScenes)[number];
const cloudOf = (scene: Scene): CloudBand | undefined => ('clouds' in scene ? scene.clouds : undefined);

/** Nuage accroché à un paysage : peint une fois, à la taille de son cadre agrandi de CONFIG.sceneCloudMargin. */
function SceneCloud({ band }: { band: CloudBand }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = canvas.current;
    const box = target?.getBoundingClientRect();
    if (!target || !box?.width) return;
    const width = 256;
    const height = Math.max(1, Math.round((width * box.height) / box.width));
    const { noiseCells } = CONFIG.clouds;
    paintBand(target, band, CONFIG.sceneCloudMargin, width, height, [
      fractalNoise(width, height, 7, noiseCells),
      fractalNoise(width, height, 1871, noiseCells),
    ]);
  }, [band]);

  return <canvas ref={canvas} />;
}

/**
 * Paysages détourés de l'accueil (CONFIG.landingScenes). Chacun entre en glissant depuis son côté, une fois décodé.
 * Un toucher fait briller le bord du paysage touché. dir="ltr" : c'est un tableau composé, chaque paysage garde sa
 * place en arabe.
 */
export function LandingScenes({ leaving }: { leaving: boolean }) {
  const [lit, setLit] = useState<string | null>(null);
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());
  // Paysages décodés, avec leur rapport largeur / hauteur
  const [arrived, setArrived] = useState<ReadonlyMap<string, number>>(new Map());
  const [wasLeaving, setWasLeaving] = useState(leaving);
  const images = useRef(new Map<string, HTMLImageElement>());
  const masks = useRef(new Map<string, AlphaMask | null>());

  // Le paysage allumé s'éteint quand le visiteur entre dans la carte
  if (leaving !== wasLeaving) {
    setWasLeaving(leaving);
    setLit(null);
  }

  const scenes = CONFIG.landingScenes.filter((scene) => !missing.has(scene.id));

  const onPointerUp = (event: PointerEvent) => {
    // Du dernier peint au premier : le paysage du dessus gagne
    const hit = [...scenes].reverse().find(({ id }) => {
      const image = images.current.get(id);
      if (!image) return false;
      const box = image.getBoundingClientRect();
      return maskHit(masks.current.get(id), (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
    });
    setLit(hit?.id ?? null);
  };

  const onLoad = (id: string, image: HTMLImageElement) => {
    masks.current.set(id, alphaMask(image));
    const arrive = () => setArrived((prev) => (prev.has(id) ? prev : new Map(prev).set(id, image.naturalWidth / image.naturalHeight)));
    // Décodée avant d'entrer, pour un glissement sans à-coup. Un onglet en arrière-plan ne décode pas : on n'attend pas plus
    image.decode().then(arrive, arrive);
    window.setTimeout(arrive, CONFIG.sceneDecodeWaitMs);
  };

  const frame = (id: string): CSSProperties | undefined => {
    const ratio = arrived.get(id);
    return ratio ? { aspectRatio: ratio } : undefined;
  };

  return (
    <div className="scenes" dir="ltr" aria-hidden="true" onPointerUp={onPointerUp}>
      {scenes.map(({ id, src }) => (
        <div key={id} className={`scene scene-${id}${arrived.has(id) ? ' is-in' : ''}${lit === id ? ' is-lit' : ''}`} style={frame(id)}>
          <img
            ref={(image) => {
              if (image) images.current.set(id, image);
              else images.current.delete(id);
            }}
            className="scene-img"
            src={mediaUrl(src)}
            alt=""
            crossOrigin="anonymous"
            decoding="async"
            draggable={false}
            onLoad={(event) => onLoad(id, event.currentTarget)}
            onError={() => setMissing((prev) => new Set(prev).add(id))}
          />
        </div>
      ))}
      {/* Les nuages des paysages passent au-dessus de tous les paysages, mais suivent chacun le sien */}
      {scenes.map((scene) => {
        const band = cloudOf(scene);
        return band && arrived.has(scene.id) ? (
          <div key={`${scene.id}-cloud`} className={`scene scene-${scene.id} scene-veil is-in`} style={frame(scene.id)}>
            <SceneCloud band={band} />
          </div>
        ) : null;
      })}
    </div>
  );
}
