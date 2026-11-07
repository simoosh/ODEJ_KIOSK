import type { IconName } from '../types';

/** Contenu SVG (viewBox 0 0 24 24, trait 2). Partagé entre React et les marqueurs DOM de la carte. */
export const CATEGORY_ICONS: Record<IconName, string> = {
  house: '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  bed: '<path d="M3 19V7"/><path d="M3 15h18v4"/><path d="M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="2"/>',
  ball: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 8.6 10l1.3 4h4.2l1.3-4z"/><path d="M12 3.5v4M8.6 10 4.3 9M15.4 10l4.3-1M9.9 14l-2.4 3.8M14.1 14l2.4 3.8"/>',
  atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
  hall: '<path d="M3 9.5 12 4l9 5.5"/><path d="M4 20h16"/><path d="M6 10v10M10 10v10M14 10v10M18 10v10"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  tent: '<path d="M12 4 3 20h18z"/><path d="M12 4v16"/><path d="m9 20 3-6 3 6"/>',
};

export const UI_ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  tiltUp: '<path d="M4 18h16"/><path d="M7 18 10 7h4l3 11"/><path d="m12 3 0 2"/>',
  tiltDown: '<path d="M4 18h16"/><path d="M5 18 8 12h8l3 6"/>',
  rotateLeft: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v4h4"/>',
  rotateRight: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M20 4v4h-4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>',
  orbit: '<ellipse cx="12" cy="13" rx="9" ry="4"/><path d="M12 3v10"/><path d="m9.5 5.5 2.5-2.5 2.5 2.5"/>',
  frame: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  backspace: '<path d="M8 5h12v14H8l-5-7z"/><path d="m11 9 6 6M17 9l-6 6"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M9 10h1M12 10h1M15 10h1M18 10h0M7 14h10"/>',
  facebook: '<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3H12V7a1 1 0 0 1 1-1h2z"/>',
  chevronUp: '<path d="m6 15 6-6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9.5" r="2.3"/><path d="M16.5 14.4A5 5 0 0 1 21 19.5"/>',
  access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 8v6l3.5 5M12 11H7.5M9.2 14.6A4.5 4.5 0 1 0 15 19"/>',
  compass: '<path d="M12 2.5 15 12h-6z" fill="currentColor" stroke="none"/><path d="M12 21.5 9 12h6z"/>',
} as const;

export type UiIconName = keyof typeof UI_ICONS;

export function svgString(inner: string, size = 24) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
