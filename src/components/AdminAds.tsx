import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { Ad, AdCampaign, AdPosition, AdClick, AdImpression } from "../types";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart2,
  Settings,
  Tv,
  Globe,
  Monitor,
  Smartphone,
  Tablet as TabletIcon,
  Calendar,
  X,
  FileVideo,
  Image as ImageIcon,
  ExternalLink,
  Code,
  Layout,
  TrendingUp,
  MousePointer,
  Eye,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface AdminAdsProps {
  adminSession: {
    token: string;
    email: string;
    name: string;
    role: string;
  };
}

// Predefined slots representing website ad positions
const DEFAULT_SLOTS = [
  { id: "Top Banner", name: "Top Banner", description: "Displayed at the very top of the webpage above the header ticker." },
  { id: "Header Banner", name: "Header Banner", description: "Header area adjacent to the brand logo." },
  { id: "Footer Banner", name: "Footer Banner", description: "Bottom of the page above the footer credits." },
  { id: "Sidebar Banner", name: "Sidebar Banner", description: "Sidebar column on article and category view pages." },
  { id: "In-Article Banner", name: "In-Article Banner", description: "Embedded inside article content body." },
  { id: "Homepage Banner", name: "Homepage Banner", description: "Interstitial banner dividing homepage news grids." },
  { id: "Pre-roll Ads", name: "Pre-roll Ads", description: "Video ad appearing prior to news video playback." },
  { id: "Mid-roll Ads", name: "Mid-roll Ads", description: "Video ad overlay or breakpoint mid-way through video playback." },
  { id: "Post-roll Ads", name: "Post-roll Ads", description: "Video ad displayed upon video completion." },
  { id: "Popup Ads", name: "Popup Ads", description: "Centered modal overlay that appears for readers." },
  { id: "Sticky Ads", name: "Sticky Ads", description: "Floating bar docked to the bottom or sides of the screen." },
  { id: "Native Ads", name: "Native Ads", description: "Styled like a normal news card integrated within news grids." },
];

const CATEGORIES = ["World News", "Politics", "Business", "Sports", "Technology", "Entertainment"];

export default function AdminAds({ adminSession }: AdminAdsProps) {
  // Database States
  const [ads, setAds] = useState<Ad[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [clicks, setClicks] = useState<AdClick[]>([]);
  const [impressions, setImpressions] = useState<AdImpression[]>([]);
  const [isSeeded, setIsSeeded] = useState(false);

  // Active sub-tab
  const [subTab, setSubTab] = useState<"dashboard" | "ads" | "campaigns" | "placements">("dashboard");

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states - Custom Ads
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adTitle, setAdTitle] = useState("");
  const [adDesc, setAdDesc] = useState("");
  const [advertiserName, setAdvertiserName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adType, setAdType] = useState<Ad["adType"]>("Banner");
  const [adPlacement, setAdPlacement] = useState<Ad["adPlacement"]>("Homepage Banner");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [deviceTargeting, setDeviceTargeting] = useState<string[]>(["Mobile", "Desktop", "Tablet"]);
  const [categoryTargeting, setCategoryTargeting] = useState<string[]>([]);
  const [countryTargeting, setCountryTargeting] = useState("all");
  const [languageTargeting, setLanguageTargeting] = useState("all");
  const [imageFileLoading, setImageFileLoading] = useState(false);
  const [videoFileLoading, setVideoFileLoading] = useState(false);

  // Form states - Campaigns
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignAdvertiser, setCampaignAdvertiser] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [campaignStart, setCampaignStart] = useState("");
  const [campaignEnd, setCampaignEnd] = useState("");

  // Custom Delete Confirmation state to avoid browser window.confirm in iframe sandbox
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "ad" | "campaign" | null;
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: null,
    id: "",
    title: "",
  });

  // Real-time listener bindings
  useEffect(() => {
    setLoading(true);
    const unsubAds = onSnapshot(collection(db, "ads"), (snap) => {
      const list: Ad[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Ad));
      setAds(list);
    });

    const unsubCampaigns = onSnapshot(collection(db, "ad_campaigns"), (snap) => {
      const list: AdCampaign[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as AdCampaign));
      setCampaigns(list);
    });

    const unsubPositions = onSnapshot(collection(db, "ad_positions"), (snap) => {
      const list: AdPosition[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as AdPosition));
      setPositions(list);
    });

    const unsubClicks = onSnapshot(collection(db, "ad_clicks"), (snap) => {
      const list: AdClick[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as AdClick));
      setClicks(list);
    });

    const unsubImpressions = onSnapshot(collection(db, "ad_impressions"), (snap) => {
      const list: AdImpression[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as AdImpression));
      setImpressions(list);
      setLoading(false);
    });

    return () => {
      unsubAds();
      unsubCampaigns();
      unsubPositions();
      unsubClicks();
      unsubImpressions();
    };
  }, []);

  // Initialize and Seed Default Ad Positions if they are missing
  useEffect(() => {
    if (positions.length === 0 && !loading && !isSeeded) {
      setIsSeeded(true);
      const seedPlacements = async () => {
        try {
          for (const slot of DEFAULT_SLOTS) {
            const docRef = doc(db, "ad_positions", slot.id);
            await setDoc(docRef, {
              id: slot.id,
              name: slot.name,
              enabled: true,
              provider: "custom",
              adsenseCode: `<!-- AdSense Sandbox Placeholder for ${slot.name} -->\n<div class="adsense-sandbox" style="background:#1a1a1a; border:1px dashed #ef4444; padding:20px; text-align:center; color:#9ca3af; font-family:monospace; font-size:11px;">\n  <strong>GOOGLE ADSENSE ACTIVE PLACEHOLDER</strong><br/>Slot: ${slot.name}<br/>Status: Sandboxed Code Loaded\n</div>`,
              lazyLoad: true,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err: any) {
          console.error("Error seeding default slots:", err);
        }
      };
      seedPlacements();
    }
  }, [positions, loading, isSeeded]);

  // URL Security Validation
  const validateAdUrl = (url: string) => {
    if (!url) return "";
    const clean = url.trim();
    if (clean.toLowerCase().startsWith("javascript:")) {
      alert("Security alert: javascript: protocol is strictly forbidden to prevent XSS.");
      return "";
    }
    if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
      return "https://" + clean;
    }
    return clean;
  };

  // Helper file uploader converting files to server URLs safely
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") {
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
      }
      setImageFileLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            try {
              const base64Data = event.target.result as string;
              const res = await fetch("/api/admin/upload-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${adminSession.token}`
                },
                body: JSON.stringify({
                  fileName: file.name,
                  fileData: base64Data
                })
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "Image upload failed." }));
                throw new Error(errData.error || `Upload failed with status ${res.status}`);
              }

              const data = await res.json();
              if (data.success && data.url) {
                setAdImageUrl(data.url);
              } else {
                throw new Error("No URL returned from upload server.");
              }
            } catch (err: any) {
              alert("Image upload failed: " + err.message);
            }
          }
          setImageFileLoading(false);
        };
        reader.onerror = () => {
          alert("FileReader error reading image file.");
          setImageFileLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert("Image process failed: " + err.message);
        setImageFileLoading(false);
      }
    } else {
      if (!file.type.startsWith("video/")) {
        alert("Please upload a valid video file.");
        return;
      }
      setVideoFileLoading(true);
      try {
        // High-performance direct binary stream upload!
        const res = await fetch("/api/admin/upload-video-binary", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${adminSession.token}`,
            "x-file-name": file.name,
            "Content-Type": file.type || "video/mp4"
          },
          body: file
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Video upload failed." }));
          throw new Error(errData.error || `Upload failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.url) {
          setAdVideoUrl(data.url);
        } else {
          throw new Error("No URL returned from upload server.");
        }
      } catch (err: any) {
        alert("Video upload failed: " + err.message);
      } finally {
        setVideoFileLoading(false);
      }
    }
  };

  // Ad Save Trigger
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !advertiserName.trim()) {
      alert("Title and Advertiser Name are mandatory.");
      return;
    }

    const secureDestUrl = validateAdUrl(destinationUrl);
    if (destinationUrl && !secureDestUrl) return;

    try {
      const adId = editingAd ? editingAd.id : `ad_${Date.now()}`;
      const payload: Omit<Ad, "id"> = {
        title: adTitle.trim(),
        description: adDesc.trim(),
        advertiserName: advertiserName.trim(),
        destinationUrl: secureDestUrl,
        imageUrl: adImageUrl,
        videoUrl: adVideoUrl,
        adType,
        adPlacement,
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        status: editingAd ? editingAd.status : "Active",
        deviceTargeting: deviceTargeting as ("Mobile" | "Desktop" | "Tablet")[],
        categoryTargeting: categoryTargeting.length === 0 ? ["all"] : categoryTargeting,
        countries: countryTargeting.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
        languages: languageTargeting.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
        campaignId: campaignId || undefined,
        impressions: editingAd ? editingAd.impressions : 0,
        clicks: editingAd ? editingAd.clicks : 0,
        ctr: editingAd ? editingAd.ctr : 0,
        createdAt: editingAd ? editingAd.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "ads", adId), payload);
      setIsAdModalOpen(false);
      resetAdForm();
    } catch (err: any) {
      alert("Error saving Ad: " + err.message);
    }
  };

  const resetAdForm = () => {
    setEditingAd(null);
    setAdTitle("");
    setAdDesc("");
    setAdvertiserName("");
    setDestinationUrl("");
    setAdImageUrl("");
    setAdVideoUrl("");
    setAdType("Banner");
    setAdPlacement("Homepage Banner");
    setStartDate("");
    setEndDate("");
    setCampaignId("");
    setDeviceTargeting(["Mobile", "Desktop", "Tablet"]);
    setCategoryTargeting([]);
    setCountryTargeting("all");
    setLanguageTargeting("all");
  };

  const handleEditAdClick = (ad: Ad) => {
    setEditingAd(ad);
    setAdTitle(ad.title);
    setAdDesc(ad.description || "");
    setAdvertiserName(ad.advertiserName);
    setDestinationUrl(ad.destinationUrl);
    setAdImageUrl(ad.imageUrl || "");
    setAdVideoUrl(ad.videoUrl || "");
    setAdType(ad.adType);
    setAdPlacement(ad.adPlacement);
    setStartDate(ad.startDate);
    setEndDate(ad.endDate);
    setCampaignId(ad.campaignId || "");
    setDeviceTargeting(ad.deviceTargeting);
    setCategoryTargeting(ad.categoryTargeting.includes("all") ? [] : ad.categoryTargeting);
    setCountryTargeting(ad.countries.join(", ") || "all");
    setLanguageTargeting(ad.languages.join(", ") || "all");
    setIsAdModalOpen(true);
  };

  const handleToggleAdStatus = async (ad: Ad) => {
    const nextStatus = ad.status === "Active" ? "Paused" : "Active";
    try {
      await updateDoc(doc(db, "ads", ad.id), { status: nextStatus, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("Status toggle error:", err);
    }
  };

  const requestDeleteAd = (ad: Ad) => {
    setDeleteConfirm({
      isOpen: true,
      type: "ad",
      id: ad.id,
      title: ad.title,
    });
  };

  // Campaign Save Trigger
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !campaignAdvertiser.trim()) {
      alert("Campaign Name and Advertiser Name are required.");
      return;
    }

    try {
      const campId = editingCampaign ? editingCampaign.id : `camp_${Date.now()}`;
      const payload: AdCampaign = {
        id: campId,
        name: campaignName.trim(),
        advertiserName: campaignAdvertiser.trim(),
        budget: campaignBudget ? parseFloat(campaignBudget) : undefined,
        status: editingCampaign ? editingCampaign.status : "Active",
        startDate: campaignStart || new Date().toISOString().split("T")[0],
        endDate: campaignEnd || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        createdAt: editingCampaign ? editingCampaign.createdAt : new Date().toISOString(),
      };

      await setDoc(doc(db, "ad_campaigns", campId), payload);
      setIsCampaignModalOpen(false);
      resetCampaignForm();
    } catch (err: any) {
      alert("Error saving Campaign: " + err.message);
    }
  };

  const resetCampaignForm = () => {
    setEditingCampaign(null);
    setCampaignName("");
    setCampaignAdvertiser("");
    setCampaignBudget("");
    setCampaignStart("");
    setCampaignEnd("");
  };

  const handleEditCampaignClick = (camp: AdCampaign) => {
    setEditingCampaign(camp);
    setCampaignName(camp.name);
    setCampaignAdvertiser(camp.advertiserName);
    setCampaignBudget(camp.budget ? camp.budget.toString() : "");
    setCampaignStart(camp.startDate);
    setCampaignEnd(camp.endDate);
    setIsCampaignModalOpen(true);
  };

  const handleToggleCampaignStatus = async (camp: AdCampaign) => {
    const nextStatus = camp.status === "Active" ? "Paused" : "Active";
    try {
      await updateDoc(doc(db, "ad_campaigns", camp.id), { status: nextStatus });
    } catch (err: any) {
      console.error("Status toggle error:", err);
    }
  };

  const requestDeleteCampaign = (camp: AdCampaign) => {
    setDeleteConfirm({
      isOpen: true,
      type: "campaign",
      id: camp.id,
      title: camp.name,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;
    try {
      if (deleteConfirm.type === "ad") {
        await deleteDoc(doc(db, "ads", deleteConfirm.id));
      } else if (deleteConfirm.type === "campaign") {
        const campId = deleteConfirm.id;
        await deleteDoc(doc(db, "ad_campaigns", campId));
        // Unlink associated ads
        const associatedAds = ads.filter((a) => a.campaignId === campId);
        for (const ad of associatedAds) {
          await updateDoc(doc(db, "ads", ad.id), { campaignId: null });
        }
      }
    } catch (err: any) {
      console.error(`Delete ${deleteConfirm.type} error:`, err);
    } finally {
      setDeleteConfirm({ isOpen: false, type: null, id: "", title: "" });
    }
  };

  // Toggle Placement Settings
  const handleTogglePlacement = async (pos: AdPosition) => {
    try {
      await updateDoc(doc(db, "ad_positions", pos.id), { enabled: !pos.enabled });
    } catch (err: any) {
      console.error("Toggle placement error:", err);
    }
  };

  const handleProviderToggle = async (pos: AdPosition, prov: "custom" | "adsense") => {
    try {
      await updateDoc(doc(db, "ad_positions", pos.id), { provider: prov });
    } catch (err: any) {
      console.error("Provider toggle error:", err);
    }
  };

  const handleSaveAdSenseCode = async (posId: string, code: string) => {
    try {
      await updateDoc(doc(db, "ad_positions", posId), { adsenseCode: code });
      alert("AdSense HTML code block saved successfully for position: " + posId);
    } catch (err: any) {
      alert("Error saving AdSense code: " + err.message);
    }
  };

  const handleToggleLazyLoad = async (pos: AdPosition) => {
    try {
      await updateDoc(doc(db, "ad_positions", pos.id), { lazyLoad: !pos.lazyLoad });
    } catch (err: any) {
      console.error("Toggle lazy load error:", err);
    }
  };

  // --- ANALYTICS DATA COMPILATION ---
  // Compile total numbers from real live tracking logs
  const totalImpressions = impressions.length;
  const totalClicks = clicks.length;
  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Generate trend reporting data for daily, weekly, monthly
  const getDailyPerformanceData = () => {
    const data = [];
    // Get last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" }); // e.g. "Mon 6/22"

      // Filter real impressions and clicks for this date
      const dayImpressions = impressions.filter(imp => imp.timestamp && imp.timestamp.startsWith(dateString)).length;
      const dayClicks = clicks.filter(clk => clk.timestamp && clk.timestamp.startsWith(dateString)).length;
      const ctr = dayImpressions > 0 ? parseFloat(((dayClicks / dayImpressions) * 100).toFixed(2)) : 0;

      data.push({
        day: label,
        Impressions: dayImpressions,
        Clicks: dayClicks,
        CTR: ctr,
      });
    }
    return data;
  };

  // Compile exact Device distribution data dynamically from clicks logs
  const getDeviceDistributionData = () => {
    const mobileCount = clicks.filter((c) => c.device === "Mobile").length;
    const desktopCount = clicks.filter((c) => c.device === "Desktop").length;
    const tabletCount = clicks.filter((c) => c.device === "Tablet").length;
    const total = mobileCount + desktopCount + tabletCount;

    return [
      { name: "Mobile", value: mobileCount, percentage: total > 0 ? `${Math.round((mobileCount / total) * 100)}%` : "0%" },
      { name: "Desktop", value: desktopCount, percentage: total > 0 ? `${Math.round((desktopCount / total) * 100)}%` : "0%" },
      { name: "Tablet", value: tabletCount, percentage: total > 0 ? `${Math.round((tabletCount / total) * 100)}%` : "0%" },
    ];
  };

  const getPlacementStats = () => {
    // Group clicks and impressions by placement
    const stats: { [key: string]: { name: string; Impressions: number; Clicks: number } } = {};
    DEFAULT_SLOTS.forEach((slot) => {
      stats[slot.id] = { name: slot.name, Impressions: 0, Clicks: 0 };
    });

    // Create a map from ad ID to placement
    const adToPlacement: { [adId: string]: string } = {};
    ads.forEach((ad) => {
      adToPlacement[ad.id] = ad.adPlacement;
    });

    // Count real impressions from logs
    impressions.forEach((imp) => {
      const placement = adToPlacement[imp.adId];
      if (placement && stats[placement]) {
        stats[placement].Impressions++;
      }
    });

    // Count real clicks from logs
    clicks.forEach((clk) => {
      const placement = adToPlacement[clk.adId];
      if (placement && stats[placement]) {
        stats[placement].Clicks++;
      }
    });

    return Object.values(stats).filter((s) => s.Impressions > 0 || s.Clicks > 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="ads-manager-root">
      {/* Upper Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-white uppercase font-mono flex items-center gap-2">
            <Megaphone className="text-red-500 animate-pulse" size={20} />
            ADVERTISEMENT MANAGEMENT SYSTEM (FC-AMS)
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Publish custom banner/video promotions, paste Google AdSense code blocks, target demographics, and monitor CTR performance reports in real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab("dashboard")}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition ${
              subTab === "dashboard" ? "bg-red-700 text-white" : "bg-neutral-950 text-neutral-400 hover:text-white"
            }`}
          >
            <BarChart2 size={13} className="inline mr-1" /> Dashboard & Stats
          </button>
          <button
            onClick={() => setSubTab("ads")}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition ${
              subTab === "ads" ? "bg-red-700 text-white" : "bg-neutral-950 text-neutral-400 hover:text-white"
            }`}
          >
            <Megaphone size={13} className="inline mr-1" /> Custom Ads ({ads.length})
          </button>
          <button
            onClick={() => setSubTab("campaigns")}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition ${
              subTab === "campaigns" ? "bg-red-700 text-white" : "bg-neutral-950 text-neutral-400 hover:text-white"
            }`}
          >
            <TrendingUp size={13} className="inline mr-1" /> Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setSubTab("placements")}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition ${
              subTab === "placements" ? "bg-red-700 text-white" : "bg-neutral-950 text-neutral-400 hover:text-white"
            }`}
          >
            <Code size={13} className="inline mr-1" /> AdSense & Placements
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DASHBOARD */}
      {subTab === "dashboard" && (
        <div className="space-y-6">
          {/* Real-time stats widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-blue-950/40 border border-blue-900 rounded text-blue-400">
                <Eye size={20} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Total Impressions</span>
                <span className="text-xl font-black text-white font-mono">{totalImpressions.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-green-950/40 border border-green-900 rounded text-green-400">
                <MousePointer size={20} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Total Ad Clicks</span>
                <span className="text-xl font-black text-white font-mono">{totalClicks.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-red-950/40 border border-red-900 rounded text-red-400">
                <Percent size={20} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Average CTR %</span>
                <span className="text-xl font-black text-white font-mono">{averageCtr.toFixed(2)}%</span>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex items-center gap-4">
              <div className="p-3 bg-amber-950/40 border border-amber-900 rounded text-amber-400">
                <Megaphone size={20} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono uppercase">Active Placements</span>
                <span className="text-xl font-black text-white font-mono">
                  {positions.filter((p) => p.enabled).length} / {DEFAULT_SLOTS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 p-5 rounded-lg space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp size={14} className="text-red-500" /> Daily Impressions & Clicks Trend
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getDailyPerformanceData()}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="day" stroke="#737373" style={{ fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis yAxisId="left" stroke="#737373" style={{ fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#737373" style={{ fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", color: "#fff" }} />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
                    <Area yAxisId="left" type="monotone" dataKey="Impressions" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" />
                    <Area yAxisId="right" type="monotone" dataKey="Clicks" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-lg flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Layout size={14} className="text-red-500" /> Device Distribution
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">Reader engagement per client machine type</p>
              </div>
              <div className="h-[180px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDeviceDistributionData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#eab308" />
                    </Pie>
                    <Tooltip formatter={(value, name, props: any) => [`${value} clicks (${props.payload.percentage})`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around text-center text-[10px] font-mono text-neutral-400 pt-3 border-t border-neutral-900">
                <div>
                  <span className="w-2.5 h-2.5 bg-red-500 inline-block rounded mr-1" /> Mobile ({getDeviceDistributionData()[0].percentage})
                </div>
                <div>
                  <span className="w-2.5 h-2.5 bg-blue-500 inline-block rounded mr-1" /> Desktop ({getDeviceDistributionData()[1].percentage})
                </div>
                <div>
                  <span className="w-2.5 h-2.5 bg-amber-500 inline-block rounded mr-1" /> Tablet ({getDeviceDistributionData()[2].percentage})
                </div>
              </div>
            </div>
          </div>

          {/* Placement performance leaderboard */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <BarChart2 size={15} className="text-red-500" /> Placement Slot Engagement Leaderboard
            </h3>
            {getPlacementStats().length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500 italic">
                No active traffic data logs recorded yet. Display custom campaigns to populate this report.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300 font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px]">
                      <th className="p-3">Ad Position Slot</th>
                      <th className="p-3">Total Impressions</th>
                      <th className="p-3">Total Clicks</th>
                      <th className="p-3">CTR %</th>
                      <th className="p-3">Bar Visualization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {getPlacementStats()
                      .sort((a, b) => b.Clicks - a.Clicks)
                      .map((stat, i) => {
                        const ctr = stat.Impressions > 0 ? (stat.Clicks / stat.Impressions) * 100 : 0;
                        const maxImp = Math.max(...getPlacementStats().map((s) => s.Impressions)) || 1;
                        const barWidth = Math.min(100, (stat.Impressions / maxImp) * 100);

                        return (
                          <tr key={i} className="hover:bg-neutral-900/40">
                            <td className="p-3 text-white font-extrabold">{stat.name}</td>
                            <td className="p-3">{stat.Impressions.toLocaleString()}</td>
                            <td className="p-3 text-green-400">{stat.Clicks.toLocaleString()}</td>
                            <td className="p-3 text-amber-500 font-bold">{ctr.toFixed(2)}%</td>
                            <td className="p-3">
                              <div className="w-32 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-600 h-full rounded-full" style={{ width: `${barWidth}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CUSTOM ADS */}
      {subTab === "ads" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Registered Promo Ads ({ads.length})
            </h3>
            <button
              onClick={() => {
                resetAdForm();
                setIsAdModalOpen(true);
              }}
              className="bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-black py-2 px-3.5 rounded flex items-center gap-1.5 cursor-pointer active:scale-95 transition shadow-md"
            >
              <Plus size={14} /> Add New Ad Campaign Item
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
            {ads.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-500 italic space-y-2">
                <p>No custom promotion ads registered yet.</p>
                <p className="text-[10px]">Create ads targeting categories, languages, and device sizes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300 font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] bg-neutral-900/60">
                      <th className="p-3">Ad Promo Details</th>
                      <th className="p-3">Placement Slot</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Duration Dates</th>
                      <th className="p-3">Targeting (Device/Cat)</th>
                      <th className="p-3">Impressions</th>
                      <th className="p-3">Clicks</th>
                      <th className="p-3">CTR</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {ads.map((ad) => {
                      const isExpired = new Date(ad.endDate) < new Date();
                      return (
                        <tr key={ad.id} className="hover:bg-neutral-900/30">
                          <td className="p-3">
                            <div>
                              <span className="text-white font-extrabold block text-sm">{ad.title}</span>
                              <span className="text-[10px] text-neutral-500 block">Adv: {ad.advertiserName}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="bg-neutral-900 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-neutral-800">
                              {ad.adPlacement}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] uppercase font-bold text-blue-400">{ad.adType}</span>
                          </td>
                          <td className="p-3 text-neutral-400">
                            <div className="text-[10px]">
                              <span>S: {ad.startDate}</span>
                              <span className={`block ${isExpired ? "text-red-500 font-bold" : ""}`}>
                                E: {ad.endDate} {isExpired && "(Expired)"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-neutral-400 text-[10px] space-y-1">
                            <div className="flex gap-1">
                              {ad.deviceTargeting.map((dev) => (
                                <span key={dev} className="bg-neutral-900 text-neutral-300 px-1.5 py-0.2 rounded border border-neutral-800">
                                  {dev}
                                </span>
                              ))}
                            </div>
                            <div className="truncate max-w-[150px]" title={ad.categoryTargeting.join(", ")}>
                              Cat: {ad.categoryTargeting.join(", ")}
                            </div>
                          </td>
                          <td className="p-3 font-bold">{ad.impressions || 0}</td>
                          <td className="p-3 font-bold text-green-400">{ad.clicks || 0}</td>
                          <td className="p-3 font-bold text-amber-500">{((ad.clicks || 0) / Math.max(1, ad.impressions || 0) * 100).toFixed(2)}%</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleAdStatus(ad)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                ad.status === "Active"
                                  ? "bg-green-950/60 text-green-400 border border-green-900 hover:bg-green-900/50"
                                  : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700/50"
                              }`}
                            >
                              {ad.status}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditAdClick(ad)}
                                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded transition"
                                title="Edit Ad"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => requestDeleteAd(ad)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-950/60 hover:border-red-900 text-red-400 hover:text-white rounded transition"
                                title="Delete Ad"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: CAMPAIGNS */}
      {subTab === "campaigns" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Campaign Folders ({campaigns.length})
            </h3>
            <button
              onClick={() => {
                resetCampaignForm();
                setIsCampaignModalOpen(true);
              }}
              className="bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-black py-2 px-3.5 rounded flex items-center gap-1.5 cursor-pointer active:scale-95 transition shadow-md"
            >
              <Plus size={14} /> Add New Campaign Folder
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
            {campaigns.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-500 italic space-y-2">
                <p>No campaign folders created yet.</p>
                <p className="text-[10px]">Create an umbrella campaign with budget targets to bind related promotions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300 font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] bg-neutral-900/60">
                      <th className="p-3">Campaign Name</th>
                      <th className="p-3">Advertiser</th>
                      <th className="p-3">Budget</th>
                      <th className="p-3">Connected Ads</th>
                      <th className="p-3">Schedule</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {campaigns.map((camp) => {
                      const linkedAds = ads.filter((a) => a.campaignId === camp.id);
                      return (
                        <tr key={camp.id} className="hover:bg-neutral-900/30">
                          <td className="p-3">
                            <span className="text-white font-extrabold text-sm block">{camp.name}</span>
                          </td>
                          <td className="p-3 font-semibold text-neutral-400">{camp.advertiserName}</td>
                          <td className="p-3 font-bold text-amber-500">
                            {camp.budget ? `$${camp.budget.toLocaleString()}` : "No limit"}
                          </td>
                          <td className="p-3 text-blue-400 font-bold">
                            {linkedAds.length} Ad(s) linked
                          </td>
                          <td className="p-3 text-neutral-400 text-[10px]">
                            <div>Start: {camp.startDate}</div>
                            <div>End: {camp.endDate}</div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleCampaignStatus(camp)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                camp.status === "Active"
                                  ? "bg-green-950/60 text-green-400 border border-green-900 hover:bg-green-900/50"
                                  : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700/50"
                              }`}
                            >
                              {camp.status}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditCampaignClick(camp)}
                                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded transition"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => requestDeleteCampaign(camp)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-950/60 hover:border-red-900 text-red-400 hover:text-white rounded transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: ADSENSE & PLACEMENTS */}
      {subTab === "placements" && (
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-lg space-y-3 select-none">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Code size={16} className="text-red-500" /> Google AdSense & Slot Control Room
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Activate Google AdSense on your news agency layout dynamically! Set placements to <span className="text-amber-500 font-bold">Google AdSense</span> and paste your AdSense scripts directly. Custom promotions will automatically yield to AdSense code blocks when AdSense is chosen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {positions.map((pos) => (
              <div key={pos.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layout size={14} className="text-neutral-500" /> {pos.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {DEFAULT_SLOTS.find((s) => s.id === pos.id)?.description || "Website ad layout position slot."}
                      </p>
                    </div>
                    {/* Position Active/Disabled Toggle */}
                    <button
                      onClick={() => handleTogglePlacement(pos)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase transition cursor-pointer ${
                        pos.enabled
                          ? "bg-red-950/60 text-red-400 border border-red-900/60 hover:bg-red-900/40"
                          : "bg-neutral-800 text-neutral-500 border border-neutral-700 hover:text-neutral-400"
                      }`}
                    >
                      {pos.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {/* Provider Radio: Custom Ad vs Google AdSense */}
                  <div className="flex items-center gap-3 pt-1 border-t border-neutral-900">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Provider Mode:</span>
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300 font-mono cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`provider-${pos.id}`}
                        checked={pos.provider === "custom"}
                        onChange={() => handleProviderToggle(pos, "custom")}
                        className="accent-red-600"
                      />
                      Custom Ad
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300 font-mono cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`provider-${pos.id}`}
                        checked={pos.provider === "adsense"}
                        onChange={() => handleProviderToggle(pos, "adsense")}
                        className="accent-red-600"
                      />
                      Google AdSense
                    </label>
                  </div>

                  {/* Lazy Load toggle */}
                  <div className="flex items-center gap-3 pt-1 border-t border-neutral-900">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Lazy-Load Stats:</span>
                    <button
                      onClick={() => handleToggleLazyLoad(pos)}
                      className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded transition ${
                        pos.lazyLoad ? "bg-blue-950 text-blue-400 border border-blue-900/60" : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                      }`}
                    >
                      {pos.lazyLoad ? "Lazy Load: Enabled" : "Instant Load: Disabled"}
                    </button>
                    <span className="text-[10px] text-neutral-500 italic">(Prevents layouts shifting)</span>
                  </div>

                  {/* HTML Script Code Container if AdSense is selected */}
                  {pos.provider === "adsense" && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] text-neutral-400 font-mono uppercase block flex items-center gap-1">
                        <Code size={12} className="text-amber-500" /> Custom AdSense Code Script / HTML
                      </label>
                      <textarea
                        id={`adsense-code-${pos.id}`}
                        defaultValue={pos.adsenseCode || ""}
                        placeholder="Paste your <ins class='adsbygoogle' ...></ins> or responsive AdSense script tag here..."
                        rows={4}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs rounded p-2 focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById(`adsense-code-${pos.id}`) as HTMLTextAreaElement;
                          if (el) handleSaveAdSenseCode(pos.id, el.value);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-black font-mono font-extrabold text-[10px] px-3 py-1 rounded transition cursor-pointer"
                      >
                        Save AdSense Script
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT CUSTOM AD */}
      {isAdModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 shrink-0">
              <h3 className="text-base font-extrabold uppercase font-mono text-white flex items-center gap-2">
                <Megaphone size={16} className="text-red-500" />
                {editingAd ? "Modify Custom Advertisement" : "Register Custom Advertisement"}
              </h3>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAd} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Campaign connection dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Campaign Folder Connection</label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  >
                    <option value="">-- No campaign associated --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.advertiserName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Advertiser Name *</label>
                  <input
                    type="text"
                    value={advertiserName}
                    onChange={(e) => setAdvertiserName(e.target.value)}
                    placeholder="Enter brand / client name"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Ad Title / Headline *</label>
                <input
                  type="text"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="Enter catchphrase or display promo title"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Ad Description (Optional)</label>
                <textarea
                  value={adDesc}
                  onChange={(e) => setAdDesc(e.target.value)}
                  placeholder="Enter supporting subtext or advertiser message"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Destination URL */}
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Destination Destination URL *</label>
                <input
                  type="text"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://client-landing-page.com/promo"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  required
                />
              </div>

              {/* Placement & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Ad Format Type</label>
                  <select
                    value={adType}
                    onChange={(e) => setAdType(e.target.value as Ad["adType"])}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  >
                    <option value="Banner">Banner Ads</option>
                    <option value="Video">Video Ads</option>
                    <option value="Popup">Popup Ads</option>
                    <option value="Sticky">Sticky Ads</option>
                    <option value="Native">Native Ads</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Target Placement Slot</label>
                  <select
                    value={adPlacement}
                    onChange={(e) => setAdPlacement(e.target.value as Ad["adPlacement"])}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  >
                    {DEFAULT_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image & Video Content Loaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image Field */}
                <div className="space-y-2 border border-neutral-900 p-3 rounded bg-neutral-950">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block font-bold flex items-center gap-1">
                    <ImageIcon size={12} className="text-red-500" /> Ad Cover Image
                  </span>
                  <input
                    type="text"
                    value={adImageUrl}
                    onChange={(e) => setAdImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="text-[9px] text-neutral-500 font-mono">Or upload image file:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "image")}
                      className="hidden"
                      id="ad-image-file-input"
                    />
                    <label
                      htmlFor="ad-image-file-input"
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer transition select-none"
                    >
                      {imageFileLoading ? "Loading..." : "Choose File"}
                    </label>
                  </div>
                  {adImageUrl && (
                    <div className="pt-2">
                      <img src={adImageUrl} alt="Preview" className="h-16 w-full object-contain rounded border border-neutral-800 bg-black" />
                    </div>
                  )}
                </div>

                {/* Video Field */}
                <div className="space-y-2 border border-neutral-900 p-3 rounded bg-neutral-950">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase block font-bold flex items-center gap-1">
                    <FileVideo size={12} className="text-red-500" /> Ad Streaming Video
                  </span>
                  <input
                    type="text"
                    value={adVideoUrl}
                    onChange={(e) => setAdVideoUrl(e.target.value)}
                    placeholder="Paste video MP4 URL..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="text-[9px] text-neutral-500 font-mono">Or upload video file:</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(e, "video")}
                      className="hidden"
                      id="ad-video-file-input"
                    />
                    <label
                      htmlFor="ad-video-file-input"
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer transition select-none"
                    >
                      {videoFileLoading ? "Loading..." : "Choose File"}
                    </label>
                  </div>
                  {adVideoUrl && (
                    <div className="pt-2">
                      <video src={adVideoUrl} controls className="h-16 w-full object-contain rounded border border-neutral-800 bg-black" muted />
                    </div>
                  )}
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold flex items-center gap-1">
                    <Calendar size={12} className="text-red-500" /> Start Activation Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold flex items-center gap-1">
                    <Calendar size={12} className="text-red-500" /> End Activation Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                </div>
              </div>

              {/* Device Targeting Checklist */}
              <div className="space-y-1.5 border-t border-neutral-900 pt-3">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Device Targeting</label>
                <div className="flex gap-4">
                  {["Mobile", "Desktop", "Tablet"].map((device) => {
                    const isChecked = deviceTargeting.includes(device);
                    return (
                      <label key={device} className="flex items-center gap-1.5 text-xs text-white font-mono cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setDeviceTargeting(deviceTargeting.filter((d) => d !== device));
                            } else {
                              setDeviceTargeting([...deviceTargeting, device]);
                            }
                          }}
                          className="accent-red-600 rounded"
                        />
                        {device === "Mobile" && <Smartphone size={12} className="text-neutral-500" />}
                        {device === "Desktop" && <Monitor size={12} className="text-neutral-500" />}
                        {device === "Tablet" && <TabletIcon size={12} className="text-neutral-500" />}
                        {device}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Category Targeting Checklist */}
              <div className="space-y-1.5 border-t border-neutral-900 pt-3">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">
                  News Category Targeting (Leave empty for All Pages)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isChecked = categoryTargeting.includes(cat);
                    return (
                      <label key={cat} className="flex items-center gap-1.5 text-xs text-white font-mono cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setCategoryTargeting(categoryTargeting.filter((c) => c !== cat));
                            } else {
                              setCategoryTargeting([...categoryTargeting, cat]);
                            }
                          }}
                          className="accent-red-600 rounded"
                        />
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Country & Language Demographic parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-900 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold flex items-center gap-1">
                    <Globe size={12} className="text-red-500" /> Country ISO Targeting
                  </label>
                  <input
                    type="text"
                    value={countryTargeting}
                    onChange={(e) => setCountryTargeting(e.target.value)}
                    placeholder="all OR comma-separated, e.g. US, CA, GB"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold flex items-center gap-1">
                    <Globe size={12} className="text-red-500" /> Language Code Targeting
                  </label>
                  <input
                    type="text"
                    value={languageTargeting}
                    onChange={(e) => setLanguageTargeting(e.target.value)}
                    placeholder="all OR comma-separated, e.g. en, es, fr"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal footer / Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-mono text-xs font-bold py-2 px-4 rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-black py-2 px-5 rounded transition shadow-md cursor-pointer"
                >
                  Save Advertisement Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT CAMPAIGN */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <h3 className="text-base font-extrabold uppercase font-mono text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-red-500" />
                {editingCampaign ? "Modify Campaign Folder" : "Register Campaign Folder"}
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Q3 Tech Blast, Black Friday Sale"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Advertiser / Sponsor *</label>
                <input
                  type="text"
                  value={campaignAdvertiser}
                  onChange={(e) => setCampaignAdvertiser(e.target.value)}
                  placeholder="Enter sponsoring brand"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Allocated Budget Target ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">Start Schedule</label>
                  <input
                    type="date"
                    value={campaignStart}
                    onChange={(e) => setCampaignStart(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase block font-bold">End Schedule</label>
                  <input
                    type="date"
                    value={campaignEnd}
                    onChange={(e) => setCampaignEnd(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white font-mono focus:border-red-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-mono text-xs font-bold py-2 px-4 rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-black py-2 px-5 rounded transition shadow-md cursor-pointer"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elegant Custom Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-neutral-950 border border-red-950 rounded-lg p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 pb-2 border-b border-neutral-900">
              <Trash2 size={22} className="animate-pulse" />
              <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider">
                Confirm Database Deletion
              </h3>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 font-sans leading-relaxed">
              <p>
                Are you sure you want to permanently delete this {deleteConfirm.type === "ad" ? "Advertisement" : "Campaign"}?
              </p>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded font-mono text-[11px] text-white">
                <span className="text-neutral-500 uppercase block text-[9px] font-bold mb-1">Target Name</span>
                {deleteConfirm.title}
              </div>
              {deleteConfirm.type === "campaign" && (
                <p className="text-red-400 font-bold bg-red-950/20 border border-red-950/40 p-2 rounded text-[10px] uppercase font-mono">
                  Warning: Deleting this campaign will automatically unlink all associated advertisements.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: "", title: "" })}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-mono text-xs font-bold py-2 px-4 rounded transition cursor-pointer"
              >
                Cancel Action
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="bg-red-800 hover:bg-red-900 text-white font-mono text-xs font-black py-2 px-5 rounded transition shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
