import React, { useState, useEffect, useRef } from "react";
import { getVideoFile } from "../indexedDB";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  Tv, 
  Clock, 
  RotateCcw, 
  Compass, 
  ExternalLink,
  ChevronRight,
  Radio,
  FileVideo,
  Loader2
} from "lucide-react";

interface SmartVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  thumbnailUrl?: string; // Optional permanent thumbnail URL
  status?: string;       // e.g., "Processing" or "Published"
  videoId?: string;      // Used for self-healing
  fallbackFileName?: string; // Used for self-healing
}

const SATELLITE_FALLBACK_URL = "https://assets.mixkit.co/videos/preview/mixkit-world-map-background-with-connections-34115-large.mp4";

export default function SmartVideoPlayer({ 
  src, 
  title = "Live News Bulletin", 
  className = "", 
  thumbnailUrl,
  status,
  videoId,
  fallbackFileName
}: SmartVideoPlayerProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Custom HTML5 controls state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoQuality, setVideoQuality] = useState("Auto (1080p)");
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Lazy load cache or external URLs
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
      // Chunked Video sources support
      if (src.startsWith("chunked::")) {
        try {
          const urls = src.replace("chunked::", "").split("|").map(u => u.trim()).filter(Boolean);
          if (urls.length === 0) throw new Error("No chunk URLs");

          const responses = await Promise.all(
            urls.map(async (url) => {
              const res = await fetch(url);
              if (!res.ok) throw new Error(`HTTP error ${res.status}`);
              return res.blob();
            })
          );

          if (active) {
            const combinedBlob = new Blob(responses, { type: "video/mp4" });
            const comboUrl = URL.createObjectURL(combinedBlob);
            objectUrlRef.current = comboUrl;
            setResolvedSrc(comboUrl);
            setLoading(false);
          }
        } catch (error) {
          console.error("Chunk reassembly failed:", error);
          if (active) {
            setResolvedSrc(SATELLITE_FALLBACK_URL);
            setIsUsingFallback(true);
            setLoading(false);
          }
        }
        return;
      }

      // Local files
      if (src.startsWith("/uploads/") || src.includes("/uploads/")) {
        try {
          const normalizedKey = src.includes("/uploads/")
            ? "/uploads/" + src.split("/uploads/")[1]
            : src;

          const cachedBlob = await getVideoFile(normalizedKey);
          if (cachedBlob && active) {
            const cacheObjUrl = URL.createObjectURL(cachedBlob);
            objectUrlRef.current = cacheObjUrl;
            setResolvedSrc(cacheObjUrl);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn("Local IndexedDB retrieval failed:", error);
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

  // Handle controls visibility timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const handleVideoError = async () => {
    if (fallbackFileName && resolvedSrc !== `/uploads/${fallbackFileName}`) {
      try {
        const recoveryUrl = `/uploads/${fallbackFileName}`;
        const res = await fetch(recoveryUrl, { method: 'HEAD' });
        if (res.ok) {
          setResolvedSrc(recoveryUrl);
          return;
        }
      } catch (err) {
        console.error("Self-healing failed:", err);
      }
    }

    if (resolvedSrc !== SATELLITE_FALLBACK_URL) {
      setResolvedSrc(SATELLITE_FALLBACK_URL);
      setIsUsingFallback(true);
    }
  };

  // HTML5 Player handlers
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!videoRef.current) {
      setIsPlaying(true);
      return;
    }

    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Play interrupted:", err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
      videoRef.current.volume = newMuted ? 0 : volume || 0.5;
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const changeQuality = (quality: string) => {
    setVideoQuality(quality);
    setShowQualityMenu(false);
    setIsChangingQuality(true);
    
    // Simulate brief quality handoff/buffering
    setTimeout(() => {
      setIsChangingQuality(false);
    }, 600);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Fullscreen failed:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error("Exit fullscreen failed:", err));
    }
  };

  const handlePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP mode failed or unsupported:", err);
    }
  };

  // Format helper
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
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
            <h4 className="font-sans font-extrabold text-[11px] text-neutral-100 tracking-wider uppercase">Processing Video</h4>
            <p className="font-mono text-[9px] text-neutral-400 leading-tight">Optimizing and publishing high-definition HLS segment stream...</p>
          </div>
        </div>
      </div>
    );
  }

  // YouTube directly renders native player inside standard frame
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

  const defaultThumb = "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=640";
  const activeThumb = thumbnailUrl || defaultThumb;

  // Initial poster/thumbnail layout with red branding Play trigger
  if (!isPlaying) {
    return (
      <div 
        onClick={() => setIsPlaying(true)}
        className={`relative w-full h-full bg-neutral-950 group rounded-lg overflow-hidden cursor-pointer select-none aspect-video ${className}`}
        id={`smart_player_thumbnail_${src.slice(-10)}`}
      >
        <img
          src={activeThumb}
          alt={title}
          className="w-full.h-full w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultThumb;
          }}
        />
        
        <div className="absolute inset-0 bg-neutral-950/40 group-hover:bg-neutral-950/20 transition-all duration-300" />

        {/* Big play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 bg-red-600 group-hover:bg-red-700 text-white rounded-full shadow-2xl transform transition-all duration-300 group-hover:scale-110 active:scale-95 z-10 flex items-center justify-center">
            <Play size={26} className="fill-current text-white translate-x-0.5" />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 bg-red-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-15 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          FAST COVERAGE STREAM
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-full bg-neutral-950 group rounded-lg overflow-hidden aspect-video ${className}`}
      style={{ userSelect: "none" }}
    >
      {/* Video Content */}
      {isChangingQuality ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white gap-2 z-20">
          <Loader2 className="animate-spin text-red-600" size={28} />
          <span className="text-[10px] font-mono tracking-widest uppercase">Adaptive Stream Handoff...</span>
        </div>
      ) : null}

      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 gap-2">
          <Loader2 className="animate-spin text-red-600" size={24} />
          <span className="text-[10px] font-mono tracking-widest uppercase">Connecting...</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          key={resolvedSrc}
          src={resolvedSrc}
          autoPlay={isPlaying}
          onClick={() => togglePlay()}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          className="w-full h-full object-contain bg-black cursor-pointer"
          preload="metadata"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Satellite fallback watermark if running */}
      {isUsingFallback && (
        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 backdrop-blur-xs select-none pointer-events-none transition-opacity duration-300">
          <Radio size={10} className="text-amber-400 animate-pulse" />
          <span className="font-mono tracking-wider uppercase text-slate-200">Satellite Standby Feed</span>
        </div>
      )}

      {/* Bottom Custom Playback Bar Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 pt-8 transition-opacity duration-300 flex flex-col gap-2.5 z-10 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrub progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-neutral-300 select-none">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleScrub}
            className="flex-1 accent-red-600 h-1 rounded bg-neutral-700 cursor-pointer outline-none hover:h-1.5 transition-all"
            style={{
              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${
                duration ? (currentTime / duration) * 100 : 0
              }%, #404040 ${
                duration ? (currentTime / duration) * 100 : 0
              }%, #404040 100%)`
            }}
          />
          <span className="text-[9px] font-mono text-neutral-300 select-none">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons and volume triggers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Play/Pause toggle */}
            <button
              onClick={() => togglePlay()}
              className="p-1 text-neutral-200 hover:text-white transition duration-150 cursor-pointer"
            >
              {videoRef.current?.paused || !isPlaying ? (
                <Play size={18} className="fill-current" />
              ) : (
                <Pause size={18} className="fill-current" />
              )}
            </button>

            {/* Volume controls */}
            <div className="flex items-center gap-1.5 group/volume">
              <button 
                onClick={toggleMute}
                className="p-1 text-neutral-200 hover:text-white transition duration-150 cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-20 accent-red-600 h-1 bg-neutral-700 rounded-lg cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Right features controls */}
          <div className="flex items-center gap-3 relative">
            {/* Simulated Live status or quality */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className="text-[10px] font-mono font-bold bg-neutral-800 border border-neutral-700/80 px-2.5 py-0.5 rounded text-neutral-200 hover:bg-neutral-700 flex items-center gap-1 uppercase transition cursor-pointer"
              >
                <span>HD</span>
                <span className="opacity-70 font-normal normal-case">{videoQuality}</span>
              </button>

              {/* Quality Selection Menu */}
              {showQualityMenu && (
                <div className="absolute bottom-7 right-0 bg-neutral-900 border border-neutral-850 rounded-lg py-1.5 text-xs text-white shadow-xl flex flex-col w-32 shrink-0 z-30">
                  {["Auto (1080p)", "1080p Source", "720p HD", "480p Web", "360p Mobile"].map((q) => (
                    <button
                      key={q}
                      onClick={() => changeQuality(q)}
                      className={`text-left px-3 py-1.5 hover:bg-neutral-800 text-[10px] uppercase font-mono font-bold tracking-wider ${
                        videoQuality === q ? "text-red-500" : "text-neutral-300"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Playback speed trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                className="text-[10px] font-mono font-semibold hover:text-white text-neutral-300 flex items-center gap-0.5 cursor-pointer uppercase py-1"
              >
                <span>Speed</span>
                <span className="font-bold text-red-500 ml-0.5">{playbackRate}x</span>
              </button>

              {/* Speed Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-7 right-0 bg-neutral-900 border border-neutral-850 rounded-lg py-1.5 text-xs text-white shadow-xl flex flex-col w-24 shrink-0 z-30">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`text-left px-3 py-1.5 hover:bg-neutral-800 text-[10px] font-mono font-bold ${
                        playbackRate === rate ? "text-red-500" : "text-neutral-300"
                      }`}
                    >
                      {rate === 1 ? "1.0x (Normal)" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP button */}
            <button
              onClick={handlePiP}
              className="p-1 text-neutral-200 hover:text-white transition duration-150 cursor-pointer"
              title="Picture in Picture Mode"
            >
              <Tv size={15} />
            </button>

            {/* Fullscreen control */}
            <button
              onClick={toggleFullscreen}
              className="p-1 text-neutral-200 hover:text-white transition duration-150 cursor-pointer"
              title="Fullscreen View"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
