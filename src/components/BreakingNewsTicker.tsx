import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { BreakingNews } from "../types";
import { AlertTriangle, Clock } from "lucide-react";

export default function BreakingNewsTicker() {
  const [tickerItems, setTickerItems] = useState<BreakingNews[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Listen for enabled breaking news in real-time
    const q = query(collection(db, "breaking_news"), where("active", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BreakingNews[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as BreakingNews);
      });
      setTickerItems(items);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 6000); // cycle statements every 6s
    return () => clearInterval(timer);
  }, [tickerItems]);

  if (tickerItems.length === 0) return null;

  const activeItem = tickerItems[currentIndex];

  return (
    <div className="bg-slate-950 text-slate-100 font-sans text-xs font-semibold flex items-center overflow-hidden border-b border-slate-800" id="breaking_news_ticker">
      <div className="bg-red-650 px-3.5 py-2.5 flex items-center gap-1.5 shrink-0 select-none">
        <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></div>
        <span className="tracking-widest uppercase text-[10px] font-black font-sans text-white">FLASH BULLETINS</span>
      </div>
      <div className="flex-1 px-4 py-2 truncate relative overflow-hidden font-medium text-slate-300">
        <span className="inline-block transition-transform duration-500 ease-out font-sans">
          {activeItem?.text}
        </span>
      </div>
      <div className="hidden md:flex items-center gap-1.5 shrink-0 px-4 py-2 text-slate-400 text-[10px] font-mono border-l border-slate-800 uppercase tracking-wider">
        <Clock size={11} className="text-blue-500" />
        <span>Live coverage</span>
      </div>
    </div>
  );
}
