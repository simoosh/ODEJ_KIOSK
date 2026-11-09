import { logoTransform } from './paint';
import { LOGO, LOGO_VIEWBOX, logoGroupAt } from './timeline';

/** Épaisseur du trait qui dessine le logo, en unités du logo (1088 de côté) */
const STROKE = 2.4;

/**
 * Logo vectoriel de l'ODEJ à l'instant `t` (secondes). Remotion le redessine à chaque image ; la borne le dessine une
 * fois puis appelle paintLogo pendant l'animation.
 */
export function OdejLogo({ t, className, title }: { t: number; className?: string; title?: string }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {LOGO.groups.map((g) => {
        const state = logoGroupAt(g.id, t);
        return (
          <path
            key={g.id}
            data-logo={g.id}
            d={g.d}
            fillRule="evenodd"
            fill={g.color}
            fillOpacity={state.fill}
            stroke={g.color}
            strokeWidth={STROKE}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - state.draw}
            // Le trait ne se voit que pendant qu'il avance : une fois rempli, le logo garde sa finesse
            strokeOpacity={state.draw > 0 && state.draw < 1 ? 1 : 0}
            transform={logoTransform(state.scale) || undefined}
          />
        );
      })}
    </svg>
  );
}
