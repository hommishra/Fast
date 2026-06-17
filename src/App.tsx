import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit, doc } from "firebase/firestore";
import { db } from "./firebase";
import { Article, Category, WebSettings } from "./types";
import { seedDatabaseIfEmpty } from "./seedData";

import Header from "./components/Header";
import Footer from "./components/Footer";
import BreakingNewsTicker from "./components/BreakingNewsTicker";
import GlobalMarketTicker from "./components/GlobalMarketTicker";
import CNNLayout from "./components/CNNLayout";
import ArticleView from "./components/ArticleView";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Global Database state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalSettings, setGlobalSettings] = useState<WebSettings>({
    logoText: "FAST COVERAGE",
    siteTitle: "Fast Coverage | Rapid Global Headlines",
    contactEmail: "press@fastcoverage.news",
    aboutText: "Fast Coverage delivers rapid global bulletins, in-depth political dossiers, financial markers, and lifestyle reviews from the frontlines.",
    socialFacebook: "https://facebook.com/fastcoverage",
    socialTwitter: "https://twitter.com/fastcoverage",
    socialInstagram: "https://instagram.com/fastcoverage",
    socialYoutube: "https://youtube.com/fastcoverage",
    seoDescription: "Your leading dynamic global news bulletin dashboard.",
    adSenseCode: "ca-pub-681675716008",
    analyticsCode: "G-9203115333"
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

  // Seed database if empty and run core listeners
  useEffect(() => {
    const initApp = async () => {
      // Trigger automatic starting seeding to guarantee beautiful layouts right away
      await seedDatabaseIfEmpty();
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
    });

    // Listen to Categories Database
    const unsubscribeCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(items);
    });

    // Listen to Custom Site Settings
    const unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data() as WebSettings);
      }
    });

    return () => {
      unsubscribeArticles();
      unsubscribeCategories();
      unsubscribeSettings();
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
      />

      {/* Real-time Global Stock and Asset Index Ticker */}
      <GlobalMarketTicker />

      {/* Main content stage viewport */}
      <main className="flex-1 mt-6">
        {selectedArticle ? (
          <ArticleView
            article={selectedArticle}
            relatedArticles={getRelatedArticles(selectedArticle)}
            onBack={() => {
              setSelectedArticle(null);
              window.scrollTo({ top: 0 });
            }}
            onSelectArticle={(art) => {
              setSelectedArticle(art);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : (
          <CNNLayout
            articles={articles}
            categories={categories}
            onSelectArticle={(art) => {
              setSelectedArticle(art);
              window.scrollTo({ top: 0 });
            }}
            selectedCategory={selectedCategoryId}
            searchTerm={searchTerm}
          />
        )}
      </main>

      {/* Professional global footers */}
      <Footer
        logoText={globalSettings.logoText}
        aboutText={globalSettings.aboutText}
        contactEmail={globalSettings.contactEmail}
        socials={{
          facebook: globalSettings.socialFacebook,
          twitter: globalSettings.socialTwitter,
          instagram: globalSettings.socialInstagram,
          youtube: globalSettings.socialYoutube,
        }}
      />
    </div>
  );
}
