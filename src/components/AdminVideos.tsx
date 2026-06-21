import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { VideoItem } from "../types";
import { 
  Video, 
  Trash2, 
  Upload, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Search,
  RefreshCw,
  X,
  FileVideo,
  Image as ImageIcon,
  Edit2,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

interface AdminVideosProps {
  adminToken: string;
  adminSession?: { token: string; email: string; name: string; role: string; ip: string };
}

const VIDEO_CATEGORIES = [
  { id: "politics", name: "Politics & Governance" },
  { id: "world", name: "World Updates" },
  { id: "tech", name: "Technology & Cyber" },
  { id: "finance", name: "Finance & Economy" },
  { id: "sports", name: "Sports Arena" },
  { id: "climate", name: "Climate & Science" },
  { id: "general", name: "General Broadcast" }
];

export default function AdminVideos({ adminToken, adminSession }: AdminVideosProps) {
  // Main collection video states
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Standard simple YouTube-style Upload Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [author, setAuthor] = useState(adminSession?.email || "admin@fastcoverage.news");

  // Local file selection and progress trackers
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
  const [uploadEta, setUploadEta] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Thumbnail optional states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Local operation indicators 
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Drag and drop helper state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Edit Video States
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editStatus, setEditStatus] = useState<"Draft" | "Published">("Published");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");
  const [editVideoProgress, setEditVideoProgress] = useState(0);
  const [editVideoUploading, setEditVideoUploading] = useState(false);
  const [editThumbProgress, setEditThumbProgress] = useState(0);
  const [editThumbUploading, setEditThumbUploading] = useState(false);

  // Synchronize with database: we load from videoBulletins with a legacy "videos" fallback
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "videoBulletins"), 
      (snap) => {
        const items: VideoItem[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            url: data.videoUrl || data.url || "",
            videoUrl: data.videoUrl || "",
            thumbnailUrl: data.thumbnailUrl || "",
            category: data.category || "general",
            duration: data.duration || "0:00",
            createdAt: data.createdAt || new Date().toISOString(),
            publishedAt: data.publishedAt || data.createdAt || new Date().toISOString(),
            author: data.author || "admin@fastcoverage.news",
            status: data.status || "Published",
            published: data.published !== false,
            views: data.views || 0,
            isLive: data.isLive || false,
            isScheduled: data.isScheduled || false,
            scheduledTime: data.scheduledTime || ""
          } as VideoItem);
        });

        items.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt).getTime();
          const dateB = new Date(b.publishedAt || a.createdAt).getTime();
          return dateB - dateA;
        });

        setVideos(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore subscription failed, trying legacy videos fallback:", error);
        const unsubscribeLegacy = onSnapshot(collection(db, "videos"), (legacySnap) => {
          const items: VideoItem[] = [];
          legacySnap.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              url: data.url || "",
              videoUrl: data.url || "",
              thumbnailUrl: data.thumbnailUrl || "",
              category: "general",
              createdAt: data.createdAt || new Date().toISOString(),
              publishedAt: data.createdAt || new Date().toISOString(),
              views: data.views || 0,
              duration: "0:00"
            } as VideoItem);
          });
          setVideos(items);
          setLoading(false);
        });
        return () => unsubscribeLegacy();
      }
    );

    return () => unsubscribe();
  }, []);

  // Update staff credentials when loaded
  useEffect(() => {
    if (adminSession?.email) {
      setAuthor(adminSession.email);
    }
  }, [adminSession]);

  // Handle Drag / Drop and File selecting triggers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      console.log("File selected: " + file.name);
      setSelectedFile(file);
      startVideoUpload(file);
    } else {
      setErrorMsg("Please select a valid HD video file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected: " + file.name);
    setSelectedFile(file);
    startVideoUpload(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Thumbnail selected: " + file.name);
    setThumbnailFile(file);
    startThumbnailUpload(file);
  };

  const triggerThumbnailSelect = () => {
    thumbnailInputRef.current?.click();
  };

  // IMMEDIATE DIRECT STORAGE UPLOADING & PROGRESS INDICATOR
  const startVideoUpload = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setVideoUrl("");
    setUploadProgress(0);
    setUploadSpeed(null);
    setUploadEta(null);
    setUploading(true);

    console.log("Upload started");
    const startTime = Date.now();
    const storageRef = ref(storage, `videoBulletins/videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const bytesTransferred = snapshot.bytesTransferred;
        const totalBytes = snapshot.totalBytes;
        const progress = totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0;
        
        setUploadProgress(progress);
        console.log(`Upload progress: ${progress}%`);

        const now = Date.now();
        const elapsedSeconds = (now - startTime) / 1000;
        if (elapsedSeconds > 0.1) {
          const speedBps = bytesTransferred / elapsedSeconds;
          const speedMBs = speedBps / (1024 * 1024);
          setUploadSpeed(speedMBs.toFixed(2) + " MB/s");
          if (speedBps > 0) {
            const eta = Math.max(0, Math.round((totalBytes - bytesTransferred) / speedBps));
            setUploadEta(eta);
          }
        }
      },
      (error) => {
        console.error("Direct Video Storage upload failed:", error);
        setErrorMsg("Direct Video upload failed: " + error.message);
        setUploading(false);
      },
      async () => {
        try {
          console.log("Upload completed");
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Download URL created: " + downloadUrl);
          setVideoUrl(downloadUrl);
          setUploading(false);
          setSuccessMsg("✓ HD Video successfully uploaded! Fill in Title and click Publish.");
        } catch (err: any) {
          console.error("Failed to fetch Video download URL:", err);
          setErrorMsg("Failed to resolve dynamic URL: " + err.message);
          setUploading(false);
        }
      }
    );
  };

  // Optional Custom Thumbnail Immediate Upload Action
  const startThumbnailUpload = (file: File) => {
    setThumbnailUrl("");
    setThumbnailProgress(0);
    setThumbnailUploading(true);

    const storageRef = ref(storage, `videoBulletins/thumbnails/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        setThumbnailProgress(progress);
      },
      (error) => {
        console.error("Thumbnail Storage upload failed:", error);
        setErrorMsg("Thumbnail upload failed: " + error.message);
        setThumbnailUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setThumbnailUrl(downloadUrl);
          setThumbnailUploading(false);
        } catch (err: any) {
          console.error("Failed to resolve Thumbnail URL:", err);
          setThumbnailUploading(false);
        }
      }
    );
  };

  // Submit flow to register completely with Firestore db
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Validation Error: Please enter a descriptive Video Title.");
      return;
    }
    if (!videoUrl) {
      setErrorMsg("Validation Error: No broadcast video path uploaded yet. Select a video first.");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const timestampISO = new Date().toISOString();
      const defaultThumb = "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=640";

      const docData = {
        title: title.trim(),
        description: description.trim(),
        category,
        url: videoUrl,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl || defaultThumb,
        duration: "0:00",
        createdAt: timestampISO,
        updatedAt: timestampISO,
        publishedAt: timestampISO,
        author: author || "admin@fastcoverage.news",
        status: "Published",
        published: true,
        featured: false,
        views: 0,
        isLive: false,
        isScheduled: false,
        scheduledTime: ""
      };

      // Add clean item to primary collection
      const docRef = await addDoc(collection(db, "videoBulletins"), docData);
      console.log("Firestore saved");

      // Set item to legacy videos mirroring system
      await setDoc(doc(db, "videos", docRef.id), { ...docData, id: docRef.id });
      console.log("Publish completed");

      setSuccessMsg(`✓ Broadcast Published Successfully: "${title.trim()}" is now live.`);

      // Reset standard fields
      setTitle("");
      setDescription("");
      setCategory("general");
      setSelectedFile(null);
      setThumbnailFile(null);
      setVideoUrl("");
      setThumbnailUrl("");
      setUploadProgress(0);
      setThumbnailProgress(0);
    } catch (err: any) {
      console.error("Publishing video bulletin failed:", err);
      setErrorMsg("Publish failed: " + (err.message || String(err)));
    } finally {
      setPublishing(false);
    }
  };

  // Edit form file replacement triggers
  const handleEditVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditVideoProgress(0);
    setEditVideoUploading(true);

    const storageRef = ref(storage, `videoBulletins/videos/edit_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        setEditVideoProgress(progress);
      },
      (error) => {
        console.error("Edit video upload failed:", error);
        setErrorMsg("Failed uploading replacement video: " + error.message);
        setEditVideoUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setEditVideoUrl(downloadUrl);
          setEditVideoUploading(false);
        } catch (err: any) {
          console.error("Failed obtaining output URL:", err);
          setEditVideoUploading(false);
        }
      }
    );
  };

  const handleEditThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditThumbProgress(0);
    setEditThumbUploading(true);

    const storageRef = ref(storage, `videoBulletins/thumbnails/edit_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        setEditThumbProgress(progress);
      },
      (error) => {
        console.error("Edit thumbnail upload failed:", error);
        setEditThumbUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setEditThumbnailUrl(downloadUrl);
          setEditThumbUploading(false);
        } catch (err: any) {
          console.error("Failed obtaining target thumbnail URL:", err);
          setEditThumbUploading(false);
        }
      }
    );
  };

  // Apply edits to existing video bulletin securely
  const handleSaveEditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    if (!editTitle.trim()) {
      setErrorMsg("Please provide a title.");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);

    try {
      const timestampISO = new Date().toISOString();
      const updatedData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        status: editStatus,
        published: editStatus === "Published",
        url: editVideoUrl || editingVideo.url,
        videoUrl: editVideoUrl || editingVideo.videoUrl || editingVideo.url,
        thumbnailUrl: editThumbnailUrl || editingVideo.thumbnailUrl,
        updatedAt: timestampISO
      };

      await updateDoc(doc(db, "videoBulletins", editingVideo.id), updatedData);
      await setDoc(doc(db, "videos", editingVideo.id), updatedData, { merge: true });

      setSuccessMsg(`✓ Video updated: "${editTitle}" has been saved.`);
      setEditingVideo(null);
    } catch (err: any) {
      console.error("Failed saving video document edits:", err);
      setErrorMsg("Failed updating broadcast payload: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Toggle status mode between Published and Draft instantly
  const handleTogglePublish = async (vid: VideoItem) => {
    try {
      const newStatus = vid.status === "Published" ? "Draft" : "Published";
      const updatedFields = {
        status: newStatus,
        published: newStatus === "Published",
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, "videoBulletins", vid.id), updatedFields);
      await setDoc(doc(db, "videos", vid.id), updatedFields, { merge: true });
    } catch (err: any) {
      console.error("Failed toggling published state:", err);
      setErrorMsg("Permission denied or database connection offline.");
    }
  };

  // Erase video records and associated storage files permanently
  const handleDeleteConfirm = async (vid: VideoItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Delete from Firestore databases
      await deleteDoc(doc(db, "videoBulletins", vid.id));
      try {
        await deleteDoc(doc(db, "videos", vid.id));
      } catch (e) {
        // Safe skip legacy record delete if already cleared
      }

      // 2. Perform safe cleanup of files inside Firebase Storage
      const mainPath = vid.videoUrl || vid.url;
      if (mainPath && mainPath.includes("firebasestorage.googleapis.com")) {
        try {
          const pathDecoded = decodeURIComponent(mainPath.split("/o/")[1]?.split("?")[0] || "");
          if (pathDecoded) {
            await deleteObject(ref(storage, pathDecoded));
          }
        } catch (stErr) {
          console.warn("Storage video cleanup skipped or missing:", stErr);
        }
      }

      const thumbPath = vid.thumbnailUrl;
      if (thumbPath && thumbPath.includes("firebasestorage.googleapis.com")) {
        try {
          const thumbDecoded = decodeURIComponent(thumbPath.split("/o/")[1]?.split("?")[0] || "");
          if (thumbDecoded) {
            await deleteObject(ref(storage, thumbDecoded));
          }
        } catch (tErr) {
          console.warn("Storage thumbnail cleanup skipped or missing:", tErr);
        }
      }

      setSuccessMsg(`✓ Broadcast record and its files have been permanently erased.`);
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Permanent erase operation failed: ", err);
      setErrorMsg("Error: Failed to clear video or associated storage files.");
    }
  };

  // Filter video collection dynamically
  const filteredVideos = videos.filter(vid => {
    const matchesQuery = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vid.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vid.author && vid.author.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (selectedCategoryFilter === "all") {
      return matchesQuery;
    }
    return matchesQuery && vid.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6 container mx-auto max-w-7xl animate-fadeIn p-4 md:p-6" id="admin_videos_root">
      {/* Title block with human labels */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-neutral-150 pb-4 select-none">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Video className="text-red-600" size={20} />
            <span>Video Broadcast Controller</span>
          </h2>
          <p className="text-xs text-neutral-510 font-medium">
            Manage breaking news video bulletins, storage items and public streaming feeds.
          </p>
        </div>
      </div>

      {/* Interactive visual alert system */}
      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r flex items-start gap-2.5 shadow-sm"
        >
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-red-800 font-medium leading-relaxed">{errorMsg}</div>
        </motion.div>
      )}

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-green-50 border-l-4 border-green-500 p-3.5 rounded-r flex items-start gap-2.5 shadow-sm"
        >
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-green-800 font-medium leading-relaxed">{successMsg}</div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Simple YouTube-style upload form */}
        <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
          
          {editingVideo ? (
            // Edit Video Panel
            <form onSubmit={handleSaveEditsSubmit} className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-2.5 mb-2 select-none">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Edit2 size={14} className="text-red-600" />
                  <span>Edit Video Broadcast</span>
                </h3>
                <button 
                  type="button" 
                  onClick={() => setEditingVideo(null)} 
                  className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Video Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:border-red-400 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:border-red-400 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Category desk</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none cursor-pointer focus:bg-white"
                  >
                    {VIDEO_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Publish Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none cursor-pointer focus:bg-white"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft Mode</option>
                  </select>
                </div>
              </div>

              {/* Replace Video Optionally */}
              <div className="border border-neutral-100 p-3 rounded bg-neutral-50 space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Replace Video File (Optional)</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleEditVideoFileChange}
                  disabled={editVideoUploading}
                  className="text-xs text-neutral-600 block w-full file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-200 file:text-neutral-700 hover:file:bg-neutral-300 file:cursor-pointer"
                />
                {editVideoUploading && (
                  <div className="space-y-1 pt-1.5 progress-container">
                    <div className="flex justify-between text-[9px] font-semibold text-neutral-500">
                      <span>Uploading Replacement Video...</span>
                      <span>{editVideoProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${editVideoProgress}%` }} />
                    </div>
                  </div>
                )}
                {editVideoUrl && <p className="text-[9px] text-green-600 font-bold">✓ Replacement video successfully cached.</p>}
              </div>

              {/* Replace Thumbnail Optionally */}
              <div className="border border-neutral-100 p-3 rounded bg-neutral-50 space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Replace Cover Image (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditThumbnailChange}
                  disabled={editThumbUploading}
                  className="text-xs text-neutral-600 block w-full file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-200 file:text-neutral-700 hover:file:bg-neutral-300 file:cursor-pointer"
                />
                {editThumbUploading && (
                  <div className="space-y-1 pt-1.5 progress-container">
                    <div className="flex justify-between text-[9px] font-semibold text-neutral-500">
                      <span>Uploading Thumbnail...</span>
                      <span>{editThumbProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${editThumbProgress}%` }} />
                    </div>
                  </div>
                )}
                {editThumbnailUrl && <p className="text-[9px] text-green-600 font-bold">✓ Replacement cover image successfully cached.</p>}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={publishing || editVideoUploading || editThumbUploading}
                  className="flex-1 py-2 px-4 rounded text-xs font-bold bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-40"
                >
                  {publishing ? "Processing..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="py-2 px-3 rounded text-xs font-medium bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            // YouTube-style Video Upload Form
            <form onSubmit={handlePublishSubmit} className="space-y-4 animate-fadeIn">
              <div className="border-b border-neutral-150 pb-2 select-none">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">YouTube-style Upload Form</h3>
              </div>

              {/* Select Video Input Box (Drag and Drop is fully active) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Select Video File *</label>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer select-none ${
                    dragActive 
                      ? "border-red-500 bg-red-50/20" 
                      : selectedFile 
                        ? "border-green-400 bg-green-50/10" 
                        : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-1.5">
                      <FileVideo className="mx-auto text-green-500" size={24} />
                      <p className="text-xs font-semibold text-neutral-800 break-all">{selectedFile.name}</p>
                      <p className="text-[9px] text-neutral-450 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      <span className="inline-block text-[9px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded mt-1.5 hover:bg-neutral-200 cursor-pointer">
                        Change File
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-neutral-450">
                      <Upload className="mx-auto text-neutral-400 mb-0.5" size={20} />
                      <p className="text-xs font-bold text-neutral-700">Drag & Drop HD Video, or Browse</p>
                      <p className="text-[9px] font-medium text-neutral-400 font-mono">Any standard HD video clip</p>
                    </div>
                  )}
                </div>

                {/* Instant upload progress block */}
                {uploading && (
                  <div className="bg-neutral-50 p-2.5 rounded border border-neutral-150 space-y-1.5 mt-2 animate-fadeIn font-mono">
                    <div className="flex justify-between items-center text-[10px] font-bold text-neutral-600">
                      <span className="flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin text-red-600" />
                        <span>Uploading directly...</span>
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-neutral-500 font-bold font-sans">
                      {uploadSpeed && <span className="text-red-600 font-bold">{uploadSpeed}</span>}
                      {uploadEta !== null && <span>ETA: {uploadEta}s</span>}
                    </div>
                  </div>
                )}

                {videoUrl && !uploading && (
                  <div className="bg-green-50 text-green-700 text-[10px] font-bold p-2 rounded border border-green-150 mt-1.5 flex items-center gap-1 animate-fadeIn">
                    <CheckCircle size={12} className="shrink-0" />
                    <span>Video file is loaded and ready.</span>
                  </div>
                )}
              </div>

              {/* Video Details fields */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize the broadcast title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:border-red-400 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Description</label>
                <textarea
                  rows={3}
                  placeholder="Details of the reporting incident, transcripts, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:border-red-400 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Category desk</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none cursor-pointer focus:bg-white font-medium"
                  >
                    {VIDEO_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Author Credit</label>
                  <input
                    type="text"
                    disabled
                    value={author}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded p-2 text-xs cursor-not-allowed text-neutral-450 font-medium"
                  />
                </div>
              </div>

              {/* Cover Image Optional Upload */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Thumbnail Upload (Optional)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerThumbnailSelect}
                    disabled={thumbnailUploading}
                    className="py-1.5 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 rounded text-xs font-semibold text-neutral-600 cursor-pointer flex items-center gap-1 select-none disabled:opacity-45"
                  >
                    <ImageIcon size={12} className="text-red-600" />
                    <span>Upload Thumbnail</span>
                  </button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    disabled={thumbnailUploading}
                    className="hidden"
                  />
                  {thumbnailUploading && (
                    <div className="text-[10px] text-neutral-500 font-bold flex items-center gap-1 font-mono">
                      <RefreshCw size={10} className="animate-spin text-red-600" />
                      <span>{thumbnailProgress}%</span>
                    </div>
                  )}
                  {thumbnailUrl && !thumbnailUploading && (
                    <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                      <CheckCircle size={10} />
                      <span>Ready</span>
                    </div>
                  )}
                </div>

                {thumbnailUrl && (
                  <div className="aspect-video w-32 border border-neutral-200 rounded overflow-hidden mt-1 bg-neutral-50 shadow-xs">
                    <img src={thumbnailUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Publish Action Button */}
              <div className="pt-2 select-none">
                <button
                  type="submit"
                  disabled={publishing || uploading || thumbnailUploading}
                  className={`w-full py-2.5 px-4 rounded text-xs tracking-wider uppercase font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                    publishing || uploading || thumbnailUploading
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                      : "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg active:scale-[0.985]"
                  }`}
                >
                  {publishing ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Publishing Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={12} />
                      <span>Publish Video Broadcast</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

        {/* COLUMN 2 & 3: Uploaded Video Feeds */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-5 shadow-sm space-y-4">
          
          <div className="border-b border-neutral-150 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-2">
              <Video size={14} className="text-red-500" />
              <span>All Uploaded Videos ({videos.length})</span>
            </h3>

            {/* Plain Search Inputs */}
            <div className="flex gap-2 items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 text-xs rounded py-1 px-2.5 pl-7 focus:outline-none focus:bg-white font-medium"
                />
                <Search size={11} className="absolute left-2.5 top-2 text-neutral-400" />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-xs rounded py-1 px-2 cursor-pointer focus:outline-none text-neutral-600 font-semibold"
              >
                <option value="all">All Category Desks</option>
                {VIDEO_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse flex flex-col items-center justify-center gap-2 text-neutral-450 text-xs font-mono">
              <RefreshCw className="animate-spin text-neutral-400" size={24} />
              <span>Loading video broadcast catalogs...</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-neutral-150 rounded bg-neutral-50/20 select-none flex flex-col items-center justify-center gap-1.5 text-neutral-400">
              <Video size={32} className="text-neutral-200 mb-1" />
              <p className="text-xs font-semibold text-neutral-700">No news broadcasts listed.</p>
            </div>
          ) : (
            // Grid of videos
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVideos.map((vid) => {
                const categoryObj = VIDEO_CATEGORIES.find(c => c.id === vid.category);
                
                return (
                  <div 
                    key={vid.id} 
                    className={`border border-neutral-200 rounded p-3 flex gap-3 hover:shadow-md transition-all ${
                      vid.status === "Draft" ? "bg-amber-50/10 border-amber-200/40" : "bg-white"
                    }`}
                  >
                    {/* Thumbnail preview inside simple card */}
                    <div className="aspect-video w-24 shrink-0 rounded overflow-hidden bg-neutral-100 border border-neutral-200/60 relative">
                      <img 
                        src={vid.thumbnailUrl || "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=200"} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=200";
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 rounded font-mono font-black select-none">
                        {vid.duration || "0:00"}
                      </span>
                    </div>

                    {/* Metadata summary */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 py-0.5 px-1.5 rounded-sm">
                            {categoryObj?.name || "General Desk"}
                          </span>
                          {vid.status === "Draft" && (
                            <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-50 py-0.5 px-1.5 rounded-sm">
                              Draft
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-neutral-800 tracking-tight mt-1 line-clamp-1 leading-normal" title={vid.title}>
                          {vid.title}
                        </h4>
                        
                        <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 leading-normal">
                          {vid.description || "No description provided."}
                        </p>
                      </div>

                      {/* Video controllers and quick actions */}
                      <div className="flex justify-between items-center gap-2 pt-2 border-t border-neutral-100/60 mt-2">
                        <span className="text-[9px] font-medium text-neutral-400 truncate max-w-[120px]">
                          By: {vid.author || "Admin"}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {deleteConfirmId === vid.id ? (
                            <div className="flex items-center gap-1 animate-fadeIn">
                              <span className="text-[9px] font-bold text-red-600">Erase?</span>
                              <button 
                                onClick={() => handleDeleteConfirm(vid)}
                                className="text-[8.5px] font-black uppercase text-red-600 hover:bg-red-50 py-0.5 px-1 rounded border border-red-200 cursor-pointer"
                              >
                                Yes
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[8.5px] font-bold text-neutral-500 hover:bg-neutral-50 py-0.5 px-1 rounded border border-neutral-200 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingVideo(vid);
                                  setEditTitle(vid.title);
                                  setEditDescription(vid.description);
                                  setEditCategory(vid.category || "general");
                                  setEditStatus(vid.status || "Published");
                                  setEditVideoUrl("");
                                  setEditThumbnailUrl("");
                                }}
                                className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 cursor-pointer"
                                title="Edit properties"
                              >
                                <Edit2 size={12} />
                              </button>
                              
                              <button
                                onClick={() => handleTogglePublish(vid)}
                                className={`text-[9.5px] font-extrabold hover:underline cursor-pointer ${
                                  vid.status === "Published" ? "text-amber-600" : "text-green-600"
                                }`}
                              >
                                {vid.status === "Published" ? "Draft" : "Publish"}
                              </button>

                              <button
                                onClick={() => setDeleteConfirmId(vid.id)}
                                className="p-1 hover:bg-red-50 hover:text-red-700 rounded text-neutral-400 cursor-pointer"
                                title="Erase completely"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
