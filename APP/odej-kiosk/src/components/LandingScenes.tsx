import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { CONFIG, mediaUrl } from '../config';
import { paintBands, type CloudBand } from '../lib/clouds';
import { fractalNoise } from '../lib/noise';
import { alphaMask, featherMask, maskHit, type AlphaMask } from '../lib/scenes';

type Scene = (typeof CONFIG.landingScenes)[number];
const featherOf = (scene: Scene): number => ('feather' in scene ? scene.feather : CONFIG.sceneFeather);
const cloudsOf = (scene: Scene): readonly CloudBand[] => ('clouds' in scene ? scene.clouds : []);

/** Nuages accrochés à un paysage : peints une fois, à la taille de son cadre agrandi de CONFIG.sceneCloudMargin. */
function SceneCloud({ bands }: { bands: readonly CloudBand[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = canvas.current;
    const box = target?.getBoundingClientRect();
    if (!target || !box?.width) return;
    const width = 320;
    const height = Math.max(1, Math.round((width * box.height) / box.width));
    const { noiseCells } = CONFIG.clouds;
    paintBands(target, bands, CONFIG.sceneCloudMargin, width, height, [
      fractalNoise(width, height, 7, noiseCells),
      fractalNoise(width, height, 1871, noiseCells),
    ]);
  }, [bands]);

  return <canvas ref={canvas} />;
}

/**
 * Paysages détourés de l'accueil (CONFIG.landingScenes). Chacun entre en glissant depuis son côté, une fois décodé.
 * Leurs bords découpés s'effacent lentement (featherMask) : ils sortent de la brume au lieu d'être collés.
 * Un toucher fait briller le bord du paysage touché. dir="ltr" : c'est un tableau composé, chaque paysage garde sa
 * place en arabe.
 */
export function LandingScenes({ leaving }: { leaving: boolean }) {
  const [lit, setLit] = useState<string | null>(null);
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());
  // Paysages décodés, avec leur rapport largeur / hauteur
  const [arrived, setArrived] = useState<ReadonlyMap<string, number>>(new Map());
  const [wasLeaving, setWasLeaving] = useState(leaving);
  // Masques de fondu des bords, calculés une fois par paysage
  const [feathers, setFeathers] = useState<ReadonlyMap<string, string>>(new Map());
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
      return maskHit(
        masks.current.get(id),
        (event.clientX - box.left) / box.width,
        (event.clientY - box.top) / box.height,
      );
    });
    setLit(hit?.id ?? null);
  };

  const onLoad = (scene: Scene, image: HTMLImageElement) => {
    const { id, solid } = scene;
    masks.current.set(id, alphaMask(image));
    const feather = featherMask(image, solid, featherOf(scene));
    if (feather) setFeathers((prev) => new Map(prev).set(id, feather));
    const arrive = () =>
      setArrived((prev) => (prev.has(id) ? prev : new Map(prev).set(id, image.naturalWidth / image.naturalHeight)));
    // Décodée avant d'entrer, pour un glissement sans à-coup. Un onglet en arrière-plan ne décode pas : on n'attend pas plus
    image.decode().then(arrive, arrive);
    window.setTimeout(arrive, CONFIG.sceneDecodeWaitMs);
  };

  const fade = (id: string): CSSProperties | undefined => {
    const feather = feathers.get(id);
    if (!feather) return undefined;
    const mask = `url(${feather})`;
    return { maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' };
  };

  const frame = (id: string): CSSProperties | undefined => {
    const ratio = arrived.get(id);
    return ratio ? { aspectRatio: ratio } : undefined;
  };

  return (
    <div className="scenes" dir="ltr" aria-hidden="true" onPointerUp={onPointerUp}>
      {scenes.map((scene) => {
        const { id, src } = scene;
        return (
          <div
            key={id}
            className={`scene scene-${id}${arrived.has(id) ? ' is-in' : ''}${lit === id ? ' is-lit' : ''}`}
            style={frame(id)}
          >
            {/* La lueur est sur l'enveloppe : posée sur l'image, le masque de fondu l'effacerait */}
            <div className="scene-art">
              <img
                ref={(image) => {
                  if (image) images.current.set(id, image);
                  else images.current.delete(id);
                }}
                className="scene-img"
                style={fade(id)}
                src={mediaUrl(src)}
                alt=""
                crossOrigin="anonymous"
                decoding="async"
                draggable={false}
                onLoad={(event) => onLoad(scene, event.currentTarget)}
                onError={() => setMissing((prev) => new Set(prev).add(id))}
              />
            </div>
          </div>
        );
      })}
      {/* Les nuages des paysages passent au-dessus de tous les paysages, mais suivent chacun le sien */}
      {scenes.map((scene) => {
        const bands = cloudsOf(scene);
        return bands.length > 0 && arrived.has(scene.id) ? (
          <div key={`${scene.id}-cloud`} className={`scene scene-${scene.id} scene-veil is-in`} style={frame(scene.id)}>
            <SceneCloud bands={bands} />
          </div>
        ) : null;
      })}
    </div>
  );
}
