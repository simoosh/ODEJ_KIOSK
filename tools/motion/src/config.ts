/** Format par défaut des vidéos. Changer ici change toutes les compositions qui l'utilisent. */
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Secondes → images, au débit de VIDEO. */
export const seconds = (s: number, fps: number = VIDEO.fps) => Math.round(s * fps);
