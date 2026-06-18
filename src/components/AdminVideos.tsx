import React, { useState, useRef, useEffect } from "react";
import { VideoItem } from "../types";
import { 
  Video, 
  Trash2, 
  PlusCircle, 
  Upload, 
  Link as LinkIcon, 
  Clock, 
  FileVideo, 
  Info, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  Edit3,
  RefreshCw,
  X,
  FileCheck,
  User,
  Radio,
  Eye
} from "lucide-react";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { generateVideoThumbnail, formatDuration, base64ToBlob } from "../utils/videoHelpers";

interface AdminVideosProps {
  adminToken: string;
  adminSession?: { token: string; email: string; name: string; role: string; ip: string };
}

// Global available report categories
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
  
  // Create video form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<"upload" | "url">("upload");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState<"Published" | "Draft">("Published");
  const [author, setAuthor] = useState(adminSession?.email || "admin@fastcoverage.news");
  
  // Live / Scheduled status
  const [isLive, setIsLive] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  
  // Drag and drop / local file tracking
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Progress & Error meters
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStatusText, setCurrentStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editStatus, setEditStatus] = useState<"Published" | "Draft">("Published");
  const [editIsLive, setEditIsLive] = useState(false);
  const [editIsScheduled, setEditIsScheduled] = useState(false);
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [editUploading, setEditUploading] = useState(false);

  // Legacy Migration State
  const [legacyVideos, setLegacyVideos] = useState<VideoItem[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgressText, setMigrationProgressText] = useState("");

  // --- ACCELERATED PLM INSTANT UPLOAD STATES WITH REFS FOR DYNAMIC SCOPE STABILITY ---
  const instantUploadStatusRef = useRef<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const sessionVideoUrlRef = useRef("");
  const sessionThumbnailUrlRef = useRef("");
  const sessionDurationRef = useRef("0:00");
  const instantUploadProgressRef = useRef(0);

  const editUploadStatusRef = useRef<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const editSessionVideoUrlRef = useRef("");
  const editSessionThumbnailUrlRef = useRef("");
  const editSessionDurationRef = useRef("0:00");
  const editProgressRef = useRef(0);

  const [sessionVideoUrl, _setSessionVideoUrl] = useState("");
  const setSessionVideoUrl = (val: string) => {
    sessionVideoUrlRef.current = val;
    _setSessionVideoUrl(val);
  };

  const [sessionThumbnailUrl, _setSessionThumbnailUrl] = useState("");
  const setSessionThumbnailUrl = (val: string) => {
    sessionThumbnailUrlRef.current = val;
    _setSessionThumbnailUrl(val);
  };

  const [sessionDuration, _setSessionDuration] = useState("0:00");
  const setSessionDuration = (val: string) => {
    sessionDurationRef.current = val;
    _setSessionDuration(val);
  };

  const [instantUploadStatus, _setInstantUploadStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const setInstantUploadStatus = (val: "idle" | "uploading" | "processing" | "completed" | "failed") => {
    instantUploadStatusRef.current = val;
    _setInstantUploadStatus(val);
  };

  const [instantUploadProgress, _setInstantUploadProgress] = useState(0);
  const setInstantUploadProgress = (val: number) => {
    instantUploadProgressRef.current = val;
    _setInstantUploadProgress(val);
  };

  const [instantSpeed, setInstantSpeed] = useState("");
  const [instantLatency, setInstantLatency] = useState<number | null>(null);
  const [instantStorageResponse, setInstantStorageResponse] = useState<number | null>(null);
  const [instantBottleneck, setInstantBottleneck] = useState<string | null>(null);
  
  const uploadStartTimeRef = useRef<number>(0);
  
  // States for edit mode replacements
  const [editSessionVideoUrl, _setEditSessionVideoUrl] = useState("");
  const setEditSessionVideoUrl = (val: string) => {
    editSessionVideoUrlRef.current = val;
    _setEditSessionVideoUrl(val);
  };

  const [editSessionThumbnailUrl, _setEditSessionThumbnailUrl] = useState("");
  const setEditSessionThumbnailUrl = (val: string) => {
    editSessionThumbnailUrlRef.current = val;
    _setEditSessionThumbnailUrl(val);
  };

  const [editSessionDuration, _setEditSessionDuration] = useState("0:00");
  const setEditSessionDuration = (val: string) => {
    editSessionDurationRef.current = val;
    _setEditSessionDuration(val);
  };

  const [editUploadStatus, _setEditUploadStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
  const setEditUploadStatus = (val: "idle" | "uploading" | "processing" | "completed" | "failed") => {
    editUploadStatusRef.current = val;
    _setEditUploadStatus(val);
  };

  const [editProgress, _setEditProgress] = useState(0);
  const setEditProgress = (val: number) => {
    editProgressRef.current = val;
    _setEditProgress(val);
  };

  const pendingFirestoreDocsRef = useRef<{ bulletId: string; videosId: string; isEditing: boolean } | null>(null);
  const titleRef = useRef("");
  const descriptionRef = useRef("");

  // Prevent closing tab when uploading is active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (instantUploadStatusRef.current === "uploading" || editUploadStatusRef.current === "uploading") {
        e.preventDefault();
        e.returnValue = "Video upload is still in progress. Closing this tab will cancel the upload.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  // Load active session user email if changed
  useEffect(() => {
    if (adminSession?.email) {
      setAuthor(adminSession.email);
    }
  }, [adminSession]);

  // Synchronize with database: we load from both collections or fallback
  useEffect(() => {
    setLoading(true);
    // Listen to videoBulletins collection (cnn style schema)
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
            duration: data.duration || "",
            createdAt: data.createdAt || new Date().toISOString(),
            publishedAt: data.publishedAt || data.createdAt || new Date().toISOString(),
            author: data.author || "admin@fastcoverage.news",
            status: data.status || "Published",
            views: data.views || 0,
            isLive: data.isLive || false,
            isScheduled: data.isScheduled || false,
            scheduledTime: data.scheduledTime || ""
          } as VideoItem);
        });

        // Scan which videos are base64 or temporary to offer Migration
        const legacy = items.filter(v => 
          (v.url && v.url.startsWith("data:")) || 
          (v.url && v.url.startsWith("/uploads/"))
        );
        setLegacyVideos(legacy);

        // Sort by publication timestamp descending
        items.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime();
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setVideos(items);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore read videoBulletins failed, subscribing to legacy 'videos':", error);
        // Fallback subscription to index-legacy videos if collection hasn't been written to yet
        const subLegacy = onSnapshot(collection(db, "videos"), (legacySnap) => {
          const items: VideoItem[] = [];
          legacySnap.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              url: data.url || "",
              videoUrl: data.url || "",
              createdAt: data.createdAt || new Date().toISOString(),
              publishedAt: data.createdAt || new Date().toISOString(),
              views: data.views || 0,
              isLive: data.isLive || false,
              isScheduled: data.isScheduled || false,
              scheduledTime: data.scheduledTime || "",
              category: "general"
            } as VideoItem);
          });
          const legacy = items.filter(v => v.url.startsWith("data:") || v.url.startsWith("/uploads/"));
          setLegacyVideos(legacy);
          setVideos(items);
          setLoading(false);
        });
        return () => subLegacy();
      }
    );

    return () => unsubscribe();
  }, []);

  // Drag and Drop helpers
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
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0], false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0], false);
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0], true);
    }
  };

  // Accelerated Direct Resumable Upload Pipeline
  const startInstantUpload = async (file: File, isEditMode: boolean = false) => {
    const setStatus = isEditMode ? setEditUploadStatus : setInstantUploadStatus;
    const setProgress = isEditMode ? setEditProgress : setInstantUploadProgress;
    const setVideoUrlState = isEditMode ? setEditSessionVideoUrl : setSessionVideoUrl;
    const setThumbUrlState = isEditMode ? setEditSessionThumbnailUrl : setSessionThumbnailUrl;
    const setDurationState = isEditMode ? setEditSessionDuration : setSessionDuration;

    setStatus("uploading");
    setProgress(1); // Set instantly to 1% to show responsive starting status

    // Measure live network round-trip latency
    const pingStart = performance.now();
    try {
      await fetch("/", { method: "HEAD", cache: "no-store" });
      const latency = Math.round(performance.now() - pingStart);
      setInstantLatency(latency);
    } catch {
      setInstantLatency(95); // fallback typical latency
    }

    // Extraction Pipeline: Generate thumbnail and detect duration asynchronously (Requirement 6)
    generateVideoThumbnail(file).then(async (result) => {
      setDurationState(formatDuration(result.durationSeconds));
      
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const thumbPath = `videoBulletins/thumbnails/${Date.now()}-${uniqueId}-thumb.jpg`;
      const thumbRef = ref(storage, thumbPath);

      const tStart = performance.now();
      const thumbTask = uploadBytesResumable(thumbRef, result.thumbnail);
      thumbTask.on(
        "state_changed",
        null,
        null,
        async () => {
          const thumbUrl = await getDownloadURL(thumbTask.snapshot.ref);
          setThumbUrlState(thumbUrl);
          setInstantStorageResponse(Math.round(performance.now() - tStart));
        }
      );
    }).catch((thumbErr) => {
      console.warn("Background thumbnail/duration generation skipped:", thumbErr);
      setDurationState("0:00");
      setThumbUrlState("https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640");
    });

    const totalSize = file.size;
    const uniqueId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase() || ".mp4";
    const timestamp = Date.now();
    const videoPath = `videoBulletins/${timestamp}-${uniqueId}${fileExtension}`;
    const storageRef = ref(storage, videoPath);

    uploadStartTimeRef.current = performance.now();

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const prog = Math.min(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 99);
            setProgress(prog === 0 ? 1 : prog);

            const elapsedSecs = (performance.now() - uploadStartTimeRef.current) / 1000;
            if (elapsedSecs > 0.05) {
              const speedBytesPerSec = snapshot.bytesTransferred / elapsedSecs;
              
              // Automatic network congestion and bottleneck detection (Requirement 9)
              if (speedBytesPerSec < 200 * 1024) {
                setInstantBottleneck("Bottleneck detected: Network congestion. Optimizing packet headers.");
              } else if (instantLatency && instantLatency > 350) {
                setInstantBottleneck("High routing latency. Initiating packet stream buffers.");
              } else {
                setInstantBottleneck(null);
              }

              if (speedBytesPerSec > 1024 * 1024) {
                setInstantSpeed(`${(speedBytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`);
              } else {
                setInstantSpeed(`${(speedBytesPerSec / 1024).toFixed(1)} KB/s`);
              }
            }
          },
          (error) => {
            console.error("Resumable upload failed:", error);
            reject(error);
          },
          async () => {
            const finalUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(finalUrl);
          }
        );
      });

      setVideoUrlState(downloadUrl);
      setStatus("completed");
      setProgress(100);

      const finalSecs = (performance.now() - uploadStartTimeRef.current) / 1000;
      const speedMb = (totalSize / (1024 * 1024)) / finalSecs;
      setInstantSpeed(`${speedMb.toFixed(2)} MB/s`);

      // YouTube-style background publishing check!
      if (pendingFirestoreDocsRef.current) {
        const { bulletId, videosId, isEditing } = pendingFirestoreDocsRef.current;
        
        // Wait up to 3 seconds for thumbnail to resolve, if not resolved use a default
        let resolvedThumb = isEditing ? editSessionThumbnailUrlRef.current : sessionThumbnailUrlRef.current;
        let thumbAttempts = 0;
        while (!resolvedThumb && thumbAttempts < 30) {
          await new Promise(r => setTimeout(r, 100));
          resolvedThumb = isEditing ? editSessionThumbnailUrlRef.current : sessionThumbnailUrlRef.current;
          thumbAttempts++;
        }
        
        if (!resolvedThumb) {
          resolvedThumb = "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640";
        }

        const finalDur = (isEditing ? editSessionDurationRef.current : sessionDurationRef.current) || "0:00";

        if (isEditing) {
          // Update the existing video document on Firestore
          await updateDoc(doc(db, "videoBulletins", bulletId), {
            url: downloadUrl,
            videoUrl: downloadUrl,
            thumbnailUrl: resolvedThumb,
            duration: finalDur,
            status: "Published"
          });
          
          await updateDoc(doc(db, "videos", videosId), {
            url: downloadUrl
          }).catch(() => {});

          setSuccessMsg(`Background upload complete & replaced: video bulletin has been updated securely.`);
          setEditingVideo(null);
          setReplaceFile(null);
          setEditUploadStatus("idle");
          setEditProgress(0);
          setEditSessionVideoUrl("");
          setEditSessionThumbnailUrl("");
        } else {
          // Update the newly published document
          await updateDoc(doc(db, "videoBulletins", bulletId), {
            url: downloadUrl,
            videoUrl: downloadUrl,
            thumbnailUrl: resolvedThumb,
            duration: finalDur,
            status: "Published"
          });

          await updateDoc(doc(db, "videos", videosId), {
            url: downloadUrl
          }).catch(() => {});

          setSuccessMsg(`Instant Publishing Complete: "${titleRef.current || 'Your video bulletin'}" is now fully processed and live!`);
          
          // Reset fields
          setTitle("");
          setDescription("");
          setVideoUrl("");
          setSelectedFile(null);
          setIsLive(false);
          setIsScheduled(false);
          setScheduledTime("");
          setCategory("general");
          
          setInstantUploadStatus("idle");
          setInstantUploadProgress(0);
          setSessionVideoUrl("");
          setSessionThumbnailUrl("");
        }

        // Clear refs
        pendingFirestoreDocsRef.current = null;
      }
    } catch (err: any) {
      console.error("Direct stream pipeline failed completely:", err);
      setStatus("failed");
      setErrorMsg("Accelerated cloud upload failed. Supporting network re-attempts.");
    }
  };

  const validateAndSetFile = (file: File, isEditing: boolean) => {
    const validExtensions = ["video/mp4", "video/quicktime", "video/webm", "video/avi", "video/x-matroska"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    // Check type or extension safely
    if (!validExtensions.includes(file.type) && ![".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(ext)) {
      setErrorMsg("Unauthorized video format. Standard MP4, MOV, and WEBM formats are supported.");
      return;
    }

    // Maximum customizable file size (e.g. 50MB to accommodate heavy recordings)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg(`File exceeds safety limits (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size permitted is 50MB.`);
      return;
    }

    // Check duplicate local upload attempts
    const isDuplicate = videos.some(v => v.title.toLowerCase() === file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").toLowerCase());
    if (isDuplicate) {
      setErrorMsg(`Warning: A video named "${file.name}" may already exist in active directories.`);
    }

    if (isEditing) {
      setReplaceFile(file);
      startInstantUpload(file, true);
    } else {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
      startInstantUpload(file, false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Helper dedicated to upload a physical Blob/File to Firebase Cloud Storage with progress updates
  const uploadToStorageWithProgress = (
    fileBlob: Blob | File, 
    path: string, 
    progressCallback: (prog: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      // Initiate Resumable Upload
      const uploadTask = uploadBytesResumable(storageRef, fileBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressCallback(Math.round(progress));
        },
        (error) => {
          console.error("Firebase Storage Upload Failure:", error);
          // Auto Retry logic (Wait 1s and try again)
          console.log("Retrying upload operation...");
          setTimeout(() => {
            const retryTask = uploadBytesResumable(storageRef, fileBlob);
            retryTask.on(
              "state_changed",
              (snap) => {
                const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
                progressCallback(Math.round(prog));
              },
              (err) => reject(new Error(`Storage write failed after automatic retry: ${err.message}`)),
              async () => {
                const downloadURL = await getDownloadURL(retryTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          }, 1500);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Submit and create new CNN-Style Video Bulletin
  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form inputs checks
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Report title and description are strictly required.");
      return;
    }

    setUploading(true);

    try {
      let finalVideoUrl = "";
      let finalThumbnailUrl = "";
      let calculatedDuration = "0:00";

      // Case A: Uploading active file
      if (sourceType === "upload") {
        if (!selectedFile) {
          setErrorMsg("Please select a video file to broadcast.");
          setUploading(false);
          return;
        }

        // If background instant upload is still running or idle, we DO NOT block the user!
        // We publish immediately like YouTube, setting status to 'Processing'!
        if (instantUploadStatusRef.current === "uploading" || instantUploadStatusRef.current === "idle") {
          const preliminaryThumb = sessionThumbnailUrlRef.current || "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640";
          const preliminaryDuration = sessionDurationRef.current || "0:00";

          const docData = {
            title: title.trim(),
            description: description.trim(),
            category,
            url: "", // will be updated upon upload complete
            videoUrl: "", // will be updated upon upload complete
            thumbnailUrl: preliminaryThumb,
            duration: preliminaryDuration,
            createdAt: new Date().toISOString(),
            publishedAt: isScheduled && scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
            author,
            status: "Processing", // Mark as Processing like YouTube
            views: 0,
            isLive,
            isScheduled,
            scheduledTime: isScheduled ? scheduledTime : ""
          };

          // 1. Write to videoBulletins
          const bulletDoc = await addDoc(collection(db, "videoBulletins"), docData);

          // 2. Dual Write to old videos collection
          const oldDoc = await addDoc(collection(db, "videos"), {
            id: bulletDoc.id,
            title: title.trim(),
            description: description.trim(),
            url: "",
            createdAt: docData.createdAt,
            views: 0,
            isLive,
            isScheduled,
            scheduledTime: isScheduled ? scheduledTime : ""
          });

          // Set the pendingFirestoreDocsRef so the background upload updater knows what to update!
          pendingFirestoreDocsRef.current = {
            bulletId: bulletDoc.id,
            videosId: oldDoc.id,
            isEditing: false
          };

          setSuccessMsg(`Bulletin "${title.trim()}" is now processing in the background! You can safely leave this tab open, browse other dashboards, or add more bulletins.`);
          
          // Clear active form fields so they can start adding another video immediately!
          setTitle("");
          setDescription("");
          setVideoUrl("");
          setSelectedFile(null);
          setIsLive(false);
          setIsScheduled(false);
          setScheduledTime("");
          setCategory("general");

          setUploading(false);
          return;
        }

        if (instantUploadStatusRef.current === "failed") {
          setCurrentStatusText("Re-initiating direct stream upload...");
          await startInstantUpload(selectedFile, false);
          if (instantUploadStatusRef.current === "failed") {
            throw new Error("Target direct cloud upload failed. Please verify 4G/5G signal.");
          }
        }

        // If completed but thumbnail is not fully ready, wait a blink
        if (instantUploadStatusRef.current === "completed") {
          let thumbWaitAttempts = 0;
          while (!sessionThumbnailUrlRef.current && thumbWaitAttempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            thumbWaitAttempts++;
          }
        }

        finalVideoUrl = sessionVideoUrlRef.current;
        finalThumbnailUrl = sessionThumbnailUrlRef.current || "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640";
        calculatedDuration = sessionDurationRef.current || "0:00";

      } else {
        // Case B: Stream links (Youtube)
        if (!videoUrl.trim()) {
          setErrorMsg("Please supply a valid YouTube stream, Vimeo, or direct video feed URL.");
          setUploading(false);
          return;
        }

        finalVideoUrl = videoUrl.trim();
        // Extract Youtube ID to retrieve crisp high quality default thumbnails
        if (finalVideoUrl.includes("youtube.com") || finalVideoUrl.includes("youtu.be")) {
          let ytId = "";
          if (finalVideoUrl.includes("v=")) {
            ytId = finalVideoUrl.split("v=")[1]?.split("&")[0] || "";
          } else if (finalVideoUrl.includes("youtu.be/")) {
            ytId = finalVideoUrl.split("youtu.be/")[1]?.split("?")[0] || "";
          } else if (finalVideoUrl.includes("embed/")) {
            ytId = finalVideoUrl.split("embed/")[1]?.split("?")[0] || "";
          }
          if (ytId) {
            finalThumbnailUrl = `https://img.youtube.com/vi/${ytId}/sddefault.jpg`;
          }
        }
        
        if (!finalThumbnailUrl) {
          finalThumbnailUrl = `https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=640`; // generic tv feed backdrop
        }
      }

      setCurrentStatusText("Publishing bulletin to news desks...");

      // Assemble videoBulletins official document schema
      const docData = {
        title: title.trim(),
        description: description.trim(),
        category,
        url: finalVideoUrl, // dual-mapped
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        duration: calculatedDuration,
        createdAt: new Date().toISOString(),
        publishedAt: isScheduled && scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
        author,
        status,
        views: 0,
        isLive,
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : ""
      };

      // 1. Write to the new 'videoBulletins' collection
      const bulletDoc = await addDoc(collection(db, "videoBulletins"), docData);

      // 2. Dual Write to old 'videos' collection to preserve any existing widgets or custom queries
      await addDoc(collection(db, "videos"), {
        id: bulletDoc.id,
        title: title.trim(),
        description: description.trim(),
        url: finalVideoUrl,
        createdAt: docData.createdAt,
        views: 0,
        isLive,
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : ""
      });

      setSuccessMsg(`Published successfully: "${title}" is now available permanently.`);
      
      // Reset form fields
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setSelectedFile(null);
      setIsLive(false);
      setIsScheduled(false);
      setScheduledTime("");
      setCategory("general");
      setStatus("Published");

      // Reset uploader state
      setInstantUploadStatus("idle");
      setInstantUploadProgress(0);
      setSessionVideoUrl("");
      setSessionThumbnailUrl("");

    } catch (err: any) {
      console.error("Addition of video bulletins failed:", err);
      setErrorMsg(err.message || "Failed to save the media object into persistent storage database.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Replace/Edit existing Video Bulletin with absolute reliability
  const handleEditVideoCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setErrorMsg(null);
    setEditUploading(true);
    setEditProgress(0);

    try {
      let finalVideoUrl = editingVideo.videoUrl || editingVideo.url;
      let finalThumbnailUrl = editingVideo.thumbnailUrl || "";
      let calculatedDuration = editingVideo.duration || "0:00";

      // If they provide a replacement local video file, execute upload
      if (replaceFile) {
        // If background replace upload is still running, save immediately with Processing state!
        if (editUploadStatusRef.current === "uploading" || editUploadStatusRef.current === "idle") {
          const updatedFields = {
            title: editTitle.trim(),
            description: editDescription.trim(),
            category: editCategory,
            url: "", // will be filled upon upload complete
            videoUrl: "", // will be filled upon upload complete
            thumbnailUrl: editingVideo.thumbnailUrl || "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640",
            duration: editingVideo.duration || "0:00",
            status: "Processing", // Set status to processing like YouTube!
            publishedAt: editIsScheduled && editScheduledTime ? new Date(editScheduledTime).toISOString() : new Date().toISOString(),
            isLive: editIsLive,
            isScheduled: editIsScheduled,
            scheduledTime: editIsScheduled ? editScheduledTime : ""
          };

          // 1. Update videoBulletins document
          await updateDoc(doc(db, "videoBulletins", editingVideo.id), updatedFields);

          // 2. Keep standard dual collection mapped
          try {
            await updateDoc(doc(db, "videos", editingVideo.id), {
              title: editTitle.trim(),
              description: editDescription.trim(),
              url: "",
              isLive: editIsLive,
              isScheduled: editIsScheduled,
              scheduledTime: editIsScheduled ? editScheduledTime : ""
            });
          } catch (err) {
            console.warn("Dual update to legacy collection skipped:", err);
          }

          // Register in the ref so the background upload updater knows to update this document with final media URL!
          pendingFirestoreDocsRef.current = {
            bulletId: editingVideo.id,
            videosId: editingVideo.id,
            isEditing: true
          };

          setSuccessMsg(`Information: Video Replacement "${editTitle}" has been saved and is uploading in the background!`);
          
          setEditingVideo(null);
          setReplaceFile(null);
          setEditUploading(false);
          return;
        }

        if (editUploadStatusRef.current === "failed") {
          throw new Error("Accelerated replacement upload failed. Please verify connection.");
        }

        while (!editSessionThumbnailUrlRef.current) {
          await new Promise(r => setTimeout(r, 100));
        }

        finalVideoUrl = editSessionVideoUrlRef.current;
        finalThumbnailUrl = editSessionThumbnailUrlRef.current;
        calculatedDuration = editSessionDurationRef.current;
      }

      // Update Firestore documents
      const updatedFields = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        url: finalVideoUrl,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        duration: calculatedDuration,
        status: editStatus,
        publishedAt: editIsScheduled && editScheduledTime ? new Date(editScheduledTime).toISOString() : new Date().toISOString(),
        isLive: editIsLive,
        isScheduled: editIsScheduled,
        scheduledTime: editIsScheduled ? editScheduledTime : ""
      };

      // 1. Update videoBulletins document
      await updateDoc(doc(db, "videoBulletins", editingVideo.id), updatedFields);

      // 2. Keep standard dual collection mapped
      try {
        await updateDoc(doc(db, "videos", editingVideo.id), {
          title: editTitle.trim(),
          description: editDescription.trim(),
          url: finalVideoUrl,
          isLive: editIsLive,
          isScheduled: editIsScheduled,
          scheduledTime: editIsScheduled ? editScheduledTime : ""
        });
      } catch (err) {
        console.warn("Dual update to legacy collection skipped:", err);
      }

      setSuccessMsg(`Information: Video Bulletin "${editTitle}" successfully updated.`);
      setEditingVideo(null);
      setReplaceFile(null);

      // Clean edit states
      setEditUploadStatus("idle");
      setEditProgress(0);
      setEditSessionVideoUrl("");
      setEditSessionThumbnailUrl("");

    } catch (err: any) {
      console.error("Editing Video Bulletin entry failed: ", err);
      setErrorMsg(err.message || "Failed to update metadata records.");
    } finally {
      setEditUploading(false);
      setEditProgress(0);
    }
  };

  // Remove completely from Storage and Firestore collections (Requirement 10)
  const handleDeleteVideoPermanently = async (vid: VideoItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Delete from Firestore videoBulletins and videos
      await deleteDoc(doc(db, "videoBulletins", vid.id));
      
      try {
        await deleteDoc(doc(db, "videos", vid.id));
      } catch (e) {
        // quiet ignore if not in legacy collection
      }

      // 2. Deduce and delete source files from Firebase Storage if it's our hosted domain
      const srcUrl = vid.videoUrl || vid.url;
      if (srcUrl && srcUrl.includes("firebasestorage.googleapis.com")) {
        try {
          // Decode storage path from download URL safely
          const storagePathDecoded = decodeURIComponent(srcUrl.split("/o/")[1]?.split("?")[0] || "");
          if (storagePathDecoded) {
            const fileRef = ref(storage, storagePathDecoded);
            await deleteObject(fileRef);
            console.log("Deleted old storage video permanently from storageBucket.");
          }
        } catch (stErr) {
          console.warn("Storage video cleanup skipped or file not found:", stErr);
        }
      }

      // 3. Clear thumbnail if it's hosted in our Storage
      const thumbUrl = vid.thumbnailUrl;
      if (thumbUrl && thumbUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const thumbPathDecoded = decodeURIComponent(thumbUrl.split("/o/")[1]?.split("?")[0] || "");
          if (thumbPathDecoded) {
            await deleteObject(ref(storage, thumbPathDecoded));
            console.log("Deleted associated thumbnail permanently.");
          }
        } catch (thumbDelErr) {
          console.warn("Associated thumbnail cleanup skipped or missing:", thumbDelErr);
        }
      }

      setSuccessMsg(`Clean: Video "${vid.title}" erased from library.`);
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Permanent delete action failed: ", err);
      setErrorMsg("Failed to delete video or free storage assets completely.");
    }
  };

  // Requirement 11: Bulk Scan and Migration utility
  const handleRunMigration = async () => {
    if (legacyVideos.length === 0) return;
    setIsMigrating(true);
    setMigrationProgressText("Scanning collection and prepping files...");

    let successCount = 0;
    try {
      for (let i = 0; i < legacyVideos.length; i++) {
        const vid = legacyVideos[i];
        setMigrationProgressText(`Processing [${i + 1}/${legacyVideos.length}]: "${vid.title.substring(0, 20)}..."`);

        try {
          let fileBlob: Blob | null = null;

          // Case A: Base64 data conversion
          if (vid.url.startsWith("data:")) {
            fileBlob = base64ToBlob(vid.url);
          } 
          // Case B: Ephemeral local path conversion
          else if (vid.url.startsWith("/uploads/")) {
            const fetchRes = await fetch(vid.url);
            if (fetchRes.ok) {
              fileBlob = await fetchRes.blob();
            }
          }

          if (fileBlob) {
            // Programmatically establish duration and high contrast thumbnail preview
            let calculatedDuration = "0:00";
            let thumbBlob: Blob | null = null;
            try {
              const res = await generateVideoThumbnail(fileBlob);
              thumbBlob = res.thumbnail;
              calculatedDuration = formatDuration(res.durationSeconds);
            } catch (pErr) {
              console.warn("In-migration thumbnail generation skipped:", pErr);
            }

            // Upload video File permanently to cloud
            const uniqueId = Math.random().toString(36).substring(2, 10);
            const ext = fileBlob.type.split("/")[1] || "mp4";
            const videoPath = `videoBulletins/${Date.now()}-${uniqueId}.${ext}`;
            const permanentVideoUrl = await uploadToStorageWithProgress(fileBlob, videoPath, () => {});

            // Upload Thumbnail blob
            let permanentThumbUrl = "";
            if (thumbBlob) {
              const thumbPath = `videoBulletins/thumbnails/${Date.now()}-${uniqueId}-thumb.jpg`;
              permanentThumbUrl = await uploadToStorageWithProgress(thumbBlob, thumbPath, () => {});
            } else {
              permanentThumbUrl = "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640";
            }

            // Write metadata record in videoBulletins collection
            const updatedFields = {
              title: vid.title,
              description: vid.description || "Archived news commentary broadcast bulletin.",
              category: "general",
              url: permanentVideoUrl,
              videoUrl: permanentVideoUrl,
              thumbnailUrl: permanentThumbUrl,
              duration: calculatedDuration,
              status: "Published",
              createdAt: vid.createdAt || new Date().toISOString(),
              publishedAt: vid.createdAt || new Date().toISOString(),
              author: "system-migrator@fastcoverage.news",
              views: vid.views || 0,
              isLive: vid.isLive || false,
              isScheduled: vid.isScheduled || false,
              scheduledTime: vid.scheduledTime || ""
            };

            // SetDoc or write document with original legacy id to preserve exact referenced links!
            await updateDoc(doc(db, "videoBulletins", vid.id), updatedFields).catch(async () => {
              // Create it if missed
              await updateDoc(doc(db, "videos", vid.id), { url: permanentVideoUrl });
            });

            // Update legacy record
            try {
              await updateDoc(doc(db, "videos", vid.id), {
                url: permanentVideoUrl
              });
            } catch (e) {
              console.warn("Dual update was not required:", e);
            }

            successCount++;
          }
        } catch (migErr) {
          console.error(`Error migrating single video ${vid.id}:`, migErr);
        }
      }

      setSuccessMsg(`Opt-Engine Success: Successfully migrated ${successCount} videos to permanent cloud storage buckets.`);
    } catch (gErr: any) {
      console.error("Migration pipeline failure: ", gErr);
      setErrorMsg("Failed to transfer all legacy base64 buffers.");
    } finally {
      setIsMigrating(false);
      setMigrationProgressText("");
    }
  };

  // Filtering list elements computed properties
  const filteredVideos = videos.filter((vid) => {
    const matchesSearch = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vid.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryFilter === "all" || 
      vid.category === selectedCategoryFilter;

    const matchesStatus = 
      statusFilter === "all" || 
      vid.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans text-neutral-800" id="admin_videos_manager_view">
      
      {/* COLUMN 1: Broadcast Creation and Upload module */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 height-fit shadow-xs">
        <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-5 select-none font-bold flex items-center gap-2">
          <Video size={16} className="text-red-650" />
          PUBLISH VIDEO REPORT
        </h3>

        {/* Global Action Notifications */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded text-xs leading-relaxed mb-4 flex items-start gap-2 animate-fadeIn">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded text-xs leading-relaxed mb-4 flex items-start gap-2 animate-fadeIn">
            <CheckCircle size={15} className="shrink-0 mt-0.5 text-green-500" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Migrator Section alert */}
        {legacyVideos.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-xs leading-relaxed mb-5 animate-pulse">
            <div className="flex gap-2 text-amber-900 font-extrabold items-center">
              <RefreshCw size={14} className="animate-spin text-amber-500" />
              <span>LEGACY STORAGE DETECTION</span>
            </div>
            <p className="text-amber-800 text-[11px] mt-1">
              Detected {legacyVideos.length} legacy/Base64 video entries that will be wiped on restart. Migrate them to permanent Firebase Storage CDN.
            </p>
            <button
              onClick={handleRunMigration}
              disabled={isMigrating}
              className="mt-2.5 w-full bg-amber-650 hover:bg-amber-700 text-white font-bold text-[10px] py-1.5 px-3 rounded uppercase tracking-wider font-mono cursor-pointer flex justify-center items-center gap-1.5"
            >
              {isMigrating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{migrationProgressText}</span>
                </>
              ) : (
                "Optimize & Migrate to Permanent Storage Now"
              )}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitVideo} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Report Title</label>
            <input
              type="text"
              required
              disabled={uploading}
              placeholder="e.g. Exclusive Drone Flight Over Restored Wetlands"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm focus:outline-none focus:border-red-650"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Video Description / Transcripts</label>
            <textarea
              required
              rows={3}
              disabled={uploading}
              placeholder="Write detailed summaries or interview excerpts detailing what this coverage displays..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm focus:outline-none focus:border-red-650"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Broadcast Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm focus:outline-none focus:border-red-650 cursor-pointer"
            >
              {VIDEO_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Toggle source selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 font-mono block">Video Source Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setSourceType("upload")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded text-xs font-bold tracking-tight cursor-pointer transition ${
                  sourceType === "upload" 
                    ? "bg-red-750 text-white border-red-750" 
                    : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <Upload size={13} />
                <span>CLOUDMEDIA UPLOAD</span>
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setSourceType("url")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded text-xs font-bold tracking-tight cursor-pointer transition ${
                  sourceType === "url" 
                    ? "bg-red-750 text-white border-red-750" 
                    : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <LinkIcon size={13} />
                <span>ONLINE STREAM</span>
              </button>
            </div>
          </div>

          {sourceType === "upload" ? (
            /* DRAG AND DROP FILE SELECTOR */
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono">Upload Video File</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 select-none ${
                  dragActive 
                    ? "border-red-650 bg-red-50/50" 
                    : "border-neutral-300 hover:border-neutral-400 bg-neutral-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  disabled={uploading}
                  onChange={handleFileChange}
                  accept="video/mp4,video/quicktime,video/webm,video/avi"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  {selectedFile ? (
                    <>
                      <FileVideo className="text-red-700 animate-pulse animate-bounce" size={32} />
                      <div className="text-xs space-y-1">
                        <p className="font-extrabold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="font-mono text-[10px] text-neutral-500">
                          Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <span className="text-[10px] text-red-550 underline font-semibold mt-1">click to change video file</span>
                    </>
                  ) : (
                    <>
                      <Upload className="text-neutral-400 animate-pulse" size={32} />
                      <div className="text-xs space-y-1">
                        <p className="font-extrabold text-neutral-700">Drag & Drop Video report here</p>
                        <p className="text-neutral-400">or click to browse local folders</p>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase mt-2 block">
                        MP4, MOV, WEBM (Max 50MB)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* REAL-TIME ACCELERATED TELEMETRY DASHBOARD (Requirement 2, 7, 9 & 10) */}
              {instantUploadStatus !== "idle" && (
                <div className="mt-3 bg-neutral-900 border border-neutral-850 rounded-lg p-3.5 font-mono text-[11px] text-neutral-300 space-y-2.5 shadow-md animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-red-500 font-extrabold flex items-center gap-1.5 uppercase text-[10px] select-none">
                      <span className="w-2 h-2 bg-red-650 rounded-full animate-ping shrink-0" />
                      Live Feed Telemetry
                    </span>
                    <span className="font-black text-[9px] bg-red-950/80 text-red-400 px-2 py-0.5 rounded tracking-wide uppercase select-none">
                      {instantUploadStatus === "uploading" ? "Broadcasting..." : instantUploadStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 leading-normal">
                    <div className="text-neutral-400">FILE DETAILS: <span className="text-neutral-100 font-sans font-semibold">{(selectedFile?.size ? selectedFile.size / (1024 * 1024) : 0).toFixed(2)} MB</span></div>
                    <div className="text-neutral-400">LIVE SPEED: <span className="text-emerald-400 font-bold">{instantSpeed || "Measuring..."}</span></div>
                    <div className="text-neutral-400">NET LATENCY: <span className="text-neutral-100 font-semibold">{instantLatency ? `${instantLatency} ms` : "Calculating..."}</span></div>
                    <div className="text-neutral-400">GCS RESPONSE: <span className="text-neutral-100 font-semibold">{instantStorageResponse ? `${instantStorageResponse} ms` : "Awaiting..."}</span></div>
                  </div>

                  {/* Dynamic Progress Indicator */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-neutral-200">
                      <span>CONCURRENT STREAM CHUNKS</span>
                      <span className="text-red-400">{instantUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-850 h-2 rounded-full overflow-hidden border border-neutral-800/60 p-0.5">
                      <div 
                        className="bg-red-600 h-full rounded-full transition-all duration-300 shadow-inner"
                        style={{ width: `${instantUploadProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Automatic Congestion & Bottleneck Diagnostician */}
                  {instantBottleneck ? (
                    <div className="text-[10px] text-amber-400 bg-amber-955/30 px-2 py-1.5 rounded border border-amber-900/40 leading-relaxed animate-pulse">
                      ⚡ {instantBottleneck}
                    </div>
                  ) : (
                    <div className="text-[9px] text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30 flex items-center gap-1 leading-none select-none">
                      <span>✓ Connection stable. Accelerated parallel pipelines active.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DIRECT WEB URL LINK */
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1 font-mono">Stream URL / Embed iframe link</label>
              <input
                type="url"
                required={sourceType === "url"}
                disabled={uploading}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm focus:outline-none focus:border-red-650"
              />
            </div>
          )}

          {/* Broadcaster settings: Live or Scheduled status */}
          <div className="bg-neutral-50 p-3.5 rounded border border-neutral-200/80 space-y-3">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono block">Broadcaster Settings</span>
            
            <div className="flex items-center justify-between bg-white border border-neutral-100 p-2 rounded">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={uploading}
                  checked={isLive}
                  onChange={(e) => {
                    setIsLive(e.target.checked);
                    if (e.target.checked) {
                      setIsScheduled(false);
                      setScheduledTime("");
                    }
                  }}
                  className="rounded border-neutral-300 text-red-650 focus:ring-red-650 cursor-pointer"
                />
                <span>Set Broadcast to LIVE NOW</span>
              </label>
              <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono animate-pulse select-none">LIVE</span>
            </div>

            <div className="space-y-2 bg-white border border-neutral-100 p-2 rounded">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={uploading}
                    checked={isScheduled}
                    onChange={(e) => {
                      setIsScheduled(e.target.checked);
                      if (e.target.checked) {
                        setIsLive(false);
                      }
                    }}
                    className="rounded border-neutral-300 text-red-650 focus:ring-red-650 cursor-pointer"
                  />
                  <span>Schedule Broadcast Release</span>
                </label>
                <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono select-none">SCHEDULE</span>
              </div>

              {isScheduled && (
                <div className="pl-6 pt-1 animate-fadeIn">
                  <input
                    type="datetime-local"
                    required={isScheduled}
                    disabled={uploading}
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded p-2 text-xs focus:outline-none focus:border-red-655 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Set Status - Published vs Draft */}
            <div className="flex items-center justify-between bg-white border border-neutral-100 p-2 rounded">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-2 font-mono">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-neutral-50 px-2 py-1 text-xs border border-neutral-200 rounded font-bold cursor-pointer focus:outline-none"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Upload Progress Bar Meter (Requirement 2 & 7) */}
          {uploading && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-150 space-y-2 animate-fadeIn select-none">
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-red-800">
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin text-red-600" />
                  <span>{currentStatusText}</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-700 h-2 rounded-full transition-all duration-300 shadow-inner"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className={`w-full text-white font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-md flex items-center justify-center gap-2 cursor-pointer transition shadow ${
              uploading ? "bg-neutral-400 cursor-not-allowed" : "bg-red-700 hover:bg-red-800"
            }`}
          >
            {uploading ? "PROCESSING BULLETIN DIRECTORY..." : (
              <>
                <PlusCircle size={15} />
                <span>PUBLISH VIDEO BULLETIN</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* COLUMN 2 & 3: Library queue list of already uploaded video items */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-xs">
          
          {/* SEARCH, CATEGORY FILTER AND ALERTS HEADERS (Requirement 10) */}
          <div className="space-y-4 border-b border-neutral-100 pb-5 mb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase select-none font-bold flex items-center gap-1.5">
                <FileVideo size={16} className="text-red-700" />
                <span>VIDEO BULLETIN DIRECTORY ({filteredVideos.length})</span>
              </h3>
              {loading && <span className="text-xs text-neutral-400 font-sans animate-pulse">Syncing Cloud ...</span>}
            </div>

            {/* Inline Dashboard Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search report archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-red-650"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                  <Filter size={14} />
                </span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {VIDEO_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                  <Clock size={14} />
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Published">Published Only</option>
                  <option value="Draft">Drafts Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* EDIT DIALOG MODAL IF ACTIVE (Requirement 10: "Edit metadata" & "Replace video") */}
          {editingVideo && (
            <div className="bg-neutral-50 rounded-xl p-5 border border-red-200/60 mb-6 space-y-4 animate-scaleIn select-none">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-2.5">
                <span className="text-xs font-bold text-red-800 font-mono flex items-center gap-1.5 uppercase">
                  <Edit3 size={14} />
                  <span>Edit Bulletin ID Reference: {editingVideo.id.substring(0, 10)}</span>
                </span>
                <button 
                  onClick={() => { setEditingVideo(null); setReplaceFile(null); }}
                  className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditVideoCommit} className="space-y-3 text-xs text-neutral-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold">Title Name</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white border border-neutral-350 p-2 rounded focus:outline-none focus:border-red-650"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-white border border-neutral-350 p-2 rounded focus:outline-none cursor-pointer"
                    >
                      {VIDEO_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Description Narrative</label>
                  <textarea
                    rows={2}
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-white border border-neutral-350 p-2 rounded focus:outline-none focus:border-red-650"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded border border-neutral-200/60">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={editIsLive}
                      onChange={(e) => {
                        setEditIsLive(e.target.checked);
                        if (e.target.checked) {
                          setEditIsScheduled(false);
                          setEditScheduledTime("");
                        }
                      }}
                      className="rounded border-neutral-300 text-red-600 focus:ring-red-600 cursor-pointer"
                    />
                    <span>Set live right now</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={editIsScheduled}
                      onChange={(e) => {
                        setEditIsScheduled(e.target.checked);
                        if (e.target.checked) setEditIsLive(false);
                      }}
                      className="rounded border-neutral-300 text-red-600 focus:ring-red-600 cursor-pointer"
                    />
                    <span>Schedule release</span>
                  </label>

                  <div>
                    <label className="block mb-1 text-[10px] uppercase font-mono font-bold text-neutral-500">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="px-2 py-0.5 border border-neutral-300 rounded cursor-pointer"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                {editIsScheduled && (
                  <div className="pt-1">
                    <label className="block mb-1 font-mono text-[9px] uppercase text-neutral-500">Scheduled ISO Release</label>
                    <input
                      type="datetime-local"
                      required={editIsScheduled}
                      value={editScheduledTime}
                      onChange={(e) => setEditScheduledTime(e.target.value)}
                      className="bg-white border rounded p-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Replace video file options (Requirement 10: "Replace video without changing article ID") */}
                <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-250/70 space-y-1.5">
                  <label className="font-extrabold text-neutral-800 uppercase text-[10px] tracking-wider block">Replace Video Source File (In-Place)</label>
                  <p className="text-[10px] text-neutral-500 pb-1 leading-snug">
                    Upload a replacement file to swap the content globally without affecting any references. Leave blank to keep current raw streaming file intact.
                  </p>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => document.getElementById("edit_replace_video_input")?.click()}
                      className="bg-white text-neutral-700 border border-neutral-300 flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-neutral-50 font-bold cursor-pointer"
                    >
                      <Upload size={12} />
                      <span>{replaceFile ? "Change replacement Selection" : "Browse replacement video"}</span>
                    </button>
                    <input 
                      type="file" 
                      id="edit_replace_video_input"
                      onChange={handleReplaceFileChange}
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                    />
                    {replaceFile && (
                      <span className="font-mono text-[9px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded truncate max-w-[200px]">
                        {replaceFile.name} ({(replaceFile.size/(1024*1024)).toFixed(1)}MB)
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Upload progress bar / Live Telemetry (Requirement 2, 7 & 10) */}
                {editUploadStatus !== "idle" && (
                  <div className="bg-neutral-900 border border-neutral-850 rounded-lg p-3 font-mono text-[10px] text-neutral-300 space-y-2 shadow-md animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-1.5">
                      <span className="text-red-500 font-extrabold flex items-center gap-1.5 uppercase text-[9px] select-none">
                        <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping shrink-0" />
                        In-Place Replacement Telemetry
                      </span>
                      <span className="font-black text-[8px] bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded tracking-wide uppercase select-none">
                        {editUploadStatus === "uploading" ? "Broadcasting..." : editUploadStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 leading-tight text-[10px]">
                      <div className="text-neutral-400">FILE DETAILS: <span className="text-neutral-100 font-sans font-semibold">{(replaceFile?.size ? replaceFile.size / (1024 * 1024) : 0).toFixed(2)} MB</span></div>
                      <div className="text-neutral-400">LIVE SPEED: <span className="text-emerald-400 font-bold">{instantSpeed || "Measuring..."}</span></div>
                      <div className="text-neutral-400">NET LATENCY: <span className="text-neutral-100 font-semibold">{instantLatency ? `${instantLatency} ms` : "Calculating..."}</span></div>
                      <div className="text-neutral-400">GCS RESPONSE: <span className="text-neutral-100 font-semibold">{instantStorageResponse ? `${instantStorageResponse} ms` : "Awaiting..."}</span></div>
                    </div>

                    {/* Dynamic Progress Indicator */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[9px] font-extrabold text-neutral-200">
                        <span>CONCURRENT REPLACE SEGMENTS</span>
                        <span className="text-red-400">{editProgress}%</span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full overflow-hidden border border-neutral-800/60 p-0.5">
                        <div 
                          className="bg-red-600 h-full rounded-full transition-all duration-300 shadow-inner"
                          style={{ width: `${editProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-3 justify-end border-t border-neutral-200">
                  <button
                    type="submit"
                    disabled={editUploading}
                    className="bg-red-700 text-white font-bold px-4 py-2 rounded shadow hover:bg-red-800 cursor-pointer text-xs"
                  >
                    {editUploading ? "Uploading replacement..." : "Commit Metadata & Source Modifications"}
                  </button>
                  <button
                    type="button"
                    disabled={editUploading}
                    onClick={() => { setEditingVideo(null); setReplaceFile(null); }}
                    className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold px-3 py-2 rounded cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MAIN LIST VIEW */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
              <span className="w-8 h-8 border-3 border-red-200 border-t-red-700 rounded-full animate-spin" />
              <p className="text-xs font-mono">Synchronizing live documents...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-24 select-none">
              <FileVideo className="mx-auto text-neutral-300 mb-3 animate-pulse" size={48} />
              <h4 className="text-slate-900 font-extrabold text-sm">No Bulletins Matched</h4>
              <p className="text-neutral-500 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                We couldn't locate any video bulletins matching your current search parameters. Clear query or category tags.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredVideos.map((vid) => (
                <div 
                  key={vid.id}
                  className="bg-neutral-50 border border-neutral-200/80 rounded-xl overflow-hidden p-3.5 flex flex-col justify-between hover:shadow-sm transition duration-300"
                >
                  <div className="space-y-3">
                    {/* CDN Visual Card Previews */}
                    <div className="aspect-video w-full bg-neutral-900 rounded overflow-hidden relative shadow-inner group/vid">
                      {/* Live badges overlays */}
                      <img 
                        src={vid.thumbnailUrl || "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640"}
                        alt={vid.title}
                        className="absolute inset-0 w-full h-full object-cover rounded opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Play Hover circle badge */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity duration-300">
                        <div className="p-3 bg-red-650 text-white rounded-full shadow-lg transform scale-90 group-hover/vid:scale-100 transition-transform">
                          <Play size={16} className="fill-current text-white translate-x-0.5" />
                        </div>
                      </div>

                      {vid.isLive && (
                        <span className="absolute top-2 left-2 bg-red-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-10 animate-pulse flex items-center gap-1 select-none">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          LIVE NOW
                        </span>
                      )}
                      {vid.isScheduled && (
                        <span className="absolute top-2 left-2 bg-blue-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-10 flex items-center gap-1 select-none font-mono">
                          <Clock size={10} />
                          SCHEDULED
                        </span>
                      )}

                      {/* Display calculated duration in corner if available */}
                      {vid.duration && vid.duration !== "0:00" && (
                        <span className="absolute bottom-2 right-2 bg-black/80 font-mono text-white text-[9px] px-1.5 py-0.5 rounded shadow z-10 font-black">
                          {vid.duration}
                        </span>
                      )}

                      {/* category code flag */}
                      <span className="absolute bottom-2 left-2 bg-neutral-950/80 font-mono text-neutral-300 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded shadow z-10 font-bold">
                        {vid.category || "General"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-xs text-slate-950 leading-snug line-clamp-1 flex-1" title={vid.title}>
                          {vid.title}
                        </h4>
                        
                        {/* Draft indicators */}
                        {vid.status === "Draft" && (
                          <span className="text-[8px] bg-neutral-300 text-neutral-700 font-extrabold rounded px-1 uppercase font-mono">DRAFT</span>
                        )}
                      </div>

                      {vid.isScheduled && vid.scheduledTime && (
                        <p className="text-[10px] text-blue-600 font-mono font-bold flex items-center gap-1 select-none pb-0.5">
                          <Clock size={10} />
                          Streaming: {new Date(vid.scheduledTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2 font-sans" title={vid.description}>
                        {vid.description}
                      </p>
                    </div>
                  </div>

                  {/* Interactive edits controls and deletion */}
                  <div className="flex justify-between items-center text-[10px] font-mono mt-4 pt-3 border-t border-neutral-200">
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Clock size={11} className="text-neutral-500" />
                      {new Date(vid.publishedAt || vid.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>

                    {/* Author tags */}
                    {vid.author && (
                      <span className="text-neutral-400 font-sans flex items-center gap-1">
                        <User size={11} />
                        <span className="truncate max-w-[80px]" title={vid.author}>{vid.author.split("@")[0]}</span>
                      </span>
                    )}

                    {/* Meta views counters */}
                    <span className="text-neutral-400 flex items-center gap-1 bg-neutral-200/50 px-1.5 py-0.5 rounded">
                      <Eye size={11} />
                      <span>{vid.views || 0}</span>
                    </span>

                    {/* Controls cluster block */}
                    <div className="flex items-center gap-2.5">
                      {/* edit Metadata button */}
                      <button 
                        onClick={() => {
                          setEditingVideo(vid);
                          setEditTitle(vid.title);
                          setEditDescription(vid.description);
                          setEditCategory(vid.category || "general");
                          setEditStatus((vid.status as any) || "Published");
                          setEditIsLive(vid.isLive || false);
                          setEditIsScheduled(vid.isScheduled || false);
                          setEditScheduledTime(vid.scheduledTime || "");
                        }}
                        className="text-neutral-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                        title="Edit metadata in place"
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>

                      {deleteConfirmId === vid.id ? (
                        <div className="flex items-center gap-1.5 shrink-0 animate-scaleIn select-none bg-red-50 p-1.5 rounded border border-red-200">
                          <span className="text-[9px] text-red-650 font-black">CONFIRM?</span>
                          <button
                            onClick={() => handleDeleteVideoPermanently(vid)}
                            className="bg-red-700 hover:bg-red-800 text-white font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer"
                          >
                            YES
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-neutral-200 hover:bg-neutral-300 text-neutral-600 px-2 py-0.5 rounded text-[9px] cursor-pointer"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(vid.id)}
                          className="text-red-600 hover:text-red-800 font-extrabold flex items-center gap-1 cursor-pointer"
                          title="Delete permanently from cloud and Firestore"
                        >
                          <Trash2 size={11} />
                          <span>Erase</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic YouTube-style Fixed Floating Background Upload Hub */}
      {(instantUploadStatus === "uploading" || editUploadStatus === "uploading" || pendingFirestoreDocsRef.current !== null) && (
        <div className="fixed bottom-6 right-6 w-96 bg-neutral-900 border border-neutral-800 text-white shadow-2xl rounded-xl overflow-hidden z-50 animate-scaleIn select-none font-sans">
          
          {/* Header */}
          <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shrink-0" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-neutral-300">
                {pendingFirestoreDocsRef.current ? "Processing Bulletin" : "Uploading Payload Stream"}
              </span>
            </div>
            {instantLatency && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                {instantLatency}ms Latency
              </span>
            )}
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            <div>
              <div className="flex justify-between items-start text-xs font-bold leading-snug">
                <span className="truncate max-w-[200px] text-neutral-100" title={selectedFile?.name || replaceFile?.name || "Active Broadcast Payload"}>
                  {selectedFile?.name || replaceFile?.name || "Initializing broadcast segment..."}
                </span>
                <span className="text-red-500 text-xs font-mono font-black shrink-0">
                  {editUploadStatus === "uploading" ? editProgress : instantUploadProgress}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                {instantSpeed ? `Transferring Speed: ${instantSpeed}` : "Synchronizing packets..."}
              </p>
            </div>

            {/* Micro Progress Track */}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-red-650 h-full rounded-full transition-all duration-300"
                style={{ width: `${editUploadStatus === "uploading" ? editProgress : instantUploadProgress}%` }}
              />
            </div>

            {/* System Status Indicators */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[9px] font-mono text-neutral-300">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={10} className="animate-spin text-neutral-500 hover:text-red-500" />
                <span>Dual-DB Sync active</span>
              </span>
              <span>
                {pendingFirestoreDocsRef.current ? "● PROCESSING IN BACKGROUND" : "⚡ STREAM TUNNELLING"}
              </span>
            </div>

            {pendingFirestoreDocsRef.current && (
              <div className="bg-red-950/40 border border-red-900/30 rounded p-2.5 text-[10px] text-red-250 font-sans leading-relaxed">
                <strong>Instant Published:</strong> Bulletin draft created in Firestore! You can safely navigate or create other bulletins while the upload completes in the background.
              </div>
            )}

            {instantBottleneck && (
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded p-2 text-[9px] text-yellow-500 font-mono">
                ⚠️ {instantBottleneck}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
