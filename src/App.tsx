import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  initialArticles, initialCategories, initialSettings, 
  initialAdSlots, initialCareers, initialUsers, initialComments,
  initialBreakingNews, initialMarkets, initialVideos, initialParentSections
} from './data';
import { Article, Category, WebsiteSettings, AdSlot, CareerListing, User, Comment, BreakingNewsItem, MarketItem, VideoItem, ParentSection } from './types';

// Component Imports
import OpeningAnimation from './components/OpeningAnimation';
import Navigation from './components/Navigation';
import NewsTicker from './components/NewsTicker';
import GlobalMarkets from './components/GlobalMarkets';
import AdBanner from './components/AdBanner';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import SpecialPages from './components/SpecialPages';

// Icons
import { 
  TrendingUp, Eye, Heart, MessageSquare, Share2, 
  ExternalLink, ArrowRight, Play, CheckCircle2, 
  Send, ShieldAlert, Award, ChevronRight, Mail, Calendar, MapPin, Search, FileText, Info
} from 'lucide-react';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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
  const [trash, setTrash] = useState<{
    articles: Article[];
    videos: VideoItem[];
    breakingNews: BreakingNewsItem[];
    markets: MarketItem[];
    categories: Category[];
  }>({ articles: [], videos: [], breakingNews: [], markets: [], categories: [] });

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
    updatedParentSections?: ParentSection[]
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
        trash: updatedTrash || trash
      })
    }).catch(() => {
      console.log("Offline client sync completed.");
    });
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
    const updated = articles.map(a => 
      a.id === article.id ? { ...a, views: a.views + 1 } : a
    );
    setArticles(updated);
    handleUpdateArticles(updated);
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'dark bg-editorial-bg text-editorial-text' : 'bg-[#fafaf6] text-slate-950'}`}>
      
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
        onOpenAdmin={() => setIsAdminOpen(true)}
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

      {/* Primary Ad Header banner */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-4 shrink-0">
        <AdBanner slot={adSlots.find(s => s.type === 'Header')} />
      </div>

      {/* 4. Main Body Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        
        {selectedArticle ? (
          /* ================== DETAILED ARTICLE READING ROOM ================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm flex flex-col gap-5">
              
              <button 
                onClick={() => setSelectedArticle(null)}
                className="text-xs font-black uppercase text-editorial-accent hover:text-red-700 flex items-center gap-1 transition self-start font-mono"
              >
                &larr; Back to News Desk
              </button>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase bg-editorial-accent/10 dark:bg-editorial-accent/15 text-editorial-accent px-3 py-1 rounded w-fit tracking-wider font-mono">
                  {selectedArticle.category}
                </span>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-editorial-text leading-tight">
                  {selectedArticle.title}
                </h1>
                {selectedArticle.subtitle && (
                  <p className="text-base md:text-lg text-slate-500 dark:text-editorial-text/60 font-medium leading-relaxed">
                    {selectedArticle.subtitle}
                  </p>
                )}
              </div>

              {/* Author & Timestamp metadata line */}
              <div className="flex items-center gap-3 border-y border-slate-200 dark:border-white/10 py-3 text-xs text-slate-500 dark:text-editorial-text/60">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 shrink-0" 
                  alt={selectedArticle.author} 
                />
                <div>
                  <p className="font-bold text-slate-850 dark:text-editorial-text">{selectedArticle.author}</p>
                  <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 dark:text-editorial-text/40">{selectedArticle.authorRole} • {new Date(selectedArticle.publishDate).toUTCString()}</p>
                </div>
              </div>

              {selectedArticle.image && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/5">
                  <img 
                    src={selectedArticle.image} 
                    alt={selectedArticle.title}
                    className="w-full h-auto max-h-[450px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Dynamic Content rendered nicely */}
              <div className="text-sm md:text-base text-slate-850 dark:text-editorial-text/90 leading-relaxed space-y-4 whitespace-pre-line font-serif">
                {selectedArticle.content}
              </div>

              {/* Photo Media Gallery Block */}
              {selectedArticle.images && selectedArticle.images.length > 0 && (
                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-editorial-text/40 mb-3 font-mono">
                    Coverage Gallery ({selectedArticle.images.length} Photos)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedArticle.images.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className="relative aspect-[4/3] rounded overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 group shadow-sm hover:shadow transition-shadow"
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Report slide ${idx + 1}`} 
                          className="w-full h-full object-cover hover:scale-[1.02] transition duration-300 cursor-zoom-in"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(imgUrl, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="flex items-center gap-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs font-semibold text-slate-500">
                <button 
                  onClick={() => handleLikeArticle(selectedArticle.id)}
                  className="flex items-center gap-1.5 hover:text-editorial-accent transition cursor-pointer font-mono"
                >
                  <Heart className="w-5 h-5 text-editorial-accent fill-current" />
                  <span>{selectedArticle.likes} Likes</span>
                </button>
                <div className="flex items-center gap-1.5 font-mono">
                  <Eye className="w-5 h-5 text-slate-400" />
                  <span>{selectedArticle.views} Views</span>
                </div>
              </div>

              {/* Comment Thread */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col gap-6">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-950 dark:text-editorial-text">Visitor Comments</h3>
                
                {/* Submit comment form */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-3 p-4 bg-[#fcfbf9] dark:bg-editorial-dark border border-slate-200 dark:border-white/5 rounded-lg">
                  <span className="text-xs font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono tracking-wider">Join the debate</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={e => setCommentName(e.target.value)}
                      placeholder="Your Name *"
                      className="bg-white dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text"
                    />
                    <input
                      type="email"
                      required
                      value={commentEmail}
                      onChange={e => setCommentEmail(e.target.value)}
                      placeholder="Email (private) *"
                      className="bg-white dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text"
                    />
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    placeholder="Write constructive comment..."
                    className="bg-white dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text"
                  />

                  <button
                    type="submit"
                    className="bg-editorial-accent hover:bg-red-700 text-white font-black py-2 px-4 rounded text-xs uppercase tracking-wider self-end transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Post Comment
                  </button>

                  {commentSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" /> Comment recorded instantly.
                    </span>
                  )}
                </form>

                {/* Display approved comments */}
                <div className="flex flex-col gap-3.5">
                  {comments.filter(c => c.articleId === selectedArticle.id).map(com => (
                    <div key={com.id} className="p-4 bg-[#fcfbf9] dark:bg-editorial-bg border border-slate-200 dark:border-white/5 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-850 dark:text-editorial-text">{com.authorName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(com.date).toLocaleDateString()}</span>
                          {sessionStorage.getItem('fc_admin_session') === 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("PERMANENT DELETE: Are you sure you want to permanently delete this comment?")) {
                                  const updatedComments = comments.filter(c => c.id !== com.id);
                                  setComments(updatedComments);
                                  syncWithServer(articles, categories, settings, adSlots, updatedComments, careers, breakingNews, markets, videos);
                                }
                              }}
                              className="text-[10px] font-bold text-red-650 hover:text-red-750 font-mono hover:underline cursor-pointer"
                              title="Purge comment permanently"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-editorial-text/70 leading-relaxed font-sans">{com.content}</p>
                    </div>
                  ))}
                  {comments.filter(c => c.articleId === selectedArticle.id).length === 0 && (
                    <p className="text-xs text-slate-400">No comments posted yet. Be the first to express opinion!</p>
                  )}
                </div>

              </div>

            </div>

            {/* Sidebar with related entries and ads */}
            <div className="flex flex-col gap-6">
              <AdBanner slot={adSlots.find(s => s.type === 'Sidebar')} />
              
              <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg">
                <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-slate-200 dark:border-white/5 mb-3 tracking-[0.25em] font-mono">Related Desks</h3>
                <div className="flex flex-col gap-3">
                  {articles.filter(a => a.category === selectedArticle.category && a.id !== selectedArticle.id).slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleViewArticle(item)}
                      className="text-left group flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-editorial-text/95 group-hover:text-editorial-accent transition line-clamp-1">{item.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-editorial-text/40">{new Date(item.publishDate).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : currentPage === 'global-markets' ? (
          <div className="w-full">
            <GlobalMarkets 
              markets={markets} 
              onUpdateMarkets={handleUpdateMarkets} 
              settings={settings}
            />
          </div>
        ) : [
          'about-us', 'contact-us', 'advertise-with-us', 'careers',
          'privacy-policy', 'terms-and-conditions', 'disclaimer',
          'live-news', 'video-news', 'photo-gallery'
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
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {art.views}</span>
                          <span className="flex items-center gap-1 text-editorial-accent"><Heart className="w-3.5 h-3.5" /> {art.likes}</span>
                        </div>
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

              {/* Live updates / most read */}
              <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent mb-3.5 tracking-[0.25em] font-mono">Most Watched</h3>
                <div className="flex flex-col gap-3">
                  {articles.sort((a, b) => b.views - a.views).slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleViewArticle(item)}
                      className="text-left flex flex-col gap-0.5 cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-editorial-text/90 group-hover:text-editorial-accent dark:group-hover:text-editorial-accent transition line-clamp-1">{item.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-editorial-text/40 font-mono">{item.views.toLocaleString()} viewers</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {currentPage === 'home' && !selectedArticle && videos && videos.length > 0 && (
          <div className="mt-12 bg-slate-50 dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between border-b-2 border-editorial-accent pb-2.5 mb-6">
              <h2 className="text-sm md:text-base font-black uppercase text-slate-950 dark:text-editorial-text tracking-[0.25em] font-mono">
                FEATURED VIDEO BROADCASTS
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((vid) => (
                <div 
                  key={vid.id}
                  onClick={() => setPlayingVideo(vid)}
                  className="bg-white dark:bg-editorial-bg border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden group cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video overflow-hidden bg-black shrink-0">
                    <img src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-80" alt={vid.title} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="bg-editorial-accent text-white p-3.5 rounded-full shadow-lg transform group-hover:scale-105 transition-all">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-black">
                      {vid.category}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xs md:text-sm font-black text-slate-950 dark:text-editorial-text leading-snug group-hover:text-editorial-accent transition line-clamp-2">{vid.title}</h3>
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
          <div className="mt-8">
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
        <AdBanner slot={adSlots.find(s => s.type === 'Footer')} />
      </div>

      {/* 5. Custom Footer Directory */}
      <Footer 
        settings={settings} 
        currentPage={currentPage}
        onNavigate={(page) => {
          // Special handles for RSS or Sitemap view
          if (page === 'rss-feed' || page === 'sitemap') {
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
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* 7. Floating Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 selection:bg-editorial-accent">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden max-w-4xl w-full flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white p-2 rounded-full cursor-pointer transition z-10"
              title="Close Player"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video 
                src={playingVideo.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full"
              />
            </div>
            
            <div className="p-5 flex flex-col gap-1.5 text-left bg-zinc-900 border-t border-zinc-800 text-white">
              <span className="text-[10px] font-black uppercase text-editorial-accent font-mono tracking-wider">{playingVideo.category}</span>
              <h2 className="text-base font-black leading-snug">{playingVideo.title}</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">{playingVideo.description}</p>
              <div className="text-[10px] text-zinc-500 font-mono mt-1">
                Published by {playingVideo.author} on {new Date(playingVideo.publishDate).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
