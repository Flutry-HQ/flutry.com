import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';

import type { Language, Messages } from './types';
import { createTranslator } from './translator';
import { loadMessages } from './loader';

type LanguageContextType = {
  language: Language;
  messages: Messages;

  t: (key: string, params?: Record<string, string | number>) => string;

  changeLanguage: (lang: Language) => Promise<void>;

  isChanging: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  language: initialLanguage,
  messages: initialMessages,
}: {
  children: React.ReactNode;
  language: Language;
  messages: Messages;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [isChanging, setIsChanging] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    document.documentElement.lang = language;

    const hasLanguageCookie = document.cookie.split('; ').some((cookie) => cookie.startsWith('lang='));

    if (!hasLanguageCookie) {
      document.cookie = [`lang=${language}`, 'path=/', 'max-age=31536000', 'SameSite=Lax'].join(';');
    }
  }, [language]);

  const t = useMemo(() => {
    return createTranslator(messages);
  }, [messages]);

  const changeLanguage = useCallback(
    async (lang: Language) => {
      if (lang === language) {
        return;
      }

      const requestId = ++requestIdRef.current;

      setIsChanging(true);

      try {
        const newMessages = await loadMessages(lang);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setLanguage(lang);
        setMessages(newMessages);

        document.cookie = [`lang=${lang}`, 'path=/', 'max-age=31536000', 'SameSite=Lax'].join(';');
      } catch (err) {
        console.error(`Nem sikerült betölteni a(z) "${lang}" nyelvet:`, err);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsChanging(false);
        }
      }
    },
    [language],
  );

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      messages,
      t,
      changeLanguage,
      isChanging,
    }),
    [language, messages, t, changeLanguage, isChanging],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
