import React, { useState } from "react";
import { Category, CoverageZone } from "../types";
import { PlusCircle, Trash2, FolderGit2, AlertTriangle } from "lucide-react";
import ActiveSectionsMap from "./ActiveSectionsMap";

interface AdminCategoriesProps {
  categories: Category[];
  onAddCategory: (cat: Omit<Category, "id">) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  coverageZones: CoverageZone[];
  onAddZone: (zone: Omit<CoverageZone, "id" | "createdAt">) => Promise<void>;
  onDeleteZone: (id: string) => Promise<void>;
}

export default function AdminCategories({
  categories,
  onAddCategory,
  onDeleteCategory,
  coverageZones,
  onAddZone,
  onDeleteZone,
}: AdminCategoriesProps) {
  const [newCatName, setNewCatName] = useState("");
  const [sectionType, setSectionType] = useState<"parent" | "sub">("parent");
  const [parentSelection, setParentSelection] = useState("");
  const [quickAddNames, setQuickAddNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter parents to specify child links if appropriate
  const parentCategories = categories.filter(c => !c.parentId);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    if (sectionType === "sub" && !parentSelection) {
      alert("Please select a parent section for your sub-section.");
      return;
    }

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
        parentId: sectionType === "sub" ? parentSelection : undefined
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
    <div className="space-y-8" id="admin_categories_master_layout">
      {/* Grid listing & Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans text-neutral-800" id="admin_categories_panel">
        {/* Creation form */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 height-fit shadow-xs">
          <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-4 select-none font-bold">
            CREATE SECTION
          </h3>

          <div className="flex bg-neutral-100 p-1 rounded-md mb-5 border border-neutral-200/50">
            <button
              type="button"
              onClick={() => setSectionType("parent")}
              className={`flex-1 py-1.5 px-3 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                sectionType === "parent"
                  ? "bg-white text-neutral-900 border border-neutral-200/60 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Parent Section
            </button>
            <button
              type="button"
              onClick={() => setSectionType("sub")}
              className={`flex-1 py-1.5 px-3 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                sectionType === "sub"
                  ? "bg-white text-neutral-900 border border-neutral-200/60 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Sub-Section
            </button>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">
                {sectionType === "parent" ? "Parent Section Name" : "Sub-Section Name"}
              </label>
              <input
                type="text"
                required
                placeholder={sectionType === "parent" ? "e.g. Science, Sports, Arts..." : "e.g. AI & Robots, Astronomy..."}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-700"
              />
              <p className="text-[10px] text-neutral-400 select-none font-mono mt-1 leading-normal italic">
                {sectionType === "parent" 
                  ? "Creates a standalone primary category accessible directly in the homepage main header bar." 
                  : "Nests this section within an existing parent header category."}
              </p>
            </div>

            {sectionType === "sub" && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Parent Section</label>
                <select
                  required
                  value={parentSelection}
                  onChange={(e) => setParentSelection(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm font-sans focus:outline-none focus:border-red-700"
                >
                  <option value="">-- Select Parent Section --</option>
                  {parentCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-sans text-xs font-bold uppercase tracking-widest py-3 rounded flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
            >
              <PlusCircle size={14} /> 
              {saving 
                ? "Creating..." 
                : sectionType === "parent" 
                  ? "Add Parent Section" 
                  : "Add Sub-Section"}
            </button>
          </form>
        </div>

        {/* Grid listing */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 shadow-xs">
          <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-5 select-none font-bold">
            ACTIVE SECTIONS LIST
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
                        className="text-red-600 hover:bg-neutral-200 p-1.5 rounded transition cursor-pointer font-bold"
                        title="Delete Parent Section"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-red-50 p-2.5 rounded border border-red-200 text-xs select-none">
                        <span className="text-[10px] sm:text-xs font-bold text-red-900 font-mono flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-red-700 font-bold shrink-0 animate-bounce" />
                          Delete section & all its sub-sections?
                        </span>
                        <div className="flex gap-1.5 shrink-0 ml-auto sm:ml-0">
                          <button
                            onClick={async () => {
                              try {
                                // Find children and delete them first to prevent orphans
                                const childList = categories.filter(c => c.parentId === parent.id);
                                for (const child of childList) {
                                  await onDeleteCategory(child.id);
                                }
                                await onDeleteCategory(parent.id);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setDeleteConfirmId(null);
                              }
                            }}
                            className="bg-red-750 hover:bg-red-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded cursor-pointer transition shadow-xs"
                          >
                            Yes, Delete All
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[10px] uppercase font-bold px-2 py-1 rounded cursor-pointer transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct sub-categories lists */}
                  {children.length > 0 ? (
                    <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                      {children.map(child => (
                        <div key={child.id} className="flex justify-between items-center bg-white p-2 border border-neutral-200 rounded text-xs shadow-2xs">
                          <span className="font-bold text-neutral-700">{child.name}</span>
                          {deleteConfirmId !== child.id ? (
                            <button
                              onClick={() => setDeleteConfirmId(child.id)}
                              className="text-red-650 hover:bg-neutral-100 p-1 rounded transition cursor-pointer"
                              title="Delete sub-section"
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-red-100 p-0.5 rounded text-[10px] select-none">
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
                                className="bg-red-700 hover:bg-red-800 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded cursor-pointer animate-pulse"
                              >
                                Del
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[8px] uppercase font-black px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] italic text-neutral-400 pl-6 select-none font-mono pb-2">
                      No active sub-sections assigned.
                    </p>
                  )}

                  {/* Inline quick-add form for sub-sections of this parent */}
                  <div className="pl-6 pt-3 border-t border-dashed border-neutral-200 mt-2">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const val = quickAddNames[parent.id] || "";
                        if (!val.trim()) return;
                        try {
                          const slug = val
                            .toLowerCase()
                            .trim()
                            .replace(/[^\w\s-]/g, "")
                            .replace(/[\s_]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                          await onAddCategory({
                            name: val.trim(),
                            slug,
                            parentId: parent.id
                          });
                          setQuickAddNames(prev => ({ ...prev, [parent.id]: "" }));
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="flex gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder={`Quick add sub-section under ${parent.name}...`}
                        value={quickAddNames[parent.id] || ""}
                        onChange={(e) => setQuickAddNames(prev => ({ ...prev, [parent.id]: e.target.value }))}
                        className="bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-sans focus:outline-none focus:border-red-700 flex-1 placeholder-neutral-400"
                      />
                      <button
                        type="submit"
                        className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded transition cursor-pointer shrink-0"
                      >
                        Add Sub
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Active Reporting Geo Map Segment */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xs font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-5 select-none font-bold">
          GEOGRAPHIC REPORTING INTERACTIVE SECTIONS MAPS
        </h3>
        
        <ActiveSectionsMap
          zones={coverageZones}
          isAdmin={true}
          onAddZone={onAddZone}
          onDeleteZone={onDeleteZone}
        />
      </div>
    </div>
  );
}
