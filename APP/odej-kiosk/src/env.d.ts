/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Racine des médias sur le CDN. Absente : les médias sont servis par le site lui-même. */
  readonly VITE_MEDIA_BASE_URL?: string;
  /** Clé ArcGIS pour le satellite. Absente : accès sans clé. */
  readonly VITE_SATELLITE_KEY?: string;
}

declare module 'qrcode-generator';
