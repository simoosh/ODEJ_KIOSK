/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Racine des médias sur le CDN. Absente : les médias sont servis par le site lui-même. */
  readonly VITE_MEDIA_BASE_URL?: string;
  /** Clé ArcGIS pour le satellite. Absente : accès sans clé. */
  readonly VITE_SATELLITE_KEY?: string;
}

/** true dans l'aperçu publié (le bac à sable bloque les tuiles et les polices de la carte). */
declare const __ARTIFACT__: boolean;

declare module 'qrcode-generator';
