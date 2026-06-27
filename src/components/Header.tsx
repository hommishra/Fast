import React, { useState, useEffect } from "react";
import { Category } from "../types";
import { 
  Search, 
  Globe, 
  ChevronDown, 
  ShieldAlert, 
  BookOpen, 
  Sun, 
  CloudSun, 
  CloudRain, 
  Cloud, 
  Moon, 
  Wind, 
  Droplets, 
  TrendingUp, 
  Info 
} from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES } from "../utils/LanguageContext";

interface HeaderProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  logoText: string;
  currentUser?: any | null;
  onOpenAuth?: () => void;
  onOpenBookmarks?: () => void;
  onSignOut?: () => void;
}

const CITY_WEATHER: Record<string, { name: string; temp: string; icon: string; desc: string; humidity: string; wind: string; aqi: string; bg: string }> = {
  london: { name: "London", temp: "18°C", icon: "🌧️", desc: "Showers", humidity: "78%", wind: "14 km/h", aqi: "32 (Good)", bg: "from-blue-900/10 to-slate-900/10" },
  newYork: { name: "New York", temp: "24°C", icon: "☀️", desc: "Sunny", humidity: "45%", wind: "8 km/h", aqi: "45 (Good)", bg: "from-amber-500/10 to-orange-500/10" },
  tokyo: { name: "Tokyo", temp: "21°C", icon: "⛅", desc: "Partly Cloudy", humidity: "62%", wind: "11 km/h", aqi: "28 (Good)", bg: "from-indigo-500/10 to-purple-500/10" },
  newDelhi: { name: "New Delhi", temp: "35°C", icon: "💨", desc: "Hazy Weather", humidity: "50%", wind: "12 km/h", aqi: "142 (Moderate)", bg: "from-orange-500/10 to-yellow-500/10" },
  paris: { name: "Paris", temp: "20°C", icon: "🌤️", desc: "Mostly Sunny", humidity: "55%", wind: "9 km/h", aqi: "38 (Good)", bg: "from-sky-500/10 to-blue-500/10" },
};

export default function Header({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  logoText,
  currentUser,
  onOpenAuth,
  onOpenBookmarks,
  onSignOut,
}: HeaderProps) {
  const [currentUtc, setCurrentUtc] = useState("");
  const [currentLocalDate, setCurrentLocalDate] = useState("");
  const { currentLang, setLanguage, t } = useLanguage();
  const [selectedCityWeather, setSelectedCityWeather] = useState<string | null>(null);

  const [clocks, setClocks] = useState({
    london: "",
    newYork: "",
    tokyo: "",
    newDelhi: "",
    paris: "",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtc(now.toUTCString().replace("GMT", "UTC"));
      
      try {
        const dateOptions: Intl.DateTimeFormatOptions = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        };
        setCurrentLocalDate(now.toLocaleDateString(currentLang.code || "en-US", dateOptions));
      } catch {
        setCurrentLocalDate(now.toDateString());
      }
      
      const formatTime = (tz: string) => {
        try {
          return now.toLocaleTimeString("en-US", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        } catch {
          return "00:00";
        }
      };

      setClocks({
        london: formatTime("Europe/London"),
        newYork: formatTime("America/New_York"),
        tokyo: formatTime("Asia/Tokyo"),
        newDelhi: formatTime("Asia/Kolkata"),
        paris: formatTime("Europe/Paris"),
      });
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentLang.code]);

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors" id="main_website_header">
      {/* Top Utility Bar */}
      <div className="bg-slate-905 text-slate-400 border-b border-slate-950 text-[10px] font-sans font-bold tracking-wider py-2 px-6 flex flex-col sm:flex-row justify-between items-center gap-2 select-none uppercase" style={{ backgroundColor: "#0f172a" }}>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Globe className="text-blue-500 animate-spin" size={12} style={{ animationDuration: "12s" }} />
            {t("Fast Coverage Network Log")}
          </span>
          <span className="text-slate-705">|</span>
          
          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-[10px] uppercase font-sans font-extrabold tracking-wider px-2 py-0.5 rounded cursor-pointer select-none relative group transition-colors">
            <span>{currentLang.flag} {currentLang.name}</span>
            <ChevronDown size={11} className="text-slate-400 group-hover:text-white transition-colors" />
            <select
              value={currentLang.code}
              onChange={(e) => setLanguage(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Language Selector"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hover:text-white text-slate-400 transition-colors cursor-pointer flex items-center gap-1" onClick={() => {
            window.location.hash = "admin-portal";
          }}>
            🔐 {t("Secure Control Room")}
          </span>
        </div>
        
        {/* User Session Profile controls of the network */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenBookmarks}
                className="hover:text-white text-blue-400 transition-colors cursor-pointer flex items-center gap-1"
                title="Saved Bookmarks Board"
              >
                🔖 {t("Bookmarks")}
              </button>
              <span className="text-slate-700 font-normal">|</span>
              <span className="text-slate-300 font-semibold normal-case">
                {currentUser.displayName || t("Subscriber")}
              </span>
              <span className="text-slate-700 font-normal">|</span>
              <button
                type="button"
                onClick={onSignOut}
                className="hover:text-red-400 text-slate-400 transition-colors cursor-pointer font-bold"
              >
                {t("Sign Out")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hover:text-white text-red-405 transition-colors cursor-pointer flex items-center gap-1 font-extrabold"
            >
              👤 {t("Reader Sign In")}
            </button>
          )}
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* News Brand Logo */}
        <div 
          onClick={() => onSelectCategory("")}
          className="cursor-pointer select-none group flex items-center gap-3"
        >
          <span className="bg-red-600 text-white font-sans font-black text-xl px-2.5 py-1 rounded tracking-tighter uppercase transform group-hover:bg-red-750 transition-all shrink-0">
            FC
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-black text-lg tracking-tight uppercase text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {logoText || "FAST COVERAGE"}
            </span>
            <span className="font-sans text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5">
              Global News Network
            </span>
          </div>
        </div>

        {/* Global News Search */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder={t("Search news database...")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-100/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-905 transition-all placeholder-slate-450 dark:placeholder-slate-500 font-sans"
          />
        </div>
      </div>

      {/* Newspaper Dateline Subheader */}
      <div className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center text-[10px] font-bold font-sans uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-red-600 font-extrabold animate-pulse">●</span>
              <span className="text-slate-900 dark:text-slate-100 font-black">{t("LIVE COVERAGE")}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium normal-case sm:uppercase">{currentLocalDate}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 py-1.5 shrink-0">
            <button
              onClick={() => onSelectCategory("")}
              className={`px-3 py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest transition-all shrink-0 rounded-md ${
                selectedCategoryId === ""
                  ? "bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {t("Top Stories")}
            </button>
            <button
              onClick={() => onSelectCategory("videos")}
              className={`px-3 py-1.5 text-[10px] font-extrabold font-sans uppercase tracking-widest transition-all shrink-0 rounded-md flex items-center gap-1 border ${
                selectedCategoryId === "videos"
                  ? "bg-red-750 text-white border-red-750 shadow-xs"
                  : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-neutral-900 dark:hover:bg-slate-800 hover:text-white border-red-200/50 dark:border-red-900/50"
              }`}
            >
              📺 {t("Video Hub")}
            </button>
            <button
              onClick={() => onSelectCategory("markets")}
              className={`px-3 py-1.5 text-[10px] font-extrabold font-sans uppercase tracking-widest transition-all shrink-0 rounded-md flex items-center gap-1 border ${
                selectedCategoryId === "markets"
                  ? "bg-red-700 text-white border-red-700 shadow-xs"
                  : "text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-900/25 border-red-200/50 dark:border-red-900/30"
              }`}
            >
              📈 {t("Live Markets")}
            </button>
            {parentCategories.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest transition-all shrink-0 rounded-md ${
                    isActive 
                      ? "bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900" 
                      : "text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {t(cat.name)}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
