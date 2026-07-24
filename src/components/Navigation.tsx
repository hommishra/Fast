import { useState, useEffect } from 'react';
import { Category, WebsiteSettings, ParentSection } from '../types';
import { 
  Search, Shield, Sun, Moon, Menu, X, Clock, 
  MapPin, AlertTriangle, Play, ChevronRight, Globe,
  Smartphone, Tablet, Laptop, Monitor, Tv, Smartphone as FoldableIcon
} from 'lucide-react';
import FCLogo from './FCLogo';
import { LanguageSelector } from './LanguageSelector';
import { useDeviceDetect } from '../useDeviceDetect';

interface NavigationProps {
  categories: Category[];
  settings: WebsiteSettings;
  parentSections?: ParentSection[];
  onNavigate: (page: string) => void;
  currentPage: string;
  onSearch: (query: string) => void;
  searchQuery: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAdmin: () => void;
}

export default function Navigation({
  categories,
  settings,
  parentSections = [],
  onNavigate,
  currentPage,
  onSearch,
  searchQuery,
  isDarkMode,
  onToggleDarkMode,
  onOpenAdmin
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const deviceInfo = useDeviceDetect();

  // Update UTC clock in real-time (world-news feeling)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const baseMenuItems = [
    { name: 'Home', slug: 'home' },
    { name: '🔴 Live Stream', slug: 'live-news' },
    { name: '📚 E-Books', slug: 'ebooks' },
    { name: 'Global Markets', slug: 'global-markets' },
    { name: 'Breaking News', slug: 'breaking-news' },
    { name: 'Latest News', slug: 'latest-news' },
    { name: 'Trending News', slug: 'trending-news' }
  ];

  const dynamicMenuItems = (parentSections || [])
    .filter(ps => ps.active !== false)
    .map(ps => ({
      name: ps.name,
      slug: ps.slug
    }));

  const menuItems = [...baseMenuItems, ...dynamicMenuItems];

  // Find currently active parent section (either directly selected or parent of selected category)
  const currentParentSection = (parentSections || []).find(ps => ps.slug === currentPage) ||
    (parentSections || []).find(ps => {
      const activeCat = categories.find(c => c.slug === currentPage);
      return activeCat && activeCat.parentSectionId === ps.id;
    });

  // If a parent section is active, get its sub-categories
  const subCategories = currentParentSection 
    ? categories.filter(c => c.parentSectionId === currentParentSection.id)
    : [];

  return (
    <nav id="global-navigation-header" className="w-full bg-white dark:bg-editorial-bg border-b border-slate-200 dark:border-white/10 font-sans shadow-sm transition-colors sticky top-0 z-40 selection:bg-editorial-accent shrink-0">
      
      {/* Top micro bar for UTC Clock & Admin Access */}
      <div className="w-full bg-slate-100 dark:bg-editorial-dark px-4 py-1.5 flex items-center justify-between text-[10px] md:text-xs text-slate-500 dark:text-editorial-text/50 font-mono tracking-wider font-bold shrink-0 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{utcTime}</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            Global news Zone
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Automatic Device Detection Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider" title={`Auto Detected: ${deviceInfo.deviceType.toUpperCase()} | ${deviceInfo.browserName} | ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`}>
            {deviceInfo.deviceType === 'mobile' && <Smartphone className="w-3 h-3 text-editorial-accent" />}
            {deviceInfo.deviceType === 'tablet' && <Tablet className="w-3 h-3 text-editorial-accent" />}
            {deviceInfo.deviceType === 'laptop' && <Laptop className="w-3 h-3 text-editorial-accent" />}
            {deviceInfo.deviceType === 'desktop' && <Monitor className="w-3 h-3 text-editorial-accent" />}
            {deviceInfo.deviceType === 'ultrawide' && <Monitor className="w-3 h-3 text-editorial-accent" />}
            {deviceInfo.deviceType === 'tv' && <Tv className="w-3 h-3 text-editorial-accent" />}
            {deviceInfo.deviceType === 'foldable' && <Smartphone className="w-3 h-3 text-editorial-accent" />}
            
            <span>
              {deviceInfo.deviceType === 'mobile' && 'Mobile View'}
              {deviceInfo.deviceType === 'tablet' && 'Tablet View'}
              {deviceInfo.deviceType === 'laptop' && 'Laptop View'}
              {deviceInfo.deviceType === 'desktop' && 'Desktop View'}
              {deviceInfo.deviceType === 'ultrawide' && 'Ultra-Wide'}
              {deviceInfo.deviceType === 'tv' && 'Smart TV View'}
              {deviceInfo.deviceType === 'foldable' && 'Foldable View'}
            </span>
            <span className="opacity-40">|</span>
            <span className="text-[9px] opacity-80">{deviceInfo.browserName}</span>
          </div>
        </div>
      </div>

      {/* Main Branding Bar with search & theme switch */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 dark:text-editorial-text hover:bg-slate-100 dark:hover:bg-white/5 rounded cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
        </button>

        {/* Brand Headline Logo with Premium Animated FC Emblem */}
        <button 
          onClick={() => onNavigate('home')}
          className="shrink-0 cursor-pointer focus:outline-none group select-none"
        >
          <FCLogo size="sm" showText={true} animatedGlobe={true} />
        </button>

        {/* Real-time Search Box */}
        <div className="hidden md:flex items-center relative max-w-sm w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearch(e.target.value);
              if (currentPage !== 'search') onNavigate('search');
            }}
            placeholder="Search breaking stories, bulletins..."
            className="w-full bg-slate-100 dark:bg-editorial-dark border border-slate-200 dark:border-white/10 text-xs px-3.5 py-2.5 rounded-full outline-none focus:border-editorial-accent dark:text-editorial-text pl-10 transition-colors"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Language Selector & Theme Toggler */}
        <div className="flex items-center gap-2.5 shrink-0">
          <LanguageSelector />

          <button 
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-editorial-dark hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-editorial-text/85 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Categories Horizontal Directory Desk */}
      <div className="hidden lg:block border-t border-slate-150 dark:border-white/5 bg-slate-50 dark:bg-editorial-dark/40 py-2.5 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {menuItems.map((item) => {
              const isItemActive = currentPage === item.slug || 
                (currentParentSection && currentParentSection.slug === item.slug);
              return (
                <button
                  key={item.slug}
                  onClick={() => onNavigate(item.slug)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition cursor-pointer ${isItemActive ? 'bg-editorial-accent text-white shadow shadow-editorial-accent/20' : 'text-slate-700 dark:text-editorial-text/80 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('live-news')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-black uppercase font-mono tracking-widest shrink-0 transition cursor-pointer ${currentPage === 'live-news' ? 'bg-red-600 text-white shadow shadow-red-600/30' : 'text-editorial-accent hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-500/20'}`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>LIVE STREAM</span>
          </button>
        </div>
      </div>

      {/* Sub-categories Secondary Directory (CNN style) */}
      {subCategories.length > 0 && (
        <div className="hidden lg:block border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-editorial-dark/20 py-2 shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono tracking-wider border-r border-slate-200 dark:border-white/10 pr-3">
              {currentParentSection?.name} Sub-desks:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {subCategories.map((subCat) => (
                <button
                  key={subCat.slug}
                  onClick={() => onNavigate(subCat.slug)}
                  className={`px-2.5 py-1 text-xs font-black rounded transition cursor-pointer ${currentPage === subCat.slug ? 'bg-editorial-accent text-white shadow shadow-editorial-accent/10' : 'text-slate-600 dark:text-editorial-text/70 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                >
                  {subCat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-[calc(100%-1px)] left-0 w-full bg-white dark:bg-editorial-bg border-b border-slate-200 dark:border-white/10 p-4 shadow-xl flex flex-col gap-3 z-50 overflow-y-auto max-h-[75vh]">
          
          {/* Language Selector in Mobile Drawer */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-editorial-dark p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-xs font-bold text-slate-700 dark:text-editorial-text">Select Language:</span>
            <LanguageSelector compact={true} />
          </div>

          {/* Search bar inside drawer */}
          <div className="flex items-center relative w-full mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearch(e.target.value);
                if (currentPage !== 'search') onNavigate('search');
              }}
              placeholder="Search news indexes..."
              className="w-full bg-slate-100 dark:bg-editorial-dark border border-slate-250 dark:border-white/10 text-xs px-3.5 py-3 rounded outline-none focus:border-editorial-accent dark:text-editorial-text pl-10"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Core Links */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono px-2 mb-1">Core Channels</span>
              {baseMenuItems.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => {
                    onNavigate(item.slug);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded transition cursor-pointer ${currentPage === item.slug ? 'bg-editorial-accent text-white' : 'text-slate-700 dark:text-editorial-text/80 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Parent Sections & Subcategories */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono px-2">Desks & Regions</span>
              {(parentSections || []).filter(ps => ps.active !== false).map(ps => {
                const psCats = categories.filter(c => c.parentSectionId === ps.id);
                const isPsActive = currentPage === ps.slug || (psCats.some(c => c.slug === currentPage));
                return (
                  <div key={ps.id} className="flex flex-col gap-1 bg-slate-50 dark:bg-editorial-dark/20 p-2 rounded-lg border border-slate-150/50 dark:border-white/5">
                    <button
                      onClick={() => {
                        onNavigate(ps.slug);
                        setMobileMenuOpen(false);
                      }}
                      className={`text-left text-xs font-black uppercase tracking-wider py-1 px-2 rounded transition cursor-pointer ${isPsActive ? 'text-editorial-accent' : 'text-slate-800 dark:text-editorial-text'}`}
                    >
                      {ps.name}
                    </button>
                    {psCats.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-2 border-l-2 border-slate-200 dark:border-white/10">
                        {psCats.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              onNavigate(cat.slug);
                              setMobileMenuOpen(false);
                            }}
                            className={`text-left text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded transition cursor-pointer ${currentPage === cat.slug ? 'bg-editorial-accent text-white shadow-sm' : 'text-slate-500 dark:text-editorial-text/60 hover:text-slate-850 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Standalone Categories (no parent) */}
            {categories.filter(c => !c.parentSectionId).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono px-2">Other Desks</span>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  {categories.filter(c => !c.parentSectionId).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onNavigate(cat.slug);
                        setMobileMenuOpen(false);
                      }}
                      className={`text-left text-[10px] font-bold uppercase tracking-wider py-1.5 px-2 rounded transition cursor-pointer border border-slate-100 dark:border-white/5 ${currentPage === cat.slug ? 'bg-editorial-accent text-white border-editorial-accent shadow-sm' : 'text-slate-600 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-white/5 bg-slate-50/50 dark:bg-editorial-dark/10'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </nav>
  );
}
