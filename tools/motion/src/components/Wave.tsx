import { useCurrentFrame } from 'remotion';

interface Props {
  color: string;
  /** Hauteur de la vague en px, du creux à la crête */
  amplitude?: number;
  /** Nombre d'ondulations sur la largeur */
  waves?: number;
  /** Décalage horizontal par image, en part d'une ondulation : la vague avance */
  speed?: number;
  /** Position du bas de la vague, en part de la hauteur de l'image */
  top?: number;
  opacity?: number;
}

/** Vague pleine qui avance, dessinée en SVG : la mer, commune aux paysages de Béjaïa. */
export function Wave({ color, amplitude = 40, waves = 2, speed = 0.01, top = 0.75, opacity = 1 }: Props) {
  const frame = useCurrentFrame();
  const width = 1000;
  const height = 1000;
  const base = top * height;
  const phase = frame * speed * Math.PI * 2;
  const points = Array.from({ length: 81 }, (_, i) => {
    const x = (i / 80) * width;
    const y = base + (amplitude / 2) * Math.sin((i / 80) * waves * Math.PI * 2 + phase);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}>
      <polygon points={`0,${height} ${points.join(' ')} ${width},${height}`} fill={color} />
    </svg>
  );
}
