import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { OdejLogo } from '../../../../APP/odej-kiosk/src/logo/OdejLogo';
import { LOGO_END } from '../../../../APP/odej-kiosk/src/logo/timeline';
import { COLORS } from '../theme';

/** Logo tenu complet après son dessin, en secondes */
export const LOGO_HOLD = 1.5;
export const logoDuration = (fps: number) => Math.round((LOGO_END + LOGO_HOLD) * fps);

/** Logo de l'ODEJ qui se dessine : cercles, arcs et textes au trait, puis l'emblème du centre en fondu. */
export function OdejLogoDraw() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const size = height * 0.82;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: `linear-gradient(to bottom, ${COLORS.sky}, ${COLORS.skyPale} 55%, ${COLORS.paper})` }}>
      <div style={{ width: size, height: size }}>
        <OdejLogo t={frame / fps} />
      </div>
    </AbsoluteFill>
  );
}
