import { useId } from 'react';
import { FLAG, flagSpan, INK, NEUTRAL, PARTS, revealRadius, viewBoxOf } from './geometry';
import { flagShift, fragmentAt, irisOrigin, TITLES, type Fill, type Lang } from './timeline';

/** Épaisseur du trait qui dessine les lettres, en unités du titre (1 em = 100) */
const STROKE = 1.8;

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
  /** Le dégradé de « Béjaia » défile tout seul (SMIL) au lieu de suivre `t` : la borne, sans boucle JavaScript */
  liveFlag?: boolean;
  className?: string;
}

/**
 * Titre vectoriel de l'accueil. Chaque lettre est un <path data-frag> : Remotion le redessine à chaque image ; la borne
 * le dessine une fois puis ne change que ses attributs pendant l'animation (paintWordmark).
 */
export function Wordmark({ lang, t, variant = 'video', theme = 'color', liveFlag = false, className }: Props) {
  const id = useId().replace(/:/g, '');
  const parts = PARTS[lang];
  const [x0, x1] = flagSpan(lang);
  const flagWidth = x1 - x0;
  const [ox, oy] = irisOrigin(TITLES[lang]);
  const flagWord = parts.some((f) => f.fill === 'flag');
  const layers: ('ink' | 'color' | 'white')[] = variant === 'landing' ? ['ink', 'color'] : [theme];

  const fillOf = (fill: Fill, layer: 'ink' | 'color' | 'white') => {
    if (layer === 'white') return FLAG.white;
    if (layer === 'ink') return INK;
    if (fill === 'flag') return `url(#${id}-flag)`;
    return fill === 'neutral' ? NEUTRAL : FLAG[fill];
  };

  const layer = (kind: 'ink' | 'color' | 'white') =>
    [false, true].map((isFlag) => (
      <g key={`${kind}-${String(isFlag)}`} filter={isFlag && kind === 'color' ? `url(#${id}-glow)` : undefined}>
        {parts.map((f, i) => {
          if ((f.fill === 'flag') !== isFlag) return null;
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
        {flagWord && layers.includes('color') && (
          <>
            {/* Rouge, blanc, vert, blanc, rouge : la répétition boucle sans couture et sans passer par le brun */}
            <linearGradient
              id={`${id}-flag`}
              gradientUnits="userSpaceOnUse"
              x1={x0}
              x2={x0 + flagWidth}
              y1={0}
              y2={0}
              spreadMethod="repeat"
              gradientTransform={liveFlag ? undefined : `translate(${(flagShift(t) * flagWidth).toFixed(1)} 0)`}
            >
              <stop offset="0" stopColor={FLAG.red} />
              <stop offset="0.25" stopColor={FLAG.white} />
              <stop offset="0.5" stopColor={FLAG.green} />
              <stop offset="0.75" stopColor={FLAG.white} />
              <stop offset="1" stopColor={FLAG.red} />
              {liveFlag && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  from="0 0"
                  to={`${flagWidth} 0`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
            {/* Halo : le mot flou derrière lui-même, et une ombre légère pour lire le blanc sur un fond clair */}
            <filter id={`${id}-glow`} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur" />
              <feComponentTransfer in="blur" result="halo">
                <feFuncA type="linear" slope="0.7" />
              </feComponentTransfer>
              <feDropShadow
                in="SourceGraphic"
                dx="0"
                dy="0.6"
                stdDeviation="0.8"
                floodColor={INK}
                floodOpacity="0.28"
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
    </svg>
  );
}
