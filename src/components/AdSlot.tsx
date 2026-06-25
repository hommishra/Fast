import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Ad, AdPosition } from "../types";
import { ExternalLink, Play, Volume2, VolumeX } from "lucide-react";

interface AdSlotProps {
  placement: Ad["adPlacement"];
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

  // Fetch placement configuration and matching custom ads
  useEffect(() => {
    // 1. Listen to position configuration
    const unsubPosition = onSnapshot(doc(db, "ad_positions", placement), (docSnap) => {
      if (docSnap.exists()) {
        setPosition(docSnap.data() as AdPosition);
      } else {
        setPosition({
          id: placement,
          name: placement,
          enabled: true,
          provider: "custom",
          lazyLoad: false,
        });
      }
    });

    // 2. Listen to active ads
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
        
        // Let's create an extremely robust start/end check that has 1 day of timezone grace,
        // so that an ad scheduled for today will start immediately regardless of local/UTC timezone offsets.
        let isStarted = !startStr;
        let isNotExpired = !endStr;

        if (startStr) {
          const parts = startStr.split("-");
          if (parts.length === 3) {
            const startObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0);
            // Allow 24 hours grace to accommodate timezone misalignments
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
            // Allow 24 hours grace to accommodate timezone misalignments
            const graceEnd = endObj.getTime() + 24 * 60 * 60 * 1000;
            isNotExpired = now.getTime() <= graceEnd;
          } else {
            isNotExpired = endStr >= todayStr;
          }
        }

        // Check if ad targets this placement, is Active, and falls within active dates
        if (
          ad.adPlacement === placement &&
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
        if (!ad.deviceTargeting || ad.deviceTargeting.length === 0) {
          return true;
        }
        return ad.deviceTargeting.some(
          (dev) => dev.toLowerCase() === deviceType.toLowerCase()
        );
      });

      // Filter by category targeting case-insensitively (e.g. "Politics" in Admin matches "politics" in App)
      filtered = filtered.filter((ad) => {
        if (!ad.categoryTargeting || ad.categoryTargeting.length === 0) {
          return true;
        }
        return ad.categoryTargeting.some(
          (cat) =>
            cat.toLowerCase() === "all" ||
            category.toLowerCase() === "all" ||
            cat.toLowerCase() === category.toLowerCase()
        );
      });

      if (filtered.length > 0) {
        // Pick a random ad from the targeted pool for rotation
        const randomIndex = Math.floor(Math.random() * filtered.length);
        setActiveAd(filtered[randomIndex]);
      } else {
        setActiveAd(null);
      }
    });

    // Reset impression state when ad or placement changes
    setImpressionRecorded(false);

    return () => {
      unsubPosition();
      unsubAds();
    };
  }, [placement, category, deviceType]);

  // Lazy load impression logger using IntersectionObserver
  useEffect(() => {
    if (!activeAd || impressionRecorded || !containerRef.current) return;

    const recordImpression = async () => {
      const currentAd = adRef.current;
      if (!currentAd || impressionRecorded) return;
      setImpressionRecorded(true);

      try {
        // Increment impression count on Ad document
        await updateDoc(doc(db, "ads", currentAd.id), {
          impressions: increment(1),
        });

        // Write to ad_impressions logger
        await addDoc(collection(db, "ad_impressions"), {
          id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          adId: currentAd.id,
          campaignId: currentAd.campaignId || "",
          timestamp: new Date().toISOString(),
          device: deviceType,
          userAgent: navigator.userAgent,
          country: "US", // Default fallbacks
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
      // Instant load
      recordImpression();
    }
  }, [activeAd, position, impressionRecorded, deviceType]);

  // Safely execute Google AdSense scripts inside raw HTML injections
  useEffect(() => {
    if (position?.enabled && position.provider === "adsense" && position.adsenseCode) {
      const timer = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear and reload html code to trigger nested script elements properly
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

  // Intercept ad click securely
  const handleAdClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!activeAd) return;
    try {
      // Increment clicks count on Ad document
      await updateDoc(doc(db, "ads", activeAd.id), {
        clicks: increment(1),
      });

      // Write to ad_clicks logger
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

  // Skip rendering if slot disabled
  if (position && !position.enabled) {
    return null;
  }

  // Define standard aspect ratio styles to avoid Layout Shifts (CLS)
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
        return "min-h-[90px] md:min-h-[120px] w-full bg-neutral-900/40 my-4";
      case "Pre-roll Ads":
      case "Mid-roll Ads":
      case "Post-roll Ads":
        return "aspect-video w-full bg-black relative";
      case "Popup Ads":
        return "max-w-md w-full p-4 rounded-xl shadow-2xl bg-neutral-950";
      case "Sticky Ads":
        return "fixed bottom-0 left-0 right-0 z-40 bg-neutral-950 border-t border-neutral-800 p-2.5 shadow-lg flex justify-between items-center";
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

  // Custom Ad Provider Mode
  if (activeAd) {
    const isVideo = activeAd.adType === "Video" && activeAd.videoUrl;

    return (
      <div
        ref={containerRef}
        className={`overflow-hidden relative flex flex-col justify-center items-center border border-slate-100 hover:border-red-650/35 transition-all duration-300 rounded shadow-sm bg-white text-slate-800 ${getSizingStyle()} ${className}`}
        id={`custom-ad-slot-${placement.replace(/\s+/g, "-")}`}
      >
        {/* Humble Ad Tag Overlay */}
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

              {/* Hover highlight overlay */}
              <div className="absolute inset-0 bg-red-700/0 group-hover:bg-red-700/[0.02] border-2 border-transparent group-hover:border-red-600/20 transition-all duration-300 pointer-events-none" />
            </div>
          )}
        </a>
      </div>
    );
  }

  // Default subtle Ad placeholder (No shift fallback)
  return null;
}
