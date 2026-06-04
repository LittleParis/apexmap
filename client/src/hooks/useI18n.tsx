import { useState, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { LOCALES, type Locale } from '../i18n/locales';

interface I18nContextValue {
  locale: Locale;
  t: (key: string) => string;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh',
  t: (key) => key,
  toggleLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('apexmap-locale');
    return (saved === 'en' ? 'en' : 'zh') as Locale;
  });

  const t = useCallback(
    (key: string) => LOCALES[locale]?.[key] ?? LOCALES.zh[key] ?? key,
    [locale]
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem('apexmap-locale', next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
