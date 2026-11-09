/** Mise à jour du logo déjà dessiné, sans React : la borne l'appelle à chaque image pendant le dessin seulement. */
import { LOGO_CENTER, logoGroupAt } from './timeline';

export const logoTransform = (scale: number) =>
  scale === 1 ? '' : `translate(${LOGO_CENTER[0]} ${LOGO_CENTER[1]}) scale(${scale.toFixed(3)}) translate(${-LOGO_CENTER[0]} ${-LOGO_CENTER[1]})`;

export function paintLogo(svg: SVGSVGElement, t: number) {
  svg.querySelectorAll<SVGPathElement>('[data-logo]').forEach((path) => {
    const state = logoGroupAt(path.dataset.logo ?? '', t);
    path.setAttribute('stroke-dashoffset', (1 - state.draw).toFixed(4));
    path.setAttribute('stroke-opacity', state.draw > 0 && state.draw < 1 ? '1' : '0');
    path.setAttribute('fill-opacity', state.fill.toFixed(3));
    const transform = logoTransform(state.scale);
    if (transform) path.setAttribute('transform', transform);
    else path.removeAttribute('transform');
  });
}
