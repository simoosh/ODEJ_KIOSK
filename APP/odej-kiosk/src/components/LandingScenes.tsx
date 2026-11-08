import { useRef, useState, type PointerEvent } from 'react';
import { CONFIG, mediaUrl } from '../config';
import { alphaMask, maskHit, type AlphaMask } from '../lib/scenes';

/**
 * Paysages détourés de l'accueil (CONFIG.landingScenes). Un toucher fait briller le bord du paysage touché.
 * dir="ltr" : c'est un tableau composé, chaque paysage garde sa place en arabe.
 */
export function LandingScenes({ leaving }: { leaving: boolean }) {
  const [lit, setLit] = useState<string | null>(null);
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());
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

  return (
    <div className="scenes" dir="ltr" aria-hidden="true" onPointerUp={onPointerUp}>
      {scenes.map(({ id, src }) => (
        <img
          key={id}
          ref={(image) => {
            if (image) images.current.set(id, image);
            else images.current.delete(id);
          }}
          className={`scene scene-${id}${lit === id ? ' is-lit' : ''}`}
          src={mediaUrl(src)}
          alt=""
          crossOrigin="anonymous"
          decoding="async"
          draggable={false}
          onLoad={(event) => masks.current.set(id, alphaMask(event.currentTarget))}
          onError={() => setMissing((prev) => new Set(prev).add(id))}
        />
      ))}
    </div>
  );
}
