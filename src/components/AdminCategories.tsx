import React, { useState } from "react";
import { Category } from "../types";
import { PlusCircle, Trash2, FolderGit2, AlertTriangle } from "lucide-react";

interface AdminCategoriesProps {
  categories: Category[];
  onAddCategory: (cat: Omit<Category, "id">) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export default function AdminCategories({
  categories,
  onAddCategory,
  onDeleteCategory,
}: AdminCategoriesProps) {
  const [newCatName, setNewCatName] = useState("");
  const [parentSelection, setParentSelection] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter parents to specify child links if appropriate
  const parentCategories = categories.filter(c => !c.parentId);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSaving(true);
    try {
      const slug = newCatName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");

      await onAddCategory({
        name: newCatName.trim(),
        slug,
        parentId: parentSelection || undefined
      });

      setNewCatName("");
      setParentSelection("");
    } catch (e) {
      console.error(e);
      alert("Error building new discipline sheet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans text-neutral-800" id="admin_categories_panel">
      {/* Creation form */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 height-fit shadow-xs">
        <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-5 select-none font-bold">
          CREATE CATEGORY
        </h3>

        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Discipline Name</label>
            <input
              type="text"
              required
              placeholder="e.g. World Affairs, Finance..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Parent Level (Optional)</label>
            <select
              value={parentSelection}
              onChange={(e) => setParentSelection(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-655"
            >
              <option value="">None (Acts as Primary Header Category)</option>
              {parentCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-sans text-xs font-bold uppercase tracking-widest py-3 rounded flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
          >
            <PlusCircle size={14} /> {saving ? "Creating Category..." : "Add Category Item"}
          </button>
        </form>
      </div>

      {/* Grid listing */}
      <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 shadow-xs">
        <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-5 select-none font-bold">
          ACTIVE SECTIONS MAPS
        </h3>

        <div className="space-y-5">
          {parentCategories.map(parent => {
            const children = categories.filter(c => c.parentId === parent.id);
            return (
              <div key={parent.id} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-3">
                <div className="flex justify-between items-center bg-neutral-100/50 p-2.5 rounded border border-neutral-200/50">
                  <div className="flex items-center gap-2 font-black text-neutral-900 font-sans tracking-tight">
                    <FolderGit2 size={16} className="text-red-700" />
                    <span>{parent.name}</span>
                    <span className="text-[10px] font-mono text-neutral-400 font-normal">(/slug: {parent.slug})</span>
                  </div>
                  {deleteConfirmId !== parent.id ? (
                    <button
                      onClick={() => setDeleteConfirmId(parent.id)}
                      className="text-red-650 hover:bg-neutral-200 p-1.5 rounded transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-red-100 p-1 rounded border border-red-200 text-xs select-none">
                      <span className="text-[10px] font-bold text-red-900 font-mono">Orphan kids?</span>
                      <button
                        onClick={async () => {
                          try {
                            await onDeleteCategory(parent.id);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setDeleteConfirmId(null);
                          }
                        }}
                        className="bg-red-700 hover:bg-red-800 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded cursor-pointer"
                      >
                        Sure
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[9px] uppercase font-black px-2 py-0.5 rounded cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct sub-categories lists */}
                {children.length > 0 ? (
                  <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {children.map(child => (
                      <div key={child.id} className="flex justify-between items-center bg-white p-2 border border-neutral-200 rounded text-xs">
                        <span className="font-bold text-neutral-700">{child.name}</span>
                        {deleteConfirmId !== child.id ? (
                          <button
                            onClick={() => setDeleteConfirmId(child.id)}
                            className="text-red-650 hover:bg-neutral-100 p-1 rounded transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-red-100 p-0.5 rounded text-xs select-none">
                            <button
                              onClick={async () => {
                                try {
                                  await onDeleteCategory(child.id);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setDeleteConfirmId(null);
                                }
                              }}
                              className="bg-red-700 hover:bg-red-800 text-white text-[8px] uppercase font-black px-1 rounded cursor-pointer"
                            >
                              Del
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[8px] uppercase font-black px-1 rounded cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-neutral-400 pl-6 select-none font-mono">
                    No active sub-disciplines assigned.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
