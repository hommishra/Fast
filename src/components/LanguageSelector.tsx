import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check, Search, ChevronDown, Sparkles, X, RefreshCw } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false, className = '' }) => {
  const { currentLanguage, languages, changeLanguage, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const popularCodes = ['en', 'hi', 'ur', 'ar', 'es', 'fr', 'zh-CN', 'de', 'ru', 'ja'];
  const popularLanguages = languages.filter(l => popularCodes.includes(l.code));

  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-editorial-dark hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-editorial-text transition-all cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs font-semibold'
        }`}
        title="Select Website Language"
      >
        <Globe className={`w-4 h-4 text-editorial-accent ${isTranslating ? 'animate-spin' : ''}`} />
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="font-bold tracking-wide">{currentLanguage.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Modal Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-600" />
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  Select Language / भाषा चुनें
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">AI Real-Time Translation System</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search 50+ languages (e.g. Hindi, Arabic, Spanish)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Quick Selection Shortcuts */}
          {!searchQuery && (
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Popular Languages
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      currentLanguage.code === lang.code
                        ? 'bg-red-600 text-white font-bold shadow'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Languages Scrollable List */}
          <div className="max-h-64 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50 scrollbar-thin">
            {filteredLanguages.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No matching language found.
              </div>
            ) : (
              filteredLanguages.map(lang => {
                const isSelected = currentLanguage.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition cursor-pointer my-0.5 ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-2">
                          <span>{lang.nativeName}</span>
                          {lang.isRtl && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-mono uppercase">
                              RTL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{lang.name}</div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-4">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Real-Time Multi-Language Engine</span>
            </span>
            <span className="font-mono text-slate-400">FAST COVERAGES</span>
          </div>
        </div>
      )}
    </div>
  );
};
