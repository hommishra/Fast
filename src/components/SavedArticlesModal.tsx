import React from "react";
import { Bookmark } from "../types";
import { X, BookMarked, Trash2, ArrowUpRight, FolderHeart, Calendar } from "lucide-react";

interface SavedArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onRemoveBookmark: (bookmarkId: string) => void;
  onSelectArticleById: (articleId: string) => void;
}

export default function SavedArticlesModal({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onSelectArticleById,
}: SavedArticlesModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      id="saved_bookmarks_modal_container"
    >
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-sans">
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-950">
          <div className="flex items-center gap-2">
            <BookMarked size={16} className="text-red-500" />
            <h3 className="text-sm font-black tracking-widest text-white uppercase font-sans">
              Saved Briefings Board
            </h3>
            <span className="bg-red-750 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
              {bookmarks.length} SAVED
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Bookmarks"
          >
            <X size={16} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-6 max-h-[420px] overflow-y-auto space-y-4">
          
          <div className="select-none">
            <p className="text-[11px] text-slate-500">
              Your personally curated index of saved news briefings, investigative reports, and market portfolios. Bookmarks sync securely across devices linked to your account.
            </p>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2 select-none">
              <FolderHeart size={28} className="text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Your brief board is currently empty.</p>
              <p className="text-[10px] text-slate-400">Click "Save Briefing" inside any global report to bookmark it.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
              {bookmarks.map((bookmark) => (
                <div 
                  key={bookmark.id}
                  className="p-3.5 bg-slate-50/50 hover:bg-slate-50 transition flex items-center gap-4 justify-between"
                >
                  <div 
                    onClick={() => {
                      onSelectArticleById(bookmark.articleId);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                  >
                    {bookmark.featuredImage ? (
                      <img 
                        src={bookmark.featuredImage}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-white shrink-0 group-hover:brightness-95 transition"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center font-bold text-[9px] text-slate-400 border border-slate-200 uppercase font-mono">
                        NEWS
                      </div>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-wider text-red-600 bg-red-50/80 px-1 py-0.5 rounded">
                          {bookmark.categoryId}
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono flex items-center gap-1 leading-none">
                          <Calendar size={8} />
                          {new Date(bookmark.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-650 transition-colors truncate">
                        {bookmark.articleTitle}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(bookmark.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                      title="Delete Bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectArticleById(bookmark.articleId);
                        onClose();
                      }}
                      className="text-slate-500 hover:text-slate-800 p-2 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex"
                      title="Read Briefing"
                    >
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Close trigger footer */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs uppercase tracking-widest font-black py-2 px-4 rounded-lg cursor-pointer"
            >
              Close Hub
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
