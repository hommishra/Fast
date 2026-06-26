import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Ad, AdPosition, VideoAd } from "../types";
import { ExternalLink, Play, Volume2, VolumeX, X } from "lucide-react";

interface AdSlotProps {
  placement: Ad["adPlacement"] | "Sticky Ads" | "Popup Ads" | "Sticky" | "Fullscreen" | "In-Article";
  category?: string;
  className?: string;
}

export default function AdSlot({ placement, category = "all", className = "" }: AdSlotProps) {
  const [position, setPosition] = useState<AdPosition | null>(null);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [deviceType, setDeviceType] = useState<"Mobile" | "Desktop" | "Tablet">("Desktop");
  const [impressionRecorded, setImpressionRecorded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<Ad | null>(null);

  // New Video Ads states
  const [activeVideoAd, setActiveVideoAd] = useState<VideoAd | null>(null);
  const [isVideoAdMuted, setIsVideoAdMuted] = useState(true);
  const [videoAdImpressionLogged, setVideoAdImpressionLogged] = useState(false);
  const [isStickyAdDismissed, setIsStickyAdDismissed] = useState(false);
  const [isFullscreenAdDismissed, setIsFullscreenAdDismissed] = useState(false);
  const videoAdRef = useRef<HTMLVideoElement>(null);

  // Sync active ad reference to use inside callbacks without triggering re-effects
  useEffect(() => {
    adRef.current = activeAd;
  }, [activeAd]);

  // Determine active device type based on width
  useEffect(() => {
    const detectDevice = () => {
      const w = window.innerWidth;
      if (w < 640) setDeviceType("Mobile");
      else if (w < 1024) setDeviceType("Tablet");
      else setDeviceType("Desktop");
    };
    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  // Fetch placement configuration, standard ads, and new video ads
  useEffect(() => {
    // 1. Listen to position configuration
    const mappedPlacement = placement === "Sticky" ? "Sticky Ads" : placement === "Fullscreen" ? "Popup Ads" : placement;
    const unsubPosition = onSnapshot(doc(db, "ad_positions", mappedPlacement), (docSnap) => {
      if (docSnap.exists()) {
        setPosition(docSnap.data() as AdPosition);
      } else {
        setPosition({
          id: mappedPlacement,
          name: mappedPlacement,
          enabled: true,
          provider: "custom",
          lazyLoad: false,
        });
      }
    });

    // 2. Listen to active ads (from standard ads collection)
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      const activeAds: Ad[] = [];
      const now = new Date();

      // Format current date to local YYYY-MM-DD string to bypass timezone offsets
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      snap.forEach((d) => {
        const ad = { ...d.data(), id: d.id } as Ad;
        
        const startStr = ad.startDate ? ad.startDate.split("T")[0] : "";
        const endStr = ad.endDate ? ad.endDate.split("T")[0] : "";
        
        let isStarted = !startStr;
        let isNotExpired = !endStr;

        if (startStr) {
          const parts = startStr.split("-");
          if (parts.length === 3) {
            const startObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0);
            const graceStart = startObj.getTime() - 24 * 60 * 60 * 1000;
            isStarted = now.getTime() >= graceStart;
          } else {
            isStarted = startStr <= todayStr;
          }
        }

        if (endStr) {
          const parts = endStr.split("-");
          if (parts.length === 3) {
            const endObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59);
            const graceEnd = endObj.getTime() + 24 * 60 * 60 * 1000;
            isNotExpired = now.getTime() <= graceEnd;
          } else {
            isNotExpired = endStr >= todayStr;
          }
        }

        if (
          ad.adPlacement === mappedPlacement &&
          ad.status === "Active" &&
          isStarted &&
          isNotExpired
        ) {
          activeAds.push(ad);
        }
      });

      if (activeAds.length === 0) {
        setActiveAd(null);
        return;
      }

      // Filter by device targeting case-insensitively
      let filtered = activeAds.filter((ad) => {
        if (!ad.deviceTargeting || ad.deviceTargeting.length === 0) return true;
        return ad.deviceTargeting.some(dev => dev.toLowerCase() === deviceType.toLowerCase());
      });

      // Filter by category targeting case-insensitively
      filtered = filtered.filter((ad) => {
        if (!ad.categoryTargeting || ad.categoryTargeting.length === 0) return true;
        return ad.categoryTargeting.some(
          cat => cat.toLowerCase() === "all" || category.toLowerCase() === "all" || cat.toLowerCase() === category.toLowerCase()
        );
      });

      if (filtered.length > 0) {
        const randomIndex = Math.floor(Math.random() * filtered.length);
        setActiveAd(filtered[randomIndex]);
      } else {
        setActiveAd(null);
      }
    });

    // 3. Listen to video_ads (from the Video Ads collection)
    const unsubVideoAds = onSnapshot(collection(db, "video_ads"), (snap) => {
      const activeVideoAds: VideoAd[] = [];
      const now = new Date();

      snap.forEach((d) => {
        const ad = { ...d.data(), id: d.id } as VideoAd;
        const start = new Date(ad.startDate);
        const end = new Date(ad.endDate);

        // Normalize placement names
        let isMatch = false;
        const normPlace = ad.placement.toLowerCase();
        const normTarget = placement.toLowerCase();

        if (normPlace === normTarget) isMatch = true;
        else if (normTarget === "homepage banner" && normPlace === "homepage banner") isMatch = true;
        else if (normTarget === "in-article banner" && normPlace === "in-article") isMatch = true;
        else if (normTarget === "sticky ads" && normPlace === "sticky") isMatch = true;
        else if (normTarget === "sticky" && normPlace === "sticky") isMatch = true;
        else if (normTarget === "popup ads" && normPlace === "fullscreen") isMatch = true;
        else if (normTarget === "fullscreen" && normPlace === "fullscreen") isMatch = true;

        if (ad.enabled && now >= start && now <= end && isMatch) {
          activeVideoAds.push(ad);
        }
      });

      if (activeVideoAds.length === 0) {
        setActiveVideoAd(null);
        return;
      }

      // Filter by device targeting
      let filtered = activeVideoAds.filter((ad) => {
        if (!ad.deviceTargeting || ad.deviceTargeting.length === 0) return true;
        return ad.deviceTargeting.some(dev => dev.toLowerCase() === deviceType.toLowerCase());
      });

      // Filter by category targeting
      filtered = filtered.filter((ad) => {
        if (!ad.categoryTargeting || ad.categoryTargeting.length === 0) return true;
        return ad.categoryTargeting.some(
          cat => cat.toLowerCase() === "all" || category.toLowerCase() === "all" || cat.toLowerCase() === category.toLowerCase()
        );
      });

      if (filtered.length > 0) {
        // Sort by priority, then random rotation
        const sorted = filtered.sort((a, b) => b.priority - a.priority);
        const highestPriority = sorted[0].priority;
        const pool = sorted.filter(a => a.priority === highestPriority);
        setActiveVideoAd(pool[Math.floor(Math.random() * pool.length)]);
      } else {
        setActiveVideoAd(null);
      }
    });

    setImpressionRecorded(false);
    setVideoAdImpressionLogged(false);

    return () => {
      unsubPosition();
      unsubAds();
      unsubVideoAds();
    };
  }, [placement, category, deviceType]);

  // Lazy load impression logger using IntersectionObserver for standard ads
  useEffect(() => {
    if (!activeAd || impressionRecorded || !containerRef.current) return;

    const recordImpression = async () => {
      const currentAd = adRef.current;
      if (!currentAd || impressionRecorded) return;
      setImpressionRecorded(true);

      try {
        await updateDoc(doc(db, "ads", currentAd.id), {
          impressions: increment(1),
        });

        await addDoc(collection(db, "ad_impressions"), {
          id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          adId: currentAd.id,
          campaignId: currentAd.campaignId || "",
          timestamp: new Date().toISOString(),
          device: deviceType,
          userAgent: navigator.userAgent,
          country: "US",
        });
      } catch (err) {
        console.error("Error logging impression:", err);
      }
    };

    if (position?.lazyLoad) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            recordImpression();
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      recordImpression();
    }
  }, [activeAd, position, impressionRecorded, deviceType]);

  // Real-time impression logger for Video Ads
  useEffect(() => {
    if (!activeVideoAd || videoAdImpressionLogged) return;

    const recordVideoAdImpression = async () => {
      setVideoAdImpressionLogged(true);
      try {
        await updateDoc(doc(db, "video_ads", activeVideoAd.id), {
          impressions: increment(1),
        });

        await addDoc(collection(db, "video_ad_views"), {
          adId: activeVideoAd.id,
          campaignId: activeVideoAd.campaignId || "",
          timestamp: new Date().toISOString(),
          completed: false,
          watchTime: 0,
          device: deviceType,
          country: "US",
          language: "en"
        });
      } catch (err) {
        console.error("Error logging video ad impression:", err);
      }
    };

    recordVideoAdImpression();
  }, [activeVideoAd, videoAdImpressionLogged, deviceType]);

  // Safely execute Google AdSense scripts inside raw HTML injections
  useEffect(() => {
    if (position?.enabled && position.provider === "adsense" && position.adsenseCode) {
      const timer = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        const scripts = container.getElementsByTagName("script");
        Array.from(scripts).forEach((scriptElement) => {
          const script = scriptElement as HTMLScriptElement;
          const newScript = document.createElement("script");
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.appendChild(document.createTextNode(script.innerHTML));
          script.parentNode?.replaceChild(newScript, script);
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [position]);

  // Intercept standard ad click securely
  const handleAdClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!activeAd) return;
    try {
      await updateDoc(doc(db, "ads", activeAd.id), {
        clicks: increment(1),
      });

      await addDoc(collection(db, "ad_clicks"), {
        id: `clk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        adId: activeAd.id,
        campaignId: activeAd.campaignId || "",
        timestamp: new Date().toISOString(),
        device: deviceType,
        userAgent: navigator.userAgent,
        country: "US",
      });
    } catch (err) {
      console.error("Error logging click:", err);
    }
  };

  // Click-through action for Video Ads
  const handleVideoAdClick = async (e: React.MouseEvent) => {
    if (!activeVideoAd) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      await updateDoc(doc(db, "video_ads", activeVideoAd.id), {
        clicks: increment(1),
      });

      await addDoc(collection(db, "video_ad_clicks"), {
        adId: activeVideoAd.id,
        campaignId: activeVideoAd.campaignId || "",
        timestamp: new Date().toISOString(),
        device: deviceType,
        country: "US",
        language: "en"
      });
    } catch (err) {
      console.error("Error logging video ad click:", err);
    }

    window.open(activeVideoAd.destinationUrl, "_blank", "noopener,noreferrer");
  };

  if (position && !position.enabled) {
    return null;
  }

  // Sizing mappings
  const getSizingStyle = () => {
    switch (placement) {
      case "Top Banner":
      case "Header Banner":
        return "min-h-[60px] md:min-h-[90px] w-full bg-neutral-900/40";
      case "Footer Banner":
      case "Homepage Banner":
        return "min-h-[70px] md:min-h-[100px] w-full bg-neutral-900/40 my-4";
      case "Sidebar Banner":
        return "min-h-[250px] w-full bg-neutral-900/40 my-3 rounded-lg";
      case "In-Article Banner":
      case "In-Article":
        return "min-h-[90px] md:min-h-[120px] w-full bg-neutral-900/40 my-4";
      case "Pre-roll Ads":
      case "Mid-roll Ads":
      case "Post-roll Ads":
        return "aspect-video w-full bg-black relative";
      case "Popup Ads":
      case "Fullscreen":
        return "max-w-md w-full p-4 rounded-xl shadow-2xl bg-neutral-950";
      case "Sticky Ads":
      case "Sticky":
        return "fixed bottom-5 right-5 z-50 w-80 bg-neutral-950 border border-neutral-800 p-2 shadow-2xl rounded-lg flex flex-col gap-2";
      default:
        return "min-h-[80px] w-full";
    }
  };

  // Google AdSense Provider Mode
  if (position && position.provider === "adsense" && position.adsenseCode) {
    return (
      <div
        ref={containerRef}
        className={`overflow-hidden relative flex justify-center items-center select-none ${getSizingStyle()} ${className}`}
        id={`adsense-slot-${placement.replace(/\s+/g, "-")}`}
      >
        <div
          dangerouslySetInnerHTML={{ __html: position.adsenseCode }}
          className="w-full h-full flex items-center justify-center"
        />
      </div>
    );
  }

  // RENDER: New Video Ads (Homepage Banner, In-Article, Sticky, Fullscreen)
  if (activeVideoAd) {
    const normPlace = activeVideoAd.placement.toLowerCase();

    // 1. Sticky Floating Video Ad (Bottom Corner)
    if ((normPlace === "sticky" || placement === "Sticky" || placement === "Sticky Ads") && !isStickyAdDismissed) {
      return (
        <div className="fixed bottom-5 right-5 z-[1000] w-72 md:w-80 bg-neutral-950 border border-neutral-800 p-2 shadow-2xl rounded-xl flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <span className="bg-yellow-500 text-black font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
              Sponsor Ad
            </span>
            <button 
              onClick={() => setIsStickyAdDismissed(true)}
              className="p-1 hover:bg-neutral-850 rounded-full text-neutral-450 hover:text-white transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="relative aspect-video rounded overflow-hidden bg-black group">
            <video
              ref={videoAdRef}
              src={activeVideoAd.videoUrl}
              autoPlay
              loop
              muted={isVideoAdMuted}
              playsInline
              onClick={handleVideoAdClick}
              className="w-full h-full object-cover cursor-pointer"
            />
            
            {/* Direct Click overlay */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300" />

            {/* Controls overlay */}
            <div className="absolute bottom-1.5 right-1.5 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoAdMuted(!isVideoAdMuted);
                }}
                className="p-1 bg-black/75 hover:bg-black border border-neutral-800 text-white rounded-full shadow transition cursor-pointer"
              >
                {isVideoAdMuted ? <VolumeX size={12} className="text-red-500" /> : <Volume2 size={12} />}
              </button>
            </div>
          </div>

          <div className="px-1 py-0.5 flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-white line-clamp-1">{activeVideoAd.title}</h4>
              <p className="text-[9px] font-mono text-neutral-500">{activeVideoAd.advertiserName}</p>
            </div>
            <button
              onClick={handleVideoAdClick}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white text-[9px] font-bold uppercase rounded font-mono tracking-wider transition cursor-pointer flex items-center gap-0.5 shrink-0"
            >
              Visit <ExternalLink size={8} />
            </button>
          </div>
        </div>
      );
    }

    // 2. Fullscreen Video Ad Overlay (Optional Modal)
    if ((normPlace === "fullscreen" || placement === "Fullscreen" || placement === "Popup Ads") && !isFullscreenAdDismissed) {
      return (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-neutral-950 border border-neutral-850 p-5 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-yellow-500 text-black font-mono text-[9px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">
                Featured Ad
              </span>
              <button 
                onClick={() => setIsFullscreenAdDismissed(true)}
                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded text-xs uppercase tracking-wider font-bold transition cursor-pointer flex items-center gap-1"
              >
                Close Ad <X size={13} />
              </button>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-black group">
              <video
                ref={videoAdRef}
                src={activeVideoAd.videoUrl}
                autoPlay
                loop
                muted={isVideoAdMuted}
                playsInline
                onClick={handleVideoAdClick}
                className="w-full h-full object-cover cursor-pointer"
              />
              
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300" />

              {/* Sound controls */}
              <div className="absolute bottom-3 right-3 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVideoAdMuted(!isVideoAdMuted);
                  }}
                  className="p-1.5 bg-black/75 hover:bg-black border border-neutral-850 text-white rounded-full shadow transition cursor-pointer"
                >
                  {isVideoAdMuted ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="space-y-0.5 text-left">
                <h3 className="text-sm font-black text-white">{activeVideoAd.title}</h3>
                <p className="text-xs text-neutral-400">{activeVideoAd.description || `Sponsor campaign by ${activeVideoAd.advertiserName}`}</p>
              </div>
              <button
                onClick={handleVideoAdClick}
                className="px-5 py-2.5 bg-red-800 hover:bg-red-700 text-white text-xs font-bold uppercase rounded font-mono tracking-wider transition cursor-pointer flex items-center gap-1.5 self-start shrink-0"
              >
                Learn More <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. Homepage Video Banner and In-Article Video Ads (Standard stream inline card)
    return (
      <div
        className={`overflow-hidden relative flex flex-col justify-center items-center border border-neutral-850 hover:border-red-650/40 transition-all duration-300 rounded-lg shadow-xl bg-neutral-950 text-neutral-100 ${getSizingStyle()} ${className}`}
        id={`video-ad-slot-${placement.replace(/\s+/g, "-")}`}
      >
        <span className="absolute top-2 left-2 bg-yellow-500 text-black font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase z-25 pointer-events-none select-none">
          Sponsored Ad
        </span>

        <div className="w-full h-full relative group">
          <video
            ref={videoAdRef}
            src={activeVideoAd.videoUrl}
            autoPlay
            loop
            muted={isVideoAdMuted}
            playsInline
            onClick={handleVideoAdClick}
            className="w-full h-full object-cover cursor-pointer bg-black"
          />

          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300 pointer-events-none" />

          {/* Learn More link Overlay (bottom left) */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <button
              onClick={handleVideoAdClick}
              className="px-3.5 py-1.5 bg-black/75 hover:bg-black border border-neutral-800 text-white text-[10px] font-bold rounded shadow-lg backdrop-blur-md transition cursor-pointer flex items-center gap-1"
            >
              Learn More <ExternalLink size={10} className="text-red-500" />
            </button>
          </div>

          {/* Sound toggle Overlay (bottom right) */}
          <div className="absolute bottom-3 right-3 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVideoAdMuted(!isVideoAdMuted);
              }}
              className="p-1.5 bg-black/75 hover:bg-black border border-neutral-800 text-white rounded-full shadow-lg backdrop-blur-md transition cursor-pointer flex items-center justify-center"
              title={isVideoAdMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isVideoAdMuted ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Custom static Ad Provider Mode
  if (activeAd) {
    const isVideo = activeAd.adType === "Video" && activeAd.videoUrl;

    return (
      <div
        ref={containerRef}
        className={`overflow-hidden relative flex flex-col justify-center items-center border border-slate-100 hover:border-red-650/35 transition-all duration-300 rounded shadow-sm bg-white text-slate-800 ${getSizingStyle()} ${className}`}
        id={`custom-ad-slot-${placement.replace(/\s+/g, "-")}`}
      >
        <span className="absolute top-1 right-1 bg-slate-900/95 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase z-10 pointer-events-none select-none">
          SPONSOR PROMO
        </span>

        <a
          href={activeAd.destinationUrl}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="w-full h-full block relative group"
        >
          {isVideo ? (
            <div className="w-full h-full relative aspect-video flex items-center justify-center bg-black">
              <video
                src={activeAd.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-white pointer-events-none">
                <Play size={8} fill="#fff" />
                <span>{activeAd.title}</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center relative">
              {activeAd.imageUrl ? (
                <img
                  src={activeAd.imageUrl}
                  alt={activeAd.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[300px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="p-4 flex flex-col justify-center items-center text-center bg-slate-50 w-full h-full">
                  <span className="font-mono text-[9px] uppercase font-bold text-red-650 mb-1 block">
                    {activeAd.advertiserName}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">
                    {activeAd.title}
                  </h4>
                  {activeAd.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 max-w-md">
                      {activeAd.description}
                    </p>
                  )}
                </div>
              )}

              <div className="absolute inset-0 bg-red-700/0 group-hover:bg-red-700/[0.02] border-2 border-transparent group-hover:border-red-600/20 transition-all duration-300 pointer-events-none" />
            </div>
          )}
        </a>
      </div>
    );
  }

  return null;
}
