import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { irisAt, irisCloseAt, irisOrigin, PHASES, TITLES, type Lang } from '../../../../APP/odej-kiosk/src/wordmark/timeline';
import { viewBoxOf } from '../../../../APP/odej-kiosk/src/wordmark/geometry';
import { Wordmark } from '../../../../APP/odej-kiosk/src/wordmark/Wordmark';
import { COLORS } from '../theme';

/** Nombre de cycles de la vidéo (la référence boucle) */
export const TITLE_CYCLES = 2;
export const titleDuration = (fps: number) => Math.round(PHASES.cycle * TITLE_CYCLES * fps);

/** Largeur du titre, en part de la largeur de la vidéo */
const WIDTH_SHARE = 0.72;

/**
 * Titre de l'accueil animé comme la référence « Sable » : sur fond clair, il se replie dans un cercle qui se referme ;
 * sur fond sombre, il se reconstruit en blanc ; un cercle part de son dernier point et rend le fond clair et les couleurs.
 */
export function OdejTitle({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) % PHASES.cycle;
  const [vx, vy, vw, vh] = viewBoxOf(lang);
  const w = width * WIDTH_SHARE;
  const h = (w * vh) / vw;
  const left = (width - w) / 2;
  const top = (height - h) / 2;
  const toPx = ([x, y]: [number, number]) => [left + ((x - vx) * w) / vw, top + ((y - vy) * h) / vh];
  const far = Math.hypot(width, height);

  // Cercle du fond clair : fermé vers le centre pendant le repli, rouvert depuis le dernier point à la fin
  let circle: { cx: number; cy: number; r: number };
  if (t < PHASES.collapse) circle = { cx: width / 2, cy: height / 2, r: far };
  else if (t < PHASES.irisStart) circle = { cx: width / 2, cy: height / 2, r: (far / 2) * irisCloseAt(t) };
  else {
    const [cx, cy] = toPx(irisOrigin(TITLES[lang]));
    circle = { cx, cy, r: far * irisAt(t) };
  }

  const mark = (theme: 'color' | 'white') => (
    <div style={{ position: 'absolute', left, top, width: w, height: h }}>
      <Wordmark lang={lang} t={t} theme={theme} />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      {mark('white')}
      <AbsoluteFill style={{ clipPath: `circle(${circle.r.toFixed(1)}px at ${circle.cx.toFixed(1)}px ${circle.cy.toFixed(1)}px)` }}>
        <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${COLORS.sky}, ${COLORS.skyPale} 55%, ${COLORS.paper})` }} />
        {mark('color')}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
