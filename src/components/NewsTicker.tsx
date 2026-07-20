import { Article } from '../types';
import { Radio, ChevronRight } from 'lucide-react';

interface NewsTickerProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export default function NewsTicker({ articles, onSelectArticle }: NewsTickerProps) {
  const breakingNews = articles.filter(a => a.isPinned || a.category === 'World News').slice(0, 5);
  
  if (breakingNews.length === 0) return null;

  return (
    <div id="breaking-ticker-bar" className="w-full bg-editorial-accent text-white flex items-stretch border-y border-editorial-accent/80 font-sans shadow-md selection:bg-black shrink-0">
      
      {/* Red live pulsing tag */}
      <div className="bg-black text-white px-4 py-2.5 font-black uppercase text-xs tracking-[0.2em] flex items-center gap-1.5 shrink-0 z-10 shadow-lg shadow-black/20">
        <Radio className="w-4 h-4 text-editorial-accent animate-pulse shrink-0" />
        <span>BREAKING</span>
      </div>

      {/* Marquee scroll container */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="flex whitespace-nowrap animate-marquee items-center py-2 h-full gap-12">
          {breakingNews.map((art) => (
            <button
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="flex items-center gap-2 text-xs md:text-sm font-bold text-white hover:text-slate-100 transition text-left cursor-pointer focus:outline-none shrink-0"
            >
              <ChevronRight className="w-4 h-4 text-white fill-current shrink-0" />
              <span>{art.title}</span>
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-sm font-mono uppercase font-black tracking-wider shrink-0">{art.category}</span>
            </button>
          ))}
          {/* Double map to ensure seamless looping marquee */}
          {breakingNews.map((art) => (
            <button
              key={`${art.id}-dup`}
              onClick={() => onSelectArticle(art)}
              className="flex items-center gap-2 text-xs md:text-sm font-bold text-white hover:text-slate-100 transition text-left cursor-pointer focus:outline-none shrink-0"
            >
              <ChevronRight className="w-4 h-4 text-white fill-current shrink-0" />
              <span>{art.title}</span>
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-sm font-mono uppercase font-black tracking-wider shrink-0">{art.category}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
