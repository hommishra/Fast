import React from "react";
import { Article, Category, VideoItem, CoverageZone } from "../types";
import { Clock, Eye, TrendingUp, Tv } from "lucide-react";
import ActiveSectionsMap from "./ActiveSectionsMap";
import SmartVideoPlayer from "./SmartVideoPlayer";
import { getFallbackImage } from "../utils/imageHelpers";

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
  onSelectArticle: (art: Article) => void;
  selectedCategory: string;
  searchTerm: string;
}

export default function FCLayout({
  articles,
  categories,
  videos = [],
  coverageZones = [],
  onSelectArticle,
  selectedCategory,
  searchTerm,
}: FCLayoutProps) {
  // Filter active and published records
  const publishedArticles = articles.filter(
    (art) => art.status === "Published" && new Date(art.publishDate).getTime() <= Date.now()
  );

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
        <h3 className="text-2xl font-bold text-neutral-800">No Headlines Matching Search</h3>
        <p className="text-neutral-500 mt-2 text-sm max-w-md mx-auto">
          We couldn't locate any stories with that query. Try broadening your keywords or browse individual category sheets.
        </p>
      </div>
    );
  }

  // If filtered by category or search, render simple structured grid list
  if (selectedCategory || searchTerm) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8" id="filtered_grid_layout">
        <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight border-b border-slate-200 pb-2.5 flex items-center gap-2">
          <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] tracking-widest font-mono rounded">LIVE</span>
          {selectedCategory 
            ? categories.find(c => c.id === selectedCategory)?.name 
            : `Search Results: "${searchTerm}"`}
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
                    src={art.featuredImage || getFallbackImage(art.title, art.categoryId)}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackImage(art.title, art.categoryId);
                    }}
                  />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold font-sans">
                    {art.categoryId}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-3">
                    {art.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-3 font-sans">
                    {art.excerpt}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-blue-500" />
                  {formatDate(art.publishDate)}
                </span>
                <span className="flex items-center gap-1 font-bold text-red-600">
                  <Eye size={11} /> {art.views} reads
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
  const sidebarStories = filteredArticles.slice(1, 4);
  const coreFlow = filteredArticles.slice(4);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-10" id="fc_blueprint_view">
      {/* SECTION 1: Dynamic Spotlight Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
        {/* Spotlight Hero Article */}
        <div 
          onClick={() => onSelectArticle(featuredHero)}
          className="lg:col-span-2 group cursor-pointer space-y-4"
        >
          <div className="overflow-hidden bg-slate-100 rounded-xl aspect-[16/9] border border-slate-200 relative">
            <img
              src={featuredHero.featuredImage || getFallbackImage(featuredHero.title, featuredHero.categoryId)}
              alt={featuredHero.title}
              className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFallbackImage(featuredHero.title, featuredHero.categoryId);
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-6 text-white pt-24 hidden md:block">
              <span className="bg-red-600 text-white text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded">
                Spotlight Bulletin
              </span>
              <h2 className="text-xl md:text-3xl font-black tracking-tight leading-snug mt-3">
                {featuredHero.title}
              </h2>
            </div>
          </div>

          <div className="md:hidden space-y-1.5">
            <span className="text-[9px] font-mono tracking-widest uppercase text-red-600 select-none">
              Spotlight Bulletin
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
              {featuredHero.title}
            </h2>
          </div>

          <p className="text-slate-600 text-xs md:text-sm leading-relaxed line-clamp-2">
            {featuredHero.excerpt}
          </p>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-800">By {featuredHero.authorName}</span>
            <span>&bull;</span>
            <span>{formatDate(featuredHero.publishDate)}</span>
          </div>
        </div>

        {/* Sidebar Headlines */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-900 border-l-3 border-blue-600 pl-2.5 flex items-center gap-1.5 font-sans select-none">
            <TrendingUp size={13} className="text-blue-600" />
            Bulletins & Analysis
          </h3>
          <div className="divide-y divide-slate-200">
            {sidebarStories.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="py-3 hover:bg-slate-50 rounded transition-colors group cursor-pointer space-y-1 first:pt-0"
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold font-sans">
                    {art.categoryId}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">
                    {formatDate(art.publishDate)}
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs leading-snug group-hover:text-blue-600 transition-colors">
                  {art.title}
                </h4>
                <p className="text-slate-500 text-[11px] line-clamp-1 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>
            ))}
            {sidebarStories.length === 0 && (
              <p className="text-slate-400 text-xs italic py-4">Updates pending. Connect server to sync.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Secondary Stories Row */}
      {coreFlow.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-550 tracking-wider uppercase border-b border-slate-200 pb-2 select-none font-sans">
            Latest Daily Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFlow.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="group cursor-pointer bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between hover:border-slate-300"
              >
                <div className="space-y-2">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-50 rounded-lg border border-slate-150 image-box relative">
                    <img
                      src={art.featuredImage || getFallbackImage(art.title, art.categoryId)}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackImage(art.title, art.categoryId);
                      }}
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold font-sans block">
                    {art.categoryId}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {art.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                  <span>{formatDate(art.publishDate)}</span>
                  <span className="font-bold text-red-650">{art.views} reads</span>
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
                  FAST COVERAGE VIDEO BULLETINS
                </h2>
                <span className="text-[10px] font-mono uppercase text-neutral-400 mt-0.5 tracking-wider block">
                  Media Releases, Editorial Descripts & Video Ground Reports
                </span>
              </div>
            </div>
            <span className="text-xs bg-neutral-800 border border-neutral-700 px-3 py-1 rounded-full text-neutral-300 font-mono self-start sm:self-center select-none font-bold">
              ● {videos.length} BRIEFINGS LIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.slice(0, 6).map((vid) => {
              const matchesYoutube = vid.url.includes("youtube.com") || vid.url.includes("youtu.be") || vid.url.includes("embed");
              return (
                <div 
                  key={vid.id}
                  className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg group shadow-sm"
                >
                  <div className="space-y-3.5">
                    {/* Embedded preview engine */}
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative shadow-inner">
                      {vid.isLive && (
                        <span className="absolute top-2 left-2 bg-red-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-15 animate-pulse flex items-center gap-1 select-none">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          LIVE NOW
                        </span>
                      )}
                      {vid.isScheduled && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-15 flex items-center gap-1 select-none">
                          <Clock size={10} />
                          SCHEDULED
                        </span>
                      )}
                      
                      <SmartVideoPlayer
                        src={vid.url}
                        title={vid.title}
                        className="rounded-lg"
                        status={vid.status}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-red-500 transition-colors duration-200 leading-snug line-clamp-2">
                        {vid.title}
                      </h4>
                      {vid.isScheduled && vid.scheduledTime && (
                        <p className="text-[10px] text-blue-400 font-mono font-bold flex items-center gap-1 select-none pb-1">
                          <Clock size={10} className="text-blue-400 animate-spin-slow" />
                          Streaming on: {safeFormatDateTime(vid.scheduledTime)}
                        </p>
                      )}
                      <p className="text-neutral-400 text-xs leading-relaxed line-clamp-3 font-sans">
                        {vid.description}
                      </p>
                    </div>
                  </div>

                  {/* Date Badge */}
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono mt-4 pt-3 border-t border-neutral-800 pb-0.5 select-none hover:text-neutral-450">
                    <Clock size={11} className="text-neutral-400" />
                    <span>PUBLISHED: {safeFormatDateFull(vid.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: Interactive Coverage Zone Map */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-4 animate-fadeIn" id="news_coverage_geomap_section">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-light pb-4 mb-2">
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2 tracking-tight uppercase">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" />
              Active Coverage Sections Maps
            </h3>
            <p className="text-xs text-slate-500 mt-1 select-none">
              Live correspondent tracking, global telemetry sectors, and incident reports from our regional bureau desks.
            </p>
          </div>
          <span className="font-mono text-[9px] font-bold text-neutral-500 mt-2 md:mt-0 uppercase tracking-wider bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded">
            ● {coverageZones.length} BUREAU STATIONS LIVE
          </span>
        </div>

        <ActiveSectionsMap
          zones={coverageZones}
          isAdmin={false}
        />
      </div>

    </div>
  );
}
