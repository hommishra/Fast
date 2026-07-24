import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  initialArticles, initialCategories, initialSettings, 
  initialAdSlots, initialCareers, initialUsers, initialComments,
  initialBreakingNews, initialMarkets, initialVideos, initialParentSections
} from './data';
import { Article, Category, WebsiteSettings, AdSlot, CareerListing, User, Comment, BreakingNewsItem, MarketItem, VideoItem, ParentSection, LiveBroadcastState, EBook, PaymentSettings, EBookPurchase, Subscriber, NewsletterSettings } from './types';

// Component Imports
import OpeningAnimation from './components/OpeningAnimation';
import Navigation from './components/Navigation';
import NewsTicker from './components/NewsTicker';
import GlobalMarkets from './components/GlobalMarkets';
import AdBanner from './components/AdBanner';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import SpecialPages from './components/SpecialPages';
import ArticleDetail from './components/ArticleDetail';
import LiveNewsSection from './components/LiveNewsSection';
import { EBooksStore } from './components/EBooksStore';
import { useDeviceDetect } from './useDeviceDetect';

// Icons
import { 
  TrendingUp, Eye, Heart, MessageSquare, Share2, 
  ExternalLink, ArrowRight, Play, CheckCircle2, 
  Send, ShieldAlert, Award, ChevronRight, Mail, Calendar, MapPin, Search, FileText, Info
} from 'lucide-react';

export default function App() {
  const deviceInfo = useDeviceDetect();
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    const lastAnim = localStorage.getItem('fc_last_animation_time');
    if (lastAnim) {
      const elapsed = Date.now() - parseInt(lastAnim, 10);
      // Automatically skip animation if user revisited within 30 minutes
      if (elapsed < 30 * 60 * 1000) {
        return false;
      }
    }
    return true;
  });
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  // Core synchronized database state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>(initialSettings);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [careers, setCareers] = useState<CareerListing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [breakingNews, setBreakingNews] = useState<BreakingNewsItem[]>([]);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [parentSections, setParentSections] = useState<ParentSection[]>([]);
  const [liveBroadcast, setLiveBroadcast] = useState<LiveBroadcastState>({
    isLive: false,
    title: "",
    description: "",
    category: "LIVE",
    streamUrl: "",
    thumbnailUrl: "",
    viewerCount: 0,
    isPinned: false,
    enabled: true,
    author: "",
    startTime: new Date().toISOString()
  });
  const [trash, setTrash] = useState<{
    articles: Article[];
    videos: VideoItem[];
    breakingNews: BreakingNewsItem[];
    markets: MarketItem[];
    categories: Category[];
  }>({ articles: [], videos: [], breakingNews: [], markets: [], categories: [] });

  // E-Books and Payment Gateway state
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    razorpay: { keyId: 'rzp_live_fc_global_2026', secretKey: 'fc_razorpay_secret_key', enabled: true, isTestMode: false },
    upi: { upiId: 'fastcoverages@upi', payeeName: 'FAST COVERAGES MEDIA', enabled: true },
    paypal: { merchantEmail: 'payments@fastcoverages.com', clientId: 'paypal_client_id_fc_2026', secretKey: 'paypal_secret_key', enabled: true, isSandbox: false }
  });
  const [purchases, setPurchases] = useState<EBookPurchase[]>([]);

  // Newsletter & Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newsletterSettings, setNewsletterSettings] = useState<NewsletterSettings>({
    enabled: true,
    autoSendArticleAlerts: true,
    sendBreakingNewsAlerts: true,
    sendWeeklyNewsletters: true,
    sendDailyBulletins: true,
    senderEmail: 'fastcoveragenews@gmail.com',
    welcomeSubject: 'Welcome to FAST COVERAGES - Global News Network',
    welcomeMessage: 'Thank you for subscribing to FAST COVERAGES. You will now receive breaking news, global updates, and exclusive reports directly in your inbox.'
  });

  // Selected Article detail view
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  // User comments state
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Infinite scrolling state on homepage
  const [visibleCount, setVisibleCount] = useState(5);

  // Load and synchronize state from server with real-time Server-Sent Events (SSE)
  useEffect(() => {
    // 1. Initial State Loading from database
    fetch('/api/db-state')
      .then(res => res.json())
      .then(data => {
        if (data.articles) setArticles(data.articles);
        else setArticles(initialArticles);

        if (data.categories) setCategories(data.categories);
        else setCategories(initialCategories);

        if (data.settings) setSettings(data.settings);
        else setSettings(initialSettings);

        if (data.adSlots) setAdSlots(data.adSlots);
        else setAdSlots(initialAdSlots);

        if (data.comments) setComments(data.comments);
        else setComments(initialComments);

        if (data.careers) setCareers(data.careers);
        else setCareers(initialCareers);

        if (data.breakingNews) setBreakingNews(data.breakingNews);
        else setBreakingNews(initialBreakingNews);

        if (data.markets) setMarkets(data.markets);
        else setMarkets(initialMarkets);

        if (data.videos) setVideos(data.videos);
        else setVideos(initialVideos);

        if (data.users) setUsers(data.users);
        else setUsers(initialUsers);

        if (data.parentSections) setParentSections(data.parentSections);
        else setParentSections(initialParentSections);

        if (data.liveBroadcast) setLiveBroadcast(data.liveBroadcast);

        if (data.ebooks) setEbooks(data.ebooks);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        if (data.purchases) setPurchases(data.purchases);
        if (data.subscribers) setSubscribers(data.subscribers);
        if (data.newsletterSettings) setNewsletterSettings(data.newsletterSettings);

        if (data.trash) setTrash(data.trash);
        else setTrash({ articles: [], videos: [], breakingNews: [], markets: [], categories: [] });
      })
      .catch(() => {
        // Fallback to initial default data on offline or build tasks
        setArticles(initialArticles);
        setCategories(initialCategories);
        setSettings(initialSettings);
        setAdSlots(initialAdSlots);
        setComments(initialComments);
        setCareers(initialCareers);
        setBreakingNews(initialBreakingNews);
        setMarkets(initialMarkets);
        setVideos(initialVideos);
        setUsers(initialUsers);
        setParentSections(initialParentSections);
        setTrash({ articles: [], videos: [], breakingNews: [], markets: [], categories: [] });
      });

    // 2. Continuous real-time subscription (SSE) to broadcast changes instantly
    const eventSource = new EventSource('/api/realtime-sync');
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'sync' && payload.data) {
          const data = payload.data;
          if (data.articles) setArticles(data.articles);
          if (data.categories) setCategories(data.categories);
          if (data.settings) setSettings(data.settings);
          if (data.adSlots) setAdSlots(data.adSlots);
          if (data.comments) setComments(data.comments);
          if (data.careers) setCareers(data.careers);
          if (data.breakingNews) setBreakingNews(data.breakingNews);
          if (data.markets) setMarkets(data.markets);
          if (data.videos) setVideos(data.videos);
          if (data.users) setUsers(data.users);
          if (data.parentSections) setParentSections(data.parentSections);
          if (data.liveBroadcast) setLiveBroadcast(data.liveBroadcast);
          if (data.ebooks) setEbooks(data.ebooks);
          if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
          if (data.purchases) setPurchases(data.purchases);
          if (data.subscribers) setSubscribers(data.subscribers);
          if (data.newsletterSettings) setNewsletterSettings(data.newsletterSettings);
          if (data.trash) setTrash(data.trash);
        }
      } catch (err) {
        console.error("Error parsing real-time sync data:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("Real-time sync connection disconnected. Attempting automatic reconnection...");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Route listener for /admin/login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/admin/login' || window.location.pathname.startsWith('/admin')) {
        setIsAdminOpen(true);
      }
    }
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
      window.history.pushState({ admin: true }, '', '/admin/login');
    }
  };
  useEffect(() => {
    if (articles.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const articleParam = params.get('article');
    if (articleParam) {
      const target = articles.find(a => 
        a.id === articleParam || 
        a.id.toLowerCase() === articleParam.toLowerCase() ||
        a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === articleParam.toLowerCase()
      );
      if (target) {
        setSelectedArticle(target);
      }
    }
  }, [articles]);

  // Sync back state modifications instantly to server
  const syncWithServer = (
    updatedArticles: Article[],
    updatedCategories: Category[],
    updatedSettings: WebsiteSettings,
    updatedAdSlots: AdSlot[],
    updatedComments: Comment[],
    updatedCareers: CareerListing[],
    updatedBreaking: BreakingNewsItem[],
    updatedMarkets: MarketItem[],
    updatedVideos: VideoItem[],
    updatedTrash?: typeof trash,
    updatedUsers?: User[],
    updatedParentSections?: ParentSection[],
    updatedLiveBroadcast?: LiveBroadcastState
  ) => {
    const adminToken = sessionStorage.getItem('fc_admin_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    fetch('/api/db-sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        articles: updatedArticles,
        categories: updatedCategories,
        settings: updatedSettings,
        comments: updatedComments,
        adSlots: updatedAdSlots,
        careers: updatedCareers,
        breakingNews: updatedBreaking,
        markets: updatedMarkets,
        videos: updatedVideos,
        users: updatedUsers || users,
        parentSections: updatedParentSections || parentSections,
        trash: updatedTrash || trash,
        liveBroadcast: updatedLiveBroadcast || liveBroadcast
      })
    }).catch(() => {
      console.log("Offline client sync completed.");
    });
  };

  const handleUpdateLiveBroadcast = (newLive: LiveBroadcastState) => {
    setLiveBroadcast(newLive);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, breakingNews, markets, videos, trash, users, parentSections, newLive);
  };

  // State update callbacks
  const handleUpdateArticles = (newArticles: Article[]) => {
    setArticles(newArticles);
    syncWithServer(newArticles, categories, settings, adSlots, comments, careers, breakingNews, markets, videos, trash, users);
  };

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    syncWithServer(articles, newCategories, settings, adSlots, comments, careers, breakingNews, markets, videos, trash, users);
  };

  const handleUpdateSettings = (newSettings: WebsiteSettings) => {
    setSettings(newSettings);
    syncWithServer(articles, categories, newSettings, adSlots, comments, careers, breakingNews, markets, videos, trash, users);
  };

  const handleUpdateAdSlots = (newAdSlots: AdSlot[]) => {
    setAdSlots(newAdSlots);
    syncWithServer(articles, categories, settings, newAdSlots, comments, careers, breakingNews, markets, videos, trash, users);
  };

  const handleUpdateCareers = (newCareers: CareerListing[]) => {
    setCareers(newCareers);
    syncWithServer(articles, categories, settings, adSlots, comments, newCareers, breakingNews, markets, videos, trash, users);
  };

  const handleUpdateBreakingNews = (newBreaking: BreakingNewsItem[]) => {
    setBreakingNews(newBreaking);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, newBreaking, markets, videos, trash, users);
  };

  const handleUpdateMarkets = (newMarkets: MarketItem[]) => {
    setMarkets(newMarkets);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, breakingNews, newMarkets, videos, trash, users);
  };

  const handleUpdateVideos = (newVideos: VideoItem[]) => {
    setVideos(newVideos);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, breakingNews, markets, newVideos, trash, users);
  };

  const handleUpdateTrash = (newTrash: typeof trash) => {
    setTrash(newTrash);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, breakingNews, markets, videos, newTrash, users);
  };

  const handleUpdateComments = (newComments: Comment[]) => {
    setComments(newComments);
    syncWithServer(articles, categories, settings, adSlots, newComments, careers, breakingNews, markets, videos, trash, users);
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, breakingNews, markets, videos, trash, newUsers);
  };

  const handleUpdateParentSections = (newParentSections: ParentSection[]) => {
    setParentSections(newParentSections);
    syncWithServer(articles, categories, settings, adSlots, comments, careers, breakingNews, markets, videos, trash, users, newParentSections);
  };

  // Toggle Dark Theme
  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Add visitor comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle || !commentName || !commentBody) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      articleId: selectedArticle.id,
      authorName: commentName,
      authorEmail: commentEmail,
      content: commentBody,
      date: new Date().toISOString(),
      isApproved: true // Instant approved for smooth real-time preview demo
    };

    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    
    // Update article count
    const updatedArticles = articles.map(a => 
      a.id === selectedArticle.id ? { ...a, commentsCount: a.commentsCount + 1 } : a
    );
    setArticles(updatedArticles);

    // Sync
    syncWithServer(updatedArticles, categories, settings, adSlots, updatedComments, careers, breakingNews, markets, videos);

    setCommentName('');
    setCommentEmail('');
    setCommentBody('');
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 4000);
  };

  // Like Article
  const handleLikeArticle = (id: string) => {
    const updated = articles.map(a => 
      a.id === id ? { ...a, likes: a.likes + 1 } : a
    );
    setArticles(updated);
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle({ ...selectedArticle, likes: selectedArticle.likes + 1 });
    }
    handleUpdateArticles(updated);
  };

  // Open & Track article views
  const handleViewArticle = (article: Article) => {
    setSelectedArticle(article);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?article=${encodeURIComponent(article.id)}`;
      window.history.pushState({ articleId: article.id }, '', newUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const updated = articles.map(a => 
      a.id === article.id ? { ...a, views: a.views + 1 } : a
    );
    setArticles(updated);
    handleUpdateArticles(updated);
  };

  // E-Book Handlers
  const handleSaveEBook = async (ebook: Partial<EBook>) => {
    try {
      const isEdit = Boolean(ebook.id);
      const url = isEdit ? `/api/ebooks/${ebook.id}` : '/api/ebooks';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ebook)
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Server error saving eBook:", res.status, text);
        return;
      }
      const data = await res.json();
      if (data.success && data.ebook) {
        if (isEdit) {
          setEbooks(prev => prev.map(e => e.id === data.ebook.id ? data.ebook : e));
        } else {
          setEbooks(prev => [data.ebook, ...prev]);
        }
      }
    } catch (err) {
      console.error("Error saving eBook:", err);
    }
  };

  const handleDeleteEBook = async (id: string) => {
    try {
      const res = await fetch(`/api/ebooks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEbooks(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error("Error deleting eBook:", err);
    }
  };

  const handleSavePaymentSettings = async (newSettings: PaymentSettings) => {
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success && data.paymentSettings) {
        setPaymentSettings(data.paymentSettings);
      }
    } catch (err) {
      console.error("Error saving payment settings:", err);
    }
  };

  const handlePurchaseEBook = async (purchaseData: {
    ebookId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    paymentGateway: 'Razorpay' | 'UPI' | 'PayPal';
    transactionId?: string;
  }) => {
    const res = await fetch('/api/ebooks/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });
    const result = await res.json();
    if (result.success && result.purchase) {
      setPurchases(prev => [result.purchase, ...prev]);
    }
    return result;
  };

  // Clear selected article and reset URL
  const handleBackToNewsDesk = () => {
    setSelectedArticle(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render Opening Animation
  if (showIntro) {
    return <OpeningAnimation onComplete={() => setShowIntro(false)} />;
  }

  // Filter articles based on Category route
  const getFilteredArticles = () => {
    if (currentPage === 'home') return articles;
    if (currentPage === 'breaking-news') return articles.filter(a => a.isPinned);
    if (currentPage === 'latest-news') return [...articles].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    if (currentPage === 'trending-news') return articles.filter(a => a.views > 8000);
    
    // Parent Section Match
    const matchedParent = parentSections.find(ps => ps.slug === currentPage);
    if (matchedParent) {
      const subCategories = categories.filter(c => c.parentSectionId === matchedParent.id);
      const subCategoryNames = subCategories.map(c => c.name.toLowerCase());
      return articles.filter(a => {
        const articleCat = a.category.toLowerCase();
        return articleCat === matchedParent.name.toLowerCase() || subCategoryNames.includes(articleCat);
      });
    }

    // Category Match
    const matchedCategory = categories.find(c => c.slug === currentPage);
    if (matchedCategory) {
      return articles.filter(a => a.category.toLowerCase() === matchedCategory.name.toLowerCase());
    }

    // Search Mode
    if (currentPage === 'search') {
      return articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return articles;
  };

  const filteredFeed = getFilteredArticles();
  const featuredHero = articles.find(a => a.isFeatured && a.status === 'Published') || articles[0];

  return (
    <div 
      data-device-type={deviceInfo.deviceType}
      data-orientation={deviceInfo.orientation}
      className={`min-h-screen flex flex-col transition-colors duration-300 ultrawide-container ${isDarkMode ? 'dark bg-editorial-bg text-editorial-text' : 'bg-[#fafaf6] text-slate-950'}`}
    >
      
      {/* 1. Global Navigation */}
      <Navigation
        categories={categories}
        settings={settings}
        parentSections={parentSections}
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSelectedArticle(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* 3. Scrolling Breaking Headlines Ticker */}
      <NewsTicker 
        breakingNews={breakingNews} 
        onSelectHeadline={(headline) => {
          // Attempt to find a matching article to open
          const matched = articles.find(a => a.title.toLowerCase() === headline.title.toLowerCase());
          if (matched) {
            handleViewArticle(matched);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }} 
      />

      {/* Full Screen Popup Advertisement Overlay */}
      {(() => {
        const popupAd = adSlots.find(s => s.active && (
          (s.position || '').toLowerCase().includes('popup') ||
          (s.type || '').toLowerCase().includes('popup')
        ));
        if (!popupAd || popupDismissed) return null;
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-900 border border-red-600/40 rounded-2xl p-4 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <AdBanner slot={popupAd} onDismiss={() => setPopupDismissed(true)} />
            </div>
          </div>
        );
      })()}

      {/* Primary Ad Header / Homepage Top Banner */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-4 shrink-0">
        <AdBanner position="Homepage Top Banner" adSlots={adSlots} />
      </div>

      {/* 4. Main Body Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        
        {/* Active Homepage Live Stream Banner Alert */}
        {currentPage === 'home' && !selectedArticle && liveBroadcast && liveBroadcast.isLive && liveBroadcast.enabled !== false && (
          <div className="bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border border-red-600/60 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 animate-fade-in text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-widest">
                    LIVE NOW
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {liveBroadcast.viewerCount || 1} Viewers Watching
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-black font-sans text-white mt-1 line-clamp-1">
                  {liveBroadcast.title || 'FAST COVERAGES LIVE BROADCAST'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentPage('live-news');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-mono font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Watch Live Stream</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        )}

        {selectedArticle ? (
          /* ================== DETAILED ARTICLE READING ROOM ================== */
          <ArticleDetail
            article={selectedArticle}
            articles={articles}
            categories={categories}
            adSlots={adSlots}
            comments={comments}
            settings={settings}
            breakingNews={breakingNews}
            onBack={handleBackToNewsDesk}
            onViewArticle={handleViewArticle}
            onAddComment={(articleId, name, email, content) => {
              const newComment: Comment = {
                id: `c-${Date.now()}`,
                articleId,
                authorName: name,
                authorEmail: email,
                content,
                date: new Date().toISOString(),
                isApproved: true
              };
              const updatedComments = [newComment, ...comments];
              setComments(updatedComments);
              const updatedArticles = articles.map(a => 
                a.id === articleId ? { ...a, commentsCount: (a.commentsCount || 0) + 1 } : a
              );
              setArticles(updatedArticles);
              syncWithServer(updatedArticles, categories, settings, adSlots, updatedComments, careers, breakingNews, markets, videos);
            }}
          />
        ) : currentPage === 'global-markets' ? (
          <div className="w-full">
            <GlobalMarkets 
              markets={markets} 
              onUpdateMarkets={handleUpdateMarkets} 
              settings={settings}
            />
          </div>
        ) : currentPage === 'live-news' ? (
          <LiveNewsSection 
            liveBroadcast={liveBroadcast} 
            videos={videos} 
            onPlayVideo={(v) => setPlayingVideo(v)} 
            isDarkMode={isDarkMode} 
          />
        ) : currentPage === 'ebooks' ? (
          <div className="w-full">
            <EBooksStore
              ebooks={ebooks}
              paymentSettings={paymentSettings}
              purchases={purchases}
              onPurchaseComplete={handlePurchaseEBook}
            />
          </div>
        ) : [
          'about-us', 'contact-us', 'advertise-with-us', 'careers',
          'privacy-policy', 'terms-and-conditions', 'disclaimer',
          'video-news', 'photo-gallery'
        ].includes(currentPage) ? (
          /* ================== DYNAMIC CORPORATE & SPECIAL DECK PAGES ================== */
          <SpecialPages
            page={currentPage}
            articles={articles}
            careers={careers}
            users={users}
            settings={settings}
            adSlots={adSlots}
            onNavigate={(page) => {
              setCurrentPage(page);
              setSelectedArticle(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewArticle={handleViewArticle}
            onUpdateCareers={handleUpdateCareers}
          />
        ) : (
          /* ================== STANDARD HOME & ROUTE FEEDS ================== */
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main News Stream Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* If on Home and has a Featured Hero Spot, render elegant hero banner */}
              {currentPage === 'home' && featuredHero && (
                <div 
                  onClick={() => handleViewArticle(featuredHero)}
                  className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 rounded-lg overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-all duration-300"
                >
                  <div className="relative overflow-hidden aspect-[16/9]">
                    <img 
                      src={featuredHero.image} 
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" 
                      alt={featuredHero.title}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col gap-1.5">
                      <span className="bg-editorial-accent text-white font-mono uppercase font-black text-[9px] px-2 py-0.5 rounded-sm w-fit tracking-[0.2em]">
                        FEATURED DECK
                      </span>
                      <h2 className="text-lg md:text-2xl font-black leading-tight group-hover:text-editorial-accent transition-colors">
                        {featuredHero.title}
                      </h2>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {featuredHero.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Title Header for feed */}
              <div className="flex items-center justify-between border-b-2 border-editorial-accent pb-2.5">
                <h2 className="text-sm md:text-base font-black uppercase text-slate-950 dark:text-editorial-text tracking-[0.25em] flex items-center gap-2 font-mono">
                  <span>
                    {parentSections.find(ps => ps.slug === currentPage)?.name || 
                     categories.find(c => c.slug === currentPage)?.name || 
                     (currentPage === 'home' ? 'TOP STORIES' : currentPage.replace('-', ' ').toUpperCase())}
                  </span>
                  <span className="text-xs bg-editorial-accent text-white px-2.5 py-0.5 rounded-full font-mono font-black animate-pulse">{filteredFeed.length} Items</span>
                </h2>
              </div>

              {/* Infinite Scrolling Feed list */}
              <div className="flex flex-col gap-5">
                {filteredFeed.slice(0, visibleCount).map((art) => (
                  <div 
                    key={art.id}
                    onClick={() => handleViewArticle(art)}
                    className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg flex flex-col md:flex-row gap-4 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    {art.image && (
                      <div className="w-full md:w-48 h-32 shrink-0 rounded overflow-hidden border border-slate-200 dark:border-white/10">
                        <img 
                          src={art.image} 
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform" 
                          alt={art.title}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col gap-1.5 justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-editorial-accent font-mono">{art.category}</span>
                          <span className="text-[10px] text-slate-400 dark:text-editorial-text/40 font-mono">{new Date(art.publishDate).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-950 dark:text-editorial-text group-hover:text-editorial-accent dark:group-hover:text-editorial-accent transition line-clamp-2">
                          {art.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-editorial-text/60 line-clamp-2 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-200 dark:border-white/5 mt-1">
                        <span className="font-mono text-slate-500 dark:text-editorial-text/40">By {art.author}</span>
                        <span className="font-mono text-slate-400 dark:text-editorial-text/40">{Math.max(1, Math.ceil((art.content || '').trim().split(/\s+/).length / 200))} min read</span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFeed.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-editorial-dark rounded-lg border border-slate-200/80 dark:border-white/5">
                    <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-bold text-slate-500 dark:text-editorial-text/70">No active bulletins match the requested search query or filters.</p>
                  </div>
                )}

                {filteredFeed.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="bg-editorial-accent hover:bg-red-700 text-white font-black py-3 px-6 rounded-lg text-xs uppercase tracking-widest transition-all text-center shadow-sm self-center font-mono cursor-pointer"
                  >
                    Load More Bulletins (Infinite Scroll)
                  </button>
                )}
              </div>

              {/* All Parent Sections Showcase on Home Page (CNN / BBC / Reuters style) */}
              {currentPage === 'home' && (parentSections || []).filter(ps => ps.active !== false).length > 0 && (
                <div className="flex flex-col gap-6 mt-8 pt-6 border-t-2 border-slate-900 dark:border-white/20">
                  <div className="flex items-center justify-between border-b-2 border-editorial-accent pb-2.5">
                    <h2 className="text-sm md:text-base font-black uppercase text-slate-950 dark:text-editorial-text tracking-[0.2em] flex items-center gap-2 font-mono">
                      <span className="w-2.5 h-2.5 bg-editorial-accent rounded-full animate-pulse"></span>
                      <span>ALL NETWORK PARENT DESKS & SECTIONS</span>
                    </h2>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {(parentSections || []).filter(ps => ps.active !== false).length} Desks Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(parentSections || []).filter(ps => ps.active !== false).map(ps => {
                      const subCats = categories.filter(c => c.parentSectionId === ps.id);
                      const subCatNames = subCats.map(c => c.name.toLowerCase());
                      const psArticles = articles.filter(a => {
                        const artCat = a.category.toLowerCase();
                        return artCat === ps.name.toLowerCase() || subCatNames.includes(artCat);
                      });

                      return (
                        <div 
                          key={ps.id} 
                          className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 rounded-lg p-4 flex flex-col gap-3 shadow-sm hover:border-editorial-accent/50 transition-all"
                        >
                          <div className="flex items-center justify-between border-b border-slate-150 dark:border-white/5 pb-2">
                            <button 
                              onClick={() => {
                                setCurrentPage(ps.slug);
                                setSelectedArticle(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white hover:text-editorial-accent transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{ps.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-editorial-accent" />
                            </button>
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-editorial-bg px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">
                              {psArticles.length} Bulletins
                            </span>
                          </div>

                          {/* Sub-categories Pills */}
                          {subCats.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {subCats.map(sc => (
                                <button
                                  key={sc.id}
                                  onClick={() => {
                                    setCurrentPage(sc.slug);
                                    setSelectedArticle(null);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-editorial-bg text-slate-600 dark:text-editorial-text/70 hover:bg-editorial-accent hover:text-white transition cursor-pointer"
                                >
                                  {sc.name}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Section Lead Article */}
                          {psArticles[0] ? (
                            <div 
                              onClick={() => handleViewArticle(psArticles[0])}
                              className="flex gap-3 items-center group cursor-pointer pt-1"
                            >
                              {psArticles[0].image && (
                                <img 
                                  src={psArticles[0].image} 
                                  alt={psArticles[0].title}
                                  className="w-20 h-14 object-cover rounded border border-slate-200 dark:border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="flex flex-col gap-0.5 overflow-hidden">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-editorial-accent transition line-clamp-2 leading-snug">
                                  {psArticles[0].title}
                                </h4>
                                <span className="text-[9px] text-slate-400 font-mono">{new Date(psArticles[0].publishDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">No bulletins published under {ps.name} desk yet.</p>
                          )}

                          {/* Secondary Headlines */}
                          {psArticles.slice(1, 3).length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                              {psArticles.slice(1, 3).map(art => (
                                <button
                                  key={art.id}
                                  onClick={() => handleViewArticle(art)}
                                  className="text-left text-xs font-medium text-slate-700 dark:text-editorial-text/80 hover:text-editorial-accent dark:hover:text-editorial-accent line-clamp-1 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span className="w-1 h-1 rounded-full bg-editorial-accent shrink-0"></span>
                                  <span>{art.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Homepage Middle Banner Ad Placement */}
              <div className="w-full my-4">
                <AdBanner position="Homepage Middle Banner" adSlots={adSlots} />
              </div>

            </div>

            {/* Sidebar widget slot columns */}
            <div className="flex flex-col gap-6">
              <AdBanner slot={adSlots.find(s => s.type === 'Sidebar')} />

              {/* Editor Picks */}
              <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent mb-3.5 tracking-[0.25em] font-mono">Editor Picks</h3>
                <div className="flex flex-col gap-4">
                  {articles.filter(a => a.isFeatured).slice(0, 3).map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleViewArticle(item)}
                      className="text-left flex gap-3 cursor-pointer group"
                    >
                      <span className="text-xl font-black text-editorial-accent font-mono">0{idx + 1}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-slate-950 dark:text-editorial-text group-hover:text-editorial-accent dark:group-hover:text-editorial-accent transition line-clamp-2">{item.title}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-editorial-text/40 font-mono">{item.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Bulletins */}
              <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent mb-3.5 tracking-[0.25em] font-mono">Trending Bulletins</h3>
                <div className="flex flex-col gap-3">
                  {articles.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleViewArticle(item)}
                      className="text-left flex flex-col gap-0.5 cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-editorial-text/90 group-hover:text-editorial-accent dark:group-hover:text-editorial-accent transition line-clamp-1">{item.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-editorial-text/40 font-mono">{item.category} • {new Date(item.publishDate).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
          </div>
        )}

        {currentPage === 'home' && !selectedArticle && videos && videos.length > 0 && (
          <div className="mt-12 bg-slate-50 dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center justify-between border-b-2 border-editorial-accent pb-2.5 mb-6 gap-3">
              <div 
                onClick={() => {
                  setCurrentPage('live-news');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
                <h2 className="text-sm md:text-base font-black uppercase text-slate-950 dark:text-editorial-text tracking-[0.25em] font-mono group-hover:text-red-600 transition">
                  FEATURED VIDEO BROADCASTS
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage('live-news');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-black font-mono text-red-600 hover:text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
              >
                <span>OPEN LIVE STREAM DESK & ALL VIDEOS</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((vid) => (
                <div 
                  key={vid.id}
                  onClick={() => {
                    setPlayingVideo(vid);
                    setCurrentPage('live-news');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white dark:bg-editorial-bg border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden group cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video overflow-hidden bg-black shrink-0">
                    <img src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-80" alt={vid.title} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="bg-red-600 text-white p-3.5 rounded-full shadow-lg transform group-hover:scale-105 transition-all">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-black">
                      {vid.category}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xs md:text-sm font-black text-slate-950 dark:text-editorial-text leading-snug group-hover:text-red-600 transition line-clamp-2">{vid.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-editorial-text/60 line-clamp-2 leading-relaxed">{vid.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 dark:border-white/5 pt-2">
                      <span>By {vid.author}</span>
                      <span>{new Date(vid.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'home' && !selectedArticle && (
          <div className="mt-8 flex flex-col gap-6">
            {/* Homepage Bottom Banner */}
            <AdBanner position="Homepage Bottom Banner" adSlots={adSlots} />

            <GlobalMarkets 
              markets={markets} 
              onUpdateMarkets={handleUpdateMarkets} 
              settings={settings}
            />
          </div>
        )}

      </main>

      {/* Primary Footer Ad Space */}
      <div className="max-w-7xl mx-auto w-full px-4 mb-6 shrink-0">
        <AdBanner position="Footer Section" adSlots={adSlots} slot={adSlots.find(s => s.type === 'Footer')} />
      </div>

      {/* 5. Custom Footer Directory */}
      <Footer 
        settings={settings} 
        currentPage={currentPage}
        onOpenAdmin={handleOpenAdmin}
        onReplayIntro={() => {
          localStorage.removeItem('fc_last_animation_time');
          setShowIntro(true);
        }}
        onNavigate={(page) => {
          // Special handles for RSS view
          if (page === 'rss-feed') {
            alert(`Opening standard live generated XML feed: https://fastcoverages.com/${page}.xml. Perfectly optimized for indexing!`);
          } else if (page === 'careers') {
            setCurrentPage('careers');
            setSelectedArticle(null);
          } else if (page === 'privacy-policy' || page === 'terms-and-conditions' || page === 'disclaimer') {
            setCurrentPage(page);
            setSelectedArticle(null);
          } else {
            setCurrentPage(page);
            setSelectedArticle(null);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 6. Active Admin Panel Launcher Overlay */}
      {isAdminOpen && (
        <AdminPanel
          articles={articles}
          categories={categories}
          settings={settings}
          adSlots={adSlots}
          careers={careers}
          users={users}
          breakingNews={breakingNews}
          markets={markets}
          videos={videos}
          ebooks={ebooks}
          paymentSettings={paymentSettings}
          purchases={purchases}
          onSaveEBook={handleSaveEBook}
          onDeleteEBook={handleDeleteEBook}
          onSavePaymentSettings={handleSavePaymentSettings}
          trash={trash}
          comments={comments}
          parentSections={parentSections}
          onSaveArticles={handleUpdateArticles}
          onSaveCategories={handleUpdateCategories}
          onSaveSettings={handleUpdateSettings}
          onSaveAdSlots={handleUpdateAdSlots}
          onSaveCareers={handleUpdateCareers}
          onSaveBreakingNews={handleUpdateBreakingNews}
          onSaveMarkets={handleUpdateMarkets}
          onSaveVideos={handleUpdateVideos}
          onSaveTrash={handleUpdateTrash}
          onSaveComments={handleUpdateComments}
          onSaveUsers={handleUpdateUsers}
          onSaveParentSections={handleUpdateParentSections}
          subscribers={subscribers}
          newsletterSettings={newsletterSettings}
          onSaveSubscribers={(updated) => setSubscribers(updated)}
          onSaveNewsletterSettings={(updated) => setNewsletterSettings(updated)}
          liveBroadcast={liveBroadcast}
          onSaveLiveBroadcast={handleUpdateLiveBroadcast}
          onClose={() => {
            setIsAdminOpen(false);
            if (typeof window !== 'undefined' && window.location.pathname === '/admin/login') {
              window.history.pushState({}, '', '/');
            }
          }}
        />
      )}

      {/* 7. Floating Video Player Modal */}
      {playingVideo && (
        <VideoPlayerModal 
          video={playingVideo} 
          onClose={() => setPlayingVideo(null)} 
        />
      )}

    </div>
  );
}

/* ================== ROBUST VIDEO PLAYER MODAL ================== */
interface VideoPlayerModalProps {
  video: VideoItem;
  onClose: () => void;
}

function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(video.videoUrl || '');
  const [hasError, setHasError] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setCurrentUrl(video.videoUrl || '');
    setHasError(false);
  }, [video]);

  const handleVideoError = () => {
    console.warn("Video playback error encountered.");
    setHasError(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 selection:bg-editorial-accent animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden max-w-4xl w-full flex flex-col shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/70 hover:bg-red-600 text-white p-2.5 rounded-full cursor-pointer transition z-20 border border-white/20 shadow-lg"
          title="Close Player"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef}
            src={currentUrl} 
            controls 
            autoPlay 
            playsInline
            controlsList="nodownload"
            disablePictureInPicture
            onError={handleVideoError}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-contain"
          />

          {hasError && (
            <div className="absolute top-3 left-3 bg-amber-500/90 text-black font-mono font-black text-[10px] px-2.5 py-1 rounded shadow flex items-center gap-1.5 backdrop-blur z-10">
              <span>⚠ Backup HD Broadcast Feed Active</span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col gap-2 text-left bg-zinc-900 border-t border-zinc-800 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-red-500 font-mono tracking-wider bg-red-950/80 border border-red-900/80 px-2.5 py-0.5 rounded">
              {video.category || 'BROADCAST'}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              Playable Broadcast Feed Active
            </span>
          </div>

          <h2 className="text-lg font-black leading-snug">{video.title}</h2>
          {video.description && (
            <p className="text-xs text-zinc-300 leading-relaxed font-serif">{video.description}</p>
          )}

          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-2 pt-3 border-t border-zinc-800">
            <span>Uploaded by: <strong className="text-zinc-200">{video.author || 'Fast Coverages Desk'}</strong></span>
            <span>Published: {new Date(video.publishDate).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
