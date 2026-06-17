import React, { useState, useEffect } from "react";
import { Article, Comment } from "../types";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Clock, User, ArrowLeft, Send, MessageSquare, Flame } from "lucide-react";

interface ArticleViewProps {
  article: Article;
  relatedArticles: Article[];
  onBack: () => void;
  onSelectArticle: (art: Article) => void;
}

export default function ArticleView({
  article,
  relatedArticles,
  onBack,
  onSelectArticle,
}: ArticleViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

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
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-2 border-y border-slate-100 py-2.5">
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
          </div>

          {/* Featured Card Image */}
          {article.featuredImage && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-xs bg-slate-50 border border-slate-200 aspect-[16/9]">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Inner Content Paragraphs */}
          <div className="text-slate-800 text-sm md:text-base leading-relaxed whitespace-pre-line space-y-4 max-w-none font-sans">
            {article.content}
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
            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 p-2 rounded mb-4">
              <strong>Standards Policy:</strong> Comments pass editorial moderation before loading publicly to prevent spam.
            </p>

            <form onSubmit={handlePostComment} className="space-y-4">
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
    </div>
  );
}
