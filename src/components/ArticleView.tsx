import React, { useState, useEffect } from "react";
import { Article, Comment, Bookmark } from "../types";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Clock, User, ArrowLeft, Send, MessageSquare, Flame, Bookmark as BookmarkIcon, Share2, Twitter, Facebook, MessageCircle, Link, X, Maximize2 } from "lucide-react";
import { getFallbackImage } from "../utils/imageHelpers";
import { AnimatePresence, motion } from "motion/react";

interface ArticleViewProps {
  article: Article;
  relatedArticles: Article[];
  currentUser?: any | null;
  onToggleBookmark?: (art: Article) => void;
  bookmarks?: Bookmark[];
  onBack: () => void;
  onSelectArticle: (art: Article) => void;
}

export default function ArticleView({
  article,
  relatedArticles,
  currentUser,
  onToggleBookmark,
  bookmarks,
  onBack,
  onSelectArticle,
}: ArticleViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Esc-key keydown event listener to close the Lightbox for high accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const isBookmarked = bookmarks?.some((b) => b.articleId === article.id) || false;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = article.title;

  const handleShare = (platform: "X" | "Facebook" | "WhatsApp" | "Copy") => {
    if (platform === "X") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (platform === "Facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (platform === "WhatsApp") {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " - " + shareUrl)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (platform === "Copy") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Sync user details to comment fields on change
  useEffect(() => {
    if (currentUser) {
      setCommentName(currentUser.displayName || "Anonymous Reader");
      setCommentEmail(currentUser.email || "");
    } else {
      setCommentName("");
      setCommentEmail("");
    }
  }, [currentUser]);

  // Track Article Views / Incrementation
  useEffect(() => {
    const incrementViews = async () => {
      try {
        const docRef = doc(db, "articles", article.id);
        await updateDoc(docRef, {
          views: increment(1)
        });
      } catch (err) {
        console.error("Failed to increment views: ", err);
      }
    };
    incrementViews();
  }, [article.id]);

  // Real-time listener for Approved Comments
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("articleId", "==", article.id),
      where("status", "==", "Approved")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Comment);
      });
      // Sort comments by date
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(list);
    }, (error) => {
      console.error("Article comments onSnapshot subscription failed:", error);
    });

    return () => unsubscribe();
  }, [article.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentContent.trim()) return;

    setSubmitStatus("sending");
    try {
      const commentPayload = {
        articleId: article.id,
        articleTitle: article.title,
        articleSlug: article.slug,
        authorName: commentName.trim(),
        authorEmail: commentEmail.trim().toLowerCase(),
        content: commentContent.trim(),
        status: "Pending", // Default starts as Pending moderation
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "comments"), commentPayload);
      setCommentName("");
      setCommentEmail("");
      setCommentContent("");
      setSubmitStatus("success");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (e) {
      console.error(e);
      setSubmitStatus("error");
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 font-sans" id="article_view_panel">
      {/* Back CTA Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-650 transition-colors mb-6 cursor-pointer text-xs font-bold tracking-wider uppercase font-sans"
      >
        <ArrowLeft size={14} /> Back to Headlines
      </button>

      {/* Main Core News Article card */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-xs mb-8">
        <article className="border-b border-slate-100 pb-8">
          {/* Title & Metadata */}
          <div className="space-y-3 mb-6">
            <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded select-none">
              {article.categoryId}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed italic border-l-2 border-blue-600 pl-3">
                {article.subtitle}
              </p>
            )}

            {/* Author info and Date details */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-y border-slate-100 py-2.5 mb-4">
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <User size={12} className="text-blue-600" />
                  <span>By {article.authorName}</span>
                </div>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Published {formatDate(article.publishDate)}</span>
                </div>
                <span className="text-slate-200">|</span>
                <div className="flex items-center gap-1.5 text-red-655">
                  <Flame size={12} />
                  <span>{article.views + 1} Reads</span>
                </div>
              </div>

              {/* Save Alert Brief Action trigger */}
              <button
                type="button"
                onClick={() => onToggleBookmark?.(article)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-sans font-bold uppercase tracking-wider select-none transition-all cursor-pointer ${
                  isBookmarked
                    ? "bg-red-700 text-white border-red-700 shadow-xs hover:bg-red-800"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-350"
                }`}
              >
                <BookmarkIcon size={12} className={isBookmarked ? "fill-white" : ""} />
                <span>{isBookmarked ? "Saved to Briefs" : "Save Briefing"}</span>
              </button>
            </div>

            {/* Social Share Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-6">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Share2 size={12} className="text-blue-600" /> Share bulletins
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShare("X")}
                  title="Share on X / Twitter"
                  className="p-1 px-2.5 text-[10px] font-bold font-sans tracking-wide bg-neutral-900 border border-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Twitter size={11} />
                  <span>X</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("Facebook")}
                  title="Share on Facebook"
                  className="p-1 px-2.5 text-[10px] font-bold font-sans tracking-wide bg-blue-700 border border-blue-800 text-white rounded-lg hover:bg-blue-650 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Facebook size={11} />
                  <span>Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("WhatsApp")}
                  title="Share on WhatsApp"
                  className="p-1 px-2.5 text-[10px] font-bold font-sans tracking-wide bg-green-600 border border-green-700 text-white rounded-lg hover:bg-green-550 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle size={11} />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("Copy")}
                  title="Copy share link"
                  className={`p-1 px-2.5 text-[10px] font-bold font-sans tracking-wide rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    copied
                      ? "bg-green-150 text-green-800 border-green-250 font-black"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Link size={11} />
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Featured Card Image with Lightbox Zoom Trigger */}
          {article.featuredImage && (
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="group relative mb-6 rounded-lg overflow-hidden shadow-sm bg-slate-50 border border-slate-200 aspect-[16/9] cursor-zoom-in active:scale-[0.99] transition-transform duration-200"
              title="Click to view full-screen"
            >
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackImage(article.title, article.categoryId);
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-350 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0 bg-neutral-900/90 text-white text-[10px] font-bold font-sans uppercase tracking-wider px-3.5 py-2 rounded-full flex items-center gap-2 transition-all duration-300 shadow-lg border border-white/10 select-none">
                  <Maximize2 size={11} className="text-blue-400" />
                  <span>Click to expand image</span>
                </div>
              </div>
            </div>
          )}

          {/* Inner Content Paragraphs */}
          <div className="text-slate-800 text-sm md:text-base leading-relaxed whitespace-pre-line space-y-4 max-w-none font-sans">
            {article.content}
          </div>

          {/* Post-Reading Bulletin Share Row */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left select-none">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-none animate-fade-in">Share this Story</h4>
              <p className="text-[10px] text-slate-400 mt-1">If you found this reporting valuable, distribute it on your networks.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShare("X")}
                className="p-1.5 px-3 bg-neutral-900 border border-neutral-950 text-white text-[11px] font-bold rounded-lg hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Twitter size={12} />
                <span>X / Twitter</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare("Facebook")}
                className="p-1.5 px-3 bg-blue-700 border border-blue-800 text-white text-[11px] font-bold rounded-lg hover:bg-blue-650 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Facebook size={12} />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare("WhatsApp")}
                className="p-1.5 px-3 bg-green-600 border border-green-700 text-white text-[11px] font-bold rounded-lg hover:bg-green-550 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare("Copy")}
                className={`p-1.5 px-3 text-[11px] font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  copied
                    ? "bg-green-100 text-green-800 border-green-200 font-bold"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Link size={12} />
                <span>{copied ? "Link Copied!" : "Copy URL"}</span>
              </button>
            </div>
          </div>
        </article>

        {/* Related Bulletins Panel */}
        {relatedArticles.length > 0 && (
          <section className="py-6 border-b border-slate-100" id="related_bulletins_wrapper">
            <h3 className="text-xs font-bold text-slate-900 mb-4 tracking-wider uppercase border-l-3 border-blue-600 pl-3">
              Related News Coverage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel)}
                  className="group cursor-pointer flex gap-3 bg-slate-50 hover:bg-slate-100/75 p-3 rounded-lg border border-slate-200/60 transition-all duration-200"
                >
                  {rel.featuredImage && (
                    <img
                      src={rel.featuredImage}
                      alt={rel.title}
                      className="w-16 h-16 object-cover rounded shrink-0 border border-slate-200"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackImage(rel.title, rel.categoryId);
                      }}
                    />
                  )}
                  <div className="space-y-1 overflow-hidden">
                    <span className="text-[9px] uppercase tracking-wider text-red-650 font-extrabold font-sans">
                      {rel.categoryId}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comments Segment */}
        <section className="py-6 space-y-8" id="comments_dashboard_section">
          <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase flex items-center gap-1.5 border-l-3 border-blue-600 pl-3 select-none">
            <MessageSquare size={14} className="text-blue-600" />
            Comments Desk ({comments.length})
          </h3>

          {/* Existing Comments listing */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] py-4 bg-slate-50 border border-dashed border-slate-200 text-center rounded-lg">
                No comments have been approved yet. Be the first to start the discussion!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs font-sans flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[9px] text-slate-600 uppercase font-mono font-black">
                        {comment.authorName[0]}
                      </span>
                      {comment.authorName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line font-sans pl-6">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Submission Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 mb-2 tracking-tight uppercase">
              Join the Conversation
            </h4>
            <p className="text-[10px] text-amber-805 bg-amber-50 border border-amber-100 p-2 rounded mb-4">
              <strong>Standards Policy:</strong> Comments pass editorial moderation before loading publicly to prevent spam.
            </p>

            {currentUser ? (
              <div className="bg-blue-50/60 border border-blue-200/60 p-3 rounded-lg mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-sans select-none animate-fade-in">
                <div className="text-blue-800">
                  Commenting as <strong className="font-bold text-blue-900">{currentUser.displayName || "Anonymous Reader"}</strong> <span className="text-blue-600/85 font-mono text-[10px]">({currentUser.email})</span>
                  <span className="ml-2 bg-blue-100 text-blue-700 font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
                    VERIFIED ID
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Synced verified user profile
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 text-slate-650 p-2.5 rounded-lg mb-4 text-[10px] leading-relaxed font-sans select-none">
                💡 <strong>Subscribers:</strong> Complete your <strong>Reader Sign In</strong> (located in the header top log bar) to register comments under your unique account handle and verify your reading streak.
              </div>
            )}

            <form onSubmit={handlePostComment} className="space-y-4">
              {!currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Your display name"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans focus:outline-none focus:border-blue-650"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com (Hidden)"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-sans focus:outline-none focus:border-blue-650"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">Your Comment</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your thoughts constructively..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-sans focus:outline-none focus:border-blue-650"
                />
              </div>

              <div className="flex justify-between items-center">
                {submitStatus === "success" && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded">
                    Thank you! Your comment went to our editorial queue for approval.
                  </span>
                )}
                {submitStatus === "error" && (
                  <span className="text-[10px] font-bold text-red-650 bg-red-50 px-2.5 py-1.5 rounded">
                    An error occurred. Please check connectivity.
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    disabled={submitStatus === "sending"}
                    className="bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white font-sans text-xs uppercase tracking-widest font-black px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {submitStatus === "sending" ? "Publishing..." : "Submit Comment"}
                    <Send size={11} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Polish Lightbox / Full-screen Media Overlay */}
      <AnimatePresence>
        {isLightboxOpen && article.featuredImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-md select-none cursor-zoom-out"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close button with nice hover interaction */}
            <motion.button
              type="button"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/10 hover:bg-white/20 active:bg-white/35 text-white rounded-full p-2.5 transition-all backdrop-blur-sm cursor-pointer shadow-xl border border-white/10"
              title="Close full-screen (Esc)"
              style={{ pointerEvents: "auto" }}
            >
              <X size={20} />
            </motion.button>

            {/* Main Full-screen image container */}
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()} // Prevent closure when clicking on image card
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900 cursor-default"
            >
              <div className="w-full h-full max-h-[75vh] flex items-center justify-center overflow-hidden bg-neutral-950">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="max-w-full max-h-[75vh] object-contain select-all"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackImage(article.title, article.categoryId);
                  }}
                />
              </div>
              
              {/* Image Details Bottom Bar inside Lightbox */}
              <div className="bg-neutral-950/90 backdrop-blur-xs p-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-white">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] uppercase tracking-wider text-blue-400 font-extrabold font-mono select-none block mb-0.5">
                    {article.categoryId}
                  </span>
                  <h3 className="text-xs md:text-sm font-bold truncate text-neutral-200" title={article.title}>
                    {article.title}
                  </h3>
                  {article.imageCaption && (
                    <p className="text-[10px] md:text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {article.imageCaption}
                    </p>
                  )}
                </div>
                {(article.photographerCredit || article.authorName) && (
                  <div className="text-[10px] font-mono text-neutral-400 shrink-0 text-left md:text-right select-all select-none">
                    {article.photographerCredit ? `Photo: ${article.photographerCredit}` : `Reporter: ${article.authorName}`}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
