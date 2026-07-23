import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../data/languages';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

interface LanguageContextType {
  currentLanguage: LanguageOption;
  languages: LanguageOption[];
  changeLanguage: (code: string) => void;
  isRtl: boolean;
  isTranslating: boolean;
}

const defaultLang = SUPPORTED_LANGUAGES[0];

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: defaultLang,
  languages: SUPPORTED_LANGUAGES,
  changeLanguage: () => {},
  isRtl: false,
  isTranslating: false
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(() => {
    const savedCode = localStorage.getItem('fc_selected_lang');
    if (savedCode) {
      const found = SUPPORTED_LANGUAGES.find(l => l.code === savedCode || l.code.toLowerCase() === savedCode.toLowerCase());
      if (found) return found;
    }
    return defaultLang;
  });

  const [isTranslating, setIsTranslating] = useState(false);

  // Helper to set cookies properly for Google Translate
  const setTranslateCookie = (langCode: string) => {
    const domain = window.location.hostname;
    const cookieVal = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; domain=${domain}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; domain=.${domain}; path=/;`;
  };

  const applyLanguageToDOM = (lang: LanguageOption) => {
    setTranslateCookie(lang.code);

    // Apply RTL if applicable
    const isRtlLang = Boolean(lang.isRtl);
    document.documentElement.dir = isRtlLang ? 'rtl' : 'ltr';
    document.documentElement.lang = lang.code;

    // Trigger Google Translate hidden combo box if available
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (combo) {
      combo.value = lang.code;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const changeLanguage = (code: string) => {
    const target = SUPPORTED_LANGUAGES.find(l => l.code === code || l.code.toLowerCase() === code.toLowerCase()) || defaultLang;
    setCurrentLanguage(target);
    localStorage.setItem('fc_selected_lang', target.code);
    setIsTranslating(true);

    applyLanguageToDOM(target);

    // Simulated short translation feedback timer
    setTimeout(() => {
      setIsTranslating(false);
    }, 600);
  };

  useEffect(() => {
    // 1. Set Google Translate initialization callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );

        // Apply saved language after init
        setTimeout(() => {
          const savedCode = localStorage.getItem('fc_selected_lang');
          if (savedCode && savedCode !== 'en') {
            const found = SUPPORTED_LANGUAGES.find(l => l.code === savedCode);
            if (found) applyLanguageToDOM(found);
          }
        }, 500);
      }
    };

    // 2. Inject Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.googleTranslateElementInit) {
      window.googleTranslateElementInit();
    }

    // Apply initial DOM setup
    applyLanguageToDOM(currentLanguage);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languages: SUPPORTED_LANGUAGES,
        changeLanguage,
        isRtl: Boolean(currentLanguage.isRtl),
        isTranslating
      }}
    >
      {/* Hidden element required for Google Translate script */}
      <div id="google_translate_element" className="hidden" style={{ display: 'none' }} />
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
