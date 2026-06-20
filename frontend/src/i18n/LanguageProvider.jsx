/* ============================================================
   Yamshat — Language Provider (i18n Context)
   يدير اللغة بشكل مركزي + يحفظها في localStorage
   ويطبّق dir/lang على عنصر <html> تلقائياً
   ============================================================ */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, getLanguageMeta, t as translate } from './translations.js';

const STORAGE_KEY = 'yamshat.language';
const DEFAULT_LANG = 'ar';

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  dir: 'rtl',
  setLang: () => {},
  t: (key) => key,
  languages: SUPPORTED_LANGUAGES,
});

function detectInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TRANSLATIONS[stored]) return stored;
  } catch (_) { /* ignore */ }
  const browser = (navigator.language || 'ar').slice(0, 2).toLowerCase();
  return TRANSLATIONS[browser] ? browser : DEFAULT_LANG;
}

function applyHtmlAttributes(lang) {
  if (typeof document === 'undefined') return;
  const meta = getLanguageMeta(lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', meta.dir);
  document.documentElement.setAttribute('data-language', lang);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLanguage);

  useEffect(() => {
    applyHtmlAttributes(lang);
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* ignore */ }
    // Notify rest of the app (legacy listeners)
    window.dispatchEvent(new CustomEvent('yamshat:language-changed', { detail: { lang } }));
  }, [lang]);

  const setLang = useCallback((nextLang) => {
    if (TRANSLATIONS[nextLang]) setLangState(nextLang);
  }, []);

  const value = useMemo(() => {
    const meta = getLanguageMeta(lang);
    return {
      lang,
      dir: meta.dir,
      meta,
      setLang,
      t: (key) => translate(lang, key),
      languages: SUPPORTED_LANGUAGES,
    };
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const { t } = useContext(LanguageContext);
  return t;
}
