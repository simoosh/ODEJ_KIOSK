import type { Establishment, KioskData, Locale, I18nText } from '../types';
import { titleOf } from '../data/model';
import { thumbUrl } from '../config';
import { CATEGORY_ICONS, UI_ICONS, svgString } from '../components/icons';

/** Durée de la fermeture de la fenêtre (styles/app.css, .mk-card.is-leaving) */
export const CARD_LEAVE_MS = 320;

const text = (value: I18nText | undefined, locale: Locale) => (value ? (value[locale] ?? value.ar ?? '') : '');

/** Image d'aperçu : la couverture, sinon la première photo de la galerie. */
export function previewImage(est: Establishment): string | null {
  const cover = est.media?.cover;
  if (cover && cover.kind !== 'video') return cover.src;
  const photo = est.media?.gallery.find((item) => item.kind !== 'video');
  return photo?.src ?? null;
}

/**
 * Fenêtre flottante du marqueur sélectionné, en DOM : la bulle s'y ouvre en douceur (CSS, une seule fois).
 * Le toucher sur la fenêtre ne descend pas jusqu'à la carte, et `onOpen` affiche la fiche.
 */
export function buildPreviewCard(data: KioskData, est: Establishment, locale: Locale, onOpen: () => void): HTMLElement {
  const category = data.categories.find((c) => c.id === est.category);
  const place = est.placeId ? data.places.find((p) => p.id === est.placeId) : undefined;
  const title = text(titleOf(est), locale);
  const subtitle = [text(category?.label, locale), text(place?.name, locale)].filter(Boolean).join(' · ');

  const root = document.createElement('div');
  root.className = `mk-card${est.featured ? ' is-featured' : ''}`;
  root.dir = locale === 'ar' ? 'rtl' : 'ltr';
  if (category?.color) root.style.setProperty('--c', category.color);

  const body = document.createElement('button');
  body.type = 'button';
  body.className = 'mk-card-body';
  body.setAttribute('aria-label', title);

  const media = document.createElement('span');
  media.className = 'mk-card-media';
  // Icône de la catégorie derrière la photo : elle reste si la photo manque ou ne charge pas
  media.innerHTML = svgString(CATEGORY_ICONS[category?.icon ?? 'star'] ?? CATEGORY_ICONS.star, 40);
  const src = previewImage(est);
  if (src) {
    const img = document.createElement('img');
    let full = false;
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    img.onload = () => img.classList.add('is-loaded');
    img.onerror = () => {
      if (full) img.remove();
      else {
        full = true;
        img.src = src;
      }
    };
    img.src = thumbUrl(src);
    media.append(img);
  }

  const caption = document.createElement('span');
  caption.className = 'mk-card-text';
  const strong = document.createElement('strong');
  strong.textContent = title;
  const small = document.createElement('small');
  small.textContent = subtitle;
  caption.append(strong, small);

  const go = document.createElement('span');
  go.className = 'mk-card-go';
  go.innerHTML = svgString(UI_ICONS.arrow, 20);

  body.append(media, caption, go);
  const tail = document.createElement('span');
  tail.className = 'mk-card-tail';
  root.append(body, tail);

  // La carte ne doit ni glisser ni sélectionner un autre marqueur sous la fenêtre
  for (const type of ['pointerdown', 'mousedown', 'touchstart', 'dblclick', 'wheel']) {
    root.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
  }
  body.addEventListener('click', (e) => {
    e.stopPropagation();
    onOpen();
  });
  return root;
}
