import { useCurrentFrame, useVideoConfig } from 'remotion';
import { settle } from '../lib/animation';
import { COLORS } from '../theme';

/** Filet vert et blanc du drapeau, qui se trace de droite à gauche. */
export function FlagRule({ delay = 0, width = 160 }: { delay?: number; width?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = settle(frame, fps, delay);
  return (
    <div style={{ display: 'flex', width, height: 8, borderRadius: 4, overflow: 'hidden', transform: `scaleX(${t})`, transformOrigin: 'right' }}>
      <span style={{ flex: 1, background: COLORS.green }} />
      <span style={{ flex: 1, background: '#fff', outline: `1px solid ${COLORS.cloud}` }} />
    </div>
  );
}
