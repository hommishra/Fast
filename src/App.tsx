import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit, doc, getDoc, updateDoc, where, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import { Article, Category, WebSettings, VideoItem, CoverageZone, Bookmark, EBook } from "./types";
import { useLanguage } from "./utils/LanguageContext";
import { seedDatabaseIfEmpty } from "./seedData";

import Header from "./components/Header";
import Footer from "./components/Footer";
import BreakingNewsTicker from "./components/BreakingNewsTicker";
import GlobalMarketTicker from "./components/GlobalMarketTicker";
import FCLayout from "./components/FCLayout";
import ArticleView from "./components/ArticleView";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import MarketDashboard from "./components/MarketDashboard";
import AuthModal from "./components/AuthModal";
import SavedArticlesModal from "./components/SavedArticlesModal";
import VideoHubView from "./components/VideoHubView";


export default function App() {
  // Global Database state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [coverageZones, setCoverageZones] = useState<CoverageZone[]>([]);
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [globalSettings, setGlobalSettings] = useState<WebSettings>({
    logoText: "FAST COVERAGE",
    siteTitle: "Fast Coverage | Rapid Global Headlines",
    contactEmail: "press@fastcoverage.news",
    securityEmail: "fastcoveragenews@gmail.com",
    aboutText: "Fast Coverage delivers rapid global bulletins, in-depth political dossiers, financial markers, and lifestyle reviews from the frontlines.",
    socialFacebook: "https://facebook.com/fastcoverage",
    socialTwitter: "https://twitter.com/fastcoverage",
    socialInstagram: "https://instagram.com/fastcoverage",
    socialYoutube: "https://youtube.com/fastcoverage",
    seoDescription: "Your leading dynamic global news bulletin dashboard.",
    adSenseCode: "ca-pub-681675716008",
    analyticsCode: "G-9203115333",
    mobileNumbers: [],
    gmailIds: []
  });

  // Gating & Routing states
  const [routeHash, setRouteHash] = useState(window.location.hash);
  const [adminSession, setAdminSession] = useState<{
    token: string;
    email: string;
    name: string;
    role: string;
    ip: string;
  } | null>(null);

  // Client layout states
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Keep selectedArticle in sync with database updates to avoid showing stale images
  useEffect(() => {
    if (selectedArticle) {
      const liveArticle = articles.find((a) => a.id === selectedArticle.id);
      if (liveArticle && (liveArticle.featuredImage !== selectedArticle.featuredImage || liveArticle.title !== selectedArticle.title || liveArticle.categoryId !== selectedArticle.categoryId)) {
        setSelectedArticle(liveArticle);
      }
    }
  }, [articles, selectedArticle]);

  // Reader authentication & saved blogs states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // Parse hash change listeners for secure routing
  useEffect(() => {
    const handleHashChange = () => {
      setRouteHash(window.location.hash);
      // If returning to public, reset view state
      if (window.location.hash !== "#admin-portal") {
        setSelectedArticle(null);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Check persistent admin sessions on boot
  useEffect(() => {
    const cachedSession = sessionStorage.getItem("fc_admin_session");
    if (cachedSession) {
      try {
        setAdminSession(JSON.parse(cachedSession));
      } catch (err) {
        console.error("Stale session tokens.");
      }
    }
  }, []);

  // Listen to Firebase Auth state with database-only reader fallback
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isFirebaseUser: true
        });
      } else {
        const storedReader = localStorage.getItem("fc_custom_reader_session");
        if (storedReader) {
          try {
            setCurrentUser(JSON.parse(storedReader));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });

    const handleStorageChange = () => {
      const storedReader = localStorage.getItem("fc_custom_reader_session");
      if (storedReader && !auth.currentUser) {
        try {
          setCurrentUser(JSON.parse(storedReader));
        } catch {
          setCurrentUser(null);
        }
      } else if (!storedReader && !auth.currentUser) {
        setCurrentUser(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      unsubAuth();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Listen to current user's bookmarks
  useEffect(() => {
    if (!currentUser || !currentUser.isFirebaseUser) {
      setBookmarks([]);
      return;
    }

    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Bookmark[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Bookmark);
      });
      list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setBookmarks(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Seed database if empty and run core listeners
  useEffect(() => {
    const initApp = async () => {
      // Trigger automatic starting seeding to guarantee beautiful layouts right away
      await seedDatabaseIfEmpty();

      // Log real-time website traffic visit
      try {
        let visitorId = localStorage.getItem("fc_visitor_id");
        if (!visitorId) {
          visitorId = "visitor_" + Math.random().toString(36).substring(2, 11);
          localStorage.setItem("fc_visitor_id", visitorId);
        }

        const now = new Date();
        const utcHour = now.getUTCHours();
        const hourBucket = String(Math.floor(utcHour / 4) * 4).padStart(2, "0") + ":00";

        await addDoc(collection(db, "traffic_logs"), {
          visitorId,
          timestamp: now.toISOString(),
          hour: hourBucket,
          path: window.location.hash || "/",
          userAgent: navigator.userAgent
        });
        console.log("Logged real-time website traffic in hour bucket:", hourBucket);
      } catch (err) {
        console.error("Failed to log real-time website traffic:", err);
      }

      // Ensure the Security Ops email is updated to fastcoveragenews@gmail.com
      try {
        const settingsRef = doc(db, "settings", "global");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as WebSettings;
          if (!data.securityEmail || data.securityEmail === "security@fastcoverage.news") {
            await updateDoc(settingsRef, {
              securityEmail: "fastcoveragenews@gmail.com"
            });
            console.log("Automatically patched securityEmail to fastcoveragenews@gmail.com");
          }
        }
      } catch (err) {
        console.error("Auto patch of security Email failed: ", err);
      }
    };
    initApp();

    // Listen to Articles Database (sorted descending)
    const unsubscribeArticles = onSnapshot(collection(db, "articles"), (snapshot) => {
      const items: Article[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Article);
      });
      // Sort articles by publish date descending
      items.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      setArticles(items);
    }, (error) => {
      console.error("Articles onSnapshot subscription failed:", error);
    });

    // Listen to Categories Database
    const unsubscribeCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(items);
    }, (error) => {
      console.error("Categories onSnapshot subscription failed:", error);
    });

    // Listen to Custom Site Settings
    const unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data() as WebSettings);
      }
    }, (error) => {
      console.error("Global settings onSnapshot subscription failed:", error);
    });

    // Listen to Videos database feed (using premium cnn style video bulletins)
    const qVideos = query(collection(db, "videoBulletins"), where("status", "==", "Published"));
    const unsubscribeVideos = onSnapshot(qVideos, (snapshot) => {
      const items: VideoItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          url: data.videoUrl || data.url || "",
          videoUrl: data.videoUrl || "",
          thumbnailUrl: data.thumbnailUrl || "",
          category: data.category || "general",
          duration: data.duration || "",
          createdAt: data.createdAt || new Date().toISOString(),
          publishedAt: data.publishedAt || data.createdAt || new Date().toISOString(),
          author: data.author || "admin@fastcoverage.news",
          status: data.status || "Published",
          views: data.views || 0,
          isLive: data.isLive || false,
          isScheduled: data.isScheduled || false,
          scheduledTime: data.scheduledTime || "",
          featured: data.featured || false,
          published: data.published !== undefined ? data.published : true
        } as VideoItem);
      });

      // Filter: handle any client-side scheduled release checks
      const now = new Date();
      const visibleItems = items.filter(v => {
        if (v.isScheduled && v.scheduledTime) {
          return now >= new Date(v.scheduledTime);
        }
        return true;
      });

      // Sort with precision: publishedAt descending
      visibleItems.sort((a, b) => {
        const tA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime();
        const tB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime();
        return tB - tA;
      });

      setVideos(visibleItems);
    }, (error) => {
      console.warn("videoBulletins listener failed, subscribing to legacy videos:", error);
      // Clean fallback if collection didn't bootstrap
      const qLegacy = query(collection(db, "videos"), where("status", "==", "Published"));
      onSnapshot(qLegacy, (legacySnap) => {
        const items: VideoItem[] = [];
        legacySnap.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            url: data.videoUrl || data.url || "",
            videoUrl: data.videoUrl || "",
            thumbnailUrl: data.thumbnailUrl || "",
            category: data.category || "general",
            duration: data.duration || "",
            createdAt: data.createdAt || new Date().toISOString(),
            publishedAt: data.publishedAt || data.createdAt || new Date().toISOString(),
            status: data.status || "Published",
            views: data.views || 0,
            featured: data.featured || false,
            published: data.published !== undefined ? data.published : true
          } as VideoItem);
        });
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setVideos(items);
      }, (legacyErr) => {
        console.error("Legacy videos listener failed:", legacyErr);
      });
    });

    // Listen to Coverage Zones collection
    const unsubscribeZones = onSnapshot(collection(db, "coverage_zones"), (snapshot) => {
      const items: CoverageZone[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CoverageZone);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCoverageZones(items);
    }, (error) => {
      console.error("Coverage zones onSnapshot subscription failed:", error);
    });

    // Listen to Ebooks collection
    const unsubscribeEbooks = onSnapshot(collection(db, "ebooks"), (snapshot) => {
      const items: EBook[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as EBook);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      setEbooks(items);
    }, (error) => {
      console.error("Ebooks onSnapshot subscription failed:", error);
    });

    return () => {
      unsubscribeArticles();
      unsubscribeCategories();
      unsubscribeSettings();
      unsubscribeVideos();
      unsubscribeZones();
      unsubscribeEbooks();
    };
  }, []);

  // Auth Operations
  const handleAdminLogin = (sessionData: typeof adminSession) => {
    if (!sessionData) return;
    sessionStorage.setItem("fc_admin_session", JSON.stringify(sessionData));
    setAdminSession(sessionData);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("fc_admin_session");
    setAdminSession(null);
    window.location.hash = ""; // Route away from control room
  };

  // Reader bookmarks management helpers
  const handleRemoveBookmark = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bookmarks", id));
    } catch (err) {
      console.error("Failed to delete bookmark:", err);
    }
  };

  const handleToggleBookmark = async (art: Article) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const bId = `${currentUser.uid}_${art.id}`;
    const alreadySaved = bookmarks.some((b) => b.id === bId);

    try {
      if (alreadySaved) {
        await deleteDoc(doc(db, "bookmarks", bId));
      } else {
        await setDoc(doc(db, "bookmarks", bId), {
          id: bId,
          userId: currentUser.uid,
          articleId: art.id,
          articleTitle: art.title,
          articleSlug: art.slug,
          featuredImage: art.featuredImage || "",
          categoryId: art.categoryId,
          savedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to save/bookmark article:", err);
    }
  };

  const handleSelectArticleById = (articleId: string) => {
    const art = articles.find((a) => a.id === articleId);
    if (art) {
      setSelectedArticle(art);
    }
  };

  // Find Related Articles helper
  const getRelatedArticles = (art: Article) => {
    return articles
      .filter((a) => a.id !== art.id && a.categoryId === art.categoryId && a.status === "Published")
      .slice(0, 4);
  };

  // Switch Category View
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedArticle(null);
  };

  // Render Engine Gating
  const isHoldingAdminPortal = routeHash === "#admin-portal" || routeHash === "#admin";

  if (isHoldingAdminPortal) {
    if (!adminSession) {
      /* Show isolated Admin Login Screen */
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLogin}
          onClose={() => {
            window.location.hash = "";
          }}
        />
      );
    }

    /* Active Admin Session Dashboard */
    return (
      <AdminPanel
        adminSession={adminSession}
        onLogout={handleAdminLogout}
        categories={categories}
        articles={articles}
        coverageZones={coverageZones}
      />
    );
  }

  /* Public CNN News Network Layout */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col selection:bg-blue-600 selection:text-white" id="public_news_shell">
      {/* Dynamic scrolling breaking bulletin ticker */}
      <BreakingNewsTicker />

      {/* Brand headers with global live UTC widgets */}
      <Header
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        logoText={globalSettings.logoText}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onSignOut={async () => {
          localStorage.removeItem("fc_custom_reader_session");
          await signOut(auth);
          setCurrentUser(null);
        }}
      />

      {/* Real-time Global Stock and Asset Index Ticker */}
      <GlobalMarketTicker />

      {/* Main content stage viewport */}
      <main className="flex-1 mt-6">
        {selectedArticle ? (
          <ArticleView
            article={selectedArticle}
            relatedArticles={getRelatedArticles(selectedArticle)}
            currentUser={currentUser}
            onToggleBookmark={handleToggleBookmark}
            bookmarks={bookmarks}
            onBack={() => {
              setSelectedArticle(null);
              window.scrollTo({ top: 0 });
            }}
            onSelectArticle={(art) => {
              setSelectedArticle(art);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : selectedCategoryId === "markets" ? (
          <MarketDashboard />
        ) : selectedCategoryId === "videos" ? (
          <VideoHubView
            videos={videos}
            currentUser={currentUser}
          />
        ) : (
          <FCLayout
            articles={articles}
            categories={categories}
            videos={videos}
            coverageZones={coverageZones}
            onSelectArticle={(art) => {
              setSelectedArticle(art);
              window.scrollTo({ top: 0 });
            }}
            selectedCategory={selectedCategoryId}
            searchTerm={searchTerm}
            ebooks={ebooks}
          />
        )}
      </main>

      {/* Professional global footers */}
      <Footer
        logoText={globalSettings.logoText}
        aboutText={globalSettings.aboutText}
        contactEmail={globalSettings.contactEmail}
        securityEmail={globalSettings.securityEmail}
        mobileNumbers={globalSettings.mobileNumbers}
        gmailIds={globalSettings.gmailIds}
        socials={{
          facebook: globalSettings.socialFacebook,
          twitter: globalSettings.socialTwitter,
          instagram: globalSettings.socialInstagram,
          youtube: globalSettings.socialYoutube,
        }}
      />

      {/* Reader Access Verification Gate modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Curated Personal Bookmark Dashboard modal */}
      <SavedArticlesModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onSelectArticleById={handleSelectArticleById}
      />
    </div>
  );
}
