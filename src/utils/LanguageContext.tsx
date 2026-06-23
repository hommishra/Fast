import React, { createContext, useContext, useState, useEffect } from "react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRtl?: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", isRtl: true },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", isRtl: true },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", isRtl: true },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" }
];

const UI_STATIC_DICTIONARY: Record<string, Record<string, string>> = {
  hi: {
    "Top Stories": "मुख्य समाचार",
    "Live Markets": "लाइव बाजार",
    "Search news database...": "समाचार डेटाबेस में खोजें...",
    "Fast Coverage Network Log": "फास्ट कवरेज नेटवर्क लॉग",
    "Secure Control Room": "सुरक्षित नियंत्रण कक्ष",
    "Bookmarks": "बुकमार्क",
    "Sign Out": "साइन आउट",
    "Reader Sign In": "पाठक लॉगिन",
    "Recent Bulletins": "हालिया बुलेटिन",
    "Load More Headlines": "अधिक सुर्खियां लोड करें",
    "Trending Focus": "ट्रेंडिंग फोकस",
    "Published on": "प्रकाशित तिथिः",
    "Author": "लेखक",
    "Search Results": "खोज परिणाम",
    "Latest Headlines": "नवीनतम सुर्खियां",
    "All rights reserved": "सभी अधिकार सुरक्षित",
    "Live coverage zones": "लाइव कवरेज क्षेत्र",
    "No articles found": "कोई लेख नहीं मिला",
    "Comments": "टिप्पणियाँ",
    "Post comment": "टिप्पणी पोस्ट करें",
    "Name": "नाम",
    "Email": "ईमेल",
    "Your comment...": "आपकी टिप्पणी...",
    "Submit": "प्रस्तुत करें",
    "Fast Coverage": "फास्ट कवरेज",
    "Subscriber": "ग्राहक",
    "Categories": "श्रेणियाँ",
    "Navigation Menu": "नेविगेशन मेनू",
    "Headlines": "सुर्खियां",
    "Articles": "लेख",
    "Article Summaries": "लेख सारांश",
    "Footer": "पाद लेख",
    "Login Pages": "लॉगिन पृष्ठ",
    "User Dashboard": "उपयोगकर्ता डैशबोर्ड",
    "Video Section": "वीडियो अनुभाग",
    "Admin Panel Labels": "व्यवस्थापक पैनल लेबल",
    "Error Messages": "त्रुटि संदेश",
    "Buttons": "बटन",
    "Forms": "फॉर्म"
  },
  ar: {
    "Top Stories": "الأخبار الرئيسية",
    "Live Markets": "الأسواق الحية",
    "Search news database...": "البحث في قاعدة الأخبار...",
    "Fast Coverage Network Log": "سجل شبكة التغطية السريعة",
    "Secure Control Room": "غرفة التحكم الآمنة",
    "Bookmarks": "الإشارات المرجعية",
    "Sign Out": "تسجيل الخروج",
    "Reader Sign In": "تسجيل دخول القارئ",
    "Recent Bulletins": "النشرات الأخيرة",
    "Load More Headlines": "تحميل المزيد من العناوين",
    "Trending Focus": "التركيز الرائج",
    "Published on": "نُشر في",
    "Author": "الكاتب",
    "Search Results": "نتائج البحث",
    "Latest Headlines": "أحدث العناوين",
    "All rights reserved": "جميع الحقوق محفوظة",
    "Live coverage zones": "مناطق التغطية الحية",
    "No articles found": "لم يتم العثور على مقالات",
    "Comments": "التعليقات",
    "Post comment": "أضف تعليقاً",
    "Name": "الاسم",
    "Email": "البريد الإلكتروني",
    "Your comment...": "تعليقك...",
    "Submit": "إرسال",
    "Fast Coverage": "التغطية السريعة",
    "Subscriber": "مشترك",
    "Categories": "الفئات",
    "Navigation Menu": "قائمة التنقل",
    "Headlines": "العناوين الرئيسية",
    "Articles": "المقالات",
    "Article Summaries": "ملخصات المقالات",
    "Footer": "الذيل",
    "Login Pages": "صفحات تسجيل الدخول",
    "User Dashboard": "لوحة تحكم المستخدم",
    "Video Section": "قسم الفيديو",
    "Admin Panel Labels": "تسميات لوحة المسؤول",
    "Error Messages": "رسائل الخطأ",
    "Buttons": "الأزرار",
    "Forms": "النماذج"
  },
  es: {
    "Top Stories": "Noticias Principales",
    "Live Markets": "Mercados en Vivo",
    "Search news database...": "Buscar base de datos...",
    "Fast Coverage Network Log": "Registro de Red Fast Coverage",
    "Secure Control Room": "Sala de Control Segura",
    "Bookmarks": "Marcadores",
    "Sign Out": "Cerrar Sesión",
    "Reader Sign In": "Iniciar Sesión Lector",
    "Recent Bulletins": "Boletines Recientes",
    "Load More Headlines": "Cargar más titulares",
    "Trending Focus": "Enfoque de Tendencia",
    "Published on": "Publicado el",
    "Author": "Autor",
    "Search Results": "Resultados de búsqueda",
    "Latest Headlines": "Últimos Titulares",
    "All rights reserved": "Todos los derechos reservados",
    "Live coverage zones": "Zonas de cobertura en vivo",
    "No articles found": "No se encontraron artículos",
    "Comments": "Comentarios",
    "Post comment": "Publicar comentario",
    "Name": "Nombre",
    "Email": "Correo electrónico",
    "Your comment...": "Tu comentario...",
    "Submit": "Enviar",
    "Fast Coverage": "Cobertura Rápida",
    "Subscriber": "Suscriptor",
    "Categories": "Categorías",
    "Navigation Menu": "Menú de Navegación",
    "Headlines": "Titulares",
    "Articles": "Artículos",
    "Article Summaries": "Resúmenes de Artículos",
    "Footer": "Pie de página",
    "Login Pages": "Páginas de Inicio de Sesión",
    "User Dashboard": "Tablero de Usuario",
    "Video Section": "Sección de Video",
    "Admin Panel Labels": "Etiquetas del Panel de Administración",
    "Error Messages": "Mensajes de Error",
    "Buttons": "Botones",
    "Forms": "Formularios"
  },
  ru: {
    "Top Stories": "Главные Новости",
    "Live Markets": "Рынки Онлайн",
    "Search news database...": "Поиск по базе новостей...",
    "Fast Coverage Network Log": "Сетевой журнал Fast Coverage",
    "Secure Control Room": "Защищенный Центр Управления",
    "Bookmarks": "Закладки",
    "Sign Out": "Выйти",
    "Reader Sign In": "Вход для читателей",
    "Recent Bulletins": "Последние бюллетени",
    "Load More Headlines": "Загрузить больше заголовков",
    "Trending Focus": "Тренды дня",
    "Published on": "Опубликовано",
    "Author": "Автор",
    "Search Results": "Результаты поиска",
    "Latest Headlines": "Последние Заголовки",
    "All rights reserved": "Все права защищены",
    "Live coverage zones": "Зоны живого вещания",
    "No articles found": "Статей не найдено",
    "Comments": "Комментарии",
    "Post comment": "Оставить комментарий",
    "Name": "Имя",
    "Email": "Электронная почта",
    "Your comment...": "Ваш комментарий...",
    "Submit": "Отправить",
    "Fast Coverage": "Быстрое Исследование",
    "Subscriber": "Подписчик",
    "Categories": "Категории",
    "Navigation Menu": "Навигационное меню",
    "Headlines": "Заголовки",
    "Articles": "Статьи",
    "Article Summaries": "Краткое содержание",
    "Footer": "Футер",
    "Login Pages": "Страницы авторизцаии",
    "User Dashboard": "Кабинет читателя",
    "Video Section": "Видеораздел",
    "Admin Panel Labels": "Ярлыки админ-панели",
    "Error Messages": "Сообщения об ошибках",
    "Buttons": "Кнопки",
    "Forms": "Формы"
  },
  fr: {
    "Top Stories": "À la une",
    "Live Markets": "Bourses en direct",
    "Search news database...": "Rechercher des actualités...",
    "Fast Coverage Network Log": "Registre réseau Fast Coverage",
    "Secure Control Room": "Salle de contrôle sécurisée",
    "Bookmarks": "Signets",
    "Sign Out": "Se Déconnecter",
    "Reader Sign In": "Connexion Lecteur",
    "Recent Bulletins": "Bulletins récents",
    "Load More Headlines": "Plus d'actualités",
    "Trending Focus": "Tendances actualités",
    "Published on": "Publié le",
    "Author": "Auteur",
    "Search Results": "Résultats de recherche",
    "Latest Headlines": "Dernières actualités",
    "All rights reserved": "Tous droits réservés",
    "Live coverage zones": "Zones de couverture",
    "No articles found": "Aucun article trouvé",
    "Comments": "Commentaires",
    "Post comment": "Poster un commentaire",
    "Name": "Nom",
    "Email": "E-mail",
    "Your comment...": "Votre commentaire...",
    "Submit": "Envoyer",
    "Fast Coverage": "Couverture Rapide",
    "Subscriber": "Abonné"
  }
};

interface LanguageContextProps {
  currentLang: Language;
  setLanguage: (code: string) => void;
  isRtl: boolean;
  t: (text: string) => string;
  translateBatch: (texts: string[]) => Promise<string[]>;
  translateArticle: (articleId: string) => Promise<any>;
  translateVideo: (videoId: string, title: string, desc: string) => Promise<any>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Parse language code from path, e.g. /app/es/ -> es, or check localstorage
  const getInitialLanguage = (): Language => {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0];

    // Find if has supported language code in pathname
    const matchedLang = SUPPORTED_LANGUAGES.find((lang) => lang.code === firstPart);
    if (matchedLang) {
      return matchedLang;
    }

    // Check localStorage
    const savedCode = localStorage.getItem("fc_target_lang");
    const cachedLang = SUPPORTED_LANGUAGES.find((lang) => lang.code === savedCode);
    return cachedLang || SUPPORTED_LANGUAGES[0]; // defaults to English
  };

  const [currentLang, setCurrentLang] = useState<Language>(getInitialLanguage);
  const [dynamicCache, setDynamicCache] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem("fc_translations_cache_v1");
    return cached ? JSON.parse(cached) : {};
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync state changes with document, href paths, and localStorage
  const handleSetLanguage = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
    setCurrentLang(lang);
    localStorage.setItem("fc_target_lang", lang.code);
  };

  useEffect(() => {
    // 1. Sync Document Direction
    const isRtl = !!currentLang.isRtl;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = currentLang.code;

    // 2. Sync URL Pathname (e.g. /es/ or /hi/) without refreshing fully, maintaining hash routing
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/").filter(Boolean);
    let restOfPath = "";

    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === pathParts[0])) {
      restOfPath = pathParts.slice(1).join("/");
    } else {
      restOfPath = pathParts.join("/");
    }

    const newPath = `/${currentLang.code}/${restOfPath}`.replace(/\/+/g, "/");
    const currentHash = window.location.hash;

    if (window.location.pathname !== newPath) {
      window.history.pushState(null, "", `${newPath}${currentHash}`);
    }

    // 3. Update SEO tags (hreflang alternates & dynamically generated head metadata)
    const existingAlternateLinks = document.querySelectorAll("link[rel='alternate']");
    existingAlternateLinks.forEach((el) => el.remove());

    // Generate alternate links for languages
    SUPPORTED_LANGUAGES.forEach((l) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = l.code;
      link.href = `${window.location.origin}/${l.code}/${restOfPath}`.replace(/\/+/g, "/");
      document.head.appendChild(link);
    });

  }, [currentLang]);

  // Translate single input dynamic label
  const t = (text: string): string => {
    if (!text || typeof text !== "string") return text;
    if (currentLang.code === "en") return text;

    // 1. Check static dictionaries first
    const dict = UI_STATIC_DICTIONARY[currentLang.code];
    if (dict && dict[text]) {
      return dict[text];
    }

    // 2. Check dynamic cache (resolved via API asynchronously)
    const cacheKey = `${currentLang.code}_${text}`;
    if (dynamicCache[cacheKey]) {
      return dynamicCache[cacheKey];
    }

    // If missing, trigger lazy background translate batch to populate cache and notify component on completion
    triggerLazyTranslation(text);

    return text; // Return english as fallback while translating in background
  };

  // Keep track of pending translations to avoid redundant simultaneous requests
  const pendingTranslations = React.useRef<Set<string>>(new Set());
  const pendingBatchTexts = React.useRef<Set<string>>(new Set());
  const batchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerLazyTranslation = (text: string) => {
    if (currentLang.code === "en" || !text.trim()) return;
    const cacheKey = `${currentLang.code}_${text}`;
    if (pendingTranslations.current.has(cacheKey) || dynamicCache[cacheKey]) return;

    pendingBatchTexts.current.add(text);

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(async () => {
      const textsToRequest = Array.from(pendingBatchTexts.current);
      pendingBatchTexts.current.clear();

      if (textsToRequest.length === 0) return;

      // Mark all as pending
      const activeCacheKeys: string[] = [];
      textsToRequest.forEach((item) => {
        const key = `${currentLang.code}_${item}`;
        pendingTranslations.current.add(key);
        activeCacheKeys.push(key);
      });

      try {
        const response = await fetch("/api/translate/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: textsToRequest,
            targetLangCode: currentLang.code,
            targetLangName: currentLang.name
          })
        });
        const data = await response.json();
        const translations = data.translations || [];

        setDynamicCache((prev) => {
          const updated = { ...prev };
          textsToRequest.forEach((item, idx) => {
            const transVal = translations[idx] || item;
            const key = `${currentLang.code}_${item}`;
            updated[key] = transVal;
          });
          localStorage.setItem("fc_translations_cache_v1", JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.warn("Batch lazy translation back-off failed:", err);
      } finally {
        activeCacheKeys.forEach((key) => {
          pendingTranslations.current.delete(key);
        });
      }
    }, 250);
  };

  // Dynamic Batch Translation Helper
  const translateBatch = async (texts: string[]): Promise<string[]> => {
    if (currentLang.code === "en" || !texts || texts.length === 0) return texts;

    try {
      const results: string[] = [];
      const missingIndexMap: { text: string; i: number }[] = [];

      texts.forEach((text, i) => {
        const cacheKey = `${currentLang.code}_${text}`;
        const dict = UI_STATIC_DICTIONARY[currentLang.code];
        if (dict && dict[text]) {
          results[i] = dict[text];
        } else if (dynamicCache[cacheKey]) {
          results[i] = dynamicCache[cacheKey];
        } else {
          missingIndexMap.push({ text, i });
        }
      });

      if (missingIndexMap.length === 0) {
        return results;
      }

      setIsLoading(true);
      const response = await fetch("/api/translate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: missingIndexMap.map((x) => x.text),
          targetLangCode: currentLang.code,
          targetLangName: currentLang.name
        })
      });

      const data = await response.json();
      const fetchedTranslations = data.translations || [];

      setDynamicCache((prev) => {
        const updated = { ...prev };
        missingIndexMap.forEach((entry, idx) => {
          const transVal = fetchedTranslations[idx] || entry.text;
          results[entry.i] = transVal;
          const cacheKey = `${currentLang.code}_${entry.text}`;
          updated[cacheKey] = transVal;
        });
        localStorage.setItem("fc_translations_cache_v1", JSON.stringify(updated));
        return updated;
      });

      return results;
    } catch (err) {
      console.error("Batch translator context failure:", err);
      return texts;
    } finally {
      setIsLoading(false);
    }
  };

  // High-Quality Article translation helper
  const translateArticle = async (articleId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/translate/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          targetLangCode: currentLang.code,
          targetLangName: currentLang.name
        })
      });
      return await response.json();
    } catch (err) {
      console.error("Article translation call failed:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // High Quality TV News Video translation helper
  const translateVideo = async (videoId: string, title: string, desc: string) => {
    try {
      const response = await fetch("/api/translate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title,
          description: desc,
          targetLangCode: currentLang.code,
          targetLangName: currentLang.name
        })
      });
      return await response.json();
    } catch (err) {
      console.error("Video translation failed:", err);
      return { title, description: desc };
    }
  };

  const isRtl = !!currentLang.isRtl;

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setLanguage: handleSetLanguage,
        isRtl,
        t,
        translateBatch,
        translateArticle,
        translateVideo,
        isLoading
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
