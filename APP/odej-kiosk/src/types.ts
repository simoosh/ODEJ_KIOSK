export type Locale = 'ar' | 'en';

export interface I18nText {
  ar: string | null;
  en: string | null;
}

export interface MediaItem {
  src: string;
  kind?: 'image' | 'video';
  caption?: I18nText;
}

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
  name: I18nText;
  category: string;
  placeId: string | null;
  location: { lat: number; lng: number };
  description?: I18nText;
  activities?: string[];
  contact?: { phone?: string | null; email?: string | null; facebook?: string | null };
  media?: { cover: MediaItem | null; gallery: MediaItem[] };
  openingHours?: I18nText | null;
  verification?: { status: 'ok' | 'to_check'; issues: Issue[] };
}

export interface CameraSpec {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

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

export type BasemapId = 'plan' | 'satellite' | 'relief' | 'osm' | 'preview';
