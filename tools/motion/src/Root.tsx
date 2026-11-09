import { Composition } from 'remotion';
import { Showcase, showcaseDuration } from './compositions/Showcase';
import { VIDEO } from './config';

/** Toutes les compositions du projet. Une nouvelle composition = un fichier dans compositions/ + une entrée ici. */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Showcase"
        component={Showcase}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={showcaseDuration(VIDEO.fps)}
      />
    </>
  );
}
