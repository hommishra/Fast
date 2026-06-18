import React, { useState, useEffect, useRef } from "react";
import { getVideoFile } from "../indexedDB";
import { Clock, Radio, Play } from "lucide-react";

interface SmartVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  thumbnailUrl?: string; // Optional permanent thumbnail URL
  status?: string;       // e.g., "Processing" or "Published"
}

const SATELLITE_FALLBACK_URL = "https://assets.mixkit.co/videos/preview/mixkit-world-map-background-with-connections-34115-large.mp4";

export default function SmartVideoPlayer({ 
  src, 
  title = "Live News Bulletin", 
  className = "", 
  thumbnailUrl,
  status
}: SmartVideoPlayerProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setIsUsingFallback(false);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!src) {
      setLoading(false);
      return;
    }

    const checkLocalCache = async () => {
      // Handle parallel-streamed chunked video sources
      if (src.startsWith("chunked::")) {
        try {
          setLoading(true);
          const urls = src.replace("chunked::", "").split("|").map(u => u.trim()).filter(Boolean);
          if (urls.length === 0) throw new Error("No chunk URLs found in source");

          // Fetch all chunks in parallel to maximize throughput
          const responses = await Promise.all(
            urls.map(async (url) => {
              const res = await fetch(url);
              if (!res.ok) throw new Error(`HTTP error ${res.status} on segment chunk`);
              return res.blob();
            })
          );

          if (active) {
            const combinedBlob = new Blob(responses, { type: "video/mp4" });
            const comboUrl = URL.createObjectURL(combinedBlob);
            objectUrlRef.current = comboUrl;
            setResolvedSrc(comboUrl);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Transparent chunk stream reassembly failed:", error);
          if (active) {
            setResolvedSrc(SATELLITE_FALLBACK_URL);
            setIsUsingFallback(true);
            setLoading(false);
          }
          return;
        }
      }

      // If our source has local mock server route we try local indexedDB first
      if (src.startsWith("/uploads/")) {
        try {
          const cachedBlob = await getVideoFile(src);
          if (cachedBlob && active) {
            const cacheObjUrl = URL.createObjectURL(cachedBlob);
            objectUrlRef.current = cacheObjUrl;
            setResolvedSrc(cacheObjUrl);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn("Local IndexedDB retrieval error:", error);
        }
      }

      if (active) {
        setResolvedSrc(src);
        setLoading(false);
      }
    };

    checkLocalCache();

    return () => {
      active = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src]);

  const handleVideoError = () => {
    if (resolvedSrc !== SATELLITE_FALLBACK_URL) {
      console.warn(`Video failed to stream smoothly from "${src}". Activating Satellite Feed Standby.`);
      setResolvedSrc(SATELLITE_FALLBACK_URL);
      setIsUsingFallback(true);
    }
  };

  const isYoutube = src.includes("youtube.com") || src.includes("youtu.be") || src.includes("embed");

  if (status === "Processing" || (!src && resolvedSrc === "")) {
    return (
      <div className={`relative w-full h-full bg-neutral-900 group rounded-lg overflow-hidden aspect-video flex flex-col items-center justify-center text-center p-4 ${className}`} id={`processing_overlay_${title.slice(0, 5)}`}>
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center gap-2.5 max-w-xs px-2">
          <div className="relative flex items-center justify-center">
            <span className="w-9 h-9 border-2 border-red-500/10 border-t-red-650 rounded-full animate-spin" />
            <Clock size={12} className="absolute text-red-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="font-sans font-extrabold text-[11px] text-neutral-100 tracking-wider uppercase">Processing Bulletin</h4>
            <p className="font-mono text-[9px] text-neutral-400 leading-tight">Optimizing and publishing high-definition video segment stream. Watchable in a few seconds...</p>
          </div>
          <span className="px-2 py-0.5 bg-red-950/60 border border-red-900/20 rounded text-[7px] font-mono font-black text-red-400 uppercase tracking-widest animate-pulse select-none mt-1">
            Processing Video like YouTube
          </span>
        </div>
      </div>
    );
  }

  // YouTube layout directly embeds
  if (isYoutube) {
    const embedUrl = src.includes("embed")
      ? src
      : src.includes("youtu.be/")
      ? `https://www.youtube.com/embed/${src.split("youtu.be/")[1]?.split("?")[0]}`
      : `https://www.youtube.com/embed/${src.split("v=")[1]?.split("&")[0]}`;

    return (
      <div className={`relative w-full h-full bg-black aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full rounded-lg border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // If a thumbnail is supplied and user has NOT started playing, show beautiful preview placard
  if (thumbnailUrl && !isPlaying) {
    return (
      <div 
        onClick={() => setIsPlaying(true)}
        className={`relative w-full h-full bg-neutral-950 group rounded-lg overflow-hidden cursor-pointer select-none aspect-video ${className}`}
        id={`smart_player_thumbnail_${src.slice(-10)}`}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If permanent thumbnail somehow fails, hide image
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Soft overlay gradient */}
        <div className="absolute inset-0 bg-neutral-950/45 group-hover:bg-neutral-950/30 transition-all duration-300" />

        {/* Pulse center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform transition-all duration-300 group-hover:scale-110 active:scale-95 z-10 flex items-center justify-center">
            <Play size={24} className="fill-current text-white translate-x-0.5" />
          </div>
        </div>

        {/* Broadcast bar */}
        <div className="absolute bottom-3 left-3 bg-red-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-15 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          FAST PLAY
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-neutral-950 group rounded-lg overflow-hidden aspect-video ${className}`}>
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 gap-2">
          <span className="w-6 h-6 border-2 border-neutral-700 border-t-red-700 rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest uppercase">Connecting to Feed...</span>
        </div>
      ) : (
        <video
          key={resolvedSrc}
          src={resolvedSrc}
          controls
          autoPlay={isPlaying} // autoplay if user explicitly clicked play list card!
          onError={handleVideoError}
          className="w-full h-full object-cover bg-black rounded-lg"
          preload="metadata"
          referrerPolicy="no-referrer"
        />
      )}

      {isUsingFallback && (
        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 backdrop-blur-xs select-none pointer-events-none transition-opacity duration-300 group-hover:opacity-100">
          <Radio size={10} className="text-amber-400 animate-pulse" />
          <span className="font-mono tracking-wider uppercase text-slate-200">Satellite Standby Buffer Loop</span>
        </div>
      )}
    </div>
  );
}

