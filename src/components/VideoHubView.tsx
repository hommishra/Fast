import React, { useState, useMemo, useEffect } from "react";
import { VideoItem } from "../types";
import { 
  Play, 
  Tv, 
  ThumbsUp, 
  Eye, 
  Clock, 
  Search, 
  Share2, 
  Flame, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  Filter,
  Maximize,
  X
} from "lucide-react";
import SmartVideoPlayer from "./SmartVideoPlayer";
import { doc, updateDoc, increment, collection, onSnapshot, query, where, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../utils/LanguageContext";

interface VideoHubViewProps {
  videos: VideoItem[];
  currentUser?: any | null;
}

const VISIBLE_INCREMENT = 6;

export default function VideoHubView({ videos = [], currentUser }: VideoHubViewProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(VISIBLE_INCREMENT);
  const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({});
  const [dbLikes, setDbLikes] = useState<Record<string, number>>({});
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<VideoItem | null>(null);

  // Sync likes and track when video views increment
  useEffect(() => {
    // Read local liked states
    const savedLikes = localStorage.getItem("fc_video_likes");
    if (savedLikes) {
      try {
        setLocalLikes(JSON.parse(savedLikes));
      } catch (e) {
        console.warn("Cleared corrupt local likes cache");
      }
    }
  }, []);

  // Listen to Firestore real-time updates for video views and likes counts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "videoBulletins"), (snap) => {
      const counts: Record<string, number> = {};
      snap.forEach(docSnap => {
        const d = docSnap.data();
        counts[docSnap.id] = d.likes || 0;
      });
      setDbLikes(counts);
    });
    return () => unsub();
  }, []);

  // Available Categories (Clean, TOI/CNN Standard capitalization)
  const videoCategories = [
    "All", "Politics", "World", "Business", "Technology", "Sports", "Entertainment", "Audio"
  ];

  // Map user categories to match database categorization (which may be lowercase)
  const matchesCategory = (vidCat: string = "", filterCat: string) => {
    if (filterCat === "All") return true;
    
    // Check direct matches
    const normVidCat = vidCat.toLowerCase();
    const normFilterCat = filterCat.toLowerCase();

    if (normVidCat === normFilterCat) return true;
    if (normVidCat === "finance" && normFilterCat === "business") return true;

    return false;
  };

  // Safe formatting for Published Time Elapsed (e.g. "8 hours ago", "3 days ago")
  const formatPublishedAt = (isoString?: string) => {
    if (!isoString) return t("Recently");
    try {
      const pubDate = new Date(isoString);
      const diffMs = new Date().getTime() - pubDate.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 5 ? t("Just Now") : `${diffMins} ${t("minutes ago")}`;
      }
      if (diffHrs < 24) {
        return `${diffHrs} ${diffHrs === 1 ? t("hour ago") : t("hours ago")}`;
      }
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} ${diffDays === 1 ? t("day ago") : t("days ago")}`;
    } catch {
      return t("Recently");
    }
  };

  // Safe formatting with fallback support for views
  const formatViews = (count: number = 0) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // 1. Process matching files
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      // Category filter check
      const passesCategory = matchesCategory(vid.category, activeCategory);
      
      // Search term text check
      const passesSearch = searchTerm.trim() === "" || 
        vid.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        vid.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return passesCategory && passesSearch;
    });
  }, [videos, activeCategory, searchTerm]);

  // 2. Identify the optimal Hero Video (Featured or first available matching)
  const heroVideo = useMemo(() => {
    if (filteredVideos.length === 0) return null;
    const featured = filteredVideos.find(v => v.featured);
    return featured || filteredVideos[0];
  }, [filteredVideos]);

  // 3. Keep remaining list
  const listVideos = useMemo(() => {
    if (!heroVideo) return [];
    return filteredVideos.filter(v => v.id !== heroVideo.id);
  }, [filteredVideos, heroVideo]);

  // Increment view counts on firestore in real-time
  const registerVideoPlay = async (vid: VideoItem) => {
    setActiveVideoId(vid.id);
    try {
      const vRef = doc(db, "videoBulletins", vid.id);
      await updateDoc(vRef, {
        views: increment(1)
      });
      // Mirror to legacy if exists
      const fallbackRef = doc(db, "videos", vid.id);
      await updateDoc(fallbackRef, {
        views: increment(1)
      }).catch(() => {});
    } catch (e) {
      console.warn("Counter view update bypassed:", e);
    }
  };

  // Toggle Like counter and update state
  const toggleLike = async (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    const isLiked = localLikes[vid.id];
    const newLikesState = { ...localLikes, [vid.id]: !isLiked };
    
    // Persist locally
    localStorage.setItem("fc_video_likes", JSON.stringify(newLikesState));
    setLocalLikes(newLikesState);
    
    try {
      const change = isLiked ? -1 : 1;
      const vRef = doc(db, "videoBulletins", vid.id);
      await updateDoc(vRef, {
        likes: increment(change)
      });
      // Mirror update to legacy "videos" if defined
      const fallbackRef = doc(db, "videos", vid.id);
      await updateDoc(fallbackRef, {
        likes: increment(change)
      }).catch(() => {});
    } catch (err) {
      console.warn("Failed recording action, bypassing:", err);
    }
  };

  const handleShare = (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: vid.title,
        text: vid.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/#videos?play=${vid.id}`);
      alert(t("Link copied to clipboard!"));
    }
  };

  const activePageVideosList = listVideos.slice(0, visibleCount);
  const showLoadMore = listVideos.length > visibleCount;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 select-none" id="news_video_hub_root">
      
      {/* SECTION HEADER: Red CNN style border accent */}
      <div className="border-b-4 border-red-650 pb-3 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-7 bg-red-600 rounded-sm shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tighter text-slate-900 uppercase flex items-center gap-2">
              <span>{t("VIDEO HUB")}</span>
              <span className="text-red-605 text-xs bg-red-50 border border-red-100 rounded px-1.5 py-0.5 animate-pulse normal-case font-extrabold tracking-normal">
                {t("ON-DEMAND STREAMING")}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-mono tracking-wider mt-0.5 uppercase">
              {t("Premium Ground Reports, Political Analyses, & Global Editorial Feeds")}
            </p>
          </div>
        </div>

        {/* Video Searching Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            className="w-full bg-slate-100 border border-slate-200 focus:bg-white text-xs text-slate-900 rounded-md py-2 pl-8 pr-4 font-sans focus:outline-none focus:border-red-605 transition-all"
            placeholder={t("Filter video stories...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* CATEGORIES NAVIGATION BAR: Horizontally scrolling capsule badges */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="p-1 px-2.5 bg-slate-900/5 border border-slate-200/50 rounded-lg text-[10px] text-slate-500 font-bold uppercase shrink-0 flex items-center gap-1 font-mono tracking-wide">
          <Filter size={11} className="text-slate-500" />
          <span>{t("CHANNELS")}:</span>
        </div>
        {videoCategories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setVisibleCount(VISIBLE_INCREMENT);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-bold font-sans uppercase tracking-widest transition-all cursor-pointer shrink-0 border ${
                isActive 
                  ? "bg-red-600 border-red-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {t(cat)}
            </button>
          );
        })}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-xs">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Tv size={28} />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">{t("No matching broadcasts found")}</h3>
          <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
            {t("We couldn't locate any video bulletins for your criteria. Check back in a few moments for freshly published ground insights.")}
          </p>
          <button
            onClick={() => {
              setActiveCategory("All");
              setSearchTerm("");
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-red-700 transition"
          >
            {t("RESET CHANNELS")}
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
            
            {/* 1. HERO FEATURED VIDEO CARD */}
            {heroVideo && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden group" id={`hero_broadcast_${heroVideo.id}`}>
                {/* Visual Stage Container */}
                <div className="relative aspect-video bg-black overflow-hidden z-0">
                  <SmartVideoPlayer
                    src={heroVideo.videoUrl || heroVideo.url}
                    title={heroVideo.title}
                    thumbnailUrl={heroVideo.thumbnailUrl}
                    status={heroVideo.status}
                    videoId={heroVideo.id}
                    className="w-full h-full"
                  />
                  
                  {/* Visual badges overlays */}
                  <div className="absolute top-3 left-3 flex gap-2 pointer-events-none z-10">
                    <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded shadow-md flex items-center gap-1">
                      <Sparkles size={9} className="fill-current text-white animate-pulse" />
                      {t("FEATURED BULLETIN")}
                    </span>
                    {heroVideo.category && (
                      <span className="bg-slate-900/85 backdrop-blur-[2px] border border-neutral-700/30 text-white text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        {heroVideo.category}
                      </span>
                    )}
                  </div>

                  {/* Top Right Duration Badge */}
                  {heroVideo.duration && heroVideo.duration !== "0:00" && (
                    <span className="absolute bottom-3 right-3 bg-black/85 text-white font-mono text-[9.5px] font-black px-2 py-0.5 rounded shadow-lg pointer-events-none z-10 select-none">
                      {heroVideo.duration}
                    </span>
                  )}
                </div>

                {/* Meta details */}
                <div className="p-5 md:p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-red-655 border border-slate-200/50">
                      {t(heroVideo.category || "General")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} className="text-slate-400" />
                      {formatViews(heroVideo.views)} {t("Views")}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {formatPublishedAt(heroVideo.publishedAt)}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black font-sans text-slate-900 tracking-tight leading-tight uppercase group-hover:text-red-600 transition-colors">
                    {heroVideo.title}
                  </h2>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-sans font-medium">
                    {heroVideo.description}
                  </p>

                  {/* Share and Like buttons bottom trigger */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedVideo(heroVideo);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-black border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition uppercase"
                      title={t("Cinematic Expand")}
                    >
                      <Maximize size={11} />
                      <span>{t("EXPAND PLAYBACK")}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleLike(e, heroVideo)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-black border transition cursor-pointer ${
                          localLikes[heroVideo.id]
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <ThumbsUp size={11.5} className={localLikes[heroVideo.id] ? "fill-current text-red-600 animate-bounce" : ""} />
                        <span>{dbLikes[heroVideo.id] !== undefined ? dbLikes[heroVideo.id] : (heroVideo.likes || 0)}</span>
                      </button>

                      <button
                        onClick={(e) => handleShare(e, heroVideo)}
                        className="p-2 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title={t("Share Video Link")}
                      >
                        <Share2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DYNAMIC VIDEO LIST: Thumbnail Left, content right */}
            <div className="space-y-4">
              <h3 className="text-xs font-black font-mono uppercase tracking-widest text-slate-600 border-b border-slate-200 pb-2 mb-4">
                🎥 {t("MORE BROADCAST COVERAGES")}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {activePageVideosList.map((vid) => {
                  const isPlayingActive = activeVideoId === vid.id;
                  return (
                    <div 
                      key={vid.id} 
                      className={`bg-white rounded-xl shadow-xs border transition-all duration-300 p-3 md:p-4 flex flex-col md:flex-row gap-4 relative group ${
                        isPlayingActive ? "ring-2 ring-red-600 border-transparent shadow-sm bg-slate-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                      id={`list_bulletin_card_${vid.id}`}
                    >
                      {/* Left Thumbnail stage (40% width approx) */}
                      <div className="relative w-full md:w-56 shrink-0 aspect-video rounded-lg overflow-hidden bg-neutral-900 group shadow-inner">
                        {isPlayingActive ? (
                          <SmartVideoPlayer
                            src={vid.videoUrl || vid.url}
                            title={vid.title}
                            thumbnailUrl={vid.thumbnailUrl}
                            status={vid.status}
                            videoId={vid.id}
                            className="w-full h-full"
                          />
                        ) : (
                          <>
                            <img
                              src={vid.thumbnailUrl || "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=300"}
                              alt={vid.title}
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=300";
                              }}
                            />
                            {/* Accent Play Button */}
                            <div 
                              onClick={() => registerVideoPlay(vid)}
                              className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/20 transition duration-200 cursor-pointer"
                            >
                              <div className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform transition group-hover:scale-110">
                                <Play size={15} className="fill-current text-white translate-x-0.5" />
                              </div>
                            </div>
                          </>
                        )}

                        {vid.duration && vid.duration !== "0:00" && (
                          <span className="absolute bottom-2 right-2 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow select-none font-extrabold">
                            {vid.duration}
                          </span>
                        )}
                        
                        {vid.isLive && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow animate-pulse">
                            {t("LIVE NOW")}
                          </span>
                        )}
                      </div>

                      {/* Right Details stage */}
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">
                            <span className="text-red-600 font-extrabold">{vid.category || "politics"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Eye size={10} className="text-slate-400" />
                              {formatViews(vid.views)}
                            </span>
                            <span>•</span>
                            <span>{formatPublishedAt(vid.publishedAt)}</span>
                          </div>

                          <h4 
                            onClick={() => registerVideoPlay(vid)}
                            className="text-sm md:text-base font-black text-slate-900 group-hover:text-red-750 font-sans transition-colors cursor-pointer leading-snug uppercase line-clamp-2"
                          >
                            {vid.title}
                          </h4>
                          <p className="text-slate-500 text-xs leading-normal font-sans line-clamp-2">
                            {vid.description}
                          </p>
                        </div>

                        {/* Interactive actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedVideo(vid);
                            }}
                            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-650 px-2.5 py-1 rounded-md text-[9px] font-mono font-black border border-slate-200 cursor-pointer transition uppercase"
                            title={t("Cinematic Expand")}
                          >
                            <Maximize size={9} className="text-slate-500" />
                            <span>{t("EXPAND")}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => toggleLike(e, vid)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-mono font-black border transition cursor-pointer ${
                                localLikes[vid.id]
                                  ? "bg-red-50 border-red-200 text-red-600"
                                  : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                              }`}
                            >
                              <ThumbsUp size={10} className={localLikes[vid.id] ? "fill-current text-red-600" : ""} />
                              <span>{dbLikes[vid.id] !== undefined ? dbLikes[vid.id] : (vid.likes || 0)}</span>
                            </button>

                            <button
                              onClick={(e) => handleShare(e, vid)}
                              className="p-1 px-2 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md cursor-pointer flex items-center justify-center transition"
                              title={t("Copy Broadcast Link")}
                            >
                              <Share2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite Scroll Load More trigger */}
              {showLoadMore && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + VISIBLE_INCREMENT)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    {t("LOAD MORE VIDEOS")}
                  </button>
                </div>
              )}
            </div>

        </div>
      )}

      {/* Cinematic Expanded Screen Light-box Overlay Modal */}
      {expandedVideo && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fadeIn">
          {/* Top Panel Actions */}
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[9.5px] font-mono font-extrabold uppercase">
                {expandedVideo.category || "General"}
              </span>
              <h3 className="font-sans font-black text-sm uppercase tracking-wide line-clamp-1">
                {expandedVideo.title}
              </h3>
            </div>
            <button
              onClick={() => setExpandedVideo(null)}
              className="p-2 bg-white/10 hover:bg-white/20 hover:text-red-500 text-white rounded-full transition cursor-pointer"
              title={t("Close Overlay")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Video Player Main Frame */}
          <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <SmartVideoPlayer
              src={expandedVideo.videoUrl || expandedVideo.url}
              title={expandedVideo.title}
              thumbnailUrl={expandedVideo.thumbnailUrl}
              status={expandedVideo.status}
              videoId={expandedVideo.id}
              className="w-full h-full"
            />
          </div>

          {/* Video Description Meta Details */}
          <div className="w-full max-w-5xl mt-5 space-y-2 text-white">
            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl font-sans font-medium">
              {expandedVideo.description}
            </p>
            <div className="flex items-center gap-6 text-[10.5px] font-mono text-slate-400 pt-2 border-t border-white/5">
              <span>Views: {formatViews(expandedVideo.views)}</span>
              <span>Published: {formatPublishedAt(expandedVideo.publishedAt)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
