import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import '@fontsource-variable/readex-pro';

/** Couleurs et polices de la borne (APP/odej-kiosk/src/styles/app.css), pour que les vidéos lui ressemblent. */
export const COLORS = {
  ink: '#14211b',
  green: '#1f6e3e',
  red: '#b42338',
  gold: '#86670c',
  paper: '#f7f6f1',
  sky: '#d6e9f6',
  skyPale: '#e6f1f8',
  sea: '#8fd0d8',
  cloud: '#cdd4db',
} as const;

export const FONTS = {
  /** Titres arabes */
  displayAr: "'Amiri', 'Noto Naskh Arabic', serif",
  /** Texte courant, arabe et latin */
  ui: "'Readex Pro Variable', 'Readex Pro', 'Segoe UI', sans-serif",
} as const;
