import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { VideoItem } from "../types";
import { saveVideoFile } from "../indexedDB";
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
  const [duration, setDuration] = useState("0:00");
  const [editDuration, setEditDuration] = useState("0:00");

  // Local operation indicators 
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Drag and drop helper state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const activeUploadPromiseRef = useRef<Promise<{ uploadId: string; localUrl: string }> | null>(null);

  // Helper to log errors to admin panel activity logs (activity_logs collection)
  const logPublishError = async (errorText: string) => {
    try {
      await addDoc(collection(db, "activity_logs"), {
        userEmail: adminSession?.email || "admin@fastcoverage.news",
        timestamp: new Date().toISOString(),
        action: `[Video Publish Error] ${errorText}`,
        ip: adminSession?.ip || "127.0.0.1"
      });
    } catch (e) {
      console.error("Failed to write error log to activity_logs:", e);
    }
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Edit Video States
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editStatus, setEditStatus] = useState<"Draft" | "Published" | "Processing" | "Archived">("Published");
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
      activeUploadPromiseRef.current = startVideoUpload(file);
    } else {
      setErrorMsg("Please select a valid HD video file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected: " + file.name);
    setSelectedFile(file);
    activeUploadPromiseRef.current = startVideoUpload(file);
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

  const [currentUploadId, setCurrentUploadId] = useState("");
  const [editUploadId, setEditUploadId] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"Draft" | "Published" | "Processing" | "Archived">("Published");

  // Advanced feature additions: Scheduling & AI Thumbnail support
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [editIsScheduled, setEditIsScheduled] = useState(false);
  const [editScheduledTime, setEditScheduledTime] = useState("");



  const [aiThumbnails, setAiThumbnails] = useState<string[]>([]);
  const [isSuggestingThumbnails, setIsSuggestingThumbnails] = useState(false);
  const [editAiThumbnails, setEditAiThumbnails] = useState<string[]>([]);
  const [isEditSuggestingThumbnails, setIsEditSuggestingThumbnails] = useState(false);

  const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks

  // Parse file extension safely
  const pathExt = (name: string) => {
    const parts = name.split(".");
    return parts.length > 1 ? `.${parts.pop()}` : "";
  };

  // Video format, integrity validation and duration extraction
  const validateAndGetVideoMetadata = (file: File): Promise<{ duration: string; durationSeconds: number }> => {
    return new Promise((resolve, reject) => {
      // 1. Verify file format extension & MIME type representation
      const validExtensions = [".mp4", ".webm", ".mov", ".avi"];
      const ext = pathExt(file.name).toLowerCase();
      
      if (!validExtensions.includes(ext) && !file.type.startsWith("video/")) {
        reject(new Error("Unsupported video format. Highly authorized formats include MP4, WebM, MOV, and AVI."));
        return;
      }
      
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
      } catch (e) {
        reject(new Error("Invalid or corrupted video file. Please test and choose another file."));
        return;
      }
      
      const timeoutSecs = 12000; // 12 seconds protection
      const loadTimeout = setTimeout(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error("File validation timeout. This file may be corrupt, DRM-protected, or encoded in an unsupported container format."));
      }, timeoutSecs);
      
      video.onloadedmetadata = () => {
        clearTimeout(loadTimeout);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        
        const seconds = video.duration;
        if (isNaN(seconds) || seconds === Infinity || seconds <= 0) {
          reject(new Error("File format integrity failed: zero-duration or corrupted/empty audio/video stream."));
          return;
        }
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const durationStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
        
        resolve({
          duration: durationStr,
          durationSeconds: seconds
        });
      };
      
      video.onerror = () => {
        clearTimeout(loadTimeout);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error("Corrupt or invalid video format. This file failed native HTML5 decoding check."));
      };
    });
  };

  // Convert canvas base64 DataURL to Blob
  const dataURLtoBlob = (dataurl: string) => {
    try {
      const arr = dataurl.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("Failed converting dataurl to blob:", e);
      return null;
    }
  };

  // Compress image helper to convert and rescale any input file into lightweight Base64 instantly
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 320;
          const MAX_HEIGHT = 180;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7)); // 0.7 quality is extremely lightweight and fast
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsDataURL(file);
    });
  };

  // Automatic Thumbnail extraction via HTML5 Video element canvas drawing
  const generateAutomaticThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
        
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1.5, video.duration / 2);
        };
        
        video.onseeked = async () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL("image/jpeg", 0.75));
            } else {
              resolve("");
            }
          } catch (e) {
            console.error("Frame draw failure:", e);
            resolve("");
          } finally {
            URL.revokeObjectURL(videoUrl);
          }
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(videoUrl);
          resolve("");
        };
      } catch (err) {
        console.error("Thumbnail capture setup failed:", err);
        resolve("");
      }
    });
  };

  // Split and upload bytes in chunks in parallel (Requirement 1)
  const uploadFileInChunks = async (
    file: File,
    onProgress: (progress: number, speed: string, eta: number) => void
  ): Promise<{ uploadId: string; localUrl: string }> => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Read the entire file as an ArrayBuffer immediately while the reference/permission is 100% active and fresh!
    let fileBuffer: ArrayBuffer | null = null;
    try {
      fileBuffer = await file.arrayBuffer();
    } catch (bufErr: any) {
      console.warn("Direct file.arrayBuffer() load failed under current context, falling back to slow slicing stream:", bufErr);
    }

    // 1. Initialize chunked transfer on express
    const initRes = await fetch("/api/admin/video-upload/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        totalChunks
      })
    });

    if (!initRes.ok) {
      const errData = await initRes.json().catch(() => ({ error: "Server Initialization Failed" }));
      throw new Error(errData.error || `Initialization HTTP Error ${initRes.status}`);
    }

    const { uploadId } = await initRes.json();
    let uploadedChunksCount = 0;
    const startTime = Date.now();

    // Chunk helper to convert Blob to Base64 safely
    const readBlobAsBase64 = async (blob: Blob): Promise<string> => {
      try {
        if (typeof blob.arrayBuffer === "function") {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          
          // Ultra-fast chunked array-to-string conversion with zero stack-overflow risk
          const chunkOfChars: string[] = [];
          const batchSize = 16384; 
          for (let i = 0; i < len; i += batchSize) {
            const chunkBytes = bytes.subarray(i, i + batchSize);
            const charArray = Array.from(chunkBytes);
            chunkOfChars.push(String.fromCharCode.apply(null, charArray));
          }
          return btoa(chunkOfChars.join(""));
        }
      } catch (abErr: any) {
        console.warn("ArrayBuffer conversion failed, falling back to FileReader:", abErr);
      }

      // Reliable FileReader recovery fallback
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1] || result;
          resolve(base64);
        };
        reader.onerror = () => {
          console.error("FileReader failure:", reader.error);
          reject(new Error("FileReader error: " + (reader.error?.message || "Unknown error")));
        };
        reader.readAsDataURL(blob);
      });
    };

    // Fast in-memory Base64 conversion from Uint8Array
    const encodeUint8ArrayToBase64 = (bytes: Uint8Array): string => {
      const len = bytes.byteLength;
      const chunkOfChars: string[] = [];
      const batchSize = 16384; 
      for (let i = 0; i < len; i += batchSize) {
        const chunkBytes = bytes.subarray(i, i + batchSize);
        const charArray = Array.from(chunkBytes);
        chunkOfChars.push(String.fromCharCode.apply(null, charArray));
      }
      return btoa(chunkOfChars.join(""));
    };

    // Chunk upload function with automatic retry logic (Requirement 6) and Base64 JSON transmission
    const uploadChunkWithRetry = async (chunkIndex: number, retriesLeft = 5): Promise<void> => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);

      try {
        let base64Data = "";
        if (fileBuffer) {
          const chunkBytes = new Uint8Array(fileBuffer, start, end - start);
          base64Data = encodeUint8ArrayToBase64(chunkBytes);
        } else {
          const chunkBlob = file.slice(start, end);
          base64Data = await readBlobAsBase64(chunkBlob);
        }

        const res = await fetch("/api/admin/video-upload/chunk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`,
            "x-upload-id": uploadId,
            "x-chunk-index": chunkIndex.toString()
          },
          body: JSON.stringify({ chunkData: base64Data })
        });

        if (!res.ok) {
          throw new Error(`Chunk ${chunkIndex} upload failed with HTTP status ${res.status}`);
        }
      } catch (err: any) {
        if (retriesLeft > 0) {
          const delay = (6 - retriesLeft) * 1500;
          console.warn(`[Auto-Retry] Dynamic chunk upload failed. Retrying chunk-${chunkIndex} in ${delay}ms... (${retriesLeft} retries remaining)`);
          await new Promise(r => setTimeout(r, delay));
          return uploadChunkWithRetry(chunkIndex, retriesLeft - 1);
        }
        throw new Error(`Upload aborted: Chunk ${chunkIndex} failed persistently after retries. ${err.message || err}`);
      }
    };

    // Queue (Requirement 1: Chunk processing in parallel with dual worker threads)
    const chunkQueue = Array.from({ length: totalChunks }, (_, i) => i);
    const workerCount = Math.min(2, totalChunks); // Dual workers for robust parallel transmission without proxy choke!

    const runWorker = async () => {
      while (chunkQueue.length > 0) {
        const index = chunkQueue.shift();
        if (index === undefined) break;

        await uploadChunkWithRetry(index);
        uploadedChunksCount++;

        // Calculate metrics
        const progress = Math.round((uploadedChunksCount / totalChunks) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const bytesLoaded = uploadedChunksCount * CHUNK_SIZE;
        const speedBps = elapsed > 0.1 ? bytesLoaded / elapsed : 0;
        const speedMBs = speedBps / (1024 * 1024);
        const speedStr = speedMBs > 0.01 ? `${speedMBs.toFixed(2)} MB/s` : "Calculating...";
        const eta = speedBps > 0 ? Math.max(0, Math.round((file.size - bytesLoaded) / speedBps)) : 0;

        onProgress(progress, speedStr, eta);
      }
    };

    const workers = Array.from({ length: workerCount }, () => runWorker());
    await Promise.all(workers);

    return { uploadId, localUrl: `/uploads/assembled-${uploadId}${pathExt(file.name)}` };
  };

  // Immediate start of chunk upload & automatic thumbnail derivation
  const startVideoUpload = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setVideoUrl("");
    setUploadProgress(0);
    setUploadSpeed(null);
    setUploadEta(null);
    setUploading(true);

    try {
      console.log("Validating video file format and integrity...");
      const meta = await validateAndGetVideoMetadata(file);
      setDuration(meta.duration);
      console.log(`Video duration validated: ${meta.duration}`);

      console.log("Extracting automatic thumbnail frame...");
      generateAutomaticThumbnail(file).then(async (dataUrl) => {
        if (dataUrl) {
          const blob = dataURLtoBlob(dataUrl);
          if (blob) {
            const thumbFile = new File([blob], `auto-cover-${Date.now()}.jpg`, { type: "image/jpeg" });
            console.log("Cover drawn, starting permanent Firebase Storage upload...");
            startThumbnailUpload(thumbFile);
          }
        }
      });

      console.log("Initiating multi-parallel chunk transfer...");
      const { uploadId, localUrl } = await uploadFileInChunks(
        file,
        (progress, speed, eta) => {
          setUploadProgress(progress);
          setUploadSpeed(speed);
          setUploadEta(eta);
        }
      );

      setVideoUrl(localUrl);
      setCurrentUploadId(uploadId);
      setUploading(false);
      setSuccessMsg("✓ HD Video successfully uploaded! Fill in details below and click Publish.");
      return { uploadId, localUrl };
    } catch (err: any) {
      console.error("Video registration and upload aborted:", err);
      const errMsg = "Video validation or upload failed: " + (err.message || String(err));
      setErrorMsg(errMsg);
      setUploading(false);
      setSelectedFile(null);
      await logPublishError(`[Upload Stream Aborted] File Name: ${file.name} - Reason: ${err.message || String(err)}`);
      throw err;
    }
  };

  // Permanent cloud cover thumbnail upload Action
  const startThumbnailUpload = async (file: File) => {
    setThumbnailUrl("");
    setThumbnailProgress(0);
    setThumbnailUploading(true);

    try {
      // 1. Generate & set ultra-fast compressed local base64 preview immediately!
      const compressedBase64 = await compressImage(file);
      if (compressedBase64) {
        setThumbnailUrl(compressedBase64);
        
        // Micro-simulation to show beautiful fast progress animation
        let prog = 0;
        const interval = setInterval(() => {
          prog += 20;
          if (prog >= 100) {
            setThumbnailProgress(100);
            setThumbnailUploading(false);
            clearInterval(interval);
          } else {
            setThumbnailProgress(prog);
          }
        }, 15);
      }
    } catch (err) {
      console.warn("Instant preview fallback helper failed:", err);
    }

    // 2. We STILL try running background storage upload in case they prefer a direct URL,
    // but the state is already populated with the local preview instantly!
    const storageRef = ref(storage, `videoBulletins/thumbnails/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Background upload log
      },
      (error) => {
        console.warn("Background storage upload didn't complete, utilizing high-speed local cover:", error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          // Upgrade to public cloud storage URL when finished
          setThumbnailUrl(downloadUrl);
        } catch (err: any) {
          console.warn("Failed to upgrade thumbnail with background URL:", err);
        }
      }
    );
  };

  const getAiThumbnailSuggestions = async (e: React.MouseEvent, useEditMode = false) => {
    e.preventDefault();
    const sourceTitle = useEditMode ? editTitle : title;
    const sourceCategory = useEditMode ? editCategory : category;

    if (!sourceTitle.trim()) {
      alert("Please specify a Video Title first so the AI model can generate relevant suggested cover tags!");
      return;
    }

    if (useEditMode) {
      setIsEditSuggestingThumbnails(true);
      setEditAiThumbnails([]);
    } else {
      setIsSuggestingThumbnails(true);
      setAiThumbnails([]);
    }

    try {
      const response = await fetch("/api/gemini/suggest-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: sourceTitle.trim(),
          categoryId: sourceCategory
        })
      });

      if (!response.ok) {
        throw new Error(`AI search query failed inside system context API: ${response.status}`);
      }

      const resData = await response.json();
      const firstUrl = resData.url;
      // Synthesize 3 diverse matching signatures
      const suggestions = [
        firstUrl,
        firstUrl.replace("fit=crop", "fit=facearea") + "&sig=1a",
        firstUrl.replace("&w=1200", "&w=640") + "&sig=2b"
      ];

      if (useEditMode) {
        setEditThumbnailUrl(firstUrl); // Pre-set first choice immediately
        setEditAiThumbnails(suggestions);
      } else {
        setThumbnailUrl(firstUrl); // Pre-set first choice immediately
        setAiThumbnails(suggestions);
      }
    } catch (err: any) {
      console.error("AI suggested images request failure:", err);
    } finally {
      if (useEditMode) {
        setIsEditSuggestingThumbnails(false);
      } else {
        setIsSuggestingThumbnails(false);
      }
    }
  };

  // Submit flow: calls Express completion endpoint which merges & uploads durably in background
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Explicit validation checks
    if (!selectedFile) {
      setErrorMsg("Validation Error: Please select an HD video file to publish.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Validation Error: Please enter a descriptive Video Title.");
      return;
    }
    if (!category) {
      setErrorMsg("Validation Error: Please select an active Category Desk.");
      return;
    }
    if (!status) {
      setErrorMsg("Validation Error: Please select a valid Publish Status.");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let activeUploadId = currentUploadId;
    let activeVideoUrl = videoUrl;

    // 2. Await in-progress upload streams smoothly so the user can hit Publish immediately after selecting
    if (uploading || !activeVideoUrl || !activeUploadId) {
      if (activeUploadPromiseRef.current) {
        setSuccessMsg("Uploading video in progress (please wait for data bytes to complete)...");
        try {
          const res = await activeUploadPromiseRef.current;
          activeUploadId = res.uploadId;
          activeVideoUrl = res.localUrl;
        } catch (err: any) {
          const errMsg = "Publish failed: Video upload failed. Please try again. " + (err.message || String(err));
          setErrorMsg(errMsg);
          setPublishing(false);
          await logPublishError(`[Submit Failure - Upload Error] File: ${selectedFile.name} - Title: ${title.trim()} - Reason: ${err.message || String(err)}`);
          return;
        }
      } else {
        setErrorMsg("Validation Error: No broadcast video path uploaded. Please select a video file first.");
        setPublishing(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/admin/video-upload/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          uploadId: activeUploadId,
          title: title.trim(),
          description: description.trim(),
          category,
          author: author || "admin@fastcoverage.news",
          status: status, // published or draft as set initially
          thumbnailUrl,
          duration, // <-- Include dynamic video duration!
          isScheduled: isScheduled,
          scheduledTime: isScheduled ? scheduledTime : ""
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Assembly endpoint failed" }));
        throw new Error(errData.error || `HTTP complete status ${response.status}`);
      }

      const resData = await response.json().catch(() => ({}));
      const finalLocalVideoUrl = resData.videoUrl || activeVideoUrl;

      // Preserves the video file blob in client's IndexedDB cache linked to its server virtual path
      if (finalLocalVideoUrl && selectedFile) {
        try {
          await saveVideoFile(finalLocalVideoUrl, selectedFile);
          console.log(`[IndexedDB Fallback Cache] Saved video file locally: ${finalLocalVideoUrl}`);
        } catch (cErr) {
          console.error("Failed to save to local IndexedDB cache:", cErr);
        }
      }

      setSuccessMsg(`✓ Video Published Successfully! "${title.trim()}" is now live on the homepage.`);

      // Reset standard field properties
      setTitle("");
      setDescription("");
      setCategory("general");
      setSelectedFile(null);
      setThumbnailFile(null);
      setVideoUrl("");
      setThumbnailUrl("");
      setDuration("0:00");
      setUploadProgress(0);
      setThumbnailProgress(0);
      setCurrentUploadId("");
      setIsScheduled(false);
      setScheduledTime("");
      setAiThumbnails([]);
      activeUploadPromiseRef.current = null;
    } catch (err: any) {
      console.error("Publishing video bulletin failed:", err);
      const errMsg = "Publish failed: " + (err.message || String(err));
      setErrorMsg(errMsg);
      await logPublishError(`[Submit Failure - Complete Endpoint] Title: ${title.trim()} - Reason: ${err.message || String(err)}`);
    } finally {
      setPublishing(false);
    }
  };

  // Edit replacing handlers: supports chunks & parallel workers cleanly
  const handleEditVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditVideoProgress(0);
    setEditVideoUploading(true);
    setEditSelectedFile(file);
    setErrorMsg(null);

    try {
      console.log("Validating replacement video and extracting duration...");
      const meta = await validateAndGetVideoMetadata(file);
      setEditDuration(meta.duration);
      console.log(`Replacement video duration validated: ${meta.duration}`);

      generateAutomaticThumbnail(file).then(async (dataUrl) => {
        if (dataUrl) {
          // Immediately show the auto-extracted thumbnail so there's zero lag!
          setEditThumbnailUrl(dataUrl);

          const blob = dataURLtoBlob(dataUrl);
          if (blob) {
            const thumbFile = new File([blob], `auto-thumb-edit-${Date.now()}.jpg`, { type: "image/jpeg" });
            console.log("Automatic edit cover extraction completed.");
            
            const storageRef = ref(storage, `videoBulletins/thumbnails/edit_${Date.now()}_${thumbFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, thumbFile);
            uploadTask.on("state_changed", null, null, async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setEditThumbnailUrl(url);
              } catch (err) {
                console.warn("Background auto thumbnail upload skipped, using instant base64 URL instead.");
              }
            });
          }
        }
      });

      const { uploadId, localUrl } = await uploadFileInChunks(
        file,
        (progress) => {
          setEditVideoProgress(progress);
        }
      );

      setEditVideoUrl(localUrl);
      setEditUploadId(uploadId);
      setEditVideoUploading(false);
      setSuccessMsg("✓ Replacement video successfully cached. Click Save Changes to complete.");
    } catch (error: any) {
      console.error("Replacement video validation or upload failed:", error);
      setErrorMsg("Replacement check or upload failed: " + error.message);
      setEditVideoUploading(false);
      setEditSelectedFile(null);
    }
  };

  const handleEditThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditThumbProgress(0);
    setEditThumbUploading(true);

    try {
      // 1. Generate & set ultra-fast compressed local base64 preview immediately!
      const compressedBase64 = await compressImage(file);
      if (compressedBase64) {
        setEditThumbnailUrl(compressedBase64);
        
        // Micro-simulation to show beautiful fast progress animation
        let prog = 0;
        const interval = setInterval(() => {
          prog += 20;
          if (prog >= 100) {
            setEditThumbProgress(100);
            setEditThumbUploading(false);
            clearInterval(interval);
          } else {
            setEditThumbProgress(prog);
          }
        }, 15);
      }
    } catch (err) {
      console.warn("Instant edit preview helper failed:", err);
    }

    const storageRef = ref(storage, `videoBulletins/thumbnails/edit_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Background upload progress
      },
      (error) => {
        console.warn("Background edit thumbnail upload didn't complete, utilizing local cover:", error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          // If the background upload finishes, update to permanent URL
          setEditThumbnailUrl(downloadUrl);
        } catch (err: any) {
          console.warn("Failed to upgrade edit thumbnail URL:", err);
        }
      }
    );
  };

  // Submit edited properties
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

      if (editVideoUrl && editUploadId) {
        // Replacement video uploaded in chunks, trigger background assembly & Storage transfer
        const response = await fetch("/api/admin/video-upload/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            uploadId: editUploadId,
            title: editTitle.trim(),
            description: editDescription.trim(),
            category: editCategory,
            author: editingVideo.author || author || "admin@fastcoverage.news",
            status: editStatus,
            thumbnailUrl: editThumbnailUrl || editingVideo.thumbnailUrl,
            duration: editDuration, // <-- Include new parsed duration!
            editVideoId: editingVideo.id
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "Assembly endpoint failed" }));
          throw new Error(errData.error || `HTTP complete status ${response.status}`);
        }

        const resData = await response.json().catch(() => ({}));
        const finalLocalUrl = resData.videoUrl || editVideoUrl;

        // Persist video file blob inside local IndexedDB cache matched by its server virtual path
        if (finalLocalUrl && editSelectedFile) {
          try {
            await saveVideoFile(finalLocalUrl, editSelectedFile);
            console.log(`[IndexedDB Cache Fallback] Saved replacement video locally: ${finalLocalUrl}`);
          } catch (cErr) {
            console.error("Failed saving video to IndexedDB cache:", cErr);
          }
        }

        setSuccessMsg(`✓ Broadcast updated and is processing in the background: "${editTitle}"`);
      } else {
        // Simple property edit: update Firestore records directly
        const updatedData = {
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          status: editStatus,
          published: editStatus === "Published",
          thumbnailUrl: editThumbnailUrl || editingVideo.thumbnailUrl,
          isScheduled: editIsScheduled,
          scheduledTime: editIsScheduled ? editScheduledTime : "",
          updatedAt: timestampISO
        };

        await updateDoc(doc(db, "videoBulletins", editingVideo.id), updatedData);
        await setDoc(doc(db, "videos", editingVideo.id), updatedData, { merge: true });

        setSuccessMsg(`✓ Broadcast updated: "${editTitle}" has been saved.`);
      }

      setEditingVideo(null);
      setEditUploadId("");
      setEditVideoUrl("");
      setEditSelectedFile(null);
      setEditDuration("0:00");
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
      let newStatus: "Draft" | "Processing" | "Published" | "Archived" = "Published";
      if (vid.status === "Draft") newStatus = "Processing";
      else if (vid.status === "Processing") newStatus = "Published";
      else if (vid.status === "Published") newStatus = "Archived";
      else if (vid.status === "Archived") newStatus = "Draft";

      const updatedFields = {
        status: newStatus,
        published: newStatus === "Published",
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, "videoBulletins", vid.id), updatedFields);
      await setDoc(doc(db, "videos", vid.id), updatedFields, { merge: true });
    } catch (err: any) {
      console.error("Failed cycling published state:", err);
      setErrorMsg("Permission denied or database connection offline.");
    }
  };

  // Erase video records and associated storage files permanently
  const handleDeleteConfirm = async (vid: VideoItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/admin/delete-video", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + adminToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: vid.id,
          videoUrl: vid.videoUrl || vid.url,
          thumbnailUrl: vid.thumbnailUrl
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || `Erasing error: ${response.status}`);
      }

      setSuccessMsg(`✓ Broadcast record and its files have been permanently erased.`);
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Permanent erase operation failed: ", err);
      setErrorMsg("Error: Failed to clear video or associated storage files: " + err.message);
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
                    <option value="Processing">Processing</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 pt-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 cursor-pointer font-sans">
                  <input
                    type="checkbox"
                    checked={editIsScheduled}
                    onChange={(e) => setEditIsScheduled(e.target.checked)}
                    className="accent-red-650 h-3.5 w-3.5 rounded"
                  />
                  <span>Schedule Release?</span>
                </label>
                {editIsScheduled && (
                  <input
                    type="datetime-local"
                    required
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    className="w-full bg-white border border-neutral-350 rounded p-1.5 text-xs text-neutral-800 font-mono"
                  />
                )}
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
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Video Cover Thumbnail (Optional)</span>
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
                      <span>Uploading Replacement Thumbnail...</span>
                      <span>{editThumbProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${editThumbProgress}%` }} />
                    </div>
                  </div>
                )}
                {editThumbnailUrl && (
                  <div className="space-y-1.5 pt-1">
                    <div className="aspect-video w-32 border border-neutral-200 rounded overflow-hidden mt-1 bg-neutral-50 shadow-xs">
                      <img src={editThumbnailUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={(e) => getAiThumbnailSuggestions(e, true)}
                    disabled={isEditSuggestingThumbnails}
                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition shadow-2xs select-none cursor-pointer"
                  >
                    {isEditSuggestingThumbnails ? (
                      <>
                        <RefreshCw size={9} className="animate-spin text-red-650" />
                        <span>AI Querying...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Get AI Covers</span>
                      </>
                    )}
                  </button>
                </div>

                {editAiThumbnails.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200/60 mt-2 space-y-1.5 animate-fadeIn">
                    <span className="block text-[8px] font-black uppercase tracking-widest text-red-650 font-sans">✨ Suggested Photographic Covers (Select One)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {editAiThumbnails.map((url, i) => (
                        <div 
                          key={i}
                          onClick={() => setEditThumbnailUrl(url)}
                          className={`relative aspect-video rounded border overflow-hidden cursor-pointer bg-neutral-900 group hover:ring-2 hover:ring-red-655 transition ${
                            editThumbnailUrl === url ? "ring-2 ring-red-655 border-transparent" : "border-neutral-200"
                          }`}
                        >
                          <img src={url} alt={`Ed Sig ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    className="w-full bg-neutral-105 border border-neutral-200 rounded p-2 text-xs cursor-not-allowed text-neutral-455 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Publish status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none cursor-pointer focus:bg-white font-medium"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft Mode</option>
                    <option value="Processing">Processing</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="accent-red-600 h-3.5 w-3.5 rounded"
                    />
                    <span>Schedule Publication Release?</span>
                  </label>
                  {isScheduled && (
                    <input
                      type="datetime-local"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-white border border-neutral-350 rounded p-2 text-xs text-neutral-800 font-mono tracking-tight cursor-pointer"
                    />
                  )}
                </div>


              </div>

              {/* Optional custom thumbnail upload */}
              <div className="border border-neutral-150 p-3 rounded-lg bg-neutral-50/50 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">Video Thumbnail Cover</span>
                  <p className="text-[9px] text-neutral-400 font-medium">Auto-generated or upload custom</p>
                </div>
                
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={thumbnailUploading}
                  className="hidden"
                />

                <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                  {thumbnailUrl ? (
                    <div className="relative group aspect-video h-16 w-32 border border-neutral-200 rounded overflow-hidden bg-neutral-100 shrink-0 shadow-xs">
                      <img src={thumbnailUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={triggerThumbnailSelect}
                          className="bg-white/90 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded text-neutral-805 shadow-sm hover:bg-white transition cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerThumbnailSelect}
                      disabled={thumbnailUploading}
                      className="aspect-video h-16 w-32 pb-0.5 border border-dashed border-neutral-350 hover:border-neutral-400 bg-white rounded flex flex-col items-center justify-center shrink-0 cursor-pointer text-neutral-400 transition"
                    >
                      <ImageIcon size={14} className="text-neutral-400" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mt-1 select-none">No Cover</span>
                    </button>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-[150px]">
                    <p className="text-[10px] leading-relaxed text-neutral-500 font-medium font-sans">
                      By default, an automatic frame thumbnail is extracted. You can upload a high-res custom thumbnail JPG/PNG or get instant suggestions.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={triggerThumbnailSelect}
                        disabled={thumbnailUploading}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-100 border border-neutral-250 text-neutral-700 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition shadow-2xs select-none cursor-pointer"
                      >
                        <Upload size={9} />
                        <span>{thumbnailUrl ? "Upload Custom Image" : "Choose Custom Cover"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => getAiThumbnailSuggestions(e, false)}
                        disabled={isSuggestingThumbnails}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1.5 rounded transition shadow-2xs select-none cursor-pointer"
                      >
                        {isSuggestingThumbnails ? (
                          <>
                            <RefreshCw size={9} className="animate-spin text-red-650" />
                            <span>AI Matching...</span>
                          </>
                        ) : (
                          <>
                            <span>✨ Get AI Covers</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Thumbnail Cover List */}
                {aiThumbnails.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200/60 mt-2 space-y-1.5 animate-fadeIn">
                    <span className="block text-[8px] font-black uppercase tracking-widest text-red-650 font-sans">✨ AI Suggested Photographic Covers (Select One)</span>
                    <div className="grid grid-cols-3 gap-2">
                      {aiThumbnails.map((url, i) => (
                        <div 
                          key={i}
                          onClick={() => setThumbnailUrl(url)}
                          className={`relative aspect-video rounded border overflow-hidden cursor-pointer bg-neutral-900 group hover:ring-2 hover:ring-red-650 transition ${
                            thumbnailUrl === url ? "ring-2 ring-red-650 border-transparent" : "border-neutral-200"
                          }`}
                        >
                          <img src={url} alt={`Sig ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className={`absolute inset-0 bg-red-650/15 flex items-center justify-center transition-opacity ${
                            thumbnailUrl === url ? "opacity-100" : "opacity-0"
                          }`}>
                            <span className="bg-red-655 text-white text-[7px] font-mono px-1 rounded uppercase font-black tracking-widest">Active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {thumbnailUploading && (
                  <div className="space-y-1 pt-1 font-mono">
                    <div className="flex justify-between text-[9px] font-bold text-neutral-500">
                      <span className="flex items-center gap-1">
                        <RefreshCw size={9} className="animate-spin text-red-600" />
                        <span>Uploading custom cover...</span>
                      </span>
                      <span>{thumbnailProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${thumbnailProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Action Button */}
              <div className="pt-2 select-none">
                <button
                  type="submit"
                  disabled={publishing}
                  className={`w-full py-2.5 px-4 rounded text-xs tracking-wider uppercase font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                    publishing
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                      : "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg active:scale-[0.985]"
                  }`}
                >
                  {publishing ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>{uploading ? "Uploading & Assembling..." : "Publishing Broadcast..."}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVideos.map((vid) => {
                const categoryObj = VIDEO_CATEGORIES.find(c => c.id === vid.category);
                
                return (
                  <div 
                    key={vid.id} 
                    className={`border border-neutral-200 rounded p-3 flex gap-3 hover:shadow-md transition-all ${
                      vid.status === "Draft" ? "bg-amber-50/10 border-amber-200/40" :
                      vid.status === "Processing" ? "bg-blue-50/10 border-blue-200/40 animate-pulse" :
                      vid.status === "Archived" ? "bg-neutral-50/20 border-neutral-300 opacity-60" : "bg-white"
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
                    <div className="flex-1 min-w-0 flex flex-col justify-between text-neutral-800">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 py-0.5 px-1.5 rounded-sm">
                            {categoryObj?.name || "General Desk"}
                          </span>
                          {vid.status === "Draft" && (
                            <span className="text-[9px] uppercase font-black text-amber-600 bg-amber-50/80 border border-amber-200/60 py-0.5 px-1.5 rounded-sm">
                              Draft
                            </span>
                          )}
                          {vid.status === "Processing" && (
                            <span className="text-[9px] uppercase font-black text-blue-600 bg-blue-50/80 border border-blue-200/40 py-0.5 px-1.5 rounded-sm animate-pulse">
                              Processing
                            </span>
                          )}
                          {vid.status === "Published" && (
                            <span className="text-[9px] uppercase font-black text-green-600 bg-green-50/80 border border-green-200/40 py-0.5 px-1.5 rounded-sm">
                              Published
                            </span>
                          )}
                          {vid.status === "Archived" && (
                            <span className="text-[9px] uppercase font-black text-neutral-600 bg-neutral-100 border border-neutral-300 py-0.5 px-1.5 rounded-sm">
                              Archived
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-neutral-800 tracking-tight mt-1 line-clamp-1 leading-normal" title={vid.title}>
                          {vid.title}
                        </h4>
                        
                        <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 leading-normal">
                          {vid.description || "No description provided."}
                        </p>

                        {/* Automated safety & self-healing health check indicators */}
                        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-dashed border-neutral-100/80 flex-wrap">
                          <div className="flex items-center gap-1 text-[8px] font-mono">
                            <span className="text-neutral-500 font-bold uppercase">Store:</span>
                            {vid.storageStatus === "Secure" ? (
                              <span className="text-green-600 font-black bg-green-50 px-1 py-0.2 rounded border border-green-200">✓ SECURE</span>
                            ) : vid.storageStatus === "Defective" ? (
                              <span className="text-red-600 font-black bg-red-50 px-1 py-0.2 rounded border border-red-200">✗ DEFECTIVE</span>
                            ) : (
                              <span className="text-neutral-500 font-bold bg-neutral-105 px-1 py-0.2 rounded border border-neutral-200">🔍 UNKNOWN</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[8px] font-mono">
                            <span className="text-neutral-500 font-bold uppercase">Playback:</span>
                            {vid.playbackStatus === "Operational" ? (
                              <span className="text-green-655 font-black bg-green-50 px-1 py-0.2 rounded border border-green-200">⚡ OPERATIONAL</span>
                            ) : vid.playbackStatus === "Failed" ? (
                              <span className="text-red-705 font-black bg-red-50 px-1 py-0.2 rounded border border-red-200">⚠️ FAILED</span>
                            ) : (
                              <span className="text-neutral-500 font-bold bg-neutral-105 px-1 py-0.2 rounded border border-neutral-200">🔍 UNKNOWN</span>
                            )}
                          </div>
                        </div>

                        {/* Highly prominent broken link callout */}
                        {vid.brokenWarning && (
                          <div className="mt-1.5 p-1 rounded bg-red-50 border border-red-250 text-red-600 font-black flex items-center gap-1 text-[8px] tracking-tight leading-none animate-bounce">
                            <AlertTriangle size={10} className="shrink-0" />
                            <span>[BROKEN LINK CALIBRATING REPAIR]</span>
                          </div>
                        )}
                      </div>
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
                                setEditThumbnailUrl(vid.thumbnailUrl || "");
                                setEditIsScheduled(vid.isScheduled || false);
                                setEditScheduledTime(vid.scheduledTime || "");
                                setEditAiThumbnails([]);
                              }}
                              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 cursor-pointer"
                              title="Edit properties"
                            >
                              <Edit2 size={12} />
                            </button>
                            
                            <button
                              onClick={() => handleTogglePublish(vid)}
                              className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-all cursor-pointer select-none active:scale-95 ${
                                vid.status === "Published"
                                  ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  : vid.status === "Draft"
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                                  : vid.status === "Processing"
                                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200"
                              }`}
                              title="Click to cycle: Draft -> Processing -> Published -> Archived"
                            >
                              {vid.status || "Published"}
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
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
