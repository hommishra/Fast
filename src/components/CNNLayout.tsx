import React from "react";
import { Article, Category } from "../types";
import { Clock, Eye, TrendingUp } from "lucide-react";

interface CNNLayoutProps {
  articles: Article[];
  categories: Category[];
  onSelectArticle: (art: Article) => void;
  selectedCategory: string;
  searchTerm: string;
}

export default function CNNLayout({
  articles,
  categories,
  onSelectArticle,
  selectedCategory,
  searchTerm,
}: CNNLayoutProps) {
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
                {art.featuredImage && (
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100 relative">
                    <img
                      src={art.featuredImage}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
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

  // Classic CNN Homepage Blueprint: Big spotlight, side list, bottom subgrids
  const featuredHero = filteredArticles[0];
  const sidebarStories = filteredArticles.slice(1, 4);
  const coreFlow = filteredArticles.slice(4);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-10" id="cnn_blueprint_view">
      {/* SECTION 1: Dynamic Spotlight Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
        {/* Spotlight Hero Article */}
        <div 
          onClick={() => onSelectArticle(featuredHero)}
          className="lg:col-span-2 group cursor-pointer space-y-4"
        >
          <div className="overflow-hidden bg-slate-100 rounded-xl aspect-[16/9] border border-slate-200 relative">
            <img
              src={featuredHero.featuredImage}
              alt={featuredHero.title}
              className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
              referrerPolicy="no-referrer"
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
                  {art.featuredImage && (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-slate-50 rounded-lg border border-slate-150 image-box relative">
                      <img
                        src={art.featuredImage}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
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
    </div>
  );
}
