import { Composition } from 'remotion';
import { OdejTitle, titleDuration } from './compositions/OdejTitle';
import { Showcase, showcaseDuration } from './compositions/Showcase';
import { VIDEO } from './config';

/** Toutes les compositions du projet. Une nouvelle composition = un fichier dans compositions/ + une entrée ici. */
export function RemotionRoot() {
  const size = { width: VIDEO.width, height: VIDEO.height, fps: VIDEO.fps };
  return (
    <>
      <Composition id="TitleAr" component={OdejTitle} defaultProps={{ lang: 'ar' as const }} durationInFrames={titleDuration(VIDEO.fps)} {...size} />
      <Composition id="TitleEn" component={OdejTitle} defaultProps={{ lang: 'en' as const }} durationInFrames={titleDuration(VIDEO.fps)} {...size} />
      <Composition id="Showcase" component={Showcase} durationInFrames={showcaseDuration(VIDEO.fps)} {...size} />
    </>
  );
}
