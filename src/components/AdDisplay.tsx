import React, { useEffect, useRef, useState } from 'react';
import { AdSlot } from '../types';
import { ExternalLink, Play, Pause, Volume2, VolumeX, Sparkles, X } from 'lucide-react';

interface AdDisplayProps {
  ad?: AdSlot;
  position?: string;
  adSlots?: AdSlot[];
  className?: string;
  onDismiss?: () => void;
}

export default function AdDisplay({ ad, position, adSlots, className = '', onDismiss }: AdDisplayProps) {
  const [impressionLogged, setImpressionLogged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find active ad matching position if direct ad not passed
  const activeAd = React.useMemo(() => {
    if (ad) return ad;
    if (!adSlots || !position) return undefined;

    const today = new Date().toISOString().split('T')[0];
    const posLower = position.toLowerCase().trim();

    const candidates = adSlots.filter((slot) => {
      if (!slot.active) return false;

      // Check date range
      if (slot.startDate && slot.startDate > today) return false;
      if (slot.endDate && slot.endDate < today) return false;

      const slotTypeLower = (slot.type || '').toLowerCase().trim();
      const slotPosLower = (slot.position || '').toLowerCase().trim();

      // Flexible position matching
      if (slotPosLower === posLower || slotTypeLower === posLower) return true;
      if (posLower.includes('homepage') && (slotPosLower.includes('homepage') || slotTypeLower === 'header' || slotTypeLower === 'banner')) return true;
      if (posLower.includes('sidebar') && (slotPosLower.includes('sidebar') || slotTypeLower === 'sidebar')) return true;
      if (posLower.includes('footer') && (slotPosLower.includes('footer') || slotTypeLower === 'footer')) return true;
      if (posLower.includes('article') && (slotPosLower.includes('article') || slotTypeLower.includes('article'))) return true;
      if (posLower.includes('live') && (slotPosLower.includes('live') || slotTypeLower.includes('live'))) return true;
      if (posLower.includes('breaking') && (slotPosLower.includes('breaking') || slotTypeLower.includes('breaking'))) return true;

      return false;
    });

    if (candidates.length === 0) return undefined;

    // Prioritize pinned ads
    const pinned = candidates.find((c) => c.isPinned);
    return pinned || candidates[0];
  }, [ad, position, adSlots]);

  // Log impression once
  useEffect(() => {
    if (activeAd && activeAd.id && !impressionLogged) {
      setImpressionLogged(true);
      fetch(`/api/ads/${activeAd.id}/impression`, { method: 'POST' }).catch(() => {});
    }
  }, [activeAd, impressionLogged]);

  if (!activeAd || !activeAd.active) return null;

  const targetRedirectUrl = activeAd.targetUrl || 'https://fastcoverages.com';

  const handleAdClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Log click on server
    if (activeAd.id) {
      fetch(`/api/ads/${activeAd.id}/click`, { method: 'POST' }).catch(() => {});
    }

    // Redirect to advertiser URL in new tab
    if (targetRedirectUrl) {
      const url = targetRedirectUrl.startsWith('http') ? targetRedirectUrl : `https://${targetRedirectUrl}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const isVideoAd = activeAd.mediaType === 'video' || activeAd.videoUrl || activeAd.adType === 'Video Ad';

  return (
    <div
      id={`ad-display-${activeAd.id}`}
      className={`w-full flex flex-col items-center justify-center bg-slate-900/90 dark:bg-slate-950/95 border border-slate-700/60 dark:border-red-900/40 p-2.5 rounded-xl shadow-lg relative group overflow-hidden transition-all duration-300 my-3 ${className}`}
    >
      {/* Top Header Tag Bar */}
      <div className="w-full flex items-center justify-between px-2 py-1 mb-1 text-[10px] font-mono tracking-wider text-slate-400 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          <span className="text-red-400 font-extrabold">SPONSORED ADVERTISEMENT</span>
        </div>
        <div className="flex items-center gap-2">
          {activeAd.position && (
            <span className="text-[9px] uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 hidden sm:inline">
              {activeAd.position}
            </span>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
              title="Close advertisement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex flex-col items-center justify-center relative">
        {isVideoAd && (activeAd.videoUrl || activeAd.mediaUrl) ? (
          <div className="relative w-full aspect-video max-h-[360px] bg-black rounded-lg overflow-hidden border border-slate-800 group/vid">
            <video
              ref={videoRef}
              src={activeAd.videoUrl || activeAd.mediaUrl}
              poster={activeAd.imageUrl}
              autoPlay={activeAd.autoPlay !== false}
              muted={isMuted}
              loop
              playsInline
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleAdClick}
            />

            {/* Video Controls Overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/75 px-2 py-1 rounded-md text-white text-xs border border-white/20 z-10 backdrop-blur-sm">
              <button
                type="button"
                onClick={togglePlay}
                className="hover:text-red-400 p-1 cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-red-400 p-1 cursor-pointer transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Click to Visit Banner Overlay */}
            <div
              onClick={handleAdClick}
              className="absolute top-2 left-2 bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded flex items-center gap-1 shadow cursor-pointer transition-all border border-red-400/40"
            >
              <ExternalLink className="w-3 h-3" />
              <span>VISIT SPONSOR SITE</span>
            </div>
          </div>
        ) : activeAd.imageUrl || activeAd.mediaUrl ? (
          <a
            href={targetRedirectUrl}
            onClick={handleAdClick}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full group/img overflow-hidden rounded-lg cursor-pointer border border-slate-800 hover:border-red-600/50 transition-all"
          >
            <img
              src={activeAd.imageUrl || activeAd.mediaUrl}
              alt={activeAd.title || activeAd.label}
              className="w-full h-auto max-h-[320px] object-cover rounded-lg group-hover/img:scale-[1.01] transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {/* Click Hover Action Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-3">
              <span className="text-xs font-bold text-white font-sans line-clamp-1">
                {activeAd.title || activeAd.label}
              </span>
              <span className="bg-red-600 text-white text-[10px] font-black font-mono px-2 py-1 rounded flex items-center gap-1 shrink-0 shadow">
                <span>VISIT WEBSITE</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </a>
        ) : activeAd.code ? (
          <div
            onClick={handleAdClick}
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 cursor-pointer overflow-hidden max-h-[250px]"
            dangerouslySetInnerHTML={{ __html: activeAd.code }}
          />
        ) : (
          <div
            onClick={handleAdClick}
            className="w-full py-8 px-4 bg-slate-900/80 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-500/50 transition-colors"
          >
            <Sparkles className="w-6 h-6 text-red-500 mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-slate-200">{activeAd.title || activeAd.label}</h4>
            {activeAd.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-md line-clamp-2">{activeAd.description}</p>
            )}
            <div className="mt-3 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow transition-colors font-mono">
              <span>EXPLORE NOW</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Ad Footer Label */}
      {activeAd.title && (activeAd.imageUrl || isVideoAd) && (
        <div className="w-full flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-400 font-mono">
          <span className="line-clamp-1 font-semibold text-slate-300">{activeAd.title}</span>
          <a
            href={targetRedirectUrl}
            onClick={handleAdClick}
            className="text-red-400 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer font-bold"
          >
            <span>Click to visit</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </div>
  );
}
