/** Racine des médias : le CDN si VITE_MEDIA_BASE_URL est défini, sinon le site lui-même. Toujours avec une barre finale. */
export function resolveMediaBase(cdnUrl: string | undefined, baseUrl: string): string {
  const base = cdnUrl || `${baseUrl}media/`;
  return base.endsWith('/') ? base : `${base}/`;
}

export const MEDIA_BASE = resolveMediaBase(import.meta.env.VITE_MEDIA_BASE_URL, import.meta.env.BASE_URL);

/** Seul endroit qui fabrique une URL de média. Tolère l'ancien préfixe media/. */
export function mediaUrl(src: string, base: string = MEDIA_BASE): string {
  return base + src.replace(/^media\//, '');
}

/** Réglages de la borne. Tout ce qui est contenu (textes, établissements) vit dans public/data/odej-bejaia.json. */
export const CONFIG = {
  dataUrl: 'data/odej-bejaia.json',
  mediaIndexUrl: 'media/index.json',
  boundaryUrl: 'data/bejaia-boundary.geojson',

  /** Retour automatique à l'accueil après inactivité (ms) */
  idleTimeoutMs: 120_000,
  /** Compte à rebours affiché avant le retour (ms) */
  idleWarningMs: 10_000,

  /** Tour d'accueil : points de vue au-dessus des terres, regard vers l'intérieur pour éviter la mer */
  tourViewpoints: [
    { center: [4.72, 36.54] as [number, number], zoom: 10.6, pitch: 55, bearing: 60 },
    { center: [4.5, 36.62] as [number, number], zoom: 10.8, pitch: 55, bearing: 150 },
    { center: [5.02, 36.655] as [number, number], zoom: 11.4, pitch: 58, bearing: 345 },
    { center: [5.2, 36.47] as [number, number], zoom: 10.8, pitch: 55, bearing: 200 },
  ],
  /** Durée d'un trajet et pause sur chaque point de vue (ms) */
  tourFlightMs: 16_000,
  tourPauseMs: 3_000,
  /** Agrandissement de l'emprise du contour pour limiter le centre de la carte, sur chaque côté */
  boundsMargin: 0.25,
  /** Marge autour de la wilaya dans le cadrage (px) */
  framePadding: 24,
  /** Vue d'un établissement sélectionné */
  focusZoom: 15.4,
  focusPitch: 62,

  maxPitch: 70,
  minZoom: 7,
  /** Limites du centre de la carte tant que le contour n'est pas chargé */
  maxBounds: [
    [3.7, 35.9],
    [6.2, 37.3],
  ] as [[number, number], [number, number]],

  /** Tuiles de relief, relatives à la racine du site */
  terrainTiles: 'terrain/{z}/{x}/{y}.webp',
  terrainAttribution:
    'Relief produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. Sports areas © OpenStreetMap contributors',

  /** Au-delà du zoom 18, Esri renvoie un carré « Map data not yet available » : on sur-échantillonne le zoom 17 */
  satelliteSourceMaxZoom: 17,
  satelliteMaxZoom: 18,
  /** Échecs de tuiles d'affilée avant de passer au fond de secours */
  basemapMaxErrors: 8,
  /** Délai maximal de chargement d'un style (ms) */
  basemapTimeoutMs: 12_000,

  /** Exagération du relief 3D */
  terrainExaggeration: 1,

  /** Délai avant de recharger la page si le contexte WebGL ne revient pas (ms) */
  contextLostReloadMs: 5_000,

  /** Tuiles gardées en mémoire par source */
  maxTileCacheSize: 150,
  /** Demi-côté de la zone de toucher d'un marqueur (px) : au moins 44 × 44 */
  touchRadius: 22,

  /** Durée de la mesure de FPS après l'entrée sur la carte (ms) */
  qualitySampleMs: 3000,
  /** Sous fpsDown, on descend d'un niveau ; sous fpsLow, directement à low */
  fpsDown: 40,
  fpsLow: 25,
} as const;

export type QualityLevel = 'high' | 'medium' | 'low';

/** Budget GPU par niveau. Le relief n'est activé par défaut qu'en high. */
export const QUALITY: Record<QualityLevel, { maxPixelRatio: number; terrain: boolean }> = {
  high: { maxPixelRatio: 1, terrain: true },
  medium: { maxPixelRatio: 1, terrain: false },
  low: { maxPixelRatio: 0.75, terrain: false },
};

/** Niveau imposé par ?quality=, sinon null : le niveau est alors réglé automatiquement. */
export function forcedQuality(search: string): QualityLevel | null {
  const value = new URLSearchParams(search).get('quality');
  return value === 'high' || value === 'medium' || value === 'low' ? value : null;
}

export function nextQuality(current: QualityLevel, fps: number): QualityLevel {
  if (fps < CONFIG.fpsLow) return 'low';
  if (fps >= CONFIG.fpsDown) return current;
  return current === 'high' ? 'medium' : 'low';
}
