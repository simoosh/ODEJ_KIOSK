export type Locale = 'ar' | 'en';

export interface I18nText {
  ar: string | null;
  en: string | null;
}

export interface MediaItem {
  src: string;
  kind?: 'image' | 'video';
  /** Image affichée avant la lecture d'une vidéo */
  poster?: string;
  /** 'contain' montre l'image entière (logo, image carrée) */
  fit?: 'cover' | 'contain';
  caption?: I18nText;
}

export interface EstablishmentMedia {
  cover: MediaItem | null;
  gallery: MediaItem[];
}

/** Contenu de media/index.json : les media.json de tous les établissements, par id */
export type MediaIndex = Record<string, EstablishmentMedia>;

/** Une activité du programme réel d'un établissement (Youth Connect). Texte en arabe seulement. */
export interface ProgrammeItem {
  title: string;
  /** Dates ISO (AAAA-MM-JJ), null si le format n'a pas été reconnu */
  from: string | null;
  to: string | null;
  theme: string | null;
}

/** Une entrée de data/details.json : ce que dit l'info.json d'un établissement, assemblé par scripts/build-details-index.mjs */
export interface DetailEntry {
  phone?: string;
  email?: string;
  address?: string;
  /** Texte arabe seulement : il passe après la description des données, qui est bilingue */
  description?: string;
  foundedYear?: number;
  capacity?: number;
  accessible?: true;
  programme?: ProgrammeItem[];
}

/** Contenu de data/details.json, par id */
export type DetailsIndex = Record<string, DetailEntry>;

export interface Category {
  id: string;
  label: I18nText;
  color: string;
  icon: IconName;
  defaultActivities?: string[];
}

export type IconName = 'house' | 'bed' | 'ball' | 'atom' | 'hall' | 'star' | 'tent';

export interface Activity {
  id: string;
  label: I18nText;
}

export interface Place {
  id: string;
  name: I18nText;
  kind: 'commune' | 'locality';
  communeId?: string | null;
}

export interface Issue {
  code: string;
  message: string;
}

export interface Establishment {
  id: string;
  ref?: number;
  /** Nom officiel de la liste ODEJ */
  name: I18nText;
  /** Titre affiché (type + commune). Absent : on affiche name */
  displayName?: I18nText;
  /** Personne qui donne son nom à l'établissement */
  honoree?: I18nText;
  featured?: boolean;
  featuredOrder?: number;
  category: string;
  placeId: string | null;
  location: { lat: number; lng: number };
  description?: I18nText;
  activities?: string[];
  contact?: { phone?: string | null; address?: string | null; email?: string | null; facebook?: string | null };
  /** Absent du JSON : fusionné au chargement depuis media/index.json */
  media?: EstablishmentMedia;
  /** Absents du JSON : fusionnés au chargement depuis data/details.json */
  facts?: { foundedYear?: number; capacity?: number; accessible?: boolean };
  programme?: ProgrammeItem[];
  openingHours?: I18nText | null;
  verification?: { status: 'ok' | 'to_check'; issues: Issue[] };
}

export interface CameraSpec {
  pitch: number;
  bearing: number;
}

export type Boundary = GeoJSON.FeatureCollection<GeoJSON.MultiPolygon>;

export interface KioskData {
  meta: { version: string; updatedAt: string; locales: Locale[]; defaultLocale: Locale; source?: string; notes?: string };
  organization: { name: I18nText; shortName: I18nText; logo: string | null; intro: I18nText };
  wilaya: {
    code: string;
    name: I18nText;
    description: I18nText;
    facts?: { value: number; label: I18nText }[];
    camera: CameraSpec;
  };
  categories: Category[];
  activities: Activity[];
  places: Place[];
  establishments: Establishment[];
}

export type BasemapId = 'plan' | 'satellite' | 'preview';
