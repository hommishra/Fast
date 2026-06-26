import React, { useState, useEffect, useRef } from "react";
import { getVideoFile } from "../indexedDB";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, addDoc, increment } from "firebase/firestore";
import { VideoAd } from "../types";
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
  Loader2,
  Mic
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
  const isAudio = !!src && (
    src.toLowerCase().endsWith(".mp3") || 
    src.toLowerCase().endsWith(".wav") || 
    src.toLowerCase().endsWith(".m4a") || 
    src.toLowerCase().endsWith(".aac") || 
    src.toLowerCase().endsWith(".ogg") ||
    src.includes(".mp3?") ||
    src.includes(".wav?") ||
    src.includes(".m4a?") ||
    (!!fallbackFileName && (
      fallbackFileName.toLowerCase().endsWith(".mp3") ||
      fallbackFileName.toLowerCase().endsWith(".wav") ||
      fallbackFileName.toLowerCase().endsWith(".m4a")
    ))
  );
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // New Video Ads Integration states
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [activeAd, setActiveAd] = useState<VideoAd | null>(null);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adTime, setAdTime] = useState(0);
  const [adDuration, setAdDuration] = useState(15);
  const [adMuted, setAdMuted] = useState(true);
  const [skipCountdown, setSkipCountdown] = useState(5);

  const [hasPlayedPreroll, setHasPlayedPreroll] = useState(false);
  const [hasPlayedMidroll, setHasPlayedMidroll] = useState(false);
  const [hasPlayedPostroll, setHasPlayedPostroll] = useState(false);

  const adVideoRef = useRef<HTMLVideoElement>(null);
  
  // Custom HTML5 controls state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
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

  // Synchronize fullscreen state with browser document state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // YouTube-like keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape" && isPseudoFullscreen) {
        e.preventDefault();
        setIsPseudoFullscreen(false);
        setIsFullscreen(false);
        return;
      }

      if (!isPlaying) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          triggerFullscreen();
          break;
        case "m":
          e.preventDefault();
          if (videoRef.current) {
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            videoRef.current.muted = newMuted;
            videoRef.current.volume = newMuted ? 0 : volume || 0.5;
          }
          break;
        case "arrowleft":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          }
          break;
        case "arrowright":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, isMuted, volume, duration, isPseudoFullscreen]);

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
  const startAd = (ad: VideoAd, placement: "Pre-roll" | "Mid-roll" | "Post-roll") => {
    setActiveAd(ad);
    setIsAdPlaying(true);
    setAdTime(0);
    setAdDuration(ad.duration || 15);
    setSkipCountdown(5);
    setAdMuted(true); // default mute for autoplay/policy bypass

    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setIsPlaying(false);

    try {
      updateDoc(doc(db, "video_ads", ad.id), {
        impressions: increment(1)
      }).catch(err => console.log("Ad impression counter error:", err));

      addDoc(collection(db, "video_ad_views"), {
        adId: ad.id,
        campaignId: ad.campaignId || "",
        timestamp: new Date().toISOString(),
        completed: false,
        watchTime: 0,
        device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        country: "US",
        language: "en"
      }).catch(err => console.log("Ad impression logger error:", err));
    } catch (err) {
      console.error(err);
    }
  };

  const completeAd = () => {
    if (!activeAd) return;
    try {
      updateDoc(doc(db, "video_ads", activeAd.id), {
        completions: increment(1),
        totalWatchTime: increment(activeAd.duration || 15)
      }).catch(err => console.log("Ad completion counter error:", err));
    } catch (err) {
      console.error(err);
    }
    setActiveAd(null);
    setIsAdPlaying(false);

    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Resume player error:", err));
    }
  };

  const skipAd = () => {
    if (!activeAd) return;
    try {
      updateDoc(doc(db, "video_ads", activeAd.id), {
        totalWatchTime: increment(Math.round(adTime))
      }).catch(err => console.log("Ad skip counter error:", err));
    } catch (err) {
      console.error(err);
    }
    setActiveAd(null);
    setIsAdPlaying(false);

    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Resume after skip error:", err));
    }
  };

  const handleAdClick = (e: React.MouseEvent) => {
    if (!activeAd) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      updateDoc(doc(db, "video_ads", activeAd.id), {
        clicks: increment(1)
      }).catch(err => console.log("Ad click counter error:", err));

      addDoc(collection(db, "video_ad_clicks"), {
        adId: activeAd.id,
        campaignId: activeAd.campaignId || "",
        timestamp: new Date().toISOString(),
        device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        country: "US",
        language: "en"
      }).catch(err => console.log("Ad click logger error:", err));
    } catch (err) {
      console.error(err);
    }

    window.open(activeAd.destinationUrl, "_blank", "noopener,noreferrer");
  };

  // Listen to active Video Ads in real time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "video_ads"), (snap) => {
      const list: VideoAd[] = [];
      const now = new Date();
      snap.forEach((doc) => {
        const d = doc.data() as VideoAd;
        const start = new Date(d.startDate);
        const end = new Date(d.endDate);
        if (d.enabled && now >= start && now <= end) {
          list.push({ ...d, id: doc.id });
        }
      });
      setVideoAds(list.sort((a, b) => b.priority - a.priority));
    });
    return () => unsub();
  }, []);

  // Ad skip countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeAd && isAdPlaying) {
      interval = setInterval(() => {
        setSkipCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeAd, isAdPlaying]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Intercept with Video Ad play/pause
    if (activeAd) {
      if (adVideoRef.current) {
        if (adVideoRef.current.paused) {
          adVideoRef.current.play()
            .then(() => setIsAdPlaying(true))
            .catch(err => console.log("Ad play error:", err));
        } else {
          adVideoRef.current.pause();
          setIsAdPlaying(false);
        }
      }
      return;
    }

    // Preroll trigger check on play initiation
    if (!hasPlayedPreroll) {
      setHasPlayedPreroll(true);
      const prerollAd = videoAds.find(a => a.placement === "Pre-roll");
      if (prerollAd) {
        startAd(prerollAd, "Pre-roll");
        return;
      }
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
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);

      // Mid-roll overlay at 50% playtime
      if (total > 0 && current >= total / 2 && !hasPlayedMidroll) {
        setHasPlayedMidroll(true);
        const midrollAd = videoAds.find(a => a.placement === "Mid-roll");
        if (midrollAd) {
          startAd(midrollAd, "Mid-roll");
        }
      }

      // Post-roll overlay near end of play
      if (total > 0 && current >= total - 0.5 && !hasPlayedPostroll) {
        setHasPlayedPostroll(true);
        const postrollAd = videoAds.find(a => a.placement === "Post-roll");
        if (postrollAd) {
          startAd(postrollAd, "Post-roll");
        }
      }
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

  const triggerFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const isCurrentlyFull = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      isPseudoFullscreen
    );

    if (!isCurrentlyFull) {
      const req =
        container.requestFullscreen ||
        (container as any).webkitRequestFullscreen ||
        (container as any).mozRequestFullScreen ||
        (container as any).msRequestFullscreen;

      if (req) {
        const promise = req.call(container);
        if (promise && promise.then) {
          promise
            .then(() => {
              setIsFullscreen(true);
              setIsPseudoFullscreen(false);
              try {
                if (screen.orientation && (screen.orientation as any).lock) {
                  (screen.orientation as any).lock("landscape").catch(() => {});
                }
              } catch (e) {}
            })
            .catch((err: any) => {
              console.error("Fullscreen request failed, trying pseudo fallback:", err);
              setIsPseudoFullscreen(true);
              setIsFullscreen(true);
            });
        } else {
          // Synchronous fallback / older browsers
          setIsFullscreen(true);
          setIsPseudoFullscreen(false);
          try {
            if (screen.orientation && (screen.orientation as any).lock) {
              (screen.orientation as any).lock("landscape").catch(() => {});
            }
          } catch (e) {}
        }
      } else if (video && (video as any).webkitEnterFullscreen) {
        try {
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
          setIsPseudoFullscreen(false);
        } catch (err) {
          console.error("webkitEnterFullscreen failed, trying pseudo:", err);
          setIsPseudoFullscreen(true);
          setIsFullscreen(true);
        }
      } else {
        setIsPseudoFullscreen(true);
        setIsFullscreen(true);
      }
    } else {
      if (isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
        setIsFullscreen(false);
      } else {
        const exit =
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen;

        if (exit) {
          const promise = exit.call(document);
          if (promise && promise.then) {
            promise
              .then(() => {
                setIsFullscreen(false);
                setIsPseudoFullscreen(false);
                try {
                  if (screen.orientation && (screen.orientation as any).unlock) {
                    (screen.orientation as any).unlock();
                  }
                } catch (e) {}
              })
              .catch((err: any) => {
                console.error("Exit fullscreen failed, forcing pseudo off:", err);
                setIsPseudoFullscreen(false);
                setIsFullscreen(false);
              });
          } else {
            setIsFullscreen(false);
            setIsPseudoFullscreen(false);
            try {
              if (screen.orientation && (screen.orientation as any).unlock) {
                (screen.orientation as any).unlock();
              }
            } catch (e) {}
          }
        } else {
          setIsPseudoFullscreen(false);
          setIsFullscreen(false);
        }
      }
    }
  };

  const toggleFullscreen = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    triggerFullscreen();
  };

  const lastTapRef = useRef<number>(0);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      toggleFullscreen(e);
    }
    lastTapRef.current = now;
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
      className={isPseudoFullscreen
        ? "fixed inset-0 w-screen h-screen bg-black z-[99999] flex items-center justify-center select-none"
        : `relative w-full h-full bg-neutral-950 group rounded-lg overflow-hidden aspect-video ${className}`
      }
      style={{ userSelect: "none" }}
    >
      {/* Dynamic Video Ad Player Overlay */}
      {activeAd && (
        <div className="absolute inset-0 bg-black z-[40] flex flex-col justify-between">
          {/* Ad click-through canvas container */}
          <div 
            onClick={handleAdClick}
            className="absolute inset-0 cursor-pointer group flex items-center justify-center bg-black"
          >
            <video
              ref={adVideoRef}
              src={activeAd.videoUrl}
              autoPlay
              muted={adMuted}
              onEnded={completeAd}
              onTimeUpdate={() => {
                if (adVideoRef.current) {
                  setAdTime(adVideoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (adVideoRef.current) {
                  setAdDuration(adVideoRef.current.duration || activeAd.duration || 15);
                }
              }}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="p-4 bg-black/60 rounded-full border border-neutral-700/50 text-white shadow-xl">
                {isAdPlaying ? <Pause size={28} /> : <Play size={28} />}
              </span>
            </div>
          </div>

          {/* Ad labels */}
          <div className="absolute top-3 left-3 z-50 flex items-center gap-2 pointer-events-none">
            <span className="px-2 py-1 bg-yellow-500 text-black text-[9px] font-extrabold uppercase rounded font-mono tracking-widest shadow-lg">
              Ad
            </span>
            <span className="px-2.5 py-1 bg-black/75 border border-neutral-800 text-white text-[10px] font-bold rounded shadow-lg backdrop-blur-md">
              {activeAd.advertiserName} • {activeAd.title}
            </span>
          </div>

          {/* Skip Ad / Learn More trigger overlays */}
          <div className="absolute bottom-16 right-3 z-50 flex items-center gap-2 font-mono">
            <button
              onClick={handleAdClick}
              className="px-3.5 py-2 bg-black/80 hover:bg-black border border-neutral-800 text-white text-xs font-bold rounded shadow-xl flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer font-sans"
            >
              Learn More <ExternalLink size={12} className="text-red-500" />
            </button>

            {skipCountdown > 0 ? (
              <span className="px-3.5 py-2 bg-black/80 border border-neutral-850 text-neutral-400 text-xs font-bold rounded shadow-xl">
                Skip Ad in {skipCountdown}s
              </span>
            ) : (
              <button
                onClick={skipAd}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded shadow-xl flex items-center gap-1 transition cursor-pointer"
              >
                Skip Ad ➔
              </button>
            )}
          </div>

          {/* Ad Volume and playback indicator bars */}
          <div className="absolute bottom-3 left-3 right-3 z-50 bg-black/75 border border-neutral-850 p-2.5 rounded-lg backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (adVideoRef.current) {
                    if (isAdPlaying) {
                      adVideoRef.current.pause();
                      setIsAdPlaying(false);
                    } else {
                      adVideoRef.current.play()
                        .then(() => setIsAdPlaying(true))
                        .catch(err => console.log("Ad resume error:", err));
                    }
                  }
                }}
                className="text-white hover:text-red-500 transition cursor-pointer"
              >
                {isAdPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextMuted = !adMuted;
                  setAdMuted(nextMuted);
                  if (adVideoRef.current) {
                    adVideoRef.current.muted = nextMuted;
                  }
                }}
                className="text-white hover:text-red-500 transition cursor-pointer"
                title={adMuted ? "Unmute sound" : "Mute sound"}
              >
                {adMuted ? <VolumeX size={15} className="text-red-500 animate-pulse" /> : <Volume2 size={15} />}
              </button>

              <span className="text-[9px] font-mono text-neutral-300">
                Ad • ({Math.round(adTime)}s / {Math.round(adDuration)}s)
              </span>
            </div>

            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest hidden sm:block">
              Fast Coverage Stream Ad
            </div>
          </div>

          {/* Real-time ad progress timeline */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900 z-50 pointer-events-none">
            <div 
              className="h-full bg-red-600 transition-all duration-100"
              style={{ width: `${(adTime / adDuration) * 100}%` }}
            />
          </div>
        </div>
      )}

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
        <>
          <video
            ref={videoRef}
            key={resolvedSrc}
            src={resolvedSrc}
            autoPlay={isPlaying}
            onClick={() => togglePlay()}
            onDoubleClick={(e) => toggleFullscreen(e)}
            onTouchEnd={handleTouchEnd}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleVideoError}
            className={isAudio ? "hidden" : "w-full h-full object-contain bg-black cursor-pointer"}
            preload="metadata"
            referrerPolicy="no-referrer"
          />
          {isAudio && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 select-none cursor-pointer"
              onClick={() => togglePlay()}
            >
              {/* Voice wave animations styling */}
              <style>{`
                @keyframes voiceWave {
                  0% { transform: scaleY(0.3); }
                  100% { transform: scaleY(1.3); }
                }
              `}</style>

              {/* Radial glow background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
              
              {/* Cover image or fallback podcast cover with spinning/pulsing glow */}
              <div className="relative z-10 flex flex-col items-center gap-3.5 text-center max-w-xs">
                <div className={`relative h-24 w-24 md:h-32 md:w-32 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-emerald-500/20 transition-all duration-500 ${isPlaying ? "scale-105 shadow-emerald-500/10" : ""}`}>
                  <img 
                    src={thumbnailUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400"} 
                    alt="Podcast Cover" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Mic size={24} className={`text-emerald-400 ${isPlaying ? "animate-bounce" : ""}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded">
                    Voice ad Broadcast
                  </span>
                  <h4 className="text-xs md:text-sm font-bold text-neutral-100 line-clamp-1">{title}</h4>
                  <p className="text-[9px] font-mono text-zinc-400">Fast Coverage Audio Network</p>
                </div>

                {/* Simulated Waveform lines with animated heights when playing */}
                <div className="flex items-center justify-center gap-1.5 h-8 mt-1">
                  {Array.from({ length: 15 }).map((_, idx) => {
                    const delay = [100, 300, 500, 200, 400, 600, 150, 350, 550, 250, 450, 650, 180, 380, 580][idx];
                    return (
                      <div
                        key={idx}
                        className="w-1 rounded-full bg-emerald-500"
                        style={{
                          height: isPlaying ? "100%" : "4px",
                          transformOrigin: "bottom",
                          animation: isPlaying ? `voiceWave 0.6s ease-in-out infinite alternate` : "none",
                          animationDelay: isPlaying ? `${delay}ms` : "0ms"
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Satellite fallback watermark if running */}
      {isUsingFallback && (
        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5 backdrop-blur-xs select-none pointer-events-none transition-opacity duration-300">
          <Radio size={10} className="text-amber-400 animate-pulse" />
          <span className="font-mono tracking-wider uppercase text-slate-200">Satellite Standby Feed</span>
        </div>
      )}

      {/* Top Left Floating Fullscreen Button Overlay */}
      <button
        onClick={toggleFullscreen}
        className={`absolute top-3 left-3 bg-red-600/95 hover:bg-red-600 border border-red-500/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-md shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all duration-300 z-20 cursor-pointer ${
          showControls && !isAudio ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize size={12} className="text-white" /> : <Maximize size={12} className="text-white" />}
        <span className="font-mono tracking-wider uppercase">{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
      </button>

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
              {isAudio ? (
                <div className="text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-800/80 px-2.5 py-0.5 rounded text-emerald-400 flex items-center gap-1 uppercase select-none">
                  <span>HQ AUDIO</span>
                </div>
              ) : (
                <>
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
                </>
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
