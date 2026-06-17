import React, { useState, useEffect } from "react";
import { Category } from "../types";
import { Search, Globe, ChevronDown, ShieldAlert, BookOpen } from "lucide-react";

interface HeaderProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  logoText: string;
}

export default function Header({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  logoText,
}: HeaderProps) {
  const [currentUtc, setCurrentUtc] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtc(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <header className="bg-white border-b border-slate-200" id="main_website_header">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-450 border-b border-slate-950 text-[10px] font-sans font-bold tracking-wider py-2 px-6 flex justify-between items-center select-none uppercase">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Globe className="text-blue-500 animate-spin" size={12} style={{ animationDuration: "12s" }} />
            Fast Coverage Network Log
          </span>
          <span className="text-slate-700">|</span>
          <span className="hover:text-white text-slate-400 transition-colors cursor-pointer flex items-center gap-1" onClick={() => {
            window.location.hash = "admin-portal";
          }}>
            🔐 Secure Control Room
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold font-mono tracking-tight">{currentUtc}</span>
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* News Brand Logo */}
        <div 
          onClick={() => onSelectCategory("")}
          className="cursor-pointer select-none group flex items-center gap-2"
        >
          <span className="bg-red-600 text-white font-sans font-black text-xl px-2 py-0.5 rounded tracking-tighter uppercase transform group-hover:bg-red-750 transition-all">
            FC
          </span>
          <span className="font-sans font-black text-lg tracking-tight uppercase text-slate-900 group-hover:text-blue-600 transition-colors">
            {logoText || "FAST COVERAGE"}
          </span>
        </div>

        {/* Global News Search */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search news database..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-100/70 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder-slate-450 font-sans"
          />
        </div>
      </div>

      {/* Navigation Links Bar */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 py-1.5 shrink-0">
            <button
              onClick={() => onSelectCategory("")}
              className={`px-3 py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest transition-all shrink-0 rounded-md ${
                selectedCategoryId === ""
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-650 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              Top Stories
            </button>
            {parentCategories.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest transition-all shrink-0 rounded-md ${
                    isActive ? "bg-slate-900 text-white shadow-xs" : "text-slate-650 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
