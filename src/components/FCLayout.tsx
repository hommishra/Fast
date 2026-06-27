import React, { useState } from "react";
import { Article, Category, VideoItem, CoverageZone, EBook } from "../types";
import { Clock, Eye, TrendingUp, Tv, Camera, ChevronLeft, ChevronRight, BookOpen, Download, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ActiveSectionsMap from "./ActiveSectionsMap";
import SmartVideoPlayer from "./SmartVideoPlayer";
import EBookReaderModal from "./EBookReaderModal";
import AdSlot from "./AdSlot";
import { getFallbackImage } from "../utils/imageHelpers";
import { useLanguage } from "../utils/LanguageContext";

const getArticleThumb = (art: Article) => {
  if (art.images && art.images.length > 0) {
    return art.images[0];
  }
  if (art.imageGallery && art.imageGallery.length > 0) {
    return art.imageGallery[0];
  }
  return art.featuredImage || getFallbackImage(art.title, art.categoryId);
};

const getArticleImagesCount = (art: Article) => {
  if (art.images && art.images.length > 0) {
    return art.images.length;
  }
  if (art.imageGallery && art.imageGallery.length > 0) {
    return art.imageGallery.length;
  }
  return 0;
};

const safeFormatDateFull = (isoStr?: string) => {
  if (!isoStr) return "Just now";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recently";
  }
};

const safeFormatDateTime = (isoStr?: string) => {
  if (!isoStr) return "Coming soon";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "Coming soon";
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Coming soon";
  }
};

interface FCLayoutProps {
  articles: Article[];
  categories: Category[];
  videos?: VideoItem[];
  coverageZones?: CoverageZone[];
  ebooks?: EBook[];
  onSelectArticle: (art: Article) => void;
  selectedCategory: string;
  searchTerm: string;
}

export default function FCLayout({
  articles,
  categories,
  videos = [],
  coverageZones = [],
  ebooks = [],
  onSelectArticle,
  selectedCategory,
  searchTerm,
}: FCLayoutProps) {
  const { t } = useLanguage();
  const [selectedEbook, setSelectedEbook] = useState<EBook | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Bulletins & Analysis Carousel States
  const [currentSidebarIndex, setCurrentSidebarIndex] = useState(0);
  const [sidebarDirection, setSidebarDirection] = useState(0);
  const [sidebarAutoplay, setSidebarAutoplay] = useState(true);

  const handleDownloadEbook = async (book: EBook) => {
    try {
      const { doc: fsDoc, updateDoc, increment } = await import("firebase/firestore");
      const { db } = await import("../firebase");
      await updateDoc(fsDoc(db, "ebooks", book.id), {
        downloadCount: increment(1)
      });
    } catch (err) {
      console.error("Failed to increment download count:", err);
    }

    if (book.pdfUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = book.pdfUrl;
      link.download = `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(book.pdfUrl, "_blank");
    }
  };

  // Filter active and published records
  const publishedArticles = articles.filter(
    (art) => art.status === "Published" && new Date(art.publishDate).getTime() <= Date.now()
  );

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollVideos = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.85;
      scrollContainerRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Apply filters based on Category & Search
  const filteredArticles = publishedArticles.filter((art) => {
    const matchesCategory = selectedCategory
      ? art.categoryId === selectedCategory || art.subCategoryId === selectedCategory
      : true;

    const matchesSearch = searchTerm
      ? art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.content.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (filteredArticles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center select-none" id="empty_headlines_grid">
        <h3 className="text-2xl font-bold text-neutral-800">{t("No Headlines Matching Search")}</h3>
        <p className="text-neutral-500 mt-2 text-sm max-w-md mx-auto">
          {t("We couldn't locate any stories with that query. Try broadening your keywords or browse individual category sheets.")}
        </p>
      </div>
    );
  }

  // If filtered by category or search, render simple structured grid list
  if (selectedCategory || searchTerm) {
    const matchedCategoryName = selectedCategory 
      ? categories.find(c => c.id === selectedCategory)?.name 
      : "";
    const headingText = selectedCategory 
      ? t(matchedCategoryName || "") 
      : `${t("Search Results:")} "${searchTerm}"`;

    return (
      <div className="max-w-7xl mx-auto px-6 py-8" id="filtered_grid_layout">
        <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b border-slate-200 pb-2.5 flex items-center gap-2">
          <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] tracking-widest font-mono rounded">{t("LIVE")}</span>
          {headingText}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer flex flex-col justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300"
            >
              <div className="space-y-3">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100 relative">
                  <img
                    src={getArticleThumb(art)}
                    alt={t(art.title)}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackImage(art.title, art.categoryId);
                    }}
                  />
                  {getArticleImagesCount(art) > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded shadow z-10 flex items-center gap-1">
                      <Camera size={11} className="text-blue-400" />
                      {getArticleImagesCount(art)} {t("Photos")}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold font-sans">
                    {t(art.categoryId)}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-3">
                    {t(art.title)}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-3 font-sans">
                    {t(art.excerpt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-blue-500" />
                  {formatDate(art.publishDate)}
                </span>
                <span className="flex items-center gap-1 font-bold text-red-600">
                  <Eye size={11} /> {art.views} {t("reads")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Classic FC Homepage Blueprint: Big spotlight, side list, bottom subgrids
  const featuredHero = filteredArticles[0];
  const sidebarStories = filteredArticles.slice(1, 7);
  const coreFlow = filteredArticles.slice(4);

  // Auto-advance bulletins and analysis slides smoothly
  React.useEffect(() => {
    if (!sidebarAutoplay || sidebarStories.length <= 1) return;
    const interval = setInterval(() => {
      setSidebarDirection(1);
      setCurrentSidebarIndex((prev) => (prev + 1) % sidebarStories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [sidebarAutoplay, sidebarStories.length]);

  // Adjust index if list shrinks below active index
  React.useEffect(() => {
    if (currentSidebarIndex >= sidebarStories.length) {
      setCurrentSidebarIndex(0);
      setSidebarDirection(0);
    }
  }, [sidebarStories.length, currentSidebarIndex]);

  const handleSidebarNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sidebarStories.length <= 1) return;
    setSidebarDirection(1);
    setCurrentSidebarIndex((prev) => (prev + 1) % sidebarStories.length);
  };

  const handleSidebarPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sidebarStories.length <= 1) return;
    setSidebarDirection(-1);
    setCurrentSidebarIndex((prev) => (prev - 1 + sidebarStories.length) % sidebarStories.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 280, damping: 28, mass: 0.8 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 280, damping: 28, mass: 0.8 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-10 animate-in fade-in duration-300" id="fc_blueprint_view">
      
      {/* SECTION 1: Dynamic Spotlight Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
        {/* Spotlight Hero Article */}
        <div 
          onClick={() => onSelectArticle(featuredHero)}
          className="lg:col-span-2 group cursor-pointer space-y-4"
        >
          <div className="overflow-hidden bg-slate-100 rounded-2xl aspect-[16/9] border border-slate-200 relative shadow-md transition-shadow group-hover:shadow-lg">
            <img
              src={getArticleThumb(featuredHero)}
              alt={t(featuredHero.title)}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFallbackImage(featuredHero.title, featuredHero.categoryId);
              }}
            />
            {getArticleImagesCount(featuredHero) > 1 && (
              <span className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider font-bold px-3 py-1 rounded shadow z-10 flex items-center gap-1.5 md:hidden">
                <Camera size={12} className="text-blue-400" />
                {getArticleImagesCount(featuredHero)} {t("Photos")}
              </span>
            )}
            {getArticleImagesCount(featuredHero) > 1 && (
              <span className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider font-bold px-3 py-1 rounded shadow z-10 flex items-center gap-1.5 hidden md:flex border border-white/10">
                <Camera size={12} className="text-blue-400" />
                {t("Gallery:")} {getArticleImagesCount(featuredHero)} {t("Photos")}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-6 text-white pt-28 hidden md:block">
              <span className="bg-red-600 text-white text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded font-bold shadow-sm">
                {t("Spotlight Bulletin")}
              </span>
              <h2 className="text-xl md:text-3xl font-black tracking-tight leading-snug mt-3 group-hover:text-blue-400 transition-colors">
                {t(featuredHero.title)}
              </h2>
            </div>
          </div>

          <div className="md:hidden space-y-1.5">
            <span className="text-[9px] font-mono tracking-widest uppercase text-red-600 select-none font-bold">
              {t("Spotlight Bulletin")}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
              {t(featuredHero.title)}
            </h2>
          </div>

          <p className="text-slate-600 text-xs md:text-sm leading-relaxed line-clamp-2 font-sans font-medium">
            {t(featuredHero.excerpt)}
          </p>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-800">{t("By")} {featuredHero.authorName}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-blue-500" />
              {formatDate(featuredHero.publishDate)}
            </span>
          </div>
        </div>

        {/* Sidebar Headlines - Bulletins & Analysis Sliding Carousel */}
        <div className="space-y-4 flex flex-col justify-between h-full min-h-[430px]" id="bulletins_analysis_carousel_section">
          <div className="flex items-center justify-between select-none">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-900 border-l-3 border-blue-600 pl-2.5 flex items-center gap-1.5 font-sans">
              <TrendingUp size={13} className="text-blue-600" />
              {t("Bulletins & Analysis")}
            </h3>
            
            {/* Carousel Controls */}
            {sidebarStories.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSidebarAutoplay(!sidebarAutoplay)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  title={sidebarAutoplay ? t("Pause Autoplay") : t("Start Autoplay")}
                >
                  {sidebarAutoplay ? <Pause size={10} /> : <Play size={10} />}
                </button>
                <button
                  type="button"
                  onClick={handleSidebarPrev}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  title={t("Previous Bulletin")}
                >
                  <ChevronLeft size={11} />
                </button>
                <button
                  type="button"
                  onClick={handleSidebarNext}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  title={t("Next Bulletin")}
                >
                  <ChevronRight size={11} />
                </button>
              </div>
            )}
          </div>

          <div 
            className="relative bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow flex-1 flex flex-col justify-between overflow-hidden group/slider min-h-[360px]"
            onMouseEnter={() => setSidebarAutoplay(false)}
            onMouseLeave={() => setSidebarAutoplay(true)}
          >
            {sidebarStories.length > 0 ? (
              <>
                {/* Drag-to-slide wrapper with Framer Motion AnimatePresence */}
                <div className="relative flex-1 flex flex-col justify-between overflow-hidden">
                  <AnimatePresence initial={false} custom={sidebarDirection} mode="wait">
                    {(() => {
                      const art = sidebarStories[currentSidebarIndex];
                      if (!art) return null;
                      return (
                        <motion.div
                          key={art.id}
                          custom={sidebarDirection}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.4}
                          onDragEnd={(e, info) => {
                            const swipe = info.offset.x;
                            if (swipe < -50) {
                              handleSidebarNext();
                            } else if (swipe > 50) {
                              handleSidebarPrev();
                            }
                          }}
                          onClick={() => onSelectArticle(art)}
                          className="w-full h-full flex flex-col justify-between cursor-pointer space-y-3.5 absolute inset-0"
                        >
                          <div className="space-y-3">
                            {/* Slide Image */}
                            <div className="aspect-[18/9] w-full overflow-hidden bg-slate-100 rounded-xl border border-slate-150 relative">
                              <img
                                src={getArticleThumb(art)}
                                alt={t(art.title)}
                                className="w-full h-full object-cover group-hover/slider:scale-104 transition-transform duration-700 select-none pointer-events-none"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getFallbackImage(art.title, art.categoryId);
                                }}
                              />
                              <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded shadow select-none">
                                {t(art.categoryId)}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono select-none">
                                <span className="flex items-center gap-1">
                                  <Clock size={10} className="text-blue-500" />
                                  {formatDate(art.publishDate)}
                                </span>
                                <span className="font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[8px]">
                                  {t("Analysis")}
                                </span>
                              </div>
                              <h4 className="font-black text-slate-900 text-[13px] md:text-[14px] leading-snug group-hover/slider:text-blue-600 transition-colors line-clamp-3 select-none">
                                {t(art.title)}
                              </h4>
                              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 select-none">
                                {t(art.excerpt)}
                              </p>
                            </div>
                          </div>

                          {/* Footer with views */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-100 select-none">
                            <span className="flex items-center gap-1 font-bold text-red-650">
                              <Eye size={11} /> {art.views} {t("reads")}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {currentSidebarIndex + 1} / {sidebarStories.length}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* Bullets navigation & autoplay visual bar */}
                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100 select-none" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    {sidebarStories.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSidebarDirection(idx > currentSidebarIndex ? 1 : -1);
                          setCurrentSidebarIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentSidebarIndex ? "w-5 bg-blue-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Subtle autoplay countdown line */}
                  {sidebarAutoplay && (
                    <div className="w-full h-0.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        key={currentSidebarIndex}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="h-full bg-blue-500/60"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-xs italic py-4 text-center">{t("Updates pending. Connect server to sync.")}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Secondary Stories Row */}
      {coreFlow.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 select-none">
            <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              {t("Latest Daily Coverage")}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Universal Dispatch Feed</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFlow.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="premium-card group cursor-pointer bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-50 rounded-lg border border-slate-150 image-box relative">
                    <img
                      src={getArticleThumb(art)}
                      alt={t(art.title)}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackImage(art.title, art.categoryId);
                      }}
                    />
                    {getArticleImagesCount(art) > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded shadow z-10 flex items-center gap-1">
                        <Camera size={11} className="text-blue-400" />
                        {getArticleImagesCount(art)} {t("Photos")}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-red-650 font-extrabold font-sans block">
                    {t(art.categoryId)}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {t(art.title)}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-4 pt-2.5 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock size={10} className="text-blue-500" />
                    {formatDate(art.publishDate)}
                  </span>
                  <span className="font-bold text-red-600">{art.views} {t("reads")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Video Bulletins & Broadcasts section */}
      {videos.length > 0 && (
        <div className="mt-12 bg-neutral-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-neutral-800 animate-fadeIn" id="news_broadcast_videos_section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-red-800 text-white rounded-lg flex items-center justify-center shrink-0">
                <Tv size={18} className="text-white" />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white font-sans">
                  {t("FAST COVERAGE VIDEO BULLETINS")}
                </h2>
                <span className="text-[10px] font-mono uppercase text-neutral-400 mt-0.5 tracking-wider block">
                  {t("Media Releases, Editorial Descripts & Video Ground Reports")}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs bg-neutral-800 border border-neutral-700 px-3 py-1 rounded-full text-neutral-300 font-mono select-none font-bold">
                ● {videos.length} {t("BRIEFINGS LIVE")}
              </span>
              {videos.length > 1 && (
                <div className="flex items-center gap-2 select-none">
                  <button
                    onClick={() => scrollVideos("left")}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white border border-neutral-700 transition duration-200 cursor-pointer flex items-center justify-center"
                    title={t("Previous Slide")}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollVideos("right")}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white border border-neutral-700 transition duration-200 cursor-pointer flex items-center justify-center"
                    title={t("Next Slide")}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {videos.map((vid) => {
              const matchesYoutube = vid.url.includes("youtube.com") || vid.url.includes("youtu.be") || vid.url.includes("embed");
              return (
                <div 
                  key={vid.id}
                  className="w-[280px] sm:w-[340px] md:w-[370px] shrink-0 snap-start bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg group shadow-sm"
                >
                  <div className="space-y-3.5">
                    {/* Embedded preview engine */}
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative shadow-inner">
                      {vid.isLive && (
                        <span className="absolute top-2 left-2 bg-red-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-15 animate-pulse flex items-center gap-1 select-none">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          {t("LIVE NOW")}
                        </span>
                      )}
                      {vid.isScheduled && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-15 flex items-center gap-1 select-none">
                          <Clock size={10} />
                          {t("SCHEDULED")}
                        </span>
                      )}

                      {vid.duration && vid.duration !== "0:00" && (
                        <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-[2px] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow z-15 select-none pointer-events-none">
                          {vid.duration}
                        </span>
                      )}
                      
                      <SmartVideoPlayer
                        src={vid.url}
                        title={t(vid.title)}
                        className="rounded-lg"
                        status={vid.status}
                        thumbnailUrl={vid.thumbnailUrl}
                        videoId={vid.id}
                        fallbackFileName={vid.url && vid.url.includes("/uploads/") ? vid.url.split("/uploads/")[1].split(/[?#]/)[0] : ""}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-red-500 transition-colors duration-200 leading-snug line-clamp-2">
                        {t(vid.title)}
                      </h4>
                      {vid.isScheduled && vid.scheduledTime && (
                        <p className="text-[10px] text-blue-400 font-mono font-bold flex items-center gap-1 select-none pb-1">
                          <Clock size={10} className="text-blue-400 animate-spin-slow" />
                          {t("Streaming on:")} {safeFormatDateTime(vid.scheduledTime)}
                        </p>
                      )}
                      <p className="text-neutral-400 text-xs leading-relaxed line-clamp-3 font-sans">
                        {t(vid.description)}
                      </p>
                    </div>
                  </div>

                  {/* Date Badge */}
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono mt-4 pt-3 border-t border-neutral-800 pb-0.5 select-none hover:text-neutral-450">
                    <Clock size={11} className="text-neutral-400" />
                    <span>{t("PUBLISHED:")} {safeFormatDateFull(vid.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Homepage Banner Advertisement Slot */}
      <AdSlot placement="Homepage Banner" category={selectedCategory || "all"} />

      {/* SECTION 4: Interactive Coverage Zone Map */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-4 animate-fadeIn" id="news_coverage_geomap_section">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-light pb-4 mb-2">
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2 tracking-tight uppercase">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" />
              {t("Active Coverage Sections Maps")}
            </h3>
            <p className="text-xs text-slate-500 mt-1 select-none">
              {t("Live correspondent tracking, global telemetry sectors, and incident reports from our regional bureau desks.")}
            </p>
          </div>
          <span className="font-mono text-[9px] font-bold text-neutral-500 mt-2 md:mt-0 uppercase tracking-wider bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded">
            ● {coverageZones.length} {t("BUREAU STATIONS LIVE")}
          </span>
        </div>

        <ActiveSectionsMap
          zones={coverageZones}
          isAdmin={false}
        />
      </div>

      {/* SECTION 5: Digital Library & Downloadable E-Books */}
      {ebooks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6 animate-fadeIn mt-12" id="digital_library_ebooks_section">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2 tracking-tight uppercase">
                <BookOpen size={18} className="text-red-650" />
                {t("Digital Library & Publications")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 select-none">
                {t("Access our official media reports, analytical dossiers, and special edition digital publications inside our secure digital document reader.")}
              </p>
            </div>
            <span className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
              ● {ebooks.length} {t("Publications Available")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.map((book) => (
              <div 
                key={book.id} 
                onClick={() => {
                  handleDownloadEbook(book);
                }}
                className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-4 flex gap-4 transition-all duration-300 hover:shadow-md relative group cursor-pointer"
                title={t("Click to Download PDF")}
              >
                <div className="w-20 h-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow border border-slate-200 relative select-none">
                  <img 
                    src={book.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 left-1 bg-black/75 text-white text-[8px] font-mono font-bold px-1 rounded-sm shadow-sm select-none">
                    PDF
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase font-bold text-red-650 tracking-wider flex items-center gap-1">
                      <Download size={8} /> {t("CLICK TO DOWNLOAD")}
                    </span>
                    <h4 className="text-xs md:text-sm font-extrabold text-slate-900 line-clamp-1 leading-tight group-hover:text-red-700 transition-colors duration-200">
                      {book.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono font-medium truncate">
                      {t("By:")} {book.author}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {book.description || t("No summary provided.")}
                    </p>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-2">
                    <span className="text-[9px] text-slate-400 font-mono">
                      {book.fileSize || "1.2 MB"}
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEbook(book);
                          setIsReaderOpen(true);
                        }}
                        className="bg-red-700 hover:bg-red-850 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                      >
                        <BookOpen size={10} />
                        {t("Read")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Document Reader Modal overlay */}
      <EBookReaderModal
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setSelectedEbook(null);
        }}
        book={selectedEbook}
        onDownload={handleDownloadEbook}
      />

      {/* Sticky & Fullscreen Video Ad Slots */}
      <AdSlot placement="Sticky" />
      <AdSlot placement="Fullscreen" />

    </div>
  );
}
