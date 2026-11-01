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

  /** Rotation continue derrière l'accueil */
  orbit: { pitch: 50, degreesPerSecond: 3, flightMs: 2_400 },
  /** Part de l'écran couverte par le voile de l'accueil : la wilaya tourne dans ce qui reste */
  landingVeil: 0.42,
  landingVeilPortrait: 0.5,
  /** Agrandissement de l'emprise du contour pour limiter le centre de la carte, sur chaque côté */
  boundsMargin: 0.15,
  /** Dézoom permis au-delà du cadrage de la wilaya */
  zoomOutMargin: 0.35,
  /** Marge autour de la wilaya dans le cadrage (px) */
  framePadding: 24,
  /** Vue d'un établissement sélectionné */
  focusZoom: 15.4,
  focusPitch: 62,

  maxPitch: 70,
  /** Remplacé dès que le cadrage de la wilaya est connu */
  minZoom: 7,
  /** Limites du centre de la carte tant que le contour n'est pas chargé */
  maxBounds: [
    [3.7, 35.9],
    [6.2, 37.3],
  ] as [[number, number], [number, number]],

  /** Tuiles de relief, relatives à la racine du site */
  /** ?v= à changer à chaque régénération : les tuiles restent 30 jours dans le cache du navigateur */
  terrainTiles: 'terrain/{z}/{x}/{y}.webp?v=3',
  terrainBounds: [4, 35.9, 5.9, 37.1] as [number, number, number, number],
  terrainAttribution:
    'Relief produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. Sports areas © OpenStreetMap contributors',

  /** Au-delà du zoom 18, Esri renvoie un carré « Map data not yet available » : on sur-échantillonne le zoom 17 */
  satelliteSourceMaxZoom: 17,
  satelliteMaxZoom: 18,
  /** Sous ce zoom, Esri passe à une imagerie générique d'une autre couleur : on ne la charge jamais à côté du détail */
  satelliteDetailZoom: 12,
  /** Échecs de tuiles d'affilée avant de passer au fond de secours */
  basemapMaxErrors: 8,
  /** Délai maximal de chargement d'un style (ms) */
  basemapTimeoutMs: 12_000,

  /** Exagération du relief 3D */
  terrainExaggeration: 1,

  /** Délai avant de recharger la page si le contexte WebGL ne revient pas (ms) */
  contextLostReloadMs: 5_000,

  /** Tuiles gardées en mémoire par source */
  maxTileCacheSize: 300,

  /** Brouillard autour de la wilaya, peint au démarrage (map/fog.ts) */
  fog: {
    color: '#EDF1F3',
    rgb: [237, 241, 243],
    /** Zone peinte : emprise du contour agrandie de ce ratio de chaque côté */
    regionMargin: 1,
    /** Largeur du flou autour du contour */
    blurKm: 10,
    /** Couverture à laquelle le brouillard est opaque, puis celle à laquelle il disparaît */
    opaqueAt: 0.03,
    clearAt: 0.22,
    noiseStrength: 0.3,
    shade: 0.22,
  },

  /** Tuiles chargées en arrière-plan sur l'accueil (map/preload.ts) */
  preload: {
    concurrency: 4,
    maxFailures: 5,
    pauseMs: 1_000,
    wilayaMargin: 0.1,
    /** Abords d'un établissement, en degrés (~1,5 km) */
    radiusDegrees: 0.015,
    terrainZooms: [8, 9, 10, 11],
    /** D'abord la vue d'ensemble des deux fonds, puis le détail */
    planZooms: [8, 9, 10, 11],
    satelliteZooms: [9, 10, 11, 12],
    planDetailZooms: [12, 13],
    satelliteDetailZooms: [13],
    aroundPlanZooms: [14],
    aroundSatelliteZooms: [14, 15, 16],
  },
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
