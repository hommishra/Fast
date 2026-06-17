import React, { useState } from "react";
import { Article, Category } from "../types";
import { PlusCircle, Search, Edit2, Trash2, Save, FileText, Globe, Eye, Sparkles, AlertCircle } from "lucide-react";

interface AdminArticlesProps {
  articles: Article[];
  categories: Category[];
  adminToken: string;
  onSaveArticle: (art: Partial<Article>) => Promise<void>;
  onDeleteArticle: (id: string) => Promise<void>;
  adminUserRole: string;
  adminUserName: string;
}

export default function AdminArticles({
  articles,
  categories,
  adminToken,
  onSaveArticle,
  onDeleteArticle,
  adminUserRole,
  adminUserName,
}: AdminArticlesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  
  // AI loader
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter categories
  const parentCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => c.parentId);

  const startCreateNew = () => {
    setEditingArticle({
      title: "",
      subtitle: "",
      excerpt: "",
      content: "",
      slug: "",
      featuredImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800", // Default Unsplash journalism image
      status: "Draft",
      categoryId: categories[0]?.id || "politics",
      publishDate: new Date().toISOString(),
      authorName: adminUserName,
      views: 0,
      relatedArticles: [],
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    });
    setIsEditing(true);
  };

  const handleEdit = (art: Article) => {
    // Authors can only edit their own articles, or we permit depending on role
    setEditingArticle({ ...art });
    setIsEditing(true);
  };

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    if (!editingArticle) return;
    setEditingArticle(prev => ({
      ...prev,
      title,
      slug: generateSlugFromTitle(title)
    }));
  };

  const triggerGeminiSEO = async () => {
    if (!editingArticle?.content) {
      alert("Please provide the core news content first so Gemini has draft substance to analyze!");
      return;
    }
    setAiGenerating(true);
    setAiMessage("");
    try {
      const response = await fetch("/api/gemini/suggest-seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: editingArticle.title,
          content: editingArticle.content
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEditingArticle(prev => ({
          ...prev,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords
        }));
        setAiMessage("SEO Metas optimization complete using deep collaborative reasoning models!");
      } else {
        alert("Gemini advice retrieval failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("AI communication timed out.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title || !editingArticle.content || !editingArticle.categoryId) return;
    
    setSaveLoading(true);
    try {
      await onSaveArticle(editingArticle);
      setIsEditing(false);
      setEditingArticle(null);
      setAiMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to preserve article metadata.");
    } finally {
      setSaveLoading(false);
    }
  };

  const filtered = articles.filter(art => 
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-neutral-800" id="admin_articles_panel">
      {/* Top action rail */}
      {!isEditing ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5 select-none">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider font-mono text-neutral-900 border-l-4 border-red-700 pl-2.5">
                Article Databases List
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Currently logged in as: <strong className="text-neutral-700">{adminUserName} ({adminUserRole})</strong>
              </p>
            </div>
            
            <button
              onClick={startCreateNew}
              className="bg-red-700 hover:bg-red-800 text-white font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <PlusCircle size={15} /> Create Article
            </button>
          </div>

          {/* Search Table filtering */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Search current database logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-md py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-red-655"
            />
          </div>

          {/* Articles Listing table */}
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-neutral-50 text-neutral-500 text-xs font-mono uppercase border-b border-neutral-200 select-none">
                  <tr>
                    <th className="p-4">Title / Category</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Views</th>
                    <th className="p-4">Published Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filtered.map(art => (
                    <tr key={art.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-wider text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                            {art.categoryId}
                          </span>
                          <p className="font-extrabold text-neutral-900 leading-snug line-clamp-1">{art.title}</p>
                          <span className="text-xs text-neutral-400 block font-mono">/slug: {art.slug}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-neutral-700">{art.authorName}</td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          art.status === "Published" ? "bg-green-100 text-green-800" :
                          art.status === "Draft" ? "bg-amber-100 text-amber-800" : "bg-neutral-200 text-neutral-800"
                        }`}>
                          {art.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-neutral-500">{art.views}</td>
                      <td className="p-4 text-xs font-mono text-neutral-500">
                        {new Date(art.publishDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          {deleteConfirmId !== art.id ? (
                            <>
                              <button
                                onClick={() => handleEdit(art)}
                                className="bg-neutral-100 hover:bg-neutral-200 p-2 rounded text-neutral-700 transition cursor-pointer"
                                title="Edit metadata"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(art.id)}
                                className="bg-red-50 hover:bg-red-100 p-2 rounded text-red-650 transition cursor-pointer"
                                title="Delete article"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-red-50 p-1 border border-red-200 rounded text-xs select-none">
                              <span className="text-[10px] font-bold text-red-800 px-1 font-mono">Delete?</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await onDeleteArticle(art.id);
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setDeleteConfirmId(null);
                                  }
                                }}
                                className="bg-red-700 hover:bg-red-800 text-white text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded transition cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded transition cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-neutral-400 italic bg-neutral-50 border-none">
                        No articles located on this sheet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Edit Or Create Panel */
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-lg p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-4 select-none">
            <h3 className="text-lg font-black tracking-tight text-neutral-900 uppercase">
              {editingArticle?.id ? "Update Press Record" : "Draft New Coverage"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingArticle(null);
                setAiMessage("");
              }}
              className="text-neutral-400 hover:text-neutral-600 text-xs uppercase tracking-widest font-mono cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Core details column */}
            <div className="lg:col-span-2 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="Historic agreement ratified on global targets..."
                  value={editingArticle?.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">News Subtitle / Caption</label>
                <input
                  type="text"
                  placeholder="Short, gripping hook for global readers..."
                  value={editingArticle?.subtitle || ""}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">URL Slug (Auto Generated)</label>
                  <input
                    type="text"
                    required
                    value={editingArticle?.slug || ""}
                    onChange={(e) => setEditingArticle(prev => ({ ...prev, slug: generateSlugFromTitle(e.target.value) }))}
                    className="w-full bg-neutral-50 text-neutral-500 border border-neutral-300 rounded p-2.5 text-xs font-mono focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Image URL Accent</label>
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={editingArticle?.featuredImage || ""}
                    onChange={(e) => setEditingArticle(prev => ({ ...prev, featuredImage: e.target.value }))}
                    className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs font-mono focus:outline-none focus:border-red-655"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Hook Summary Excerpt</label>
                <textarea
                  required
                  rows={2}
                  maxLength={250}
                  placeholder="Gives a fast, gripping highlight of what this dossier entails (max 250 characters)."
                  value={editingArticle?.excerpt || ""}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono">Core Article Journalism Content</label>
                  <span className="text-neutral-400 text-xs font-mono">Format: Double return paragraph divisions</span>
                </div>
                <textarea
                  required
                  rows={12}
                  placeholder="Write complete global journalism articles detailing events, quotes, and developments..."
                  value={editingArticle?.content || ""}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-white border border-neutral-300 rounded p-3 text-sm font-serif leading-relaxed focus:outline-none focus:border-red-655"
                />
              </div>
            </div>

            {/* Config metadata column */}
            <div className="space-y-5 bg-neutral-50 p-5 rounded-lg border border-neutral-200">
              <h4 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-200 pb-2 mb-3 select-none">
                SEO METADATA & CONTROLS
              </h4>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Main Discipline Category</label>
                <select
                  value={editingArticle?.categoryId || ""}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                >
                  {parentCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Sub Category Discipline (Optional)</label>
                <select
                  value={editingArticle?.subCategoryId || ""}
                  onChange={(e) => setEditingArticle(prev => ({ ...prev, subCategoryId: e.target.value || undefined }))}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                >
                  <option value="">None — Primary Parent Only</option>
                  {subCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Parent: {c.parentId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Release Status</label>
                  <select
                    value={editingArticle?.status || ""}
                    onChange={(e) => setEditingArticle(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs font-mono focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Publish Schedule Date</label>
                  <input
                    type="datetime-local"
                    value={editingArticle?.publishDate ? new Date(editingArticle.publishDate).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setEditingArticle(prev => ({ ...prev, publishDate: new Date(e.target.value).toISOString() }))}
                    className="w-full bg-white border border-neutral-300 rounded p-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Server-side Gemini AI recommendation section */}
              <div className="bg-red-950/5 p-4 rounded border border-red-900/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-red-800 font-bold text-xs uppercase tracking-wider font-sans select-none">
                    <Sparkles size={14} className="text-red-700" />
                    <span>Gemini AI Engine Advisories</span>
                  </div>
                  <button
                    type="button"
                    onClick={triggerGeminiSEO}
                    disabled={aiGenerating}
                    className="bg-red-700 hover:bg-red-800 text-white text-[10px] uppercase tracking-wider font-extrabold px-2 py-1.5 rounded transition cursor-pointer"
                  >
                    {aiGenerating ? "Retrieving Advice..." : "Optimize SEO"}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-sans select-none">
                  Triggers deep server-side reasoning analyzing content to automatically suggest search performance keywords.
                </p>

                {aiMessage && (
                  <p className="text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded">
                    {aiMessage}
                  </p>
                )}

                <div className="space-y-2.5 pt-2 border-t border-red-900/5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase font-mono">SEO Title</label>
                    <input
                      type="text"
                      placeholder="Title tag for indexes..."
                      value={editingArticle?.seoTitle || ""}
                      onChange={(e) => setEditingArticle(prev => ({ ...prev, seoTitle: e.target.value }))}
                      className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-sans focus:outline-none focus:border-red-655"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase font-mono">SEO Description</label>
                    <input
                      type="text"
                      placeholder="Brief meta descriptions snippet..."
                      value={editingArticle?.seoDescription || ""}
                      onChange={(e) => setEditingArticle(prev => ({ ...prev, seoDescription: e.target.value }))}
                      className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-sans focus:outline-none focus:border-red-655"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase font-mono">SEO Keywords</label>
                    <input
                      type="text"
                      placeholder="comma, separated, tags"
                      value={editingArticle?.seoKeywords || ""}
                      onChange={(e) => setEditingArticle(prev => ({ ...prev, seoKeywords: e.target.value }))}
                      className="w-full bg-white border border-neutral-300 rounded p-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons Submit */}
              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-sans text-xs font-extrabold uppercase tracking-widest py-3 rounded-md flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Save size={14} /> {saveLoading ? "Saving..." : "Save Dossier"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
