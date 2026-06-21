import React, { useState } from "react";
import { Article, Category } from "../types";
import { PlusCircle, Search, Edit2, Trash2, Save, FileText, Globe, Eye, Sparkles, AlertCircle } from "lucide-react";
import FcMediaSuite from "./FcMediaSuite";

const CATEGORY_IMAGE_PRESETS: Record<string, string[]> = {
  politics: [
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800", // Capitol building
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800", // Gavel courtroom
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800"  // Press room mic
  ],
  "us-politics": [
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800", // Flag white house
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800"
  ],
  "world-politics": [
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800", // World globes administration
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800"
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800", // Technology server motherboard
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800"  // Coding screen
  ],
  "ai-robots": [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800", // Cyber abstract visualization
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800"  // Robotic fingers
  ],
  gadgets: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800", // Smart gadget devices
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800"  // Premium smart watch
  ],
  business: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800", // Downtown Skyscrapers
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"  // Financial workspace
  ],
  markets: [
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800", // Exchange stock tracking board
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800"  // Financial metrics
  ],
  opinion: [
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800", // Vintage typewriter
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800"  // Writing tablet desk
  ],
  style: [
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800", // Garments boutique
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800"  // High street luxury
  ]
};

const KEYWORD_IMAGE_PRESETS: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ["climate", "carbon", "green", "emission", "environment", "global warming", "earth", "summit", "biodiversity", "renewable", "solar", "wind", "weather", "warming"],
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800"
  },
  {
    keywords: ["space", "nasa", "mars", "moon", "galaxy", "rocket", "orbit", "astronomy", "satellite", "spacex", "telescope"],
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"
  },
  {
    keywords: ["tesla", "electric vehicle", "car", "ev", "automotive", "self-driving", "autonomous"],
    url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800"
  },
  {
    keywords: ["crypto", "bitcoin", "ethereum", "blockchain", "token", "coinbase", "solana"],
    url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800"
  },
  {
    keywords: ["cybersecurity", "hack", "leak", "security", "encryption", "databreach", "virus", "phishing", "ransomware", "firewall"],
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
  },
  {
    keywords: ["health", "covid", "virus", "medical", "hospital", "doctor", "cure", "fda", "syringes", "vaccines", "mental", "brain"],
    url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800"
  },
  {
    keywords: ["sports", "olympics", "cup", "trophy", "championship", "stadium", "athlete", "f1", "racing", "basketball", "soccer"],
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800"
  }
];

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const getAutoCaughtImage = (title: string, categoryId: string): string => {
  const normTitle = title.toLowerCase();
  
  // 1. Keyword search in title
  for (const item of KEYWORD_IMAGE_PRESETS) {
    if (item.keywords.some(k => normTitle.includes(k))) {
      return item.url;
    }
  }

  // 2. Category level fallback
  const presets = CATEGORY_IMAGE_PRESETS[categoryId] || CATEGORY_IMAGE_PRESETS["politics"];
  const index = hashString(title || "news") % presets.length;
  return presets[index] || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800";
};

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

  // Auto Image catching state
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState("");
  const [imageMode, setImageMode] = useState<"ai" | "url">("ai");

  // Filter categories
  const parentCategories = categories.filter(c => !c.parentId);
  const subCategories = categories.filter(c => c.parentId);

  const startCreateNew = () => {
    setImagePrompt("");
    setSuggestedKeywords("");
    const newId = "art_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    setEditingArticle({
      id: newId,
      title: "",
      subtitle: "",
      excerpt: "",
      content: "",
      slug: "",
      featuredImage: "", // Left blank to activate intelligent automatic image catching
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
    setImagePrompt("");
    setSuggestedKeywords("");
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

  const triggerGeminiImage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || imagePrompt || editingArticle?.title || "").trim();
    if (!promptToSend) {
      alert("Please provide an image prompt or write an article title first so Gemini can analyze!");
      return;
    }
    setImageGenerating(true);
    try {
      const response = await fetch("/api/gemini/suggest-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          prompt: promptToSend,
          title: editingArticle?.title || "",
          categoryId: editingArticle?.categoryId || ""
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEditingArticle(prev => ({
          ...prev,
          featuredImage: data.url
        }));
        if (data.keywords) {
          setSuggestedKeywords(data.keywords);
        }
        // If they provided a custom search prompt, update that field's model too
        if (customPrompt) {
          setImagePrompt(customPrompt);
        }
      } else {
        alert("Intelligent Image Catch failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("AI communication timed out while matching image accents.");
    } finally {
      setImageGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title || !editingArticle.content || !editingArticle.categoryId) return;
    
    setSaveLoading(true);
    try {
      const existingArticle = articles.find(a => a.id === editingArticle.id);
      const finalFeaturedImage = editingArticle.featuredImage?.trim() || 
        existingArticle?.featuredImage?.trim() ||
        getAutoCaughtImage(editingArticle.title || "", editingArticle.categoryId || "");
      
      const payload: Partial<Article> = {
        ...editingArticle,
        featuredImage: finalFeaturedImage,
        featuredImageBackup: editingArticle.featuredImageBackup || existingArticle?.featuredImageBackup || "",
        featuredImage800: editingArticle.featuredImage800 || existingArticle?.featuredImage800 || "",
        featuredImage400: editingArticle.featuredImage400 || existingArticle?.featuredImage400 || "",
      };

      await onSaveArticle(payload);
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
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Author Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={editingArticle?.authorName || ""}
                    onChange={(e) => setEditingArticle(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
                  />
                </div>
              </div>

              {/* FC style corporate Media Library Management core */}
              <div className="pt-2">
                <FcMediaSuite 
                  article={editingArticle || {}} 
                  adminToken={adminToken}
                  onChangeArticle={(updatedFields) => {
                    setEditingArticle(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        ...updatedFields
                      };
                    });
                  }}
                />
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
