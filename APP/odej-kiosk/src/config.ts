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

/** Vignette de 480 px produite par media:thumbs : thumbs/<nom>-480.webp à côté du dossier de la source. */
export function thumbUrl(src: string): string {
  return src.replace(/\/[^/]+\/([^/]+)\.webp$/, '/thumbs/$1-480.webp');
}

/** Réglages de la borne. Tout ce qui est contenu (textes, établissements) vit dans public/data/odej-bejaia.json. */
export const CONFIG = {
  dataUrl: 'data/odej-bejaia.json',
  mediaIndexUrl: 'media/index.json',
  detailsIndexUrl: 'data/details.json',
  boundaryUrl: 'data/bejaia-boundary.geojson',

  /** Retour automatique à l'accueil après inactivité (ms) */
  idleTimeoutMs: 120_000,
  /** Compte à rebours affiché avant le retour (ms) */
  idleWarningMs: 10_000,

  /** Rotation continue derrière l'accueil. zoomOut : caméra plus haute que le dézoom permis sur la carte */
  orbit: { pitch: 50, degreesPerSecond: 3, flightMs: 2_400, zoomOut: 0.55 },
  /** Haut de la zone où tourne la wilaya sur l'accueil, en part de l'écran */
  landingMapTop: 0.58,
  landingMapTopPortrait: 0.62,

  /**
   * Paysages détourés de l'accueil, dans public/media/landing/ (hors git, publiés avec les médias : docs/MEDIA.md).
   * Leur place à l'écran est dans app.css (.scene-*). Ils composent un tableau : la même place en arabe et en anglais.
   * Dans l'ordre de peinture : le dernier passe au-dessus.
   * clouds : des nuages d'un seul tenant le long des bords du paysage, tracés dans son cadre (0 à 1, ils peuvent en
   * déborder). Ils suivent le paysage sur chaque écran et passent au-dessus de tous les paysages.
   */
  landingScenes: [
    {
      id: 'bottom-left',
      src: 'landing/bottom-left.webp',
      // Tout le bord droit, contre la carte
      clouds: [
        {
          width: 0.3,
          points: [
            [0.6, 0.05],
            [0.8, 0.11],
            [0.88, 0.2],
            [0.92, 0.3],
            [0.96, 0.4],
            [0.99, 0.5],
            [0.99, 0.57],
            [0.94, 0.63],
            [0.84, 0.68],
            [0.73, 0.73],
            [0.79, 0.8],
            [0.86, 0.88],
            [0.91, 0.96],
            [0.93, 1.06],
          ],
        },
      ],
    },
    {
      id: 'bottom-right',
      src: 'landing/bottom-right.webp',
      // Bord extérieur de la mer, contre la carte
      clouds: [
        {
          width: 0.28,
          points: [
            [0.18, -0.04],
            [0.12, 0.06],
            [0.19, 0.12],
            [0.3, 0.18],
            [0.24, 0.25],
            [0.2, 0.33],
            [0.12, 0.43],
            [0.06, 0.54],
            [0.01, 0.6],
            [0.05, 0.66],
            [0.16, 0.72],
            [0.18, 0.82],
            [0.14, 0.9],
            [0.07, 0.97],
            [0.05, 1.06],
          ],
        },
      ],
    },
    {
      id: 'top-left',
      src: 'landing/top-left.webp',
      clouds: [
        // Bord du bas, au-dessus du paysage bas gauche : comble le vide entre les deux. Cœur large, pour un nuage plein
        {
          width: 0.32,
          core: 0.55,
          points: [
            [-0.2, 0.93],
            [0.1, 0.95],
            [0.35, 0.94],
            [0.55, 0.91],
            [0.72, 0.86],
          ],
        },
        // Reste de ciel le long de la falaise, entre elle et le détourage
        {
          width: 0.16,
          core: 0.5,
          points: [
            [0.36, -0.04],
            [0.52, 0.15],
            [0.63, 0.3],
            [0.73, 0.45],
            [0.82, 0.58],
            [0.88, 0.64],
          ],
        },
      ],
    },
    { id: 'top-right', src: 'landing/top-right.webp' },
  ],
  /** Débord du canevas des nuages d'un paysage autour de son cadre, de chaque côté (app.css, .scene-veil canvas) */
  sceneCloudMargin: 0.5,
  /**
   * Ruban de motifs de l'accueil (lib/ribbon.ts), dans un repère étiré sur toute la largeur de l'écran.
   * gap : écart entre les deux ondes, où se posent les motifs. waves : nombre d'ondulations sur la largeur.
   * clouds : nuages gris clair qui dépassent du ruban, [position de 0 à 1, côté : -1 au-dessus, 1 en dessous].
   */
  motifRibbon: {
    width: 1200,
    height: 64,
    amplitude: 10,
    gap: 34,
    waves: 1.5,
    phase: 0.4,
    samples: 96,
    clouds: [
      [0.09, 1],
      [0.3, -1],
      [0.55, 1],
      [0.76, -1],
      [0.95, 1],
    ],
  },
  /** Attente maximale du décodage d'un paysage avant son entrée (ms) */
  sceneDecodeWaitMs: 600,

  /** Nuages de l'accueil (lib/clouds.ts) : des bouffées qui cachent les bords des paysages et le haut de la carte */
  clouds: {
    canvas: [640, 360],
    /** Grilles du bruit, de la plus large à la plus fine : de grandes masses, pas un grain */
    noiseCells: [4, 8, 16, 32],
    /** Part du rayon pleinement opaque, puis effilochage du bord par le bruit */
    core: 0.3,
    tear: 0.6,
    /** Ombre sous chaque bouffée, pour le volume */
    underside: 0.45,
    light: [251, 251, 248],
    shadow: [222, 229, 234],
    /** Centre x, y et taille w, h en part de l'écran. front : plan avant, qui part plus vite à la sortie */
    landscape: [
      { x: 0.16, y: 0.06, w: 0.46, h: 0.16 },
      { x: 0.84, y: 0.05, w: 0.46, h: 0.16 },
      { x: 0.31, y: 0.5, w: 0.2, h: 0.17 },
      { x: 0.37, y: 0.33, w: 0.12, h: 0.22 },
      { x: 0.66, y: 0.42, w: 0.17, h: 0.17 },
      { x: 0.85, y: 0.47, w: 0.32, h: 0.18 },
      { x: 0.2, y: 0.97, w: 0.5, h: 0.2, front: true },
      { x: 0.41, y: 1.02, w: 0.3, h: 0.14, front: true },
      { x: 0.8, y: 0.97, w: 0.5, h: 0.2, front: true },
      { x: 0.6, y: 1.02, w: 0.3, h: 0.14, front: true },
    ],
    portrait: [
      { x: 0.2, y: 0.04, w: 0.6, h: 0.09 },
      { x: 0.8, y: 0.04, w: 0.6, h: 0.09 },
      { x: 0.15, y: 0.25, w: 0.45, h: 0.06 },
      { x: 0.44, y: 0.22, w: 0.3, h: 0.06 },
      { x: 0.85, y: 0.29, w: 0.45, h: 0.06 },
      // Horizon de la carte qui tourne
      { x: 0.12, y: 0.635, w: 0.5, h: 0.07 },
      { x: 0.4, y: 0.65, w: 0.45, h: 0.06 },
      { x: 0.62, y: 0.65, w: 0.45, h: 0.06 },
      { x: 0.9, y: 0.63, w: 0.5, h: 0.07 },
      { x: 0.3, y: 0.82, w: 0.4, h: 0.05 },
      { x: 0.2, y: 0.99, w: 0.7, h: 0.08, front: true },
      { x: 0.8, y: 0.99, w: 0.7, h: 0.08, front: true },
    ],
  },
  /** Durée du recentrement de la caméra après le bouton de l'accueil (ms) */
  enterFlightMs: 3_600,
  /** Agrandissement de l'emprise du contour pour limiter le centre de la carte, sur chaque côté */
  boundsMargin: 0.15,
  /** Dézoom permis au-delà du cadrage de la wilaya */
  zoomOutMargin: 0.35,
  /** Marge autour de la wilaya dans le cadrage (px) */
  framePadding: 24,
  /** Bonus de classement d'un établissement phare dans la recherche */
  featuredSearchBoost: 1.25,
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
  terrainTiles: 'terrain/{z}/{x}/{y}.webp?v=4',
  terrainBounds: [3.8, 35.75, 6.05, 37.3] as [number, number, number, number],
  terrainAttribution:
    'Relief produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. Sports areas © OpenStreetMap contributors',

  /** Au-delà du zoom 18, Esri renvoie un carré « Map data not yet available » : on sur-échantillonne le zoom 17 */
  satelliteSourceMaxZoom: 17,
  satelliteMaxZoom: 18,
  /** Sous ce zoom, Esri passe à une imagerie générique d'une autre couleur : on ne la charge jamais à côté du détail */
  satelliteDetailZoom: 12,
  /** Sous-couche : quelques tuiles suffisent à couvrir la wilaya, le temps que le détail arrive */
  satelliteUnderlayZoom: 9,
  /** Au-delà, le brouillard est opaque : inutile de charger ce que personne ne voit */
  satelliteBounds: [3.8, 35.75, 6.05, 37.3] as [number, number, number, number],
  /** Échecs de tuiles d'affilée avant de passer au fond de secours */
  basemapMaxErrors: 8,
  /** Délai maximal de chargement d'un style (ms) */
  basemapTimeoutMs: 12_000,

  /** Exagération du relief 3D */
  terrainExaggeration: 1,

  /** Glissement minimal dans la visionneuse (px) */
  swipeThreshold: 60,

  /** Délai avant de recharger la page si le contexte WebGL ne revient pas (ms) */
  contextLostReloadMs: 5_000,

  /** Tuiles gardées en mémoire par source */
  maxTileCacheSize: 300,

  /** Brouillard autour de la wilaya, peint au démarrage (map/fog.ts) : il s'épaissit avec la distance au contour */
  fog: {
    color: '#EDF1F3',
    rgb: [237, 241, 243],
    /** Zone peinte : emprise du contour agrandie de ce ratio de chaque côté */
    regionMargin: 1,
    /** Distance au contour où le brouillard commence, puis celle où il devient opaque */
    clearKm: 3,
    opaqueKm: 58,
    noiseStrength: 0.4,
    shade: 0.1,
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
    satelliteZooms: [12],
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
