import React, { useState } from "react";
import { Comment } from "../types";
import { CheckCircle2, XCircle, Trash2, ShieldAlert, MessageCircleCode } from "lucide-react";

interface AdminCommentsProps {
  comments: Comment[];
  onUpdateCommentStatus: (id: string, status: Comment["status"]) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

export default function AdminComments({
  comments,
  onUpdateCommentStatus,
  onDeleteComment,
}: AdminCommentsProps) {
  const [filterState, setFilterState] = useState<Comment["status"] | "All">("Pending");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredComments = comments.filter(c => 
    filterState === "All" ? true : c.status === filterState
  );

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 font-sans text-neutral-800" id="admin_comments_panel">
      {/* Moderation filter bar tabs */}
      <div className="flex justify-between items-center bg-white border border-neutral-200 p-4 rounded-lg select-none">
        <div className="flex gap-2">
          {["Pending", "Approved", "Rejected", "Spam", "All"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterState(tab as any)}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${
                filterState === tab
                  ? "bg-red-700 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {tab} Queue
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-400 font-mono">
          Total items on this sheet: {filteredComments.length}
        </span>
      </div>

      {/* Main Comment Queue Cards list */}
      <div className="space-y-4">
        {filteredComments.map(comm => (
          <div
            key={comm.id}
            className={`bg-white border rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-xs transition-shadow hover:shadow ${
              comm.status === "Pending" ? "border-amber-300" :
              comm.status === "Approved" ? "border-neutral-200" :
              comm.status === "Spam" ? "border-red-300 bg-red-50/20" : "border-neutral-200"
            }`}
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-extrabold text-neutral-900 text-sm font-sans">{comm.authorName}</span>
                <span className="text-neutral-400 text-xs font-mono select-all">/{comm.authorEmail}</span>
                <span className="text-[10px] text-neutral-400 font-mono">| {formatDate(comm.createdAt)}</span>
              </div>
              <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-line bg-neutral-50/80 p-3 rounded border border-neutral-100 italic">
                "{comm.content}"
              </p>
              <div className="text-[10px] uppercase font-mono text-neutral-400">
                Story Title: <strong className="text-neutral-600 select-all">{comm.articleTitle}</strong>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex sm:flex-col gap-2 shrink-0 self-center w-full sm:w-auto">
              {comm.status !== "Approved" && (
                <button
                  onClick={() => onUpdateCommentStatus(comm.id, "Approved")}
                  className="flex-1 sm:flex-initial bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 text-xs font-bold px-3 py-2 rounded flex items-center justify-center gap-1 cursor-pointer transition"
                  title="Approve to Main Website"
                >
                  <CheckCircle2 size={13} /> Approve
                </button>
              )}
              {comm.status !== "Rejected" && (
                <button
                  onClick={() => onUpdateCommentStatus(comm.id, "Rejected")}
                  className="flex-1 sm:flex-initial bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-2 rounded flex items-center justify-center gap-1 cursor-pointer transition"
                  title="Move to Rejected Stack"
                >
                  <XCircle size={13} /> Reject
                </button>
              )}
              {comm.status !== "Spam" && (
                <button
                  onClick={() => onUpdateCommentStatus(comm.id, "Spam")}
                  className="flex-1 sm:flex-initial bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-bold px-3 py-2 rounded flex items-center justify-center gap-1 cursor-pointer transition"
                  title="Flag as Trash Spam"
                >
                  <ShieldAlert size={13} /> Spam
                </button>
              )}
              {deleteConfirmId !== comm.id ? (
                <button
                  onClick={() => setDeleteConfirmId(comm.id)}
                  className="flex-1 sm:flex-initial bg-neutral-100 hover:bg-neutral-200 text-neutral-750 text-xs font-bold px-3 py-2 rounded flex items-center justify-center gap-1 cursor-pointer transition border border-neutral-200"
                  title="Erase document"
                >
                  <Trash2 size={13} /> Delete Record
                </button>
              ) : (
                <div className="flex-1 sm:flex-initial bg-red-50 p-1.5 border border-red-200 rounded text-xs select-none flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-bold text-red-800 font-mono">Delete?</span>
                  <div className="flex gap-1">
                    <button
                      onClick={async () => {
                        try {
                          await onDeleteComment(comm.id);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setDeleteConfirmId(null);
                        }
                      }}
                      className="bg-red-750 hover:bg-red-800 text-white text-[9px] uppercase font-bold px-2 py-1 rounded cursor-pointer transition"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[9px] uppercase font-bold px-2 py-1 rounded cursor-pointer transition"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredComments.length === 0 && (
          <div className="text-center py-12 bg-white border border-neutral-200 rounded-lg select-none">
            <MessageCircleCode size={36} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-neutral-400 italic text-sm">
              The {filterState} comment queue sheet is currently empty.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
