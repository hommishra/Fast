import { BreakingNewsItem } from '../types';
import { Radio, ChevronRight } from 'lucide-react';

interface NewsTickerProps {
  breakingNews: BreakingNewsItem[];
  onSelectHeadline?: (item: BreakingNewsItem) => void;
}

export default function NewsTicker({ breakingNews, onSelectHeadline }: NewsTickerProps) {
  const activeItems = breakingNews.filter(item => item.active);

  if (activeItems.length === 0) return null;

  // Pin important news items at the beginning
  const sortedItems = [...activeItems].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  return (
    <div id="breaking-ticker-bar" className="w-full bg-[#E10600] text-white flex items-stretch border-y border-red-700 font-sans shadow-md selection:bg-black shrink-0 relative z-20">
      
      {/* Premium CNN Style sharp breaking news tag */}
      <div className="bg-black text-white px-5 py-3 font-black uppercase text-xs tracking-[0.25em] flex items-center gap-2 shrink-0 z-20 shadow-[4px_0_15px_rgba(0,0,0,0.4)] relative">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
        <Radio className="w-4 h-4 text-[#E10600] animate-pulse shrink-0" />
        <span className="font-sans">BREAKING NEWS</span>
      </div>

      {/* Marquee slider container */}
      <div className="flex-1 overflow-hidden relative flex items-center bg-red-600/10">
        <div className="flex whitespace-nowrap animate-marquee items-center py-2 h-full gap-16 hover:[animation-play-state:paused] cursor-pointer">
          {sortedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectHeadline && onSelectHeadline(item)}
              className="flex items-center gap-3 text-xs md:text-sm font-extrabold text-white hover:text-red-100 transition text-left cursor-pointer focus:outline-none shrink-0"
            >
              {item.isPinned ? (
                <span className="bg-black text-yellow-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest font-mono shrink-0 uppercase">PINNED</span>
              ) : (
                <ChevronRight className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{item.title}</span>
              {item.category && (
                <span className="text-[9px] bg-black/40 border border-white/10 px-2 py-0.5 rounded font-mono uppercase font-black tracking-widest shrink-0">
                  {item.category}
                </span>
              )}
            </button>
          ))}
          
          {/* Double mapped items to ensure seamless loop in marquee */}
          {sortedItems.map((item) => (
            <button
              key={`${item.id}-loop`}
              onClick={() => onSelectHeadline && onSelectHeadline(item)}
              className="flex items-center gap-3 text-xs md:text-sm font-extrabold text-white hover:text-red-100 transition text-left cursor-pointer focus:outline-none shrink-0"
            >
              {item.isPinned ? (
                <span className="bg-black text-yellow-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest font-mono shrink-0 uppercase">PINNED</span>
              ) : (
                <ChevronRight className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{item.title}</span>
              {item.category && (
                <span className="text-[9px] bg-black/40 border border-white/10 px-2 py-0.5 rounded font-mono uppercase font-black tracking-widest shrink-0">
                  {item.category}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

