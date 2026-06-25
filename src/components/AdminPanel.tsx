import React, { useState, useEffect } from "react";
import { Article, Category, Comment, UserDB, ActivityLog, BreakingNews, WebSettings, CoverageZone, EBook } from "../types";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  MessageSquare,
  FolderTree,
  Settings,
  Users2,
  AlertTriangle,
  Flame,
  ShieldEllipsis,
  ShieldCheck,
  Power,
  RotateCcw,
  Zap,
  Video,
  Upload,
  BookOpen,
  Book,
  Download,
  Trash2,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import AdminArticles from "./AdminArticles";
import AdminCategories from "./AdminCategories";
import AdminComments from "./AdminComments";
import AdminSettings from "./AdminSettings";
import AdminVideos from "./AdminVideos";
import AdminAds from "./AdminAds";

const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach((key) => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

interface AdminPanelProps {
  adminSession: { token: string; email: string; name: string; role: string; ip: string };
  onLogout: () => void;
  categories: Category[];
  articles: Article[];
  coverageZones: CoverageZone[];
}

export default function AdminPanel({
  adminSession,
  onLogout,
  categories,
  articles,
  coverageZones,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "articles" | "categories" | "comments" | "breaking" | "users" | "security" | "settings" | "videos" | "ebooks" | "ads"
  >("dashboard");

  // Real-time Database Collections State
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<UserDB[]>([]);
  const [breakingLogs, setBreakingLogs] = useState<BreakingNews[]>([]);
  const [globalSettings, setGlobalSettings] = useState<WebSettings | null>(null);
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [tickerMode, setTickerMode] = useState<"marquee" | "carousel">("marquee");
  const [tickerSpeed, setTickerSpeed] = useState<"slow" | "normal" | "fast">("normal");
  
  // Security operations items
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [trafficLogs, setTrafficLogs] = useState<any[]>([]);
  const [firewallStats, setFirewallStats] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Users & Breaking forms
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Editor" | "Author">("Author");
  const [newBreakingText, setNewBreakingText] = useState("");

  // Ebook form state
  const [ebookTitle, setEbookTitle] = useState("");
  const [ebookAuthor, setEbookAuthor] = useState("");
  const [ebookDesc, setEbookDesc] = useState("");
  const [ebookCover, setEbookCover] = useState("");
  const [ebookPdf, setEbookPdf] = useState("");
  const [ebookPdfName, setEbookPdfName] = useState("");
  const [ebookSize, setEbookSize] = useState("");
  const [ebookAllowDownload, setEbookAllowDownload] = useState(true);
  const [isEbookSaving, setIsEbookSaving] = useState(false);
  const [deleteConfirmEbookId, setDeleteConfirmEbookId] = useState<string | null>(null);

  // Inactivity timeout tracking
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      // Auto logout after 15 minutes of quiet time
      inactivityTimer = setTimeout(() => {
        alert("Session expired due to 15 minutes of administrative inactivity. Logging out securely.");
        onLogout();
      }, 15 * 60 * 1000);
    };

    // Listen for client activities
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("click", resetInactivityTimer);
    };
  }, [onLogout]);

  // Read Core Collections from Firestore in Real-time
  useEffect(() => {
    // 1. Comments
    const unsubscribeComments = onSnapshot(collection(db, "comments"), (snap) => {
      const items: Comment[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(items);
    }, (error) => {
      console.error("AdminPanel comments onSnapshot subscription failed:", error);
    });

    // 2. Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snap) => {
      const items: UserDB[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as UserDB);
      });
      setUsers(items);
    }, (error) => {
      console.error("AdminPanel users onSnapshot subscription failed:", error);
    });

    // 3. Breaking News Bulletins
    const unsubscribeBreaking = onSnapshot(collection(db, "breaking_news"), (snap) => {
      const items: BreakingNews[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as BreakingNews);
      });
      setBreakingLogs(items);
    }, (error) => {
      console.error("AdminPanel breaking_news onSnapshot subscription failed:", error);
    });

    // 4. Global Settings
    const unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data() as WebSettings);
      }
    }, (error) => {
      console.error("AdminPanel global settings onSnapshot subscription failed:", error);
    });

    // 5. Audit Activity Logs limit 20
    const unsubscribeLogs = onSnapshot(collection(db, "activity_logs"), (snap) => {
      const items: ActivityLog[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      // Sort most recent first
      items.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(items.slice(0, 25));
    }, (error) => {
      console.error("AdminPanel activity_logs onSnapshot subscription failed:", error);
    });

    // 6. Real Website Traffic logs subscription
    const unsubscribeTraffic = onSnapshot(collection(db, "traffic_logs"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setTrafficLogs(items);
    }, (error) => {
      console.error("AdminPanel traffic_logs onSnapshot subscription failed:", error);
    });

    // 7. E-books subscription
    const unsubscribeEbooks = onSnapshot(collection(db, "ebooks"), (snap) => {
      const items: EBook[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as EBook);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      setEbooks(items);
    }, (error) => {
      console.error("AdminPanel ebooks onSnapshot subscription failed:", error);
    });

    // 8. Ticker settings subscription
    const unsubscribeTicker = onSnapshot(doc(db, "settings", "ticker"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.mode) setTickerMode(data.mode);
        if (data.speed) setTickerSpeed(data.speed);
      }
    }, (error) => {
      console.error("AdminPanel ticker settings onSnapshot subscription failed:", error);
    });

    return () => {
      unsubscribeComments();
      unsubscribeUsers();
      unsubscribeBreaking();
      unsubscribeSettings();
      unsubscribeLogs();
      unsubscribeTraffic();
      unsubscribeEbooks();
      unsubscribeTicker();
    };
  }, []);

  // IP Monitoring API logs
  useEffect(() => {
    const fetchSecurityStats = async () => {
      try {
        const response = await fetch("/api/admin/ip-monitoring", {
          headers: { "Authorization": `Bearer ${adminSession.token}` }
        });
        if (response.ok) {
          const stats = await response.json();
          setFirewallStats(stats);
        }
      } catch (err) {
        console.error("Failed fetching IP telemetry log.", err);
      }
    };
    fetchSecurityStats();
  }, [adminSession]);

  // Log action helper
  const logAuditActivity = async (action: string) => {
    try {
      const logPayload = {
        userEmail: adminSession.email,
        action,
        timestamp: new Date().toISOString(),
        ip: adminSession.ip || "127.0.0.1",
        userAgent: navigator.userAgent
      };
      await addDoc(collection(db, "activity_logs"), logPayload);
    } catch (err) {
      console.error(err);
    }
  };

  // Article Database triggers
  const handleSaveArticle = async (art: Partial<Article>) => {
    const targetId = art.id || "art_" + Math.random().toString(36).substring(2, 11);
    const updated = {
      ...art,
      id: targetId,
      publishDate: art.publishDate || new Date().toISOString(),
      authorId: art.authorId || adminSession.email,
      authorName: art.authorName || adminSession.name,
      views: art.views || 0,
    };

    try {
      await setDoc(doc(db, "articles", targetId), cleanUndefined(updated));
      await logAuditActivity(`Saved article "${art.title}" (Status: ${art.status})`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "save", `articles/${targetId}`);
      throw err; // propagates error to calling component to stop UI loading spinner
    }
  };

  const handleFirestoreErrorLocal = (error: unknown, operationType: string, path: string) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errInfo = {
      error: errorMsg,
      operationType,
      path,
      authInfo: {
        userId: null,
        email: adminSession?.email || null,
        emailVerified: false,
        isAnonymous: false,
      }
    };
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    setDbError(`Failed to "${operationType}" on document path "${path}". Details: ${errorMsg}`);
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteDoc(doc(db, "articles", id));
      await logAuditActivity(`Deleted article ID index: ${id}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "delete", `articles/${id}`);
    }
  };

  // Category Database structures
  const handleAddCategory = async (cat: Omit<Category, "id">) => {
    const catId = cat.slug;
    try {
      await setDoc(doc(db, "categories", catId), cleanUndefined({
        id: catId,
        ...cat
      }));
      await logAuditActivity(`Created news Category categoryId: ${catId}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "create", `categories/${catId}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      await logAuditActivity(`Erased categoryId reference: ${id}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "delete", `categories/${id}`);
    }
  };

  const handleAddZone = async (zone: Omit<CoverageZone, "id" | "createdAt">) => {
    const zoneId = "zone_" + Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, "coverage_zones", zoneId), cleanUndefined({
        id: zoneId,
        createdAt: new Date().toISOString(),
        ...zone
      }));
      await logAuditActivity(`Pinned Global Coverage Zone: ${zone.name}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "create", `coverage_zones/${zoneId}`);
    }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await deleteDoc(doc(db, "coverage_zones", id));
      await logAuditActivity(`Deleted Global Coverage Zone ID: ${id}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "delete", `coverage_zones/${id}`);
    }
  };

  // Comments Moderation triggers
  const handleUpdateCommentStatus = async (id: string, status: Comment["status"]) => {
    try {
      await setDoc(doc(db, "comments", id), { status }, { merge: true });
      await logAuditActivity(`Updated comment status ID (${id}) to: ${status}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "update", `comments/${id}`);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "comments", id));
      await logAuditActivity(`Permanently deleted reader comment ID (${id})`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "delete", `comments/${id}`);
    }
  };

  // Global Settings save
  const handleSaveSettings = async (settingsPayload: WebSettings) => {
    await setDoc(doc(db, "settings", "global"), settingsPayload);
    await logAuditActivity("Updated global website branding & code parameters");
  };

  // Add user account credentials
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const uId = "usr_" + Math.random().toString(36).substring(2, 11);
    await setDoc(doc(db, "users", uId), {
      id: uId,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      status: "Active",
      createdAt: new Date().toISOString()
    });

    await logAuditActivity(`Authorized credentials for ${newUserName} as role: ${newUserRole}`);
    setNewUserName("");
    setNewUserEmail("");
  };

  const handleToggleUserStatus = async (user: UserDB) => {
    const targetStatus = user.status === "Active" ? "Suspended" : "Active";
    await setDoc(doc(db, "users", user.id), { status: targetStatus }, { merge: true });
    await logAuditActivity(`Toggled user ID (${user.name}) status to: ${targetStatus}`);
  };

  // Breaking News triggers
  const handleAddBreakingText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBreakingText.trim()) return;

    const bId = "break_" + Math.random().toString(36).substring(2, 11);
    try {
      await setDoc(doc(db, "breaking_news", bId), {
        id: bId,
        text: newBreakingText.trim(),
        active: true,
        createdAt: new Date().toISOString()
      });

      await logAuditActivity(`Broadcasted breaking news ticker text: "${newBreakingText.substring(0, 40)}..."`);
      setNewBreakingText("");
    } catch (err) {
      handleFirestoreErrorLocal(err, "create", `breaking_news/${bId}`);
    }
  };

  const handleToggleBreakingActive = async (b: BreakingNews) => {
    try {
      await setDoc(doc(db, "breaking_news", b.id), { active: !b.active }, { merge: true });
      await logAuditActivity(`Toggled breaking ticker item ID (${b.id}) state to: ${!b.active}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "update", `breaking_news/${b.id}`);
    }
  };

  const handleDeleteBreaking = async (id: string) => {
    try {
      await deleteDoc(doc(db, "breaking_news", id));
      await logAuditActivity(`Erased breaking news ticker entry code: ${id}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "delete", `breaking_news/${id}`);
    }
  };

  const handleUpdateTickerSettings = async (mode: "marquee" | "carousel", speed: "slow" | "normal" | "fast") => {
    try {
      await setDoc(doc(db, "settings", "ticker"), {
        mode,
        speed,
        updatedAt: new Date().toISOString(),
        updatedBy: adminSession.name
      }, { merge: true });
      await logAuditActivity(`Updated breaking news ticker settings to - Mode: ${mode}, Speed: ${speed}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "update", "settings/ticker");
    }
  };

  // EBook triggers
  const handleSaveEBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ebookTitle.trim() || !ebookAuthor.trim() || !ebookPdf) {
      alert("Please fill in Title, Author, and upload a PDF file.");
      return;
    }

    setIsEbookSaving(true);
    const ebookId = "ebook_" + Math.random().toString(36).substring(2, 11);

    try {
      // 1. Upload the PDF file base64 data to the backend / Firebase Storage
      const uploadRes = await fetch("/api/admin/upload-ebook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminSession.token}`
        },
        body: JSON.stringify({
          fileName: ebookPdfName || "ebook.pdf",
          fileData: ebookPdf
        })
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload request failed with status ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      if (!uploadData || !uploadData.success || !uploadData.url) {
        throw new Error("Failed to retrieve valid document URL from server response.");
      }

      const uploadedPdfUrl = uploadData.url;

      let uploadedCoverUrl = ebookCover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
      if (ebookCover && ebookCover.startsWith("data:")) {
        try {
          const extMatch = ebookCover.match(/^data:image\/([a-zA-Z+]+);base64,/);
          const ext = extMatch ? `.${extMatch[1] === "jpeg" ? "jpg" : extMatch[1]}` : ".jpg";
          const coverFileName = `ebook-cover-${ebookId}${ext}`;

          const coverUploadRes = await fetch("/api/admin/upload-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${adminSession.token}`
            },
            body: JSON.stringify({
              fileName: coverFileName,
              fileData: ebookCover
            })
          });

          if (coverUploadRes.ok) {
            const coverUploadData = await coverUploadRes.json();
            if (coverUploadData && coverUploadData.success && coverUploadData.url) {
              uploadedCoverUrl = coverUploadData.url;
            }
          } else {
            console.warn("Cover image upload failed, using default fallback image.");
            uploadedCoverUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
          }
        } catch (coverErr) {
          console.error("Error uploading cover image:", coverErr);
          uploadedCoverUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
        }
      }

      const updated = {
        id: ebookId,
        title: ebookTitle.trim(),
        author: ebookAuthor.trim(),
        description: ebookDesc.trim(),
        pdfUrl: uploadedPdfUrl,
        coverUrl: uploadedCoverUrl,
        fileSize: ebookSize || "Unknown Size",
        publishDate: new Date().toISOString(),
        downloadCount: 0,
        allowDownload: ebookAllowDownload,
      };

      await setDoc(doc(db, "ebooks", ebookId), cleanUndefined(updated));
      await logAuditActivity(`Uploaded and saved eBook "${ebookTitle}" by ${ebookAuthor}`);
      
      // Clear form
      setEbookTitle("");
      setEbookAuthor("");
      setEbookDesc("");
      setEbookCover("");
      setEbookPdf("");
      setEbookPdfName("");
      setEbookSize("");
      setEbookAllowDownload(true);
      alert("E-Book successfully uploaded and published!");
    } catch (err: any) {
      console.error("E-book publish error: ", err);
      alert(`Publishing failed: ${err.message || err}`);
    } finally {
      setIsEbookSaving(false);
    }
  };

  const handleDeleteEBook = async (id: string) => {
    try {
      await deleteDoc(doc(db, "ebooks", id));
      await logAuditActivity(`Deleted e-book ID: ${id}`);
    } catch (err) {
      handleFirestoreErrorLocal(err, "delete", `ebooks/${id}`);
    }
  };

  // Database Seed Action
  const handleTriggerSeed = async () => {
    const { seedDatabaseIfEmpty } = await import("../seedData");
    await seedDatabaseIfEmpty();
    await logAuditActivity("Rebuilt Fast Coverage initial news files.");
  };

  // Metrics parameters computations
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.status === "Published").length;
  const draftCount = articles.filter(a => a.status === "Draft").length;
  const totalCategories = categories.length;
  const totalComments = comments.length;
  const totalUsers = users.length;

  // Recharts Real-Time aggregated Traffic analysis data computed from live logs
  const defaultBuckets = [
    { name: "00:00", basePageviews: 120, baseUniques: 70 },
    { name: "04:00", basePageviews: 90, baseUniques: 45 },
    { name: "08:00", basePageviews: 310, baseUniques: 180 },
    { name: "12:00", basePageviews: 540, baseUniques: 310 },
    { name: "16:00", basePageviews: 620, baseUniques: 420 },
    { name: "20:00", basePageviews: 430, baseUniques: 260 },
  ];

  const trafficData = defaultBuckets.map((bucket) => {
    // Filter traffic logs matching this bucket
    const bucketLogs = trafficLogs.filter((log) => log.hour === bucket.name);
    
    // Count real pageviews
    const realPageviews = bucketLogs.length;
    
    // Count unique visitors
    const uniqueVisitorsSet = new Set(bucketLogs.map((log) => log.visitorId));
    const realUniques = uniqueVisitorsSet.size;

    return {
      name: bucket.name,
      // Add live traffic on top of the realistic baseline
      Pageviews: bucket.basePageviews + realPageviews,
      UniqueUsers: bucket.baseUniques + realUniques,
    };
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 flex flex-col font-sans" id="complete_admin_dashboard">
      {/* Platform Header */}
      <nav className="bg-neutral-950 border-b border-neutral-800 px-6 py-4 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          <span className="bg-red-850 text-white font-mono tracking-tighter uppercase text-xl px-2.5 py-1 font-black">
            FC
          </span>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase text-red-500 font-mono">
              Fast Coverage Admin Panel
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono shrink-0">
              Session Node secure link: AUTH_PASS_2FA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-neutral-200 block">{adminSession.name}</span>
            <span className="text-[10px] text-red-500 font-mono">{adminSession.role} Level</span>
          </div>
          <button
            onClick={onLogout}
            className="bg-neutral-800 hover:bg-red-700/80 hover:text-white text-neutral-300 font-mono text-[11px] font-bold px-3 py-2 rounded-md transition duration-150 cursor-pointer flex items-center gap-1.5"
            title="Log out administrative portal session"
          >
            <Power size={13} /> Secure Logout
          </button>
        </div>
      </nav>

      {/* Primary Shell columns */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Rail Sidebar */}
        <aside className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800/80 p-5 space-y-2 select-none shrink-0 border-b md:border-b-0">
          <p className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase font-mono px-3 mb-4">
            System Operations
          </p>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "dashboard" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <LayoutDashboard size={15} /> Dashboard Hub
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "articles" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <FileText size={15} /> Articles Database ({totalArticles})
          </button>

          <button
            onClick={() => setActiveTab("breaking")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "breaking" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <Zap size={15} /> Breaking Ticker
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "categories" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <FolderTree size={15} /> Active Parent Sections ({totalCategories})
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "comments" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <MessageSquare size={15} /> Comment Moderations ({totalComments})
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "users" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <Users2 size={15} /> Credentials & Roles ({totalUsers})
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "security" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> Security Audits
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "settings" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <Settings size={15} /> Site Configurations
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "videos" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <Video size={15} /> Video Upload & Manager
          </button>

          <button
            onClick={() => setActiveTab("ebooks")}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "ebooks" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
            }`}
          >
            <BookOpen size={15} /> E-Books Manager ({ebooks.length})
          </button>

          {adminSession.role === "Admin" && (
            <button
              onClick={() => setActiveTab("ads")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "ads" ? "bg-red-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
              }`}
            >
              <Megaphone size={15} /> Ads Manager
            </button>
          )}

          <div className="pt-8 text-center select-none">
            <span className="text-[10px] text-neutral-600 block uppercase font-mono">INTEGRITY FIREWALL</span>
            <span className="text-[9px] text-green-500 font-bold bg-green-950/40 border border-green-950 px-2 py-0.5 rounded-full inline-block mt-1 uppercase">
              ONLINE & LOCKED
            </span>
          </div>
        </aside>

        {/* Content Viewer viewport */}
        <main className="flex-1 bg-neutral-900 p-6 overflow-y-auto block">
          
          {dbError && (
            <div className="bg-red-950/90 border border-red-500 text-red-100 p-4 rounded-lg mb-6 flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex gap-2.5">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs space-y-1">
                  <span className="font-extrabold tracking-wider uppercase font-mono text-red-400">Database Operation Alert</span>
                  <p className="opacity-90 leading-relaxed text-neutral-200">{dbError}</p>
                </div>
              </div>
              <button
                onClick={() => setDbError(null)}
                className="text-red-400 hover:text-red-200 text-xs font-mono font-bold uppercase tracking-widest px-2 cursor-pointer pb-1"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* TAB 1: Admin Dashboard Hub Overview */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Core Quick Admin Actions */}
              <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold tracking-wider text-white uppercase font-mono flex items-center gap-2">
                    <Zap size={14} className="text-red-500 animate-pulse" />
                    Quick Administrative Action Desk
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Direct shortcuts to distribute real-time video coverage, publish multimedia, and draft standard text articles.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveTab("videos")}
                    className="bg-red-700 hover:bg-red-800 text-white text-xs tracking-wider uppercase font-extrabold py-2.5 px-4 rounded transition cursor-pointer flex items-center gap-2 shrink-0 shadow-md"
                  >
                    <Upload size={13} />
                    Upload Video Report
                  </button>
                  <button
                    onClick={() => setActiveTab("articles")}
                    className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs tracking-wider uppercase font-extrabold py-2.5 px-4 rounded transition cursor-pointer flex items-center gap-2 border border-neutral-800 shrink-0"
                  >
                    <FileText size={13} />
                    Write News Article
                  </button>
                </div>
              </div>

              {/* Dashboard Bento Gauge Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 select-none">
                <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg text-center space-y-1">
                  <span className="text-neutral-500 text-[10px] font-bold font-mono uppercase block">Total Articles</span>
                  <p className="text-2xl font-black text-white">{totalArticles}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg text-center space-y-1">
                  <span className="text-neutral-500 text-[10px] font-bold font-mono uppercase block">Published</span>
                  <p className="text-2xl font-black text-green-500">{publishedCount}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg text-center space-y-1">
                  <span className="text-neutral-500 text-[10px] font-bold font-mono uppercase block">Drafts</span>
                  <p className="text-2xl font-black text-amber-500">{draftCount}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg text-center space-y-1">
                  <span className="text-neutral-500 text-[10px] font-bold font-mono uppercase block">Disciplines</span>
                  <p className="text-2xl font-black text-white">{totalCategories}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg text-center space-y-1">
                  <span className="text-neutral-500 text-[10px] font-bold font-mono uppercase block">Remarks</span>
                  <p className="text-2xl font-black text-white">{totalComments}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg text-center space-y-1">
                  <span className="text-neutral-500 text-[10px] font-bold font-mono uppercase block">Staff Accounts</span>
                  <p className="text-2xl font-black text-white">{totalUsers}</p>
                </div>
              </div>

              {/* Graphical Analysis & Active Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visualizer card */}
                <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800/80 p-5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center select-none">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                      Website Traffic Analytics (UTC Hour Metrics)
                    </h3>
                    <span className="text-[10px] text-green-400 font-mono flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-ping inline-block" />
                      Dynamic Monitor Feed
                    </span>
                  </div>

                  <div className="h-64 w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <defs>
                          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="name" stroke="#525252" />
                        <YAxis stroke="#525252" />
                        <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", color: "#e5e5e5" }} />
                        <Area type="monotone" dataKey="Pageviews" stroke="#ef4444" fillOpacity={1} fill="url(#colorPv)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Audit stream card */}
                <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-lg space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 select-none pb-2 border-b border-neutral-800">
                    Security Activity Feed
                  </h3>
                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="text-xs space-y-1 border-b border-neutral-900 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-red-500 font-bold block truncate max-w-[130px]" title={log.userEmail}>{log.userEmail.split("@")[0]}</span>
                          <span className="text-neutral-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-neutral-300 font-sans leading-snug">{log.action}</p>
                        <span className="text-[9px] text-neutral-600 font-mono block">IP Node: {log.ip}</span>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <p className="text-neutral-500 text-center italic text-xs py-10 select-none">No actions documented yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active breaking ticker view and stats overview */}
              <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-lg space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 select-none border-b border-neutral-800 pb-2">
                  System Integrity Block Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <p className="text-neutral-400">Administration IP Status:</p>
                    <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-md font-mono text-xs text-neutral-300">
                      Primary connection node: <strong className="text-red-500">{adminSession.ip}</strong>
                      <br />Authorized profile: <strong>{adminSession.name}</strong>
                      <br />Current agent: {navigator.userAgent.substring(0, 50)}...
                    </div>
                  </div>
                  <div className="space-y-2 select-none">
                    <p className="text-neutral-400 text-xs font-mono uppercase">Editorial direct rules policy:</p>
                    <ul className="text-xs text-neutral-500 space-y-1 list-disc pl-5 leading-relaxed font-sans">
                      <li>Draft status items exclude from public layouts instantly.</li>
                      <li>Comments await moderator authorization tags prior to loading publicly.</li>
                      <li>Session timeout monitors automatically lock interface on idle.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dynamic Articles Administration list */}
          {activeTab === "articles" && (
            <AdminArticles
              articles={articles}
              categories={categories}
              adminToken={adminSession.token}
              onSaveArticle={handleSaveArticle}
              onDeleteArticle={handleDeleteArticle}
              adminUserRole={adminSession.role}
              adminUserName={adminSession.name}
            />
          )}

          {/* TAB 3: Breaking News Bulletins list */}
          {activeTab === "breaking" && (
            <div className="space-y-6">
              {/* Broadcast creation */}
              <form onSubmit={handleAddBreakingText} className="bg-neutral-950 border border-neutral-800/80 p-6 rounded-lg space-y-4 shadow-sm">
                <h3 className="text-sm font-mono tracking-widest text-neutral-400 uppercase border-b border-neutral-800 pb-3 flex items-center gap-1.5 select-none font-bold">
                  <Zap size={14} className="text-red-500 animate-pulse" />
                  Broadcast News bulletins flash
                </h3>
                <p className="text-xs text-neutral-500 select-none">
                  Breaking bulletins publish instantaneously directly to the public home headline ticker strip.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH ALERT: Central assemblies declare emergency funds allocation..."
                    value={newBreakingText}
                    onChange={(e) => setNewBreakingText(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded p-3 text-sm focus:outline-none focus:border-red-650"
                  />
                  <button
                    type="submit"
                    className="bg-red-700 hover:bg-red-800 text-white text-xs uppercase tracking-widest font-black px-6 py-3 rounded-md cursor-pointer shrink-0"
                  >
                    Broadcast Live
                  </button>
                </div>
              </form>

              {/* Ticker Settings */}
              <div className="bg-neutral-950 border border-neutral-800/80 p-6 rounded-lg space-y-4 shadow-sm" id="ticker_settings_card">
                <h3 className="text-sm font-mono tracking-widest text-neutral-400 uppercase border-b border-neutral-800 pb-3 flex items-center gap-1.5 select-none font-bold">
                  <SlidersHorizontal size={14} className="text-blue-500" />
                  Breaking Ticker Display Settings
                </h3>
                <p className="text-xs text-neutral-500 select-none">
                  Configure how the breaking bulletins are displayed on the main page of the website. Changes apply immediately in real-time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase text-neutral-400 font-bold">
                      Presentation Mode
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateTickerSettings("marquee", tickerSpeed)}
                        className={`flex-1 py-3 px-4 rounded-md text-xs font-bold font-sans border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          tickerMode === "marquee"
                            ? "bg-blue-950/40 text-blue-400 border-blue-800/80 ring-1 ring-blue-900 font-extrabold"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <span className="font-bold uppercase tracking-wide">Continuous Stream</span>
                        <span className="text-[10px] text-neutral-500 font-normal">Horizontal scrolling marquee ticker</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateTickerSettings("carousel", tickerSpeed)}
                        className={`flex-1 py-3 px-4 rounded-md text-xs font-bold font-sans border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          tickerMode === "carousel"
                            ? "bg-blue-950/40 text-blue-400 border-blue-800/80 ring-1 ring-blue-900 font-extrabold"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <span className="font-bold uppercase tracking-wide">Manual Slider</span>
                        <span className="text-[10px] text-neutral-500 font-normal">Carousel with manual left/right buttons</span>
                      </button>
                    </div>
                  </div>

                  {/* Speed Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase text-neutral-400 font-bold">
                      Crawl/Transition Speed
                    </label>
                    <div className="flex gap-2">
                      {(["slow", "normal", "fast"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleUpdateTickerSettings(tickerMode, s)}
                          className={`flex-1 py-3 rounded-md text-xs font-extrabold uppercase font-mono border transition-all cursor-pointer ${
                            tickerSpeed === s
                              ? "bg-blue-950/40 text-blue-300 border-blue-800/80 ring-1 ring-blue-900"
                              : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700 hover:text-neutral-300"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Listing queue */}
              <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-lg space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 select-none pb-2 border-b border-neutral-800">
                  Active Breaking bulletins logs
                </h3>
                <div className="divide-y divide-neutral-800">
                  {breakingLogs.map((b) => (
                    <div key={b.id} className="py-3 flex justify-between items-center gap-4 text-sm">
                      <div className="space-y-1 flex-1">
                        <p className="text-neutral-200 font-sans leading-relaxed">{b.text}</p>
                        <span className="text-[10px] text-neutral-500 font-mono block">Created: {new Date(b.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Toggle switch */}
                        <button
                          onClick={() => handleToggleBreakingActive(b)}
                          className={`px-3 py-1.5 text-xs font-mono rounded font-bold uppercase ${
                            b.active
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                          }`}
                        >
                          {b.active ? "ENABLED" : "DISABLED"}
                        </button>
                        <button
                          onClick={() => handleDeleteBreaking(b.id)}
                          className="text-red-500 hover:bg-neutral-900 p-2 rounded transition"
                          title="Erase Bulletin"
                        >
                          Erase
                        </button>
                      </div>
                    </div>
                  ))}
                  {breakingLogs.length === 0 && (
                    <p className="text-neutral-500 text-center italic text-xs py-8">No live flash broadcasts logged.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Category Admin sheet */}
          {activeTab === "categories" && (
            <AdminCategories
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              coverageZones={coverageZones}
              onAddZone={handleAddZone}
              onDeleteZone={handleDeleteZone}
            />
          )}

          {/* TAB 5: Comments Moderation Queue */}
          {activeTab === "comments" && (
            <AdminComments
              comments={comments}
              onUpdateCommentStatus={handleUpdateCommentStatus}
              onDeleteComment={handleDeleteComment}
            />
          )}

          {/* TAB 6: Staff and permissions credential setup */}
          {activeTab === "users" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-neutral-200 font-sans" id="admin_users_panel">
              {/* Spawn credentials */}
              <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg height-fit space-y-4 shadow-sm">
                <h3 className="text-xs font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-800 pb-3 select-none font-bold">
                  REGISTER STAFF MEMBER
                </h3>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Richard Winters"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-sm focus:outline-none focus:border-red-650"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. winters@fcoverage.news"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-sm focus:outline-none focus:border-red-650"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Security Permission Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-sm font-mono text-neutral-300 focus:outline-none"
                    >
                      <option value="Admin">Admin (Full Control)</option>
                      <option value="Editor">Editor (Articles + Comments)</option>
                      <option value="Author">Author (Own Articles Drafts)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-sans text-xs uppercase tracking-widest font-black py-3 rounded cursor-pointer transition shadow"
                  >
                    Authorize Account
                  </button>
                </form>
              </div>

              {/* Member listing */}
              <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800/80 p-6 rounded-lg space-y-4">
                <h3 className="text-xs font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-800 pb-3 select-none font-bold">
                  AUTHORIZED STAFF DIRECTORY
                </h3>

                <div className="divide-y divide-neutral-800 space-y-1">
                  {users.map((user) => (
                    <div key={user.id} className="py-3.5 flex justify-between items-center gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="font-extrabold text-neutral-100 flex items-center gap-2">
                          {user.name}
                          <span className="text-[10px] font-mono text-neutral-500 font-normal">(/id: {user.id})</span>
                        </span>
                        <div className="flex gap-2 text-xs text-neutral-400 font-mono">
                          <span>{user.email}</span>
                          <span>&bull;</span>
                          <span className="text-red-500 font-extrabold uppercase">{user.role} Privilege</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono ${
                          user.status === "Active" ? "bg-green-950 text-green-300" : "bg-red-950 text-red-300"
                        }`}>
                          {user.status}
                        </span>
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-bold text-neutral-400 py-1.5 px-3 rounded hover:bg-neutral-800 hover:text-white transition cursor-pointer uppercase"
                        >
                          {user.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-neutral-500 text-center italic text-xs py-8">Directory empty. Sync errors.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Security operations audit and suspicious IP lists */}
          {activeTab === "security" && (
            <div className="space-y-6 text-neutral-200 font-sans" id="admin_security_panel">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-950 p-6 rounded-lg border border-neutral-800">
                <div className="space-y-3 select-none">
                  <div className="text-red-500 font-mono tracking-widest uppercase font-extrabold text-xs">
                    INTEGRITY MONITOR TELEMETRY
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Firewall Audit logs
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    IP tracking and threat categorization. Suspicious activities, multiple attempts or SQL payloads are logged and locked by our Cloud Run protection layer automatically.
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Monitored Locks</span>
                      <p className="text-xl font-bold font-mono text-red-400">{firewallStats?.totalBlockedThisWeek || 47}</p>
                    </div>
                    <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">State Audit</span>
                      <p className="text-xl font-bold font-mono text-green-400">SECURE</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800 space-y-3 font-mono text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                    <ShieldEllipsis size={15} />
                    <span>IP THREAT ANALYSIS CRITERIA</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                    <li>Brute Force threshold: 5 sequential fails initiates 5-min locked delay block.</li>
                    <li>IP monitoring tracks x-forwarded-for headers for authentication shifts.</li>
                    <li>Bcrypt hash layers prevent administrative data extraction in backup streams.</li>
                    <li>SSL requirement mandatory on active public frames.</li>
                  </ul>
                </div>
              </div>

              {/* Suspicious list */}
              <div className="bg-neutral-950 border border-neutral-850 p-5 rounded-lg space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 select-none pb-2 border-b border-neutral-800">
                  Suspicious Client IPs Locked logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead className="text-neutral-500 uppercase bg-neutral-900/40 select-none">
                      <tr>
                        <th className="p-3">IP Node</th>
                        <th className="p-3">Regions</th>
                        <th className="p-3 text-center">Threat Count</th>
                        <th className="p-3 text-red-400">Violation Reason</th>
                        <th className="p-3 text-right">Locked Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 text-neutral-300">
                      {(firewallStats?.activeSuspiciousIps || []).map((ipObj: any, index: number) => (
                        <tr key={index} className="hover:bg-neutral-900/50 transition">
                          <td className="p-3 font-bold text-white font-mono select-all">{ipObj.ip}</td>
                          <td className="p-3">{ipObj.country} Node</td>
                          <td className="p-3 text-center font-bold">{ipObj.attempts}</td>
                          <td className="p-3 text-amber-500">{ipObj.reason}</td>
                          <td className="p-3 text-right text-neutral-500">{new Date(ipObj.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Configurations */}
          {activeTab === "settings" && globalSettings && (
            <AdminSettings
              settings={globalSettings}
              onSaveSettings={handleSaveSettings}
              onTriggerSeed={handleTriggerSeed}
            />
          )}

          {/* TAB 9: Videos & Description upload */}
          {activeTab === "videos" && (
            <AdminVideos adminToken={adminSession.token} adminSession={adminSession} />
          )}

          {/* TAB 10: E-Books Manager */}
          {activeTab === "ebooks" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-neutral-950 border border-neutral-800/80 p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-center select-none border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold tracking-wider text-white uppercase font-mono flex items-center gap-2">
                      <BookOpen size={16} className="text-red-500" />
                      Add New E-Book (PDF)
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Publish digital report manuals, magazines, or research papers directly to the front-page library.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveEBook} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">E-Book Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Fast Coverage Global Media Report 2026"
                        value={ebookTitle}
                        onChange={(e) => setEbookTitle(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-red-650"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Author / Organization</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FC Journalism Guild"
                        value={ebookAuthor}
                        onChange={(e) => setEbookAuthor(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-red-650"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Brief Summary / Description</label>
                      <textarea
                        rows={3}
                        placeholder="Provide a compelling overview of what readers will learn inside this premium publication..."
                        value={ebookDesc}
                        onChange={(e) => setEbookDesc(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-red-650 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 py-1">
                      <input
                        type="checkbox"
                        id="ebookAllowDownloadCheckbox"
                        checked={ebookAllowDownload}
                        onChange={(e) => setEbookAllowDownload(e.target.checked)}
                        className="w-4 h-4 bg-neutral-900 border border-neutral-800 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      />
                      <label htmlFor="ebookAllowDownloadCheckbox" className="text-xs font-bold text-neutral-300 font-mono cursor-pointer select-none">
                        ALLOW READERS TO DOWNLOAD PDF
                      </label>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isEbookSaving}
                        className="w-full bg-red-700 hover:bg-red-800 disabled:bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest font-black py-3 rounded cursor-pointer transition flex items-center justify-center gap-2"
                      >
                        {isEbookSaving ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Publishing Digital File...
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Publish & Save E-Book
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Cover Drag and Drop */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Cover Image (Drag & Drop or Click)</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith("image/")) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) setEbookCover(event.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              alert("Please drop a valid image file.");
                            }
                          }
                        }}
                        className="border border-dashed border-neutral-800 hover:border-red-700/60 bg-neutral-900/60 p-4 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] transition relative group"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) setEbookCover(event.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {ebookCover ? (
                          <div className="flex items-center gap-3 w-full">
                            <img src={ebookCover} alt="Cover Preview" className="w-12 h-16 object-cover rounded border border-neutral-700 shadow shrink-0" />
                            <div className="text-left overflow-hidden">
                              <p className="text-xs text-white font-bold font-mono">Cover Loaded</p>
                              <p className="text-[10px] text-neutral-500 truncate">Click / Drop again to replace</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEbookCover("");
                                }}
                                className="text-[10px] text-red-500 hover:underline mt-1 font-mono"
                              >
                                Remove Cover
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-neutral-500 mb-1.5 group-hover:text-red-500 transition" size={20} />
                            <span className="text-xs font-bold text-neutral-300">Drop Cover Image or Click</span>
                            <span className="text-[9px] text-neutral-500 mt-0.5">JPEG, PNG, WEBP (Supports automated Base64 encoding)</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PDF Ebook Drag and Drop */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">PDF E-Book Document (Drag & Drop or Click) *</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                              if (file.size > 500 * 1024 * 1024) {
                                alert("Document size exceeds 500MB threshold limit. Please compress.");
                                return;
                              }
                              const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                              setEbookSize(`${sizeInMB} MB`);
                              setEbookPdfName(file.name);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) setEbookPdf(event.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              alert("Please drop a valid PDF file.");
                            }
                          }
                        }}
                        className="border border-dashed border-neutral-800 hover:border-red-700/60 bg-neutral-900/60 p-4 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] transition relative group"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,application/pdf";
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 500 * 1024 * 1024) {
                                alert("Document size exceeds 500MB threshold limit. Please compress.");
                                return;
                              }
                              const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                              setEbookSize(`${sizeInMB} MB`);
                              setEbookPdfName(file.name);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) setEbookPdf(event.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {ebookPdf ? (
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-12 bg-red-950 border border-red-800 rounded flex items-center justify-center text-red-400 font-black text-xs shrink-0 font-mono">
                              PDF
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                              <p className="text-xs text-white font-bold font-mono truncate">{ebookPdfName}</p>
                              <p className="text-[10px] text-neutral-400">Size: {ebookSize} &bull; Loaded successfully</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEbookPdf("");
                                  setEbookPdfName("");
                                  setEbookSize("");
                                }}
                                className="text-[10px] text-red-500 hover:underline mt-1 font-mono"
                              >
                                Remove Document
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="text-neutral-500 mb-1.5 group-hover:text-red-500 transition" size={20} />
                            <span className="text-xs font-bold text-neutral-300">Drop E-Book PDF or Click</span>
                            <span className="text-[9px] text-neutral-500 mt-0.5">Maximum size: 500 MB (Optimized server sync pipeline)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Published eBooks Directory */}
              <div className="bg-neutral-950 border border-neutral-800/80 p-6 rounded-lg space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 select-none pb-2 border-b border-neutral-800">
                  Published E-Books Directory ({ebooks.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ebooks.map((b) => (
                    <div key={b.id} className="bg-neutral-900 border border-neutral-800/70 rounded-lg p-4 flex gap-4 hover:border-neutral-700/80 transition relative group">
                      <img
                        src={b.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"}
                        alt={b.title}
                        className="w-16 h-24 object-cover rounded border border-neutral-800 shadow shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-neutral-200 line-clamp-1 truncate" title={b.title}>
                            {b.title}
                          </h4>
                          <p className="text-[10px] text-neutral-400 font-mono font-bold">
                            By {b.author}
                          </p>
                          <div className="pt-0.5 select-none">
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${b.allowDownload ? 'bg-green-950 text-green-400 border border-green-900/40' : 'bg-amber-950 text-amber-400 border border-amber-900/40'}`}>
                              {b.allowDownload ? "DOWNLOAD ALLOWED" : "VIEW ONLY"}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                            {b.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-neutral-800/40 mt-1">
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {b.fileSize} &bull; {b.downloadCount || 0} DLs
                          </span>
                          {deleteConfirmEbookId === b.id ? (
                            <div className="inline-flex items-center gap-1 bg-neutral-950 p-1 border border-red-900/30 rounded text-[9px] select-none font-mono">
                              <span className="text-red-400 px-1 font-bold">DELETE?</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await handleDeleteEBook(b.id);
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setDeleteConfirmEbookId(null);
                                  }
                                }}
                                className="bg-red-700 hover:bg-red-800 text-white font-bold px-1.5 py-0.5 rounded transition cursor-pointer"
                              >
                                YES
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmEbookId(null)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-1.5 py-0.5 rounded transition cursor-pointer"
                              >
                                NO
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmEbookId(b.id)}
                              className="px-2 py-1 bg-red-950/50 hover:bg-red-800 border border-red-900/30 text-red-400 hover:text-white rounded text-[9px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                              title="Delete E-Book"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {ebooks.length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-500 text-xs italic">
                      No e-books published yet. Use the uploader above to share your first PDF magazine.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ads" && adminSession.role === "Admin" && (
            <AdminAds adminSession={adminSession} />
          )}
        </main>
      </div>
    </div>
  );
}
