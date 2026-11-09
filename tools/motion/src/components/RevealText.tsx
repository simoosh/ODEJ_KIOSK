import type { CSSProperties } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { settle, stagger } from '../lib/animation';

interface Props {
  text: string;
  /** Image de départ de la première unité */
  delay?: number;
  /** Écart entre deux unités, en images */
  step?: number;
  /** Distance de montée, en px */
  rise?: number;
  dir?: 'rtl' | 'ltr';
  style?: CSSProperties;
}

/**
 * Texte qui apparaît mot par mot : chaque mot monte, se dé-floute et s'éclaire. Par mots, jamais par lettres : en arabe
 * les lettres sont liées, les découper casserait leur forme.
 */
export function RevealText({ text, delay = 0, step = 4, rise = 40, dir = 'rtl', style }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <div dir={dir} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.28em', ...style }}>
      {words.map((word, i) => {
        const t = settle(frame, fps, stagger(i, step, delay));
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: 'inline-block',
              opacity: t,
              transform: `translateY(${(1 - t) * rise}px)`,
              filter: `blur(${(1 - t) * 8}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
