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

  /** Retour automatique à l'accueil après inactivité (ms) */
  idleTimeoutMs: 120_000,
  /** Compte à rebours affiché avant le retour (ms) */
  idleWarningMs: 10_000,

  /** Vue « attente » derrière l'accueil : fixe, aucun rendu continu */
  attractCamera: { center: [4.92, 36.6] as [number, number], zoom: 8.3, pitch: 38, bearing: 0 },
  /** Vue d'un établissement sélectionné */
  focusZoom: 15.4,
  focusPitch: 62,

  maxPitch: 70,
  maxBounds: [
    [3.7, 35.9],
    [6.2, 37.3],
  ] as [[number, number], [number, number]],

  /** Exagération du relief 3D */
  terrainExaggeration: 1,

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
