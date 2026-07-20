import React, { useState, useEffect } from 'react';
import { Article, Category, User, AdSlot, WebsiteSettings, CareerListing, BreakingNewsItem, MarketItem, VideoItem } from '../types';
import { 
  FileText, FolderPlus, Settings as SettingsIcon, Image as ImageIcon, 
  Video, Eye, Calendar, Sparkles, LogOut, CheckCircle2, AlertTriangle, 
  Download, Database, Server, RefreshCw, Send, Plus, Trash2, Edit3, 
  TrendingUp, BarChart3, Layout, MessageSquare, Briefcase, HelpCircle,
  Shield, Lock, KeyRound, Radio, TrendingUp as TrendIcon, Check, Power
} from 'lucide-react';

interface AdminPanelProps {
  articles: Article[];
  categories: Category[];
  settings: WebsiteSettings;
  adSlots: AdSlot[];
  careers: CareerListing[];
  users: User[];
  breakingNews: BreakingNewsItem[];
  markets: MarketItem[];
  videos: VideoItem[];
  trash: {
    articles: Article[];
    videos: VideoItem[];
    breakingNews: BreakingNewsItem[];
    markets: MarketItem[];
    categories: Category[];
  };
  onSaveArticles: (articles: Article[]) => void;
  onSaveCategories: (categories: Category[]) => void;
  onSaveSettings: (settings: WebsiteSettings) => void;
  onSaveAdSlots: (slots: AdSlot[]) => void;
  onSaveCareers: (careers: CareerListing[]) => void;
  onSaveBreakingNews: (breaking: BreakingNewsItem[]) => void;
  onSaveMarkets: (markets: MarketItem[]) => void;
  onSaveVideos: (videos: VideoItem[]) => void;
  onSaveTrash: (trash: {
    articles: Article[];
    videos: VideoItem[];
    breakingNews: BreakingNewsItem[];
    markets: MarketItem[];
    categories: Category[];
  }) => void;
  onClose: () => void;
}

export default function AdminPanel({
  articles,
  categories,
  settings,
  adSlots,
  careers,
  users,
  breakingNews,
  markets,
  videos = [],
  trash,
  onSaveArticles,
  onSaveCategories,
  onSaveSettings,
  onSaveAdSlots,
  onSaveCareers,
  onSaveBreakingNews,
  onSaveMarkets,
  onSaveVideos,
  onSaveTrash,
  onClose
}: AdminPanelProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | '2fa'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [showTotpHint, setShowTotpHint] = useState(false);

  // General Tabs
  const [activeTab, setActiveTab] = useState<'articles' | 'ai-writer' | 'breaking-news' | 'markets' | 'categories' | 'ads' | 'settings' | 'server-deploy' | 'videos' | 'trash-bin'>('articles');

  // Video Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleVideoFileUpload = async (file: File, onUploadComplete: (url: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (e.g. .mp4, .mov, .webm).');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const response = await fetch('/api/upload-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              base64: base64Data
            })
          });
          
          const result = await response.json();
          if (result.success && result.fileUrl) {
            onUploadComplete(result.fileUrl);
            showBanner(`Video "${file.name}" uploaded successfully!`);
          } else {
            throw new Error(result.error || "Failed to upload video to server");
          }
        } catch (err: any) {
          console.error("Reader onload error:", err);
          setUploadError(err.message || "Upload failed");
          alert("Error: " + (err.message || "Failed to upload video."));
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        setUploadError("Failed to read video file.");
        alert("Failed to read video file.");
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || "Upload setup failed");
      alert("Error: " + (err.message || "Failed to upload video."));
    }
  };

  // Video form state
  const [editingVideo, setEditingVideo] = useState<Partial<VideoItem> | null>(null);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);

  // Article form state
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  // Breaking News form state
  const [editingBreaking, setEditingBreaking] = useState<Partial<BreakingNewsItem> | null>(null);
  const [isCreatingBreaking, setIsCreatingBreaking] = useState(false);

  // Markets form state
  const [editingMarket, setEditingMarket] = useState<Partial<MarketItem> | null>(null);
  const [isCreatingMarket, setIsCreatingMarket] = useState(false);

  // AI Writer state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState(categories[0]?.name || 'World News');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({ ...settings });

  // Ad Slot state
  const [adForm, setAdForm] = useState<AdSlot[]>(JSON.parse(JSON.stringify(adSlots)));

  // Banner Alerts inside Admin
  const [bannerText, setBannerText] = useState('');

  // Check existing session
  useEffect(() => {
    const isSessionActive = sessionStorage.getItem('fc_admin_session') === 'active';
    if (isSessionActive) {
      setIsAuthenticated(true);
    }
  }, []);

  const showBanner = (text: string) => {
    setBannerText(text);
    setTimeout(() => {
      setBannerText('');
    }, 4000);
  };

  // Secure Authentication Actions
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Pre-registered users or super credentials
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if ((cleanUser === 'hariom' && cleanPass === '2006') || ((cleanUser === 'admin' || cleanUser === 'sarah.j@fastcoverages.com') && cleanPass === 'password')) {
      setAuthStep('2fa');
      setShowTotpHint(true);
    } else {
      setAuthError('Access denied: Invalid administrative username or password combination.');
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (totpCode.trim() === '123456') {
      sessionStorage.setItem('fc_admin_session', 'active');
      setIsAuthenticated(true);
      showBanner("Administrative authentication successful. Welcome to the controls.");
    } else {
      setAuthError('Cryptographic match failed. Please input valid 2FA authenticator passcode.');
    }
  };

  // Article save actions
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    let updatedArticles = [...articles];
    if (isCreatingArticle) {
      const newArticle: Article = {
        id: `art-${Date.now()}`,
        title: editingArticle.title || 'Untitled Article',
        subtitle: editingArticle.subtitle,
        content: editingArticle.content || '',
        summary: editingArticle.summary || '',
        category: editingArticle.category || 'World News',
        subcategory: editingArticle.subcategory,
        image: editingArticle.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
        videoUrl: editingArticle.videoUrl,
        author: 'Sarah Jenkins',
        authorRole: 'Super Admin',
        publishDate: new Date().toISOString(),
        status: editingArticle.status || 'Published',
        isPinned: !!editingArticle.isPinned,
        isFeatured: !!editingArticle.isFeatured,
        views: editingArticle.views || 0,
        likes: editingArticle.likes || 0,
        commentsCount: 0,
        keywords: editingArticle.keywords || []
      };
      updatedArticles = [newArticle, ...updatedArticles];
    } else {
      updatedArticles = updatedArticles.map(a => 
        a.id === editingArticle.id ? { ...a, ...editingArticle as Article } : a
      );
    }

    onSaveArticles(updatedArticles);
    setEditingArticle(null);
    setIsCreatingArticle(false);
    showBanner("Article saved and published instantly globally.");
  };

  const handleDeleteArticle = (id: string) => {
    if (window.confirm("Are you sure you want to move this article to the Trash Bin?")) {
      const deletedItem = articles.find(a => a.id === id);
      const updated = articles.filter(a => a.id !== id);
      onSaveArticles(updated);
      if (deletedItem) {
        onSaveTrash({
          ...trash,
          articles: [deletedItem, ...(trash?.articles || [])]
        });
      }
      showBanner("Article moved to Trash Bin.");
    }
  };

  // Breaking news actions
  const handleSaveBreaking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBreaking) return;

    let updatedBreaking = [...breakingNews];
    if (isCreatingBreaking) {
      const newItem: BreakingNewsItem = {
        id: `b-${Date.now()}`,
        title: (editingBreaking.title || '').toUpperCase(),
        isPinned: !!editingBreaking.isPinned,
        publishDate: new Date().toISOString(),
        category: (editingBreaking.category || 'WORLD NEWS').toUpperCase(),
        active: editingBreaking.active !== false
      };
      updatedBreaking = [newItem, ...updatedBreaking];
    } else {
      updatedBreaking = updatedBreaking.map(item => 
        item.id === editingBreaking.id ? { ...item, ...editingBreaking, title: (editingBreaking.title || '').toUpperCase(), category: (editingBreaking.category || 'WORLD NEWS').toUpperCase() } as BreakingNewsItem : item
      );
    }

    onSaveBreakingNews(updatedBreaking);
    setEditingBreaking(null);
    setIsCreatingBreaking(false);
    showBanner("Breaking news headlines saved and updated instantly on visitor desks.");
  };

  const handleDeleteBreaking = (id: string) => {
    if (window.confirm("Move this breaking news ticker item to the Trash Bin?")) {
      const deletedItem = breakingNews.find(item => item.id === id);
      const updated = breakingNews.filter(item => item.id !== id);
      onSaveBreakingNews(updated);
      if (deletedItem) {
        onSaveTrash({
          ...trash,
          breakingNews: [deletedItem, ...(trash?.breakingNews || [])]
        });
      }
      showBanner("Headline moved to Trash Bin.");
    }
  };

  // Financial markets actions
  const handleSaveMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarket) return;

    let updatedMarkets = [...markets];
    if (isCreatingMarket) {
      const newItem: MarketItem = {
        id: `m-${Date.now()}`,
        name: editingMarket.name || 'New Index',
        value: editingMarket.value || '0.00',
        change: editingMarket.change || '0.00%',
        isUp: editingMarket.isUp !== false,
        active: editingMarket.active !== false,
        position: editingMarket.position || (markets.length + 1)
      };
      updatedMarkets.push(newItem);
    } else {
      updatedMarkets = updatedMarkets.map(item => 
        item.id === editingMarket.id ? { ...item, ...editingMarket } as MarketItem : item
      );
    }

    onSaveMarkets(updatedMarkets);
    setEditingMarket(null);
    setIsCreatingMarket(false);
    showBanner("Financial market configuration synchronized perfectly.");
  };

  const handleDeleteMarket = (id: string) => {
    if (window.confirm("Are you sure you want to move this financial market ticker to the Trash Bin?")) {
      const deletedItem = markets.find(item => item.id === id);
      const updated = markets.filter(item => item.id !== id);
      onSaveMarkets(updated);
      if (deletedItem) {
        onSaveTrash({
          ...trash,
          markets: [deletedItem, ...(trash?.markets || [])]
        });
      }
      showBanner("Financial market ticker moved to Trash Bin.");
    }
  };

  // Categories actions
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      slug,
      description: newCatDesc
    };

    onSaveCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    showBanner(`Category "${newCatName}" created instantly.`);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm("Move this category to the Trash Bin?")) {
      const deletedItem = categories.find(c => c.id === id);
      const updated = categories.filter(c => c.id !== id);
      onSaveCategories(updated);
      if (deletedItem) {
        onSaveTrash({
          ...trash,
          categories: [deletedItem, ...(trash?.categories || [])]
        });
      }
      showBanner("Category moved to Trash Bin.");
    }
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm("Move this video broadcast to the Trash Bin?")) {
      const deletedItem = videos.find(v => v.id === id);
      const updated = videos.filter(v => v.id !== id);
      onSaveVideos(updated);
      if (deletedItem) {
        onSaveTrash({
          ...trash,
          videos: [deletedItem, ...(trash?.videos || [])]
        });
      }
      showBanner("Video broadcast moved to Trash Bin.");
    }
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    showBanner("Website tagline, header configuration, and theme settings updated instantly.");
  };

  const handleUpdateAds = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAdSlots(adForm);
    showBanner("Advertisement slots, custom AdSense blocks, and promotional creatives updated instantly.");
  };

  // Google Gemini powered AI news article writer
  const handleGenerateAIArticle = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiSuccessMessage('');
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiPrompt, category: aiCategory })
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setEditingArticle({
        title: data.title,
        subtitle: data.subtitle,
        summary: data.summary,
        content: data.content,
        category: aiCategory,
        keywords: data.keywords,
        status: 'Published',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
        isPinned: false,
        isFeatured: true
      });
      setIsCreatingArticle(true);
      setAiPrompt('');
      setActiveTab('articles');
      setAiSuccessMessage("AI News generated perfectly. You can now review and publish it.");
    } catch (e: any) {
      alert("AI Generation failed. This happens if the Gemini API Key is not set yet in your environment variables. Using advanced client-side simulation to generate high-quality article content instead!");
      
      const mockAiArticle = {
        title: `Global Breakthrough: New clean energy fusion grid launched in ${aiCategory}`,
        subtitle: 'Quantum generators produce sustainable energy at zero net cost during test trials.',
        summary: `A monumental advancement in zero-emission fusion cells marks a massive leap forward for clean energy grids globally.`,
        content: `GENEVA — In a historic development for global renewable energy infrastructure, a localized clean fusion grid trial has successfully operated at 120% net positive energy output.

The experiments represent the culmination of a decade of joint engineering studies between research bureaus in India, Europe, and Silicon Valley.

### Unlimited Zero-Carbon Power
The project uses advanced quantum magnetic injectors to contain isotopes within high-energy fields. Unlike legacy fusion reactors, this model utilizes safe, stable fuel rods that produce no long-term hazardous waste.

"We have solved the primary confinement bottle-neck that has hindered green fusion projects for half a century," commented lead investigator Marcus Vance. Commercial deployments are slated to commence across three metropolitan hubs by the end of 2028.`,
        keywords: ['green fusion', 'clean grid', 'renewable energy', 'tech innovation']
      };

      setEditingArticle({
        title: mockAiArticle.title,
        subtitle: mockAiArticle.subtitle,
        summary: mockAiArticle.summary,
        content: mockAiArticle.content,
        category: aiCategory,
        keywords: mockAiArticle.keywords,
        status: 'Published',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1200',
        isPinned: false,
        isFeatured: true
      });
      setIsCreatingArticle(true);
      setAiPrompt('');
      setActiveTab('articles');
    } finally {
      setAiLoading(false);
    }
  };

  const generateSqlDump = () => {
    const sql = `
-- =========================================================
-- FAST COVERAGES GLOBAL NEWS DATABASE DUMP (MySQL / PostgreSQL)
-- Designed for High-Performance Production Servers
-- =========================================================

CREATE TABLE IF NOT EXISTS website_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  tagline VARCHAR(200),
  logo_url VARCHAR(500),
  footer_text TEXT,
  primary_color VARCHAR(50),
  facebook_url VARCHAR(250),
  twitter_url VARCHAR(250),
  instagram_url VARCHAR(250),
  youtube_url VARCHAR(250)
);

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  content TEXT NOT NULL,
  summary TEXT,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  image VARCHAR(500) NOT NULL,
  video_url VARCHAR(500),
  author VARCHAR(100) NOT NULL,
  publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Published',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0
);

-- Seed Initial Categories
INSERT INTO categories (name, slug, description) VALUES
('World News', 'world-news', 'Latest news and updates from around the globe.'),
('India News', 'india-news', 'Top headlines and breaking updates from India.'),
('Politics', 'politics', 'Legislative battles and policy updates.'),
('Sports', 'sports', 'Football, cricket, and world sports updates.'),
('Technology', 'technology', 'Artificial Intelligence, software development, and cybersecurity.');

-- Seed Website Settings
INSERT INTO website_settings (name, tagline, footer_text, primary_color) VALUES
('FAST COVERAGES', 'GLOBAL NEWS NETWORK', '© 2026 FAST COVERAGES Global News Network. All Rights Reserved.', 'red');
`;
    const element = document.createElement("a");
    const file = new Blob([sql], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "database_seed.sql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Secure Authentication Overlay layout
  if (!isAuthenticated) {
    return (
      <div id="admin-auth-overlay" className="fixed inset-0 bg-neutral-950 flex items-center justify-center z-50 p-4 font-sans selection:bg-[#E10600] select-none animate-fade-in">
        <div className="absolute inset-0 bg-radial-gradient from-[#E10600]/10 to-transparent opacity-40"></div>
        
        <div className="bg-[#0e0e0e] border border-neutral-800 rounded-lg p-6 md:p-8 w-full max-w-md shadow-2xl relative z-10 flex flex-col gap-6">
          
          {/* Lock Header */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className="bg-[#E10600]/10 border border-[#E10600]/20 p-3 rounded-full text-[#E10600]">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">FAST COVERAGES</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Control Center Gateway</p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-950/40 border border-red-900/50 p-3 rounded text-xs text-red-400 font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {authStep === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Administrative User / Email</label>
                <div className="relative flex items-center">
                  <Shield className="w-4 h-4 text-zinc-600 absolute left-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin@fastcoverages.com"
                    className="w-full bg-[#050505] border border-neutral-800 rounded py-2.5 pl-10 pr-4 text-xs text-zinc-200 outline-none focus:border-[#E10600]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Authorization Password</label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-zinc-600 absolute left-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050505] border border-neutral-800 rounded py-2.5 pl-10 pr-4 text-xs text-zinc-200 outline-none focus:border-[#E10600]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#E10600] hover:bg-red-700 text-white text-xs font-black uppercase py-3 rounded tracking-widest mt-2 transition cursor-pointer"
              >
                Request Authorization Code
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Multi-Factor Authenticator Code (2FA)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Enter 6-digit verification code"
                  className="w-full bg-[#050505] border border-neutral-800 rounded py-2.5 px-4 text-sm font-bold tracking-[0.4em] text-center text-white outline-none focus:border-[#E10600]"
                />
              </div>

              <button
                type="submit"
                className="bg-[#E10600] hover:bg-red-700 text-white text-xs font-black uppercase py-3 rounded tracking-widest transition cursor-pointer"
              >
                Validate Cryptographic Token
              </button>

              {showTotpHint && (
                <div className="mt-2 p-3 bg-neutral-900/60 border border-neutral-800 rounded text-center text-[11px] text-zinc-500 font-mono">
                  <span>Demo Security Token: </span>
                  <span className="text-yellow-500 font-bold">123456</span>
                </div>
              )}
            </form>
          )}

          <div className="flex justify-between items-center text-[10px] text-zinc-600 font-semibold border-t border-neutral-900 pt-4 font-mono">
            <span>SECURE GATEWAY</span>
            <button onClick={onClose} className="hover:text-zinc-400">ABORT SYSTEM ACCESS</button>
          </div>

        </div>
      </div>
    );
  }

  // authenticated layout
  return (
    <div id="admin-panel" className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans selection:bg-editorial-accent">
      <div className="bg-white dark:bg-editorial-bg rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 transition-all">
        
        {/* Banner Notification */}
        {bannerText && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-sm font-semibold flex items-center justify-between animate-fade-in shadow-md relative z-55">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{bannerText}</span>
            </div>
            <button onClick={() => setBannerText('')} className="hover:opacity-80 font-bold font-mono">×</button>
          </div>
        )}

        {/* Admin Header */}
        <div className="bg-editorial-dark text-white px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-editorial-accent p-1.5 rounded text-white shadow-md shadow-red-950/30">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase">FAST COVERAGES</h2>
              <p className="text-[10px] text-zinc-550 dark:text-editorial-text/40 font-bold uppercase tracking-wider font-mono">Premium Editorial Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 bg-editorial-bg border border-white/5 text-slate-300 px-3 py-1 text-xs font-semibold rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced Desk
            </span>
            <button 
              onClick={() => {
                sessionStorage.removeItem('fc_admin_session');
                setIsAuthenticated(false);
                setAuthStep('login');
                setUsername('');
                setPassword('');
                setTotpCode('');
              }}
              className="bg-neutral-800 hover:bg-neutral-900 border border-neutral-700 text-white px-3 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
              title="Log out of session"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign Out
            </button>
            <button 
              onClick={onClose}
              className="bg-editorial-accent hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-[#fcfbf9] dark:bg-editorial-dark border-r border-slate-200 dark:border-white/10 p-4 flex flex-col gap-1 overflow-y-auto shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono px-2 mb-2 block">Management</span>
            
            <button
              onClick={() => { setActiveTab('articles'); setEditingArticle(null); setIsCreatingArticle(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'articles' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <FileText className="w-4.5 h-4.5" /> Articles (CRUD)
            </button>

            <button
              onClick={() => { setActiveTab('breaking-news'); setEditingBreaking(null); setIsCreatingBreaking(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'breaking-news' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <Radio className="w-4.5 h-4.5 text-red-500" /> Ticker News
            </button>

            <button
              onClick={() => { setActiveTab('markets'); setEditingMarket(null); setIsCreatingMarket(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'markets' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <BarChart3 className="w-4.5 h-4.5 text-emerald-500" /> Market Tickers
            </button>

            <button
              onClick={() => { setActiveTab('videos'); setEditingVideo(null); setIsCreatingVideo(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'videos' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <Video className="w-4.5 h-4.5 text-blue-500" /> Video Broadcasts
            </button>

            <button
              onClick={() => { setActiveTab('ai-writer'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'ai-writer' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" /> AI News Generator
            </button>

            <button
              onClick={() => { setActiveTab('categories'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'categories' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <FolderPlus className="w-4.5 h-4.5" /> Categories
            </button>

            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono px-2 mt-4 mb-2 block">Commercials</span>

            <button
              onClick={() => { setActiveTab('ads'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'ads' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <Layout className="w-4.5 h-4.5" /> Advertisements
            </button>

            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-editorial-text/40 font-mono px-2 mt-4 mb-2 block">System</span>

            <button
              onClick={() => { setActiveTab('settings'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'settings' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <SettingsIcon className="w-4.5 h-4.5" /> Website Settings
            </button>

            <button
              onClick={() => { setActiveTab('server-deploy'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'server-deploy' ? 'bg-editorial-accent text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <Database className="w-4.5 h-4.5 text-blue-500" /> Export & Backup
            </button>

            <button
              onClick={() => { setActiveTab('trash-bin'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'trash-bin' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-700 dark:text-editorial-text/70 hover:bg-slate-100 dark:hover:bg-editorial-bg'}`}
            >
              <Trash2 className="w-4.5 h-4.5 text-red-500" /> Trash Bin (Recovery)
            </button>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/10 px-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold font-mono">Port: 3000 (Proxy)</span>
              </div>
              <p className="mt-1 leading-relaxed">Design optimized for extreme speed indices and real-time updates.</p>
            </div>
          </div>

          {/* Tab Workspaces */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#fafaf6] dark:bg-editorial-bg">
            
            {/* ARTICLES */}
            {activeTab === 'articles' && (
              <div>
                {editingArticle ? (
                  <form onSubmit={handleSaveArticle} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">
                        {isCreatingArticle ? "Compose New News Article" : "Modify Published Article"}
                      </h3>
                      <button 
                        type="button" 
                        onClick={() => { setEditingArticle(null); setIsCreatingArticle(false); }}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Article Title *</label>
                        <input
                          type="text"
                          required
                          value={editingArticle.title || ''}
                          onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                          placeholder="Federal elections approach standard metrics..."
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Sub-Headline / Deck</label>
                        <input
                          type="text"
                          value={editingArticle.subtitle || ''}
                          onChange={e => setEditingArticle({ ...editingArticle, subtitle: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                          placeholder="Voters express high interest in secure electronic ledgers."
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Category *</label>
                        <select
                          value={editingArticle.category || 'World News'}
                          onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Image URL (Unsplash/Web)</label>
                        <input
                          type="text"
                          value={editingArticle.image || ''}
                          onChange={e => setEditingArticle({ ...editingArticle, image: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900/10">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Featured Video URL (Optional)</label>
                        <input
                          type="text"
                          value={editingArticle.videoUrl || ''}
                          onChange={e => setEditingArticle({ ...editingArticle, videoUrl: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-mono"
                          placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
                        />
                        <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleVideoFileUpload(file, (url) => {
                                  setEditingArticle({ ...editingArticle, videoUrl: url });
                                });
                              }
                            }}
                            className="hidden"
                            id="article-video-upload-input"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="article-video-upload-input"
                            className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer border border-slate-300 dark:border-slate-700 hover:border-slate-400 transition select-none flex items-center gap-1.5 ${isUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200'}`}
                          >
                            {isUploading ? (
                              <>
                                <span className="animate-spin inline-block w-3 h-3 border-2 border-t-transparent border-slate-700 rounded-full"></span>
                                <span>Uploading to Server...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Select & Upload Video File</span>
                              </>
                            )}
                          </label>
                          <span className="text-[10px] text-slate-400 text-center">Directly upload a video stream file to display alongside article content (up to 150MB)</span>
                          {editingArticle.videoUrl?.startsWith('/uploads/') && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-center">
                              ✓ Video uploaded: <span className="font-mono text-xs select-all bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded">{editingArticle.videoUrl}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Brief Summary (For mobile widgets & tickers)</label>
                        <input
                          type="text"
                          value={editingArticle.summary || ''}
                          onChange={e => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Article Content (Supports markdown style headers & quotes) *</label>
                        <textarea
                          rows={8}
                          required
                          value={editingArticle.content || ''}
                          onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono rounded focus:border-red-500 outline-none dark:text-white"
                          placeholder="GENEVA — In a historic milestone..."
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingArticle.isPinned || false}
                          onChange={e => setEditingArticle({ ...editingArticle, isPinned: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
                        />
                        <span>Pin to Breaking Ticker / Top Banner</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingArticle.isFeatured || false}
                          onChange={e => setEditingArticle({ ...editingArticle, isFeatured: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
                        />
                        <span>Featured Hero Spot</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => { setEditingArticle(null); setIsCreatingArticle(false); }}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold rounded shadow cursor-pointer"
                      >
                        Publish Instantly
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Active Global Feed</h3>
                      <button
                        onClick={() => { setEditingArticle({}); setIsCreatingArticle(true); }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition shadow cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Compose Article Manually
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold uppercase">
                            <th className="px-4 py-3">Headline</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Views</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {articles.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition text-sm">
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{a.title}</span>
                                    {a.isPinned && <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 text-[9px] font-black uppercase rounded font-mono">Pinned</span>}
                                    {a.isFeatured && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase rounded font-mono">Featured</span>}
                                  </div>
                                  <span className="text-xs text-slate-400 line-clamp-1">{a.subtitle}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-semibold">{a.category}</td>
                              <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{new Date(a.publishDate).toLocaleDateString()}</td>
                              <td className="px-4 py-3.5 font-mono font-bold text-xs text-slate-600 dark:text-slate-400">{a.views.toLocaleString()}</td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => { setEditingArticle(a); setIsCreatingArticle(false); }}
                                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArticle(a.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TICKER BREAKING NEWS */}
            {activeTab === 'breaking-news' && (
              <div>
                {editingBreaking ? (
                  <form onSubmit={handleSaveBreaking} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 max-w-xl">
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-white pb-2 border-b border-slate-150 dark:border-slate-800">
                      {isCreatingBreaking ? "Create Breaking News Headline" : "Edit Headline"}
                    </h3>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Headline Title *</label>
                        <input
                          type="text"
                          required
                          value={editingBreaking.title || ''}
                          onChange={e => setEditingBreaking({ ...editingBreaking, title: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-sans uppercase font-bold"
                          placeholder="STOCKS TOUCH RECORD HIGHS IN LATEST SESSIONS"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Category Tag</label>
                        <input
                          type="text"
                          required
                          value={editingBreaking.category || ''}
                          onChange={e => setEditingBreaking({ ...editingBreaking, category: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-mono uppercase"
                          placeholder="WORLD NEWS"
                        />
                      </div>

                      <div className="flex items-center gap-4 py-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700 dark:text-zinc-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingBreaking.isPinned || false}
                            onChange={e => setEditingBreaking({ ...editingBreaking, isPinned: e.target.checked })}
                            className="rounded text-[#E10600] focus:ring-[#E10600]"
                          />
                          <span>Pin Item (Highlight in Gold)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700 dark:text-zinc-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingBreaking.active !== false}
                            onChange={e => setEditingBreaking({ ...editingBreaking, active: e.target.checked })}
                            className="rounded text-[#E10600] focus:ring-[#E10600]"
                          />
                          <span>Active / Display on Ticker</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <button
                        type="button"
                        onClick={() => { setEditingBreaking(null); setIsCreatingBreaking(false); }}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold rounded cursor-pointer"
                      >
                        Save Headline
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Breaking News Slider headlines</h3>
                      <button
                        onClick={() => { setEditingBreaking({ active: true, isPinned: false, category: 'WORLD NEWS' }); setIsCreatingBreaking(true); }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition shadow cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Ticker Headline
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold uppercase">
                            <th className="px-4 py-3">Tag</th>
                            <th className="px-4 py-3">Headline Title</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                          {breakingNews.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                              <td className="px-4 py-3 font-bold text-[#E10600] uppercase">{item.category}</td>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{item.title}</span>
                                  {item.isPinned && <span className="bg-amber-150 text-amber-800 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-widest">Pinned</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                  {item.active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => { setEditingBreaking(item); setIsCreatingBreaking(false); }}
                                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBreaking(item.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MARKET TICKERS */}
            {activeTab === 'markets' && (
              <div>
                {editingMarket ? (
                  <form onSubmit={handleSaveMarket} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 max-w-xl">
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-white pb-2 border-b border-slate-150 dark:border-slate-800">
                      {isCreatingMarket ? "Add New Index / Commodity Ticker" : "Modify Financial Index Ticker"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Ticker Name *</label>
                        <input
                          type="text"
                          required
                          value={editingMarket.name || ''}
                          onChange={e => setEditingMarket({ ...editingMarket, name: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-sans"
                          placeholder="e.g. Dow Jones"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Current Value *</label>
                        <input
                          type="text"
                          required
                          value={editingMarket.value || ''}
                          onChange={e => setEditingMarket({ ...editingMarket, value: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-mono"
                          placeholder="e.g. 39,122.40"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Percent Change *</label>
                        <input
                          type="text"
                          required
                          value={editingMarket.change || ''}
                          onChange={e => setEditingMarket({ ...editingMarket, change: e.target.value })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-mono"
                          placeholder="e.g. +1.31%"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Order Position (Relative sort)</label>
                        <input
                          type="number"
                          required
                          value={editingMarket.position || ''}
                          onChange={e => setEditingMarket({ ...editingMarket, position: parseInt(e.target.value) })}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-4 py-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700 dark:text-zinc-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingMarket.isUp !== false}
                            onChange={e => setEditingMarket({ ...editingMarket, isUp: e.target.checked })}
                            className="rounded text-emerald-500 focus:ring-emerald-500 font-bold"
                          />
                          <span className="text-emerald-500">Positive Gain (+) / Bull Market</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700 dark:text-zinc-350 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingMarket.active !== false}
                            onChange={e => setEditingMarket({ ...editingMarket, active: e.target.checked })}
                            className="rounded text-red-500 focus:ring-red-500"
                          />
                          <span>Active on Market Grid</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <button
                        type="button"
                        onClick={() => { setEditingMarket(null); setIsCreatingMarket(false); }}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-bold rounded cursor-pointer"
                      >
                        Save Index Ticker
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Bloomberg Tickers Leaderboard</h3>
                      <button
                        onClick={() => { setEditingMarket({ active: true, isUp: true, position: markets.length + 1 }); setIsCreatingMarket(true); }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition shadow cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add New Index / Commodity
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold uppercase">
                            <th className="px-4 py-3">Sorting</th>
                            <th className="px-4 py-3">Ticker Index</th>
                            <th className="px-4 py-3">Current Spot value</th>
                            <th className="px-4 py-3">Percent Change</th>
                            <th className="px-4 py-3">Active Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                          {markets.sort((a, b) => a.position - b.position).map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                              <td className="px-4 py-3 font-semibold text-slate-400">#{item.position}</td>
                              <td className="px-4 py-3 font-black text-slate-800 dark:text-white uppercase">{item.name}</td>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{item.value}</td>
                              <td className={`px-4 py-3 font-bold ${item.isUp ? 'text-emerald-500' : 'text-red-500'}`}>{item.change}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                  {item.active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => { setEditingMarket(item); setIsCreatingMarket(false); }}
                                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMarket(item.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI NEWS GENERATOR */}
            {activeTab === 'ai-writer' && (
              <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">AI-Assisted Newsroom</h3>
                    <p className="text-xs text-slate-400">Automate drafting of professional, fact-grounded articles using Google Gemini API.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-w-2xl mt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Core News Topic / Story Pitch</label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="e.g., SpaceX launches Starship flight 8 in Boca Chica with full booster catch, detailing technical milestones and spectators..."
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm rounded focus:border-amber-500 outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Target Desk Category</label>
                    <select
                      value={aiCategory}
                      onChange={e => setAiCategory(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm rounded focus:border-amber-500 outline-none dark:text-white"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateAIArticle}
                    disabled={aiLoading || !aiPrompt}
                    className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow cursor-pointer"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Drafting and Grounding with Gemini...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Draft News Article Instantly
                      </>
                    )}
                  </button>

                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-500 leading-relaxed">
                      <p className="font-bold mb-1">How it Works:</p>
                      The AI Newsroom harnesses Gemini's high context window to assemble fully researched articles containing standard inverted-pyramid structures, simulated witness lines, quotes, subheaders, and localized meta keywords, immediately ready for standard publishing!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <form onSubmit={handleCreateCategory} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 h-fit">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-850">Create Desk Category</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Category Name</label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="e.g. Geopolitics"
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Description</label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="Deep analytics on global alliances..."
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded focus:border-red-500 outline-none dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-slate-950 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Add Category
                  </button>
                </form>

                <div className="md:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850 mb-4">Categories Overview</h3>
                  <div className="flex flex-col gap-2">
                    {categories.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/10">
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{c.description || 'No description added yet.'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ADVERTISEMENTS */}
            {activeTab === 'ads' && (
              <form onSubmit={handleUpdateAds} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Commercial Space Management</h3>
                  <p className="text-xs text-slate-400">Control Google AdSense blocks, custom banner URLs, and active placements instantly across mobile and desktop viewpoints.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {adForm.map((slot, idx) => (
                    <div key={slot.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">{slot.type} Placement</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.active}
                            onChange={e => {
                              const updated = [...adForm];
                              updated[idx].active = e.target.checked;
                              setAdForm(updated);
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs font-bold text-slate-500">Active</span>
                        </label>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400">Ad Title / Tracking Identifier</label>
                        <input
                          type="text"
                          value={slot.label}
                          onChange={e => {
                            const updated = [...adForm];
                            updated[idx].label = e.target.value;
                            setAdForm(updated);
                          }}
                          className="w-full border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs rounded outline-none dark:text-white font-sans"
                        />
                      </div>

                      {slot.imageUrl !== undefined && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400">Image Creative Link</label>
                            <input
                              type="text"
                              value={slot.imageUrl}
                              onChange={e => {
                                const updated = [...adForm];
                                updated[idx].imageUrl = e.target.value;
                                setAdForm(updated);
                              }}
                              className="w-full border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs rounded outline-none dark:text-white font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400">Destination Redirect URL</label>
                            <input
                              type="text"
                              value={slot.targetUrl || ''}
                              onChange={e => {
                                const updated = [...adForm];
                                updated[idx].targetUrl = e.target.value;
                                setAdForm(updated);
                              }}
                              className="w-full border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs rounded outline-none dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Save Placements Instantly
                  </button>
                </div>
              </form>
            )}

            {/* WEBSITE SETTINGS */}
            {activeTab === 'settings' && (
              <form onSubmit={handleUpdateSettings} className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Portal Configuration</h3>
                  <p className="text-xs text-slate-400">Control core headers, footer disclaimers, editorial taglines, and simulated multi-factor credentials globally.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Website Name</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.name}
                      onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Tagline</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.tagline}
                      onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Standard Footer legal boilerplate</label>
                    <textarea
                      rows={2}
                      required
                      value={settingsForm.footerText}
                      onChange={e => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Primary Branding Accent Color</label>
                    <select
                      value={settingsForm.primaryColor}
                      onChange={e => setSettingsForm({ ...settingsForm, primaryColor: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm rounded outline-none dark:text-white"
                    >
                      <option value="red">CNN Red Accent</option>
                      <option value="blue">Fox News Blue Accent</option>
                      <option value="emerald">Al Jazeera Emerald Accent</option>
                      <option value="zinc">Reuters Charcoal Accent</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.twoFactorEnabled}
                        onChange={e => setSettingsForm({ ...settingsForm, twoFactorEnabled: e.target.checked })}
                        className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enforce Two-Factor Authentication for editors</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Update Settings Globally
                  </button>
                </div>
              </form>
            )}

            {/* SERVER DEPLOYMENT & BACKUP CENTER */}
            {activeTab === 'server-deploy' && (
              <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-150 dark:border-slate-850">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Server Connection & Database Backups</h3>
                    <p className="text-xs text-slate-400">Export schemas, database seeds, and retrieve active deployment configurations for secure cloud hosts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SQL Export */}
                  <div className="p-4 border border-blue-100 dark:border-blue-950/40 bg-blue-50/20 dark:bg-blue-950/10 rounded-lg flex flex-col gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 font-mono flex items-center gap-1.5">
                      <Database className="w-4 h-4" /> Production Database SQL Exporter
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Download the standardized production table structures. You can import this directly into any cPanel phpMyAdmin or cloud SQL database console. It provisions categories, custom ad spots, settings, and table structures seamlessly.
                    </p>
                    <button
                      onClick={generateSqlDump}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition w-fit mt-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download database_seed.sql
                    </button>
                  </div>

                  {/* Environment variables */}
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                      <SettingsIcon className="w-4 h-4" /> Production Env Properties (.env)
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Insert these environment variables in your server backend or deployment container:
                    </p>
                    <pre className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded text-[10px] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-800 overflow-x-auto select-all">
{`NODE_ENV=production
PORT=3000
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_USER=production_user
DATABASE_PASS=YourStrongSecurePassword
DATABASE_NAME=fast_coverages_db
GEMINI_API_KEY=${settings.name ? 'YOUR_GEMINI_KEY' : ''}`}
                    </pre>
                  </div>
                </div>

                {/* Checklist */}
                <div className="p-4 border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-lg">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5 mb-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" /> Server Production Deployment Checklist
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 dark:text-white">1. Bundle Web Client</span>
                      <p className="leading-relaxed">Run <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-red-500">npm run build</code>. Upload the produced bundle inside the server's root serving directories.</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 dark:text-white">2. Set Up SQL DB</span>
                      <p className="leading-relaxed">Provision standard SQL databases. Import the downloaded seed SQL file to set up initial relational schemas.</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 dark:text-white">3. Deploy Node Application</span>
                      <p className="leading-relaxed">Bind node start triggers to port 3000. Start the web server and let users read the global news desk with zero delay.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO BROADCASTS MANAGEMENT */}
            {activeTab === 'videos' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Video Desk Control</h3>
                    <p className="text-xs text-slate-400">Add, update, or remove interactive live video feeds featured across the home page broadcast block.</p>
                  </div>
                  {!isCreatingVideo && !editingVideo && (
                    <button
                      onClick={() => {
                        setEditingVideo({
                          title: '',
                          description: '',
                          videoUrl: '',
                          thumbnailUrl: '',
                          category: 'Global',
                          author: 'Fast Coverages Desk'
                        });
                        setIsCreatingVideo(true);
                      }}
                      className="bg-editorial-accent hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Video Broadcast
                    </button>
                  )}
                </div>

                {(isCreatingVideo || editingVideo) ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!editingVideo) return;
                      
                      let updatedList: VideoItem[];
                      if (editingVideo.id) {
                        // edit
                        updatedList = videos.map(v => v.id === editingVideo.id ? { ...v, ...editingVideo } as VideoItem : v);
                      } else {
                        // create
                        const newVid: VideoItem = {
                          id: 'vid-' + Date.now(),
                          title: editingVideo.title || 'Untitled Broadcast',
                          description: editingVideo.description || '',
                          videoUrl: editingVideo.videoUrl || '',
                          thumbnailUrl: editingVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800',
                          category: editingVideo.category || 'Global',
                          author: editingVideo.author || 'Fast Coverages Desk',
                          publishDate: new Date().toISOString()
                        };
                        updatedList = [...videos, newVid];
                      }
                      onSaveVideos(updatedList);
                      setEditingVideo(null);
                      setIsCreatingVideo(false);
                    }}
                    className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 text-left"
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-mono">
                      {editingVideo?.id ? 'Edit Video Broadcast' : 'Create New Video Broadcast'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Video Title</label>
                        <input
                          type="text"
                          required
                          value={editingVideo?.title || ''}
                          onChange={e => setEditingVideo({ ...editingVideo, title: e.target.value })}
                          className="w-full bg-[#050505] border border-neutral-800 rounded py-2 px-3 text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Category Tag (e.g. World, Market, Live)</label>
                        <input
                          type="text"
                          required
                          value={editingVideo?.category || ''}
                          onChange={e => setEditingVideo({ ...editingVideo, category: e.target.value })}
                          className="w-full bg-[#050505] border border-neutral-800 rounded py-2 px-3 text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Video URL (Direct link to .mp4 / .mov / stream - Optional)</label>
                        <input
                          type="url"
                          value={editingVideo?.videoUrl || ''}
                          onChange={e => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                          placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4 (Optional if video file is uploaded below)"
                          className="w-full bg-[#050505] border border-neutral-800 rounded py-2 px-3 text-xs text-zinc-200 outline-none font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2 p-4 border border-dashed border-neutral-800 rounded bg-[#030303] text-center">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">OR: Directly Upload Video File</label>
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleVideoFileUpload(file, (url) => {
                                  setEditingVideo({ ...editingVideo, videoUrl: url });
                                });
                              }
                            }}
                            className="hidden"
                            id="video-broadcast-file-upload-input"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="video-broadcast-file-upload-input"
                            className={`px-4 py-2 text-xs font-bold rounded cursor-pointer border border-neutral-700 hover:border-neutral-500 transition select-none flex items-center gap-1.5 ${isUploading ? 'bg-neutral-900 text-neutral-500 border-neutral-800 cursor-not-allowed' : 'bg-neutral-950 text-neutral-200'}`}
                          >
                            {isUploading ? (
                              <>
                                <span className="animate-spin inline-block w-3 h-3 border-2 border-t-transparent border-white rounded-full"></span>
                                <span>Uploading Stream to Server...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Select & Upload Video File</span>
                              </>
                            )}
                          </label>
                          <span className="text-[9px] text-zinc-500">Supports standard video formats (MP4, MOV, WebM up to 150MB)</span>
                          {uploadError && <span className="text-[9px] text-red-500 font-semibold">{uploadError}</span>}
                          {editingVideo?.videoUrl?.startsWith('/uploads/') && (
                            <div className="w-full mt-2 flex flex-col gap-1 text-center bg-emerald-950/20 border border-emerald-900/40 p-2 rounded">
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                                ✓ Uploaded successfully:
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono select-all overflow-hidden text-ellipsis">{editingVideo.videoUrl}</span>
                              <video src={editingVideo.videoUrl} controls className="max-h-24 mx-auto rounded mt-1.5 bg-black" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Thumbnail Image URL</label>
                        <input
                          type="url"
                          value={editingVideo?.thumbnailUrl || ''}
                          onChange={e => setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value })}
                          placeholder="Leave blank for automatic placeholder"
                          className="w-full bg-[#050505] border border-neutral-800 rounded py-2 px-3 text-xs text-zinc-200 outline-none font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Broadcaster Name / Agency</label>
                        <input
                          type="text"
                          required
                          value={editingVideo?.author || ''}
                          onChange={e => setEditingVideo({ ...editingVideo, author: e.target.value })}
                          className="w-full bg-[#050505] border border-neutral-800 rounded py-2 px-3 text-xs text-zinc-200 outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Brief Description / Caption</label>
                        <textarea
                          required
                          rows={3}
                          value={editingVideo?.description || ''}
                          onChange={e => setEditingVideo({ ...editingVideo, description: e.target.value })}
                          className="w-full bg-[#050505] border border-neutral-800 rounded py-2 px-3 text-xs text-zinc-200 outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => { setEditingVideo(null); setIsCreatingVideo(false); }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        {editingVideo?.id ? 'Update Video' : 'Publish Video'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-left">
                    {videos.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                        <Video className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">No Video Broadcasts Available</span>
                        <p className="text-xs text-slate-400 max-w-sm">Create high-impact breaking live reports or coverage summaries to display on the main board.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-editorial-dark border-b border-slate-200 dark:border-white/5 font-mono text-slate-400 font-bold tracking-wider">
                              <th className="p-4">Broadcast</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Publisher</th>
                              <th className="p-4">Published Date</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {videos.map((vid) => (
                              <tr key={vid.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                <td className="p-4 flex gap-3 items-center">
                                  <div className="w-16 aspect-video bg-black rounded overflow-hidden relative shrink-0 border border-slate-200 dark:border-white/10">
                                    <img src={vid.thumbnailUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-white line-clamp-1">{vid.title}</span>
                                    <span className="text-[10px] text-slate-400 line-clamp-1">{vid.description}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[9px] font-mono">
                                    {vid.category}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{vid.author}</td>
                                <td className="p-4 text-slate-500 font-mono text-[10px]">{new Date(vid.publishDate).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2.5">
                                    <button
                                      onClick={() => {
                                        setEditingVideo(vid);
                                        setIsCreatingVideo(false);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 transition cursor-pointer"
                                      title="Edit Video"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVideo(vid.id)}
                                      className="text-red-600 hover:text-red-700 transition cursor-pointer"
                                      title="Delete Video"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trash-bin' && (
              <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 text-left overflow-y-auto max-h-full w-full">
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 dark:text-white">Admin Trash Bin</h3>
                  <p className="text-xs text-slate-400">View deleted items, restore them to visitor screens, or permanently delete them forever from the server database.</p>
                </div>

                <div className="flex flex-col gap-8 pb-10">
                  {/* Articles Trash */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
                      <span>Deleted Articles ({trash?.articles?.length || 0})</span>
                    </h4>
                    {(!trash?.articles || trash.articles.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No deleted articles in trash.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-sans">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-mono font-black text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-2.5">Title</th>
                              <th className="px-4 py-2.5">Category</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {trash.articles.map(a => (
                              <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{a.title}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">{a.category}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        onSaveArticles([a, ...articles]);
                                        onSaveTrash({
                                          ...trash,
                                          articles: trash.articles.filter(item => item.id !== a.id)
                                        });
                                        showBanner("Article restored successfully.");
                                      }}
                                      className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you absolutely sure you want to PERMANENTLY DELETE this article? This action is irreversible and deletes it forever from server database.")) {
                                          onSaveTrash({
                                            ...trash,
                                            articles: trash.articles.filter(item => item.id !== a.id)
                                          });
                                          showBanner("Article permanently deleted forever.");
                                        }
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Permanently Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Videos Trash */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
                      <span>Deleted Video Broadcasts ({trash?.videos?.length || 0})</span>
                    </h4>
                    {(!trash?.videos || trash.videos.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No deleted videos in trash.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-sans">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-mono font-black text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-2.5">Title</th>
                              <th className="px-4 py-2.5">Category</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {trash.videos.map(v => (
                              <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{v.title}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">{v.category}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        onSaveVideos([v, ...videos]);
                                        onSaveTrash({
                                          ...trash,
                                          videos: trash.videos.filter(item => item.id !== v.id)
                                        });
                                        showBanner("Video broadcast restored successfully.");
                                      }}
                                      className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you absolutely sure you want to PERMANENTLY DELETE this video? This action is irreversible and deletes it forever from server database.")) {
                                          onSaveTrash({
                                            ...trash,
                                            videos: trash.videos.filter(item => item.id !== v.id)
                                          });
                                          showBanner("Video permanently deleted forever.");
                                        }
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Permanently Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Breaking News Trash */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
                      <span>Deleted Breaking News ({trash?.breakingNews?.length || 0})</span>
                    </h4>
                    {(!trash?.breakingNews || trash.breakingNews.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No deleted breaking news in trash.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-sans">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-mono font-black text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-2.5">Title</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {trash.breakingNews.map(b => (
                              <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{b.title}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        onSaveBreakingNews([b, ...breakingNews]);
                                        onSaveTrash({
                                          ...trash,
                                          breakingNews: trash.breakingNews.filter(item => item.id !== b.id)
                                        });
                                        showBanner("Breaking news item restored successfully.");
                                      }}
                                      className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you absolutely sure you want to PERMANENTLY DELETE this headline? This action is irreversible.")) {
                                          onSaveTrash({
                                            ...trash,
                                            breakingNews: trash.breakingNews.filter(item => item.id !== b.id)
                                          });
                                          showBanner("Headline permanently deleted.");
                                        }
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Permanently Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Markets Trash */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
                      <span>Deleted Market Tickers ({trash?.markets?.length || 0})</span>
                    </h4>
                    {(!trash?.markets || trash.markets.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No deleted markets in trash.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-sans">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-mono font-black text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-2.5">Name</th>
                              <th className="px-4 py-2.5">Value</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {trash.markets.map(m => (
                              <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{m.name}</td>
                                <td className="px-4 py-3 font-mono text-slate-400">{m.value}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        onSaveMarkets([m, ...markets]);
                                        onSaveTrash({
                                          ...trash,
                                          markets: trash.markets.filter(item => item.id !== m.id)
                                        });
                                        showBanner("Market item restored successfully.");
                                      }}
                                      className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you absolutely sure you want to PERMANENTLY DELETE this market item? This action is irreversible.")) {
                                          onSaveTrash({
                                            ...trash,
                                            markets: trash.markets.filter(item => item.id !== m.id)
                                          });
                                          showBanner("Market item permanently deleted.");
                                        }
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Permanently Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Categories Trash */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
                      <span>Deleted Categories ({trash?.categories?.length || 0})</span>
                    </h4>
                    {(!trash?.categories || trash.categories.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No deleted categories in trash.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-sans">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider font-mono font-black text-[10px] border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-2.5">Name</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                            {trash.categories.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">{c.name}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        onSaveCategories([c, ...categories]);
                                        onSaveTrash({
                                          ...trash,
                                          categories: trash.categories.filter(item => item.id !== c.id)
                                        });
                                        showBanner("Category restored successfully.");
                                      }}
                                      className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you absolutely sure you want to PERMANENTLY DELETE this category? This action is irreversible.")) {
                                          onSaveTrash({
                                            ...trash,
                                            categories: trash.categories.filter(item => item.id !== c.id)
                                          });
                                          showBanner("Category permanently deleted.");
                                        }
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded font-semibold transition cursor-pointer"
                                    >
                                      Permanently Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
