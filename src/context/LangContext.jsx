import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../lib/i18n';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('lang') : null;
    if (saved === 'am' || saved === 'en') {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
    }
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t: (key) => {
      return translations[lang]?.[key] || translations.en?.[key] || key;
    },
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within LangProvider');
  }
  return ctx;
}
