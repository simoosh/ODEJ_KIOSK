import { useId } from 'react';
import { FLAG, fillSpan, INK, NEUTRAL, PARTS, revealRadius, viewBoxOf } from './geometry';
import { fragmentAt, irisOrigin, TITLES, type Fill, type Lang } from './timeline';

/** Épaisseur du trait qui dessine les lettres, en unités du titre (1 em = 100) */
const STROKE = 1.8;

/** Le blanc où « ODEJ » finit et où « Béjaia » commence : un blanc pur, plus clair que le ciel du fond */
const FADE_WHITE = '#ffffff';
const FADES: { fill: Fill; from: string; to: string }[] = [
  { fill: 'fade-green', from: FLAG.green, to: FADE_WHITE },
  { fill: 'fade-red', from: FADE_WHITE, to: FLAG.red },
];
const isFade = (fill: Fill) => fill === 'fade-green' || fill === 'fade-red';

type Layer = 'ink' | 'color' | 'white';

interface Props {
  lang: Lang;
  /** Instant du cycle, en secondes (timeline.ts) */
  t: number;
  /**
   * video : un seul calque, blanc ou en couleurs (Remotion gère le fond et le cercle).
   * landing : encre foncée pendant la reconstruction, puis les couleurs versées par le cercle, sur un fond transparent.
   */
  variant?: 'video' | 'landing';
  /** video seulement : white pour la phase sombre */
  theme?: 'color' | 'white';
  className?: string;
}

/**
 * Titre vectoriel de l'accueil. Chaque lettre est un <path data-frag> : Remotion le redessine à chaque image ; la borne
 * le dessine une fois puis ne change que ses attributs pendant l'animation (paintWordmark).
 */
export function Wordmark({ lang, t, variant = 'video', theme = 'color', className }: Props) {
  const id = useId().replace(/:/g, '');
  const parts = PARTS[lang];
  const [ox, oy] = irisOrigin(TITLES[lang]);
  const fades = FADES.filter((fade) => parts.some((f) => f.fill === fade.fill));
  const layers: Layer[] = variant === 'landing' ? ['ink', 'color'] : [theme];

  const fillOf = (fill: Fill, layer: Layer) => {
    if (layer === 'white') return FLAG.white;
    if (layer === 'ink') return INK;
    if (fill === 'fade-green' || fill === 'fade-red') return `url(#${id}-${fill})`;
    return fill === 'neutral' ? NEUTRAL : FLAG[fill];
  };

  const layer = (kind: Layer) =>
    [false, true].map((faded) => (
      <g key={`${kind}-${String(faded)}`} filter={faded && kind === 'color' ? `url(#${id}-glow)` : undefined}>
        {parts.map((f, i) => {
          if (isFade(f.fill) !== faded) return null;
          const state = fragmentAt(f, i, parts.length, t);
          return (
            // pathLength 1 : le trait avance de 0 à 1 le long du contour, quelle que soit la lettre
            <path
              key={i}
              data-frag={i}
              d={f.d}
              fill={fillOf(f.fill, kind)}
              fillOpacity={state.fill}
              stroke={fillOf(f.fill, kind)}
              strokeWidth={STROKE}
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - state.draw}
              // Trait masqué tant qu'il n'a pas commencé : le bord du tiret laisserait des points
              strokeOpacity={state.draw > 0 ? 1 : 0}
            />
          );
        })}
      </g>
    ));

  return (
    <svg className={className} viewBox={viewBoxOf(lang).join(' ')} overflow="visible" aria-hidden="true">
      <defs>
        {variant === 'landing' && (
          <clipPath id={`${id}-reveal`}>
            <circle data-iris="" cx={ox} cy={oy} r={revealRadius(lang, t)} />
          </clipPath>
        )}
        {fades.length > 0 && layers.includes('color') && (
          <>
            {fades.map(({ fill, from, to }) => {
              const [x0, x1] = fillSpan(lang, fill);
              return (
                <linearGradient
                  key={fill}
                  id={`${id}-${fill}`}
                  gradientUnits="userSpaceOnUse"
                  x1={x0}
                  x2={x1}
                  y1={0}
                  y2={0}
                >
                  <stop offset="0" stopColor={from} />
                  <stop offset="1" stopColor={to} />
                </linearGradient>
              );
            })}
            {/* Halo léger, et une ombre fine pour lire le blanc sur le fond clair */}
            <filter id={`${id}-glow`} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
              <feComponentTransfer in="blur" result="halo">
                <feFuncA type="linear" slope="0.6" />
              </feComponentTransfer>
              <feDropShadow
                in="SourceGraphic"
                dx="0"
                dy="0.6"
                stdDeviation="0.8"
                floodColor={INK}
                floodOpacity="0.32"
                result="edge"
              />
              <feMerge>
                <feMergeNode in="halo" />
                <feMergeNode in="edge" />
              </feMerge>
            </filter>
          </>
        )}
      </defs>
      {layers.map((kind) =>
        kind === 'color' && variant === 'landing' ? (
          <g key={kind} clipPath={`url(#${id}-reveal)`}>
            {layer(kind)}
          </g>
        ) : (
          <g key={kind}>{layer(kind)}</g>
        ),
      )}
      {/* Lueur blanche qui court le long des contours toutes les 5 s (CSS .title-glint), sur l'accueil seulement */}
      {variant === 'landing' && (
        <g className="title-glint">
          {parts.map((f, i) => (
            <path key={i} d={f.d} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" pathLength={1} />
          ))}
        </g>
      )}
    </svg>
  );
}
