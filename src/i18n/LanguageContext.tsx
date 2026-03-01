"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from './dictionaries/en';
import { id } from './dictionaries/id';

type Language = 'en' | 'id';
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Dictionary, params?: Record<string, string>) => string;
}

const dictionaries: Record<Language, Dictionary> = { en, id };
const defaultLanguage: Language = 'en';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
      setLanguageState(savedLang);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'id') {
        setLanguageState('id');
      }
    }
    setIsMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback(
    (key: keyof Dictionary, params?: Record<string, string>): string => {
      // Return key if not found in dictionary to easily spot missing translations
      let text = dictionaries[language]?.[key] as string || dictionaries[defaultLanguage]?.[key] as string || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(new RegExp(`{${paramKey}}`, 'g'), value);
        });
      }

      return text;
    },
    [language]
  );

  // Prevent hydration mismatch by rendering nothing until mounted
  // or render with default language but suppress hydration warning
  // Prevent hydration mismatch by rendering nothing until mounted
  // or render with default language but suppress hydration warning
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {!isMounted ? <div style={{ visibility: 'hidden' }}>{children}</div> : children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
