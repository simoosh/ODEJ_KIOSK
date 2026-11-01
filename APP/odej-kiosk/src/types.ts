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
