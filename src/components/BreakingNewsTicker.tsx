import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { BreakingNews, Article } from "../types";
import { 
  AlertTriangle, 
  Clock, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  BellRing
} from "lucide-react";

export default function BreakingNewsTicker() {
  const [tickerItems, setTickerItems] = useState<BreakingNews[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tickerMode, setTickerMode] = useState<"marquee" | "carousel">("marquee");
  const [scrollSpeed, setScrollSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [selectedBulletin, setSelectedBulletin] = useState<BreakingNews | null>(null);
  const [matchingArticles, setMatchingArticles] = useState<Article[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [lastItemCount, setLastItemCount] = useState(0);

  // Real-time listener for breaking news items
  useEffect(() => {
    const q = query(collection(db, "breaking_news"), where("active", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BreakingNews[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as BreakingNews);
      });

      // Sort by creation date descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Trigger animation alarm if list fetched has a new item
      setLastItemCount((prev) => {
        if (prev !== 0 && items.length > prev) {
          setHasNewAlert(true);
          setTimeout(() => setHasNewAlert(false), 8000);
        }
        return items.length;
      });

      setTickerItems(items);
    }, (error) => {
      console.error("BreakingNewsTicker onSnapshot subscription failed:", error);
    });

    return () => unsubscribe();
  }, []);

  // Live real-time clock counter
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short"
      };
      setCurrentTime(new Date().toLocaleTimeString("en-US", options));
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Carousel slider auto-advancing logic
  useEffect(() => {
    if (tickerMode !== "carousel" || tickerItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 5000); // 5s paging duration
    return () => clearInterval(timer);
  }, [tickerMode, tickerItems]);

  // Query articles in Firestore to find matches when a bulletin is clicked
  useEffect(() => {
    if (!selectedBulletin) {
      setMatchingArticles([]);
      return;
    }

    const fetchRelated = async () => {
      setIsLoadingRelated(true);
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "articles"), where("status", "==", "Published"))
        );
        const allArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          allArticles.push({ id: doc.id, ...doc.data() } as Article);
        });

        // Match based on keywords from bulletin text
        const textWords = selectedBulletin.text
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .split(/\s+/)
          .filter(word => word.length > 4); // Only words longer than 4 characters

        const matches = allArticles.filter(art => {
          const stringToSearch = (art.title + " " + art.excerpt + " " + art.content).toLowerCase();
          return textWords.some(word => stringToSearch.includes(word));
        });

        setMatchingArticles(matches.slice(0, 3)); // Limit to top 3 articles
      } catch (err) {
        console.error("Error matching related database coverage", err);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [selectedBulletin]);

  if (tickerItems.length === 0) return null;

  // Manual pagination for Carousel Ticker mode
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + tickerItems.length) % tickerItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
  };

  // Clipboard copy handler
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Speed mapping for marquee CSS animations
  const speedDurations = {
    fast: "14s",
    normal: "28s",
    slow: "55s"
  };

  return (
    <div className="bg-slate-900 border-b border-slate-950 font-sans select-none relative" id="live_flash_ticker_stage">
      
      {/* Dynamic Custom Embedded Keyframes for Continuous Marquee crawl performance */}
      <style>{`
        @keyframes scrollMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-track {
          display: flex;
          width: max-content;
          animation: scrollMarquee var(--speed-dur) linear infinite;
        }
        .animate-marquee-track:hover {
          animation-play-state: var(--play-state);
        }
      `}</style>

      {/* Main Bar Shell layout */}
      <div className="flex flex-col md:flex-row items-stretch">
        
        {/* Urgent Live Red Badge */}
        <div className={`relative z-10 flex items-center gap-1.5 shrink-0 px-4 py-2.5 shadow-md select-none border-r border-slate-950 transition-colors duration-500 ${
          hasNewAlert ? "bg-amber-600 font-extrabold" : "bg-rose-700"
        }`}>
          {hasNewAlert ? (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-100 animate-pulse"></div>
          )}
          <span className="tracking-widest uppercase text-[10px] font-black text-white flex items-center gap-1">
            {hasNewAlert ? (
              <>
                <BellRing size={12} className="animate-bounce" />
                NEW BULLETIN
              </>
            ) : (
              "FLASH BULLETINS"
            )}
          </span>
          <span className="bg-slate-950/45 px-1.5 py-0.5 rounded text-[8px] font-mono text-rose-350 ml-1.5 tracking-tight font-black">
            LIVE FEED
          </span>
        </div>

        {/* Streaming core text zone */}
        <div 
          className="flex-1 overflow-hidden relative min-h-[38px] flex items-center cursor-pointer hover:bg-slate-950/40 transition"
          style={{
            "--speed-dur": speedDurations[scrollSpeed],
            "--play-state": "running"
          } as React.CSSProperties}
        >
          {tickerMode === "marquee" ? (
            /* Continuous hardware-accelerated horizontal crawler track */
            <div className="animate-marquee-track">
              {/* Double items for seamless circular wrapping */}
              {[...tickerItems, ...tickerItems].map((item, idx) => {
                const isUrgent = item.text.toUpperCase().includes("URGENT") || 
                                 item.text.toUpperCase().includes("BREAKING") || 
                                 item.text.toUpperCase().includes("CRITICAL");
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => setSelectedBulletin(item)}
                    className="flex items-center gap-4 px-6 text-xs text-slate-300 font-sans tracking-wide shrink-0 transition hover:text-white"
                  >
                    <span className="text-rose-500 font-bold">✦</span>
                    <span className={`font-medium ${isUrgent ? "text-amber-400 font-bold bg-amber-950/45 px-2 py-0.5 rounded border border-amber-900/40" : ""}`}>
                      {item.text}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Carousel static transitions paging system */
            <div className="flex-1 flex items-center justify-between px-6">
              <button 
                onClick={handlePrev}
                className="text-slate-500 hover:text-white transition p-1 rounded hover:bg-slate-800 shrink-0"
              >
                <ChevronLeft size={16} />
              </button>

              <div 
                onClick={() => setSelectedBulletin(tickerItems[currentIndex])}
                className="flex-1 text-center truncate mx-4 text-xs font-sans tracking-wide transition hover:text-white text-slate-200 font-semibold"
              >
                <span className="text-rose-500 mr-2">✦</span>
                {tickerItems[currentIndex]?.text}
                <span className="text-[9px] text-slate-500 font-mono ml-2">
                  ({currentIndex + 1}/{tickerItems.length})
                </span>
              </div>

              <button 
                onClick={handleNext}
                className="text-slate-500 hover:text-white transition p-1 rounded hover:bg-slate-800 shrink-0"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Quick inline instruction hover tooltip */}
          <div className="hidden lg:block absolute right-2 bottom-1 text-[8px] text-slate-600 font-mono uppercase bg-slate-900/80 px-1 rounded pointer-events-none">
            Hover to pause • Click to open details
          </div>
        </div>

        {/* Interactive Controls & Settings Drawer Ribbon */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 md:py-0 border-t md:border-t-0 md:border-l border-slate-950 bg-slate-950 text-slate-400 text-[10px] font-mono select-none">

          {/* Toggle crawler styles */}
          <button
            onClick={() => setTickerMode(tickerMode === "marquee" ? "carousel" : "marquee")}
            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-[9px]"
            title="Switch news stream presentation type"
          >
            <SlidersHorizontal size={9} className="text-blue-500" />
            <span>{tickerMode === "marquee" ? "STREAM" : "SLIDER"}</span>
          </button>

          <span className="text-slate-800 font-sans">|</span>

          {/* Speed settings dropdown (only for marquee stream) */}
          {tickerMode === "marquee" && (
            <>
              <div className="flex items-center gap-1 text-[9px]">
                <span className="text-slate-600">SPEED:</span>
                {(["slow", "normal", "fast"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScrollSpeed(s)}
                    className={`px-1 rounded uppercase font-extrabold text-[8px] transition cursor-pointer ${
                      scrollSpeed === s 
                        ? "bg-blue-900/70 text-blue-300 border border-blue-800/60" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-slate-800 font-sans">|</span>
            </>
          )}

          {/* UTC Clock validation widget */}
          <div className="flex items-center gap-1 text-slate-500 text-[9px]">
            <Clock size={10} className="text-teal-500" />
            <span className="font-bold tracking-tight">{currentTime || "LIVE STREAM"}</span>
          </div>

        </div>

      </div>

      {/* DETAILED EXPANSION BULLETIN DIALOG POPOVER */}
      {selectedBulletin && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          id="detailed_bulletin_dialog"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            
            {/* Header section with live flashing state badge */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-rose-700 text-white font-sans font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  <AlertTriangle size={10} />
                  Live bulletin
                </span>
                <span className="text-slate-500 text-xs font-mono">
                  ID: {selectedBulletin.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedBulletin(null)}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Core Bulletin body */}
            <div className="p-6 space-y-5">
              
              <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-xl">
                <p className="text-base text-white tracking-wide font-medium leading-relaxed font-sans first-letter:text-2xl first-letter:font-bold first-letter:text-rose-500">
                  {selectedBulletin.text}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-4 border-t border-slate-900 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-550" />
                    Published: {new Date(selectedBulletin.createdAt).toLocaleString()}
                  </span>
                  <span>Active Live Stream</span>
                </div>
              </div>

              {/* Utility command bar */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleCopy(selectedBulletin.text)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-705 border border-slate-700 shadow text-[11px] text-slate-200 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy text to clipboard
                    </>
                  )}
                </button>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `BREAKING: ${selectedBulletin.text} via Fast Coverage Live Feed`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-sky-950/50 hover:bg-sky-900/50 border border-sky-900 text-[11px] text-sky-400 px-3 py-2 rounded-lg font-bold transition"
                >
                  <ExternalLink size={12} />
                  Share bulletin
                </a>
              </div>

              {/* Related detailed database articles keyword matching */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText size={12} className="text-blue-500" />
                    Recommended Deep Coverage Articles
                  </h5>
                  <span className="text-[9px] font-mono text-slate-600 uppercase">Live Cross-Reference</span>
                </div>

                {isLoadingRelated ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-500 font-mono animate-pulse">
                    <Clock size={13} className="animate-spin" />
                    Searching corresponding archive catalogs...
                  </div>
                ) : matchingArticles.length > 0 ? (
                  <div className="space-y-2">
                    {matchingArticles.map((art) => (
                      <div
                        key={art.id}
                        className="p-3 bg-slate-950/30 hover:bg-slate-950/70 border border-slate-850 rounded-xl flex items-center justify-between gap-4 transition group"
                      >
                        <div className="truncate flex-1">
                          <h6 className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition truncate">
                            {art.title}
                          </h6>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {art.excerpt || art.content.substring(0, 100)}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 group-hover:text-blue-400 transition shrink-0 flex items-center gap-1">
                          Open Coverage
                          <ExternalLink size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 bg-slate-950/15 border border-dashed border-slate-850 rounded-xl text-slate-500 text-[11px] font-sans">
                    No matching articles are tagged directly under the keyword profiles of this bulletin.
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
