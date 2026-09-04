'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ruMessages from './ru.json';
import uzMessages from './uz.json';

type Messages = typeof ruMessages;
type Language = 'ru' | 'uz';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextType | null>(null);

const messagesMap: Record<Language, Messages> = {
  ru: ruMessages,
  uz: uzMessages,
};

export function I18nProvider({
  children,
  initialLanguage = 'ru',
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lab-cert-language', lang);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('lab-cert-language') as Language | null;
    if (saved && (saved === 'ru' || saved === 'uz')) {
      setLanguageState(saved);
    }
  }, []);

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: messagesMap[language],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

export function getTranslation(language: Language) {
  return messagesMap[language] || messagesMap.ru;
}
