import React, { useState, useEffect } from 'react';
import { 
  Article, Category, AdSlot, Comment, WebsiteSettings, BreakingNewsItem 
} from '../types';
import { 
  ArrowLeft, Share2, Copy, Check, MessageCircle, Facebook, Twitter, 
  Send, Linkedin, Mail, Smartphone, Clock, Calendar, RefreshCw, 
  User, Tag, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2, 
  Send as SendIcon, AlertCircle, Bookmark, ExternalLink, Globe, Layers
} from 'lucide-react';
import AdBanner from './AdBanner';

interface ArticleDetailProps {
  article: Article;
  articles: Article[];
  categories: Category[];
  adSlots: AdSlot[];
  comments: Comment[];
  settings: WebsiteSettings;
  breakingNews?: BreakingNewsItem[];
  onBack: () => void;
  onViewArticle: (article: Article) => void;
  onAddComment: (articleId: string, name: string, email: string, content: string) => void;
}

export default function ArticleDetail({
  article,
  articles,
  categories,
  adSlots,
  comments,
  settings,
  breakingNews = [],
  onBack,
  onViewArticle,
  onAddComment
}: ArticleDetailProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comment Form State
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Lightbox Modal for Article Image Gallery
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Compile all available article images for the gallery and lightbox
  const allArticleImages = Array.from(new Set([
    ...(article.image ? [article.image] : []),
    ...(article.images || [])
  ])).filter(Boolean);

  // Derive dynamic canonical article URL
  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?article=${encodeURIComponent(article.id)}`
    : `https://fastcoverages.com/?article=${article.id}`;

  const articleTitle = article.title;
  const websiteTitle = settings.name || 'FAST COVERAGES – GLOBAL NEWS NETWORK';
  const fullShareText = `${article.title} | ${websiteTitle}`;

  // Calculate reading time dynamically (words / 200 wpm)
  const wordCount = (article.content || '').trim().split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Formatted Dates
  const publishDateObj = new Date(article.publishDate);
  const formattedPublishDate = isNaN(publishDateObj.getTime())
    ? article.publishDate
    : publishDateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  // Calculate simulated updated date (e.g., publishDate or recent update)
  const updatedDateObj = new Date(article.publishDate);
  const formattedUpdatedDate = isNaN(updatedDateObj.getTime())
    ? article.publishDate
    : updatedDateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  // Find Previous and Next Articles
  const currentIndex = articles.findIndex(a => a.id === article.id);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  // Filter Related Articles from same category
  const relatedArticles = articles
    .filter(a => a.category.toLowerCase() === article.category.toLowerCase() && a.id !== article.id)
    .slice(0, 4);

  // Filter Trending Articles
  const trendingArticles = articles
    .filter(a => a.id !== article.id)
    .slice(0, 5);

  // Inject / Update SEO Open Graph and Meta Tags dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Update Document Title
    const originalTitle = document.title;
    document.title = `${article.title} - ${websiteTitle}`;

    // Helper to set or update meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const descriptionText = article.summary || article.subtitle || article.content.slice(0, 160).replace(/\n/g, ' ');

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', descriptionText);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', (article.keywords || [article.category, 'breaking news', 'global news']).join(', '));
    setMetaTag('meta[name="author"]', 'name', 'author', article.author);

    // Open Graph Tags (OG)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', article.title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', descriptionText);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', article.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', articleUrl);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', websiteTitle);

    // Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', article.title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', descriptionText);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', article.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167');

    // Article Specific Meta
    setMetaTag('meta[property="article:published_time"]', 'property', 'article:published_time', article.publishDate);
    setMetaTag('meta[property="article:section"]', 'property', 'article:section', article.category);

    return () => {
      document.title = originalTitle;
    };
  }, [article, articleUrl, websiteTitle]);

  // Show toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      triggerToast('Article link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = articleUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      triggerToast('Article link copied!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Native Mobile Share API
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || article.title,
          url: articleUrl
        });
        triggerToast('Article shared successfully!');
      } catch (err) {
        // User cancelled or share failed
        console.log('Native share closed or unavailable', err);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  // Social Sharing Links
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText + '\n' + articleUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodeURIComponent(article.title)}&body=${encodeURIComponent(fullShareText + '\n\nRead full article here:\n' + articleUrl)}`,
    sms: `sms:?body=${encodeURIComponent(article.title + ' - ' + articleUrl)}`
  };

  // Handle Comment Submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentBody.trim()) return;

    onAddComment(article.id, commentName.trim(), commentEmail.trim(), commentBody.trim());

    setCommentName('');
    setCommentEmail('');
    setCommentBody('');
    setCommentSuccess(true);
    triggerToast('Comment posted successfully!');
    setTimeout(() => setCommentSuccess(false), 4000);
  };

  const articleComments = comments.filter(c => c.articleId === article.id);

  return (
    <div className="relative animate-fade-in pb-20">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-mono font-bold px-4 py-3 rounded-lg shadow-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sticky Desktop Share Bar (CNN / Reuters Style) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center gap-3 sticky top-28 h-fit self-start pt-2">
          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono tracking-widest text-center mb-1">
            SHARE
          </span>

          <a 
            href={shareLinks.whatsapp} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow hover:scale-110" 
            title="Share on WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>

          <a 
            href={shareLinks.facebook} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow hover:scale-110" 
            title="Share on Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>

          <a 
            href={shareLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-black text-white flex items-center justify-center transition shadow hover:scale-110" 
            title="Share on Twitter (X)"
          >
            <Twitter className="w-5 h-5" />
          </a>

          <a 
            href={shareLinks.telegram} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition shadow hover:scale-110" 
            title="Share on Telegram"
          >
            <Send className="w-5 h-5" />
          </a>

          <a 
            href={shareLinks.linkedin} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center transition shadow hover:scale-110" 
            title="Share on LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>

          <a 
            href={shareLinks.gmail} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow hover:scale-110" 
            title="Share via Email"
          >
            <Mail className="w-5 h-5" />
          </a>

          <button 
            onClick={handleCopyLink} 
            className={`w-10 h-10 rounded-full ${copied ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-800'} text-white flex items-center justify-center transition shadow hover:scale-110 cursor-pointer`} 
            title="Copy Article Link"
          >
            {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
          </button>

          <button 
            onClick={handleNativeShare} 
            className="w-10 h-10 rounded-full bg-editorial-accent hover:bg-red-700 text-white flex items-center justify-center transition shadow hover:scale-110 cursor-pointer" 
            title="Open Full Share Sheet"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Center Main Article Column */}
        <div className="lg:col-span-8 bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-6 md:p-8 rounded-lg shadow-sm flex flex-col gap-6">
          
          {/* Top Breadcrumb & Back Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <button 
              onClick={onBack}
              className="text-xs font-black uppercase text-editorial-accent hover:text-red-700 flex items-center gap-1.5 transition font-mono cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to News Desk</span>
            </button>

            <span className="text-[10px] font-black uppercase tracking-widest bg-editorial-accent/10 dark:bg-editorial-accent/20 text-editorial-accent px-3 py-1 rounded font-mono">
              {article.category}
            </span>
          </div>

          {/* Headline & Subtitle */}
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-editorial-text leading-[1.15]">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-base md:text-xl text-slate-600 dark:text-editorial-text/75 font-serif leading-relaxed">
                {article.subtitle}
              </p>
            )}
          </div>

          {/* Author & Strict Metadata Line */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 dark:border-white/10 py-4 text-xs">
            <div className="flex items-center gap-3">
              {article.authorImage ? (
                <img 
                  src={article.authorImage} 
                  alt={article.author || 'Editorial Staff'} 
                  className="w-11 h-11 rounded-full object-cover border-2 border-editorial-accent/80 shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-editorial-accent text-white font-black text-base font-mono flex items-center justify-center border-2 border-editorial-accent/80 shadow-md shrink-0">
                  {(article.author || 'Editorial Staff').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-editorial-text text-sm flex items-center gap-1.5">
                  <span>By {article.author || 'Editorial Staff'}</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-editorial-text/40">
                  {article.authorDesignation || article.authorRole || 'Senior News Editor'}
                </span>
              </div>
            </div>

            {/* Timestamps & Reading Time */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-editorial-text/60">
              <div className="flex items-center gap-1.5" title="Published Date">
                <Calendar className="w-3.5 h-3.5 text-editorial-accent shrink-0" />
                <span>{formattedPublishDate}</span>
              </div>

              <div className="flex items-center gap-1.5" title="Last Updated">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Updated {formattedUpdatedDate}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-editorial-bg px-2.5 py-1 rounded border border-slate-200 dark:border-white/5 font-bold text-slate-700 dark:text-editorial-text" title="Estimated Reading Time">
                <Clock className="w-3.5 h-3.5 text-editorial-accent shrink-0" />
                <span>{readingTimeMinutes} min read</span>
              </div>
            </div>
          </div>

          {/* Inline Premium Desktop / Mobile Share Buttons Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 dark:bg-editorial-bg p-3 rounded-lg border border-slate-200/80 dark:border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-editorial-text font-mono flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-editorial-accent" />
              <span>Share Bulletin</span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <a 
                href={shareLinks.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              <a 
                href={shareLinks.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">X (Twitter)</span>
              </a>

              <a 
                href={shareLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Facebook</span>
              </a>

              <button 
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-1.5 bg-editorial-accent hover:bg-red-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>All Share Options</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {article.image && (
            <div 
              className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-editorial-bg shadow-sm relative group cursor-pointer"
              onClick={() => {
                const imgIdx = allArticleImages.indexOf(article.image);
                setLightboxIndex(imgIdx >= 0 ? imgIdx : 0);
              }}
            >
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-auto max-h-[520px] object-cover group-hover:scale-[1.01] transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                <ExternalLink className="w-3.5 h-3.5 text-red-500" /> Click to view full high-res image
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-editorial-bg border-t border-slate-200 dark:border-white/5 text-[11px] font-mono text-slate-500 dark:text-editorial-text/50 flex justify-between items-center">
                <span>Featured Image • Fast Coverages Global Wire</span>
                <span>Category: {article.category}</span>
              </div>
            </div>
          )}

          {/* Article Editorial Body with Dynamic In-Article Advertisements */}
          {(() => {
            const paragraphs = (article.content || '').split('\n\n').filter(p => p.trim());
            const activeInArticleAds = adSlots.filter(s => (s.type === 'In-Article' || s.type === 'Between-Articles') && s.active);

            if (paragraphs.length <= 1 || activeInArticleAds.length === 0) {
              return (
                <div className="text-base md:text-lg text-slate-900 dark:text-editorial-text leading-[1.8] space-y-5 whitespace-pre-line font-serif selection:bg-editorial-accent selection:text-white">
                  {article.content}
                </div>
              );
            }

            return (
              <div className="text-base md:text-lg text-slate-900 dark:text-editorial-text leading-[1.8] space-y-5 font-serif selection:bg-editorial-accent selection:text-white">
                {paragraphs.map((pText, pIdx) => {
                  const paraNumber = pIdx + 1;
                  // Check if an ad is configured for this paragraph index
                  const matchingAd = activeInArticleAds.find(s => s.paragraphPosition === paraNumber) || 
                    (paraNumber === 1 && !activeInArticleAds.some(s => s.paragraphPosition) ? activeInArticleAds[0] : undefined);

                  return (
                    <React.Fragment key={pIdx}>
                      <p className="whitespace-pre-line leading-[1.8]">{pText}</p>
                      {matchingAd && (
                        <div className="my-6 border-y border-slate-100 dark:border-slate-800/80 py-3 bg-slate-50/50 dark:bg-slate-900/20 rounded">
                          <div className="text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider text-center">
                            Sponsored Advertisement • Paragraph {paraNumber}
                          </div>
                          <AdBanner slot={matchingAd} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}

          {/* Coverage Photo Gallery Grid */}
          {allArticleImages.length > 0 && (
            <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text tracking-[0.2em] font-mono flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-editorial-accent" />
                  <span>Coverage Photo Gallery ({allArticleImages.length} High-Res Slides)</span>
                </span>
                <span className="text-[10px] text-slate-400 normal-case font-sans">Click photo to open full-screen viewer</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allArticleImages.map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 group shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Coverage photo ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono font-bold gap-1">
                      <ExternalLink className="w-4 h-4" />
                      <span>View Slide {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dedicated Author Profile Card (Requirement 3 & 5) */}
          <div className="border-t-2 border-editorial-accent bg-slate-50 dark:bg-editorial-bg p-6 rounded-lg border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row items-start gap-5 shadow-sm my-2">
            {article.authorImage ? (
              <img 
                src={article.authorImage} 
                alt={article.author || 'Editorial Staff'} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-editorial-accent/80 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-2xl font-mono flex items-center justify-center border-2 border-editorial-accent shadow-md shrink-0">
                {(article.author || 'Editorial Staff').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase text-editorial-accent tracking-widest block">By</span>
                  <h4 className="text-lg md:text-xl font-black text-slate-950 dark:text-editorial-text">
                    {article.author || 'Editorial Staff'}
                  </h4>
                  <p className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-editorial-text/50 mt-0.5">
                    {article.authorDesignation || article.authorRole || 'Senior News Editor'}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-editorial-text/50 bg-white dark:bg-editorial-dark px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 font-semibold">
                  Published: {formattedPublishDate}
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-600 dark:text-editorial-text/75 font-serif leading-relaxed">
                {article.authorBio || `${article.author} is a senior editorial correspondent at FAST COVERAGES - GLOBAL NEWS NETWORK, reporting on breaking international developments, political policies, and field disclosures.`}
              </p>

              {/* Author Social Media Links */}
              {article.authorSocials && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Connect with Author:</span>
                  {article.authorSocials.twitter && (
                    <a href={article.authorSocials.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-black hover:text-white text-slate-700 dark:text-white transition text-xs">
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {article.authorSocials.facebook && (
                    <a href={article.authorSocials.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-white transition text-xs">
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {article.authorSocials.linkedin && (
                    <a href={article.authorSocials.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-blue-700 hover:text-white text-slate-700 dark:text-white transition text-xs">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {article.authorSocials.email && (
                    <a href={`mailto:${article.authorSocials.email}`} className="p-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-red-600 hover:text-white text-slate-700 dark:text-white transition text-xs">
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags & Keywords */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-slate-400 font-mono flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-editorial-accent" />
                <span>Tags:</span>
              </span>
              {article.keywords.map((kw, i) => (
                <span 
                  key={i} 
                  className="text-xs font-mono font-bold bg-slate-100 dark:bg-editorial-bg text-slate-700 dark:text-editorial-text/80 px-2.5 py-1 rounded border border-slate-200 dark:border-white/10 hover:border-editorial-accent transition"
                >
                  #{kw.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Share Callout Box */}
          <div className="bg-slate-900 text-white p-6 rounded-lg border border-slate-800 flex flex-col gap-4 my-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm md:text-base font-black uppercase font-mono tracking-wider text-editorial-accent">
                  INFORM YOUR NETWORK
                </h3>
                <p className="text-xs text-slate-300 font-serif mt-1">
                  Help spread verified global journalism. Share this bulletin directly with colleagues or on social platforms.
                </p>
              </div>
              <button 
                onClick={handleNativeShare} 
                className="bg-editorial-accent hover:bg-red-700 text-white font-mono font-black text-xs px-4 py-2.5 rounded uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Share2 className="w-4 h-4" /> Share Bulletin
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-800">
              <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold transition">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-800 hover:bg-black text-white text-xs font-mono font-bold transition">
                <Twitter className="w-3.5 h-3.5" /> Twitter (X)
              </a>
              <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold transition">
                <Facebook className="w-3.5 h-3.5" /> Facebook
              </a>
              <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded bg-sky-500 hover:bg-sky-600 text-white text-xs font-mono font-bold transition">
                <Send className="w-3.5 h-3.5" /> Telegram
              </a>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded bg-blue-700 hover:bg-blue-800 text-white text-xs font-mono font-bold transition">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
              <a href={shareLinks.gmail} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
              <button onClick={handleCopyLink} className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 p-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-mono font-bold transition cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} Link
              </button>
            </div>
          </div>

          {/* Previous & Next Article Navigation Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/10 pt-6">
            {prevArticle ? (
              <button 
                onClick={() => onViewArticle(prevArticle)}
                className="flex flex-col gap-1.5 p-4 rounded-lg bg-slate-50 dark:bg-editorial-bg border border-slate-200/80 dark:border-white/5 hover:border-editorial-accent transition text-left group cursor-pointer"
              >
                <span className="text-[10px] font-black uppercase text-slate-400 font-mono flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5 text-editorial-accent" /> Previous Bulletin
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-editorial-text group-hover:text-editorial-accent transition line-clamp-2">
                  {prevArticle.title}
                </span>
              </button>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50/50 dark:bg-editorial-bg/30 border border-slate-100 dark:border-white/5 opacity-50 text-xs font-mono text-slate-400">
                Beginning of Latest News Index
              </div>
            )}

            {nextArticle ? (
              <button 
                onClick={() => onViewArticle(nextArticle)}
                className="flex flex-col gap-1.5 p-4 rounded-lg bg-slate-50 dark:bg-editorial-bg border border-slate-200/80 dark:border-white/5 hover:border-editorial-accent transition text-right group cursor-pointer items-end"
              >
                <span className="text-[10px] font-black uppercase text-slate-400 font-mono flex items-center gap-1">
                  Next Bulletin <ChevronRight className="w-3.5 h-3.5 text-editorial-accent" />
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-editorial-text group-hover:text-editorial-accent transition line-clamp-2">
                  {nextArticle.title}
                </span>
              </button>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50/50 dark:bg-editorial-bg/30 border border-slate-100 dark:border-white/5 opacity-50 text-xs font-mono text-slate-400 text-right">
                End of Current Bulletins Index
              </div>
            )}
          </div>

          {/* Embedded Newsletter Subscription Box */}
          <div className="bg-editorial-bg border border-white/10 p-6 rounded-lg text-white flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-editorial-accent font-mono flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              <span>Subscribe To Fast Coverages Global Digest</span>
            </h3>
            <p className="text-xs text-editorial-text/70 leading-relaxed font-serif">
              Get urgent breaking alerts, editorial investigations, and daily market intelligence delivered directly to your inbox.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); triggerToast('Subscribed to Global Breaking Digest!'); }} className="flex gap-2">
              <input 
                type="email" 
                required 
                placeholder="Enter your work email address..." 
                className="bg-white/5 border border-white/10 text-xs p-3 rounded text-white outline-none focus:border-editorial-accent flex-1 font-mono"
              />
              <button type="submit" className="bg-editorial-accent hover:bg-red-700 text-white font-mono font-black text-xs px-5 py-3 rounded uppercase tracking-wider transition cursor-pointer shrink-0">
                Subscribe
              </button>
            </form>
          </div>

          {/* Visitor Comments Thread */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col gap-6">
            <h3 className="text-base font-black uppercase tracking-tight text-slate-950 dark:text-editorial-text font-mono flex items-center justify-between">
              <span>Visitor Discussion ({articleComments.length})</span>
            </h3>

            {/* Submit Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 rounded-lg">
              <span className="text-xs font-black uppercase text-slate-400 dark:text-editorial-text/40 font-mono tracking-wider">
                Join the News Desk Discussion
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                  placeholder="Your Name *"
                  className="bg-white dark:bg-editorial-dark border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans"
                />
                <input
                  type="email"
                  required
                  value={commentEmail}
                  onChange={e => setCommentEmail(e.target.value)}
                  placeholder="Email (kept private) *"
                  className="bg-white dark:bg-editorial-dark border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans"
                />
              </div>

              <textarea
                rows={3}
                required
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                placeholder="Share your perspective on this bulletin..."
                className="bg-white dark:bg-editorial-dark border border-slate-200 dark:border-white/10 text-xs p-2.5 rounded outline-none focus:border-editorial-accent dark:text-editorial-text font-sans"
              />

              <button
                type="submit"
                className="bg-editorial-accent hover:bg-red-700 text-white font-black py-2.5 px-5 rounded text-xs uppercase tracking-wider self-end transition flex items-center gap-1.5 font-mono cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" /> Post Comment
              </button>

              {commentSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-fade-in font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Comment recorded in real-time.
                </span>
              )}
            </form>

            {/* Display Approved Comments */}
            <div className="flex flex-col gap-3">
              {articleComments.map(com => (
                <div key={com.id} className="p-4 bg-slate-50 dark:bg-editorial-bg border border-slate-200/80 dark:border-white/5 rounded-lg flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-editorial-text">{com.authorName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(com.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-editorial-text/80 leading-relaxed font-sans">{com.content}</p>
                </div>
              ))}

              {articleComments.length === 0 && (
                <p className="text-xs text-slate-400 italic">No comments published on this bulletin yet. Be the first to share an insight!</p>
              )}
            </div>

          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Sidebar Ad Slot */}
          <AdBanner slot={adSlots.find(s => s.type === 'Sidebar')} />

          {/* Breaking Bulletins Sidebar Widget */}
          {breakingNews && breakingNews.length > 0 && (
            <div className="bg-editorial-accent text-white p-4 rounded-lg shadow-sm flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>LIVE BREAKING ALERTS</span>
              </span>
              <div className="flex flex-col gap-2 border-t border-white/20 pt-2 text-xs">
                {breakingNews.slice(0, 3).map((bn) => (
                  <p key={bn.id} className="leading-snug font-medium border-b border-white/10 pb-2 last:border-0 last:pb-0">
                    {bn.title}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Related Category Bulletins */}
          <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent mb-3 tracking-[0.25em] font-mono">
              Related {article.category} Desks
            </h3>
            <div className="flex flex-col gap-3">
              {relatedArticles.map(rel => (
                <button
                  key={rel.id}
                  onClick={() => onViewArticle(rel)}
                  className="text-left group flex flex-col gap-1 cursor-pointer border-b border-slate-100 dark:border-white/5 pb-2.5 last:border-0 last:pb-0"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-editorial-text group-hover:text-editorial-accent transition line-clamp-2">
                    {rel.title}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{rel.author}</span>
                    <span>{new Date(rel.publishDate).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}

              {relatedArticles.length === 0 && (
                <p className="text-xs text-slate-400 italic">No additional related articles in {article.category} desk right now.</p>
              )}
            </div>
          </div>

          {/* Trending Bulletins (NO VIEW COUNTS) */}
          <div className="bg-white dark:bg-editorial-dark border border-slate-200/80 dark:border-white/5 p-4 rounded-lg shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-950 dark:text-editorial-text pb-2 border-b border-editorial-accent mb-3.5 tracking-[0.25em] font-mono">
              Trending Headlines
            </h3>
            <div className="flex flex-col gap-3">
              {trendingArticles.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => onViewArticle(item)}
                  className="text-left flex gap-3 cursor-pointer group border-b border-slate-100 dark:border-white/5 pb-2.5 last:border-0 last:pb-0"
                >
                  <span className="text-lg font-black text-editorial-accent font-mono shrink-0">0{idx + 1}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-editorial-text group-hover:text-editorial-accent transition line-clamp-2">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="uppercase text-editorial-accent font-bold">{item.category}</span>
                      <span>•</span>
                      <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Bottom Share Bar for Mobile Screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 p-3 flex items-center justify-between gap-2 shadow-2xl">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-wider text-editorial-accent font-mono shrink-0">
            SHARE
          </span>
          <span className="text-xs font-bold truncate max-w-[150px] sm:max-w-[250px]">
            {article.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a 
            href={shareLinks.whatsapp} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition" 
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <a 
            href={shareLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 rounded-full bg-slate-800 text-white hover:bg-black transition" 
            title="X (Twitter)"
          >
            <Twitter className="w-4 h-4" />
          </a>

          <button 
            onClick={handleCopyLink} 
            className="p-2 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition cursor-pointer" 
            title="Copy Link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button 
            onClick={handleNativeShare} 
            className="px-3 py-1.5 rounded-full bg-editorial-accent hover:bg-red-700 text-white text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer shadow-lg"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Full Screen Image Lightbox Modal */}
      {lightboxIndex !== null && allArticleImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in">
          {/* Top Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between text-white border-b border-white/10 pb-3 z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-black uppercase text-editorial-accent tracking-widest bg-editorial-accent/20 px-2.5 py-1 rounded border border-editorial-accent/40">
                Photo {lightboxIndex + 1} of {allArticleImages.length}
              </span>
              <span className="text-xs font-mono text-slate-300 hidden sm:inline truncate max-w-md">
                {article.title}
              </span>
            </div>

            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-red-600 text-white transition cursor-pointer"
              title="Close Full-Screen View"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Slide Image */}
          <div className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-4 overflow-hidden">
            {allArticleImages.length > 1 && (
              <button
                onClick={() => setLightboxIndex((lightboxIndex - 1 + allArticleImages.length) % allArticleImages.length)}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/70 hover:bg-red-600 text-white transition cursor-pointer border border-white/20 shadow-xl"
                title="Previous Image"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            <img
              src={allArticleImages[lightboxIndex]}
              alt={`Slide ${lightboxIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-lg border border-white/10 shadow-2xl transition duration-200"
              referrerPolicy="no-referrer"
            />

            {allArticleImages.length > 1 && (
              <button
                onClick={() => setLightboxIndex((lightboxIndex + 1) % allArticleImages.length)}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/70 hover:bg-red-600 text-white transition cursor-pointer border border-white/20 shadow-xl"
                title="Next Image"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Carousel */}
          {allArticleImages.length > 1 && (
            <div className="w-full max-w-4xl flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 bg-black/40 rounded-xl border border-white/10">
              {allArticleImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition shrink-0 ${i === lightboxIndex ? 'border-editorial-accent scale-105 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Premium Share Modal / Popup */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-editorial-dark border border-slate-200 dark:border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5 animate-scale-in">
            
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-editorial-text hover:bg-editorial-accent hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-editorial-accent font-mono text-xs font-black uppercase mb-1">
                <Share2 className="w-4 h-4" />
                <span>Premium Article Distribution</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-editorial-text leading-snug">
                Share Bulletin
              </h2>
              <p className="text-xs text-slate-500 dark:text-editorial-text/60 line-clamp-2 mt-1 font-serif">
                {article.title}
              </p>
            </div>

            {/* Direct Copy Link Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Direct Web Address</span>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-editorial-bg p-2 rounded border border-slate-200 dark:border-white/10">
                <input 
                  type="text" 
                  readOnly 
                  value={articleUrl} 
                  className="bg-transparent text-xs text-slate-800 dark:text-editorial-text flex-1 outline-none font-mono"
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-editorial-accent hover:bg-red-700 text-white text-xs font-mono font-bold px-3 py-1.5 rounded transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Grid of Social Channels */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono font-bold">
              <a 
                href={shareLinks.whatsapp} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>WhatsApp</span>
              </a>

              <a 
                href={shareLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
              >
                <Facebook className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Facebook</span>
              </a>

              <a 
                href={shareLinks.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-black hover:text-white transition"
              >
                <Twitter className="w-4 h-4 shrink-0 text-slate-800 dark:text-white" />
                <span>Twitter (X)</span>
              </a>

              <a 
                href={shareLinks.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition"
              >
                <Send className="w-4 h-4 shrink-0 text-sky-500" />
                <span>Telegram</span>
              </a>

              <a 
                href={shareLinks.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 hover:bg-blue-700 hover:text-white transition"
              >
                <Linkedin className="w-4 h-4 shrink-0 text-blue-700" />
                <span>LinkedIn</span>
              </a>

              <a 
                href={shareLinks.gmail} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white transition"
              >
                <Mail className="w-4 h-4 shrink-0 text-red-600" />
                <span>Gmail / Email</span>
              </a>

              <a 
                href={shareLinks.sms} 
                onClick={() => setIsShareModalOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
              >
                <Smartphone className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>SMS Message</span>
              </a>

              <button 
                onClick={() => {
                  handleCopyLink();
                  setIsShareModalOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-100 dark:bg-editorial-bg border border-slate-200 dark:border-white/10 text-slate-800 dark:text-editorial-text hover:bg-editorial-accent hover:text-white transition cursor-pointer"
              >
                <Globe className="w-4 h-4 shrink-0 text-editorial-accent" />
                <span>Instagram / Web</span>
              </button>
            </div>

            {/* Native OS Share button */}
            {typeof navigator !== 'undefined' && (
              <button 
                onClick={() => {
                  setIsShareModalOpen(false);
                  handleNativeShare();
                }}
                className="w-full bg-editorial-accent hover:bg-red-700 text-white font-mono font-black text-xs py-3 rounded-lg uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Use System Device Share Sheet</span>
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
