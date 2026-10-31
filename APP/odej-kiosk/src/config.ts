/** Réglages de la borne. Tout ce qui est contenu (textes, établissements) vit dans public/data/odej-bejaia.json. */
export const CONFIG = {
  dataUrl: 'data/odej-bejaia.json',
  mediaIndexUrl: 'media/index.json',

  /** Retour automatique à l'accueil après inactivité (ms) */
  idleTimeoutMs: 120_000,
  /** Compte à rebours affiché avant le retour (ms) */
  idleWarningMs: 10_000,

  /** Vue « attente » derrière l'accueil : la carte tourne lentement */
  attractCamera: { center: [4.92, 36.6] as [number, number], zoom: 8.3, pitch: 38, bearing: 0 },
  /** Vue d'un établissement sélectionné */
  focusZoom: 15.4,
  focusPitch: 62,

  maxPitch: 80,
  maxBounds: [
    [3.7, 35.9],
    [6.2, 37.3],
  ] as [[number, number], [number, number]],

  /** Exagération du relief 3D */
  terrainExaggeration: 1.35,

  /** Plugin MapLibre pour afficher l'arabe sur la carte (à héberger localement pour le mode hors ligne) */
  rtlTextPluginUrl: 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',
} as const;
