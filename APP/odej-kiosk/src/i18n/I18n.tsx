import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { I18nText, Locale } from '../types';
import { STRINGS, type StringKey } from './strings';

interface I18nValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Texte bilingue venant du JSON ; retombe sur l'autre langue si vide */
  tx: (text: I18nText | null | undefined) => string;
}

const Ctx = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => {
      let s = STRINGS[locale][key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [locale],
  );
  const tx = useCallback(
    (text: I18nText | null | undefined) => {
      if (!text) return '';
      const other: Locale = locale === 'ar' ? 'en' : 'ar';
      return text[locale] ?? text[other] ?? '';
    },
    [locale],
  );
  const value = useMemo<I18nValue>(() => ({ locale, dir: locale === 'ar' ? 'rtl' : 'ltr', t, tx }), [locale, t, tx]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
