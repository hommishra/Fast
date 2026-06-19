import React, { useState, useRef, useEffect } from "react";
import { VideoItem } from "../types";
import { 
  Video, 
  Trash2, 
  Upload, 
  Link as LinkIcon, 
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
  Eye,
  FileVideo,
  Clock,
  Info
} from "lucide-react";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { generateVideoThumbnail, formatDuration, base64ToBlob } from "../utils/videoHelpers";
import { saveVideoFile } from "../indexedDB";

const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const uploadToBackendWithProgress = (
  file: File,
  adminToken: string,
  progressCallback: (prog: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Use the optimized web streaming upload endpoint with query parameters
    xhr.open("POST", `/api/admin/upload-video-binary?fileName=${encodeURIComponent(file.name)}`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${adminToken}`);
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    // Hook standard XMLHttpRequest progress listener
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        progressCallback(Math.round(percentComplete));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.url) {
            resolve(response.url);
          } else {
            reject(new Error("Server response is missing the file URL."));
          }
        } catch (e) {
          reject(new Error("Failed to parse server response as JSON."));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `Upload failed with HTTP status ${xhr.status}.`));
        } catch (e) {
          reject(new Error(`Upload failed with HTTP status ${xhr.status}.`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network connection error encountered during upload."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted by the administrator."));
    });

    xhr.send(file);
  });
};

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
  const [author, setAuthor] = useState(adminSession?.email || "admin@fastcoverage.news");

  // Publish Status configurations
  const [publishStatus, setPublishStatus] = useState<"Draft" | "Scheduled" | "Published">("Published");
  const [scheduledTime, setScheduledTime] = useState("");
  const [publishedSuccess, setPublishedSuccess] = useState<VideoItem | null>(null);
  
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

  // Edit State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editProgress, setEditProgress] = useState(0);

  // Prevent closing tab when uploading is active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading || editUploading) {
        e.preventDefault();
        e.returnValue = "Video upload is still in progress. Closing this tab will cancel the upload.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uploading, editUploading]);

  // Load active session user email if changed
  useEffect(() => {
    if (adminSession?.email) {
      setAuthor(adminSession.email);
    }
  }, [adminSession]);

  // Synchronize with database: we load from both collections or fallback
  useEffect(() => {
    setLoading(true);
    // Listen to videoBulletins collection
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

  const validateAndSetFile = (file: File, isEditing: boolean) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isVideo = file.type.startsWith("video/") || [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v", ".3gp", ".flv", ".ts", ".wmv"].includes(ext);
    
    if (!isVideo) {
      setErrorMsg("Unauthorized video format. Please upload standard video file formats (MP4, MOV, WEBM, MKV, etc.).");
      return;
    }

    const MAX_SIZE = 150 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg(`File exceeds safety limits (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size permitted is 150MB.`);
      return;
    }

    const isDuplicate = videos.some(v => v.title.toLowerCase() === file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").toLowerCase());
    if (isDuplicate) {
      setErrorMsg(`Warning: A video named "${file.name}" may already exist.`);
    }

    if (isEditing) {
      setReplaceFile(file);
    } else {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const uploadToStorageWithProgress = (
    fileBlob: Blob | File, 
    pathName: string, 
    progressCallback: (prog: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, pathName);
      const uploadTask = uploadBytesResumable(storageRef, fileBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressCallback(Math.round(progress));
        },
        (error) => {
          console.error("Firebase Storage Upload Failure, retrying:", error);
          setTimeout(() => {
            const retryTask = uploadBytesResumable(storageRef, fileBlob);
            retryTask.on(
              "state_changed",
              (snap) => {
                const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
                progressCallback(Math.round(prog));
              },
              (err) => reject(new Error(`Storage write failed after retry: ${err.message}`)),
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

  // Submit and create new Simple Video Bulletin
  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Rigorous Field and Format Validation
    if (!adminSession || !adminSession.email) {
      setErrorMsg("Security Authorization Error: Only authenticated administrator accounts are authorized to publish reports.");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Validation Error: Bulletin Title is strictly required.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Validation Error: Description / Briefing Synopsis is strictly required.");
      return;
    }

    if (!category) {
      setErrorMsg("Validation Error: Category desk selection is required.");
      return;
    }

    if (sourceType === "upload" && !selectedFile) {
      setErrorMsg("Validation Error: Broadcast Video file is required for local upload. Please drag & drop or browse a video file.");
      return;
    }

    if (sourceType === "url" && !videoUrl.trim()) {
      setErrorMsg("Validation Error: External Video Feed URL is required for stream delivery.");
      return;
    }

    if (!author) {
      setErrorMsg("Validation Error: Reporting Author desk credential could not be resolved.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let finalVideoUrl = "";
      let finalThumbnailUrl = "";
      let calculatedDuration = "0:00";

      if (sourceType === "upload") {
        const file = selectedFile!;
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase() || ".mp4";
        const videoPath = `videoBulletins/${timestamp}-${uniqueId}${ext}`;

        // Extraction Pipeline: Generate thumbnail and detect duration asynchronously
        setCurrentStatusText("Extracting video metadata & duration...");
        try {
          const result = await generateVideoThumbnail(file);
          calculatedDuration = formatDuration(result.durationSeconds);
          
          setCurrentStatusText("Uploading video thumbnail to server...");
          const thumbPath = `videoBulletins/thumbnails/${timestamp}-${uniqueId}-thumb.jpg`;
          try {
            // High-speed local write first
            const base64Data = await fileToBase64(result.thumbnail);
            const res = await fetch("/api/admin/upload-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                fileName: `${timestamp}-${uniqueId}-thumb.jpg`,
                fileData: base64Data
              })
            });
            if (res.ok) {
              const resData = await res.json();
              finalThumbnailUrl = resData.url || "";
            } else {
              throw new Error("Local backend image upload endpoint failed");
            }
          } catch (localThumbnailError) {
            console.warn("Storage thumbnail local write failed, falling back to Firebase storage:", localThumbnailError);
            try {
              finalThumbnailUrl = await uploadToStorageWithProgress(result.thumbnail, thumbPath, () => {});
            } catch (storageErr) {
              console.error("Firebase Storage thumbnail write failed:", storageErr);
            }
          }
        } catch (thumbErr) {
          console.warn("Background thumbnail/duration generation skipped:", thumbErr);
        }

        if (!finalThumbnailUrl) {
          finalThumbnailUrl = "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640";
        }

        // Upload Video File
        setCurrentStatusText("Uploading video file (0%)...");
        try {
          // Priority A: High-speed local binary streaming (super fast, perfect progress tracking)
          setCurrentStatusText("Streaming video payload to server (0%)...");
          finalVideoUrl = await uploadToBackendWithProgress(file, adminToken, (prog) => {
            setUploadProgress(prog);
            setCurrentStatusText(`Uploading video file (${prog}%)...`);
          });
        } catch (backendUploadErr: any) {
          console.warn("High-speed binary stream upload failed, falling back to Firebase Storage:", backendUploadErr);
          setCurrentStatusText("Routing to Firebase Cloud Storage (0%)...");
          setUploadProgress(0);
          try {
            finalVideoUrl = await uploadToStorageWithProgress(file, videoPath, (prog) => {
              setUploadProgress(Math.min(prog, 99));
              setCurrentStatusText(`Uploading video file (${Math.min(prog, 99)}%)...`);
            });
          } catch (storageException) {
            console.error("Firebase Storage failed, trying base64 fallback:", storageException);
            setCurrentStatusText("Invoking compatibility base64 chunker...");
            setUploadProgress(20);
            const base64Str = await fileToBase64(file);
            setUploadProgress(50);
            
            const response = await fetch("/api/admin/upload-video", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                fileName: file.name,
                fileData: base64Str
              })
            });
            
            setUploadProgress(85);
            if (!response.ok) {
              const errDetail = await response.json().catch(() => ({}));
              throw new Error(errDetail.error || `Server HTTP Error ${response.status}`);
            }
            
            const responseData = await response.json();
            if (!responseData.url) {
              throw new Error("Express upload proxy did not return valid url.");
            }
            finalVideoUrl = responseData.url;
          }
        }

        // Buffer locally in IndexedDB as a helpful benefit
        try {
          await saveVideoFile(finalVideoUrl, file);
        } catch (dbErr) {
          console.warn("Local IndexedDB storage disabled:", dbErr);
        }

      } else {
        // Stream URL Mode
        finalVideoUrl = videoUrl.trim();
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
          finalThumbnailUrl = `https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=640`;
        }
      }

      setCurrentStatusText("Verifying publishing metadata...");
      setUploadProgress(99);

      const timestampISO = new Date().toISOString();
      const isSched = publishStatus === "Scheduled";
      const actualPublishTime = isSched && scheduledTime ? new Date(scheduledTime).toISOString() : timestampISO;

      const docData = {
        title: title.trim(),
        description: description.trim(),
        category,
        url: finalVideoUrl,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        duration: calculatedDuration,
        createdAt: timestampISO,
        publishedAt: actualPublishTime,
        author,
        status: publishStatus, // "Draft" | "Scheduled" | "Published"
        views: 0,
        isLive: false,
        isScheduled: isSched,
        scheduledTime: isSched && scheduledTime ? actualPublishTime : ""
      };

      // Log verified administrative activity details securely
      console.log("SECURE ADMINISTRATIVE ACTION REPORT:", {
        action: "PUBLISH_VIDEO_REPORT",
        publisher: adminSession.email,
        role: adminSession.role || "Admin",
        sessionToken: adminSession.token ? "Verified" : "Missing",
        ipAddress: adminSession.ip || "unknown",
        title: docData.title,
        status: docData.status,
        timestamp: timestampISO
      });

      // 1. Write to 'videoBulletins' collection so it works on public page
      const bulletDoc = await addDoc(collection(db, "videoBulletins"), docData);

      // 2. Dual Write to 'videos' collection to maintain compatibility
      await addDoc(collection(db, "videos"), {
        id: bulletDoc.id,
        title: title.trim(),
        description: description.trim(),
        url: finalVideoUrl,
        createdAt: docData.createdAt,
        views: 0,
        isLive: false,
        isScheduled: isSched,
        scheduledTime: isSched && scheduledTime ? actualPublishTime : ""
      });

      // Formulate complete VideoItem for navigation/success action metrics
      const successVideoItem: VideoItem = {
        id: bulletDoc.id,
        title: docData.title,
        description: docData.description,
        url: docData.url,
        videoUrl: docData.videoUrl,
        thumbnailUrl: docData.thumbnailUrl,
        category: docData.category,
        duration: docData.duration,
        createdAt: docData.createdAt,
        publishedAt: docData.publishedAt,
        author: docData.author,
        status: docData.status as any,
        views: docData.views,
        isLive: docData.isLive,
        isScheduled: docData.isScheduled,
        scheduledTime: docData.scheduledTime
      };

      setSuccessMsg(`✓ Broadcast Published Successfully: "${title}" recorded under ID "${bulletDoc.id}".`);
      setPublishedSuccess(successVideoItem);

      // Reset form fields
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setSelectedFile(null);
      setCategory("general");
      setPublishStatus("Published");
      setScheduledTime("");

    } catch (err: any) {
      console.error("Publishing video bulletin failed:", err);
      setErrorMsg(err.message || "Failed to publish reporting video.");
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

      if (replaceFile) {
        const file = replaceFile;
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase() || ".mp4";
        const videoPath = `videoBulletins/${timestamp}-${uniqueId}${ext}`;

        // Generate replacements
        try {
          const result = await generateVideoThumbnail(file);
          calculatedDuration = formatDuration(result.durationSeconds);
          
          const thumbPath = `videoBulletins/thumbnails/${timestamp}-${uniqueId}-thumb.jpg`;
          try {
            // High-speed local write first
            const base64Data = await fileToBase64(result.thumbnail);
            const res = await fetch("/api/admin/upload-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                fileName: `${timestamp}-${uniqueId}-thumb.jpg`,
                fileData: base64Data
              })
            });
            if (res.ok) {
              const resData = await res.json();
              finalThumbnailUrl = resData.url || "";
            } else {
              throw new Error("Local backend image upload endpoint failed");
            }
          } catch (localThumbnailError) {
            console.warn("Storage replacement thumb write failed, falling back to Firebase storage:", localThumbnailError);
            try {
              finalThumbnailUrl = await uploadToStorageWithProgress(result.thumbnail, thumbPath, () => {});
            } catch (storageErr) {
              console.error("Firebase Storage replacement thumbnail write failed:", storageErr);
            }
          }
        } catch (thumbErr) {
          console.warn("Replacement thumbnail extraction skipped:", thumbErr);
        }

        if (!finalThumbnailUrl) {
          finalThumbnailUrl = editingVideo.thumbnailUrl || "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640";
        }

        // Upload replacement video
        try {
          // Priority A: High-speed local binary streaming (super fast, perfect progress tracking)
          finalVideoUrl = await uploadToBackendWithProgress(file, adminToken, (prog) => {
            setEditProgress(prog);
          });
        } catch (backendUploadErr: any) {
          console.warn("High-speed binary stream upload failed for edit, falling back to Firebase Storage:", backendUploadErr);
          try {
            finalVideoUrl = await uploadToStorageWithProgress(file, videoPath, (prog) => {
              setEditProgress(Math.min(prog, 99));
            });
          } catch (storageExc) {
            console.error("Firebase Storage failed for edit, trying base64 fallback:", storageExc);
            const base64Str = await fileToBase64(file);
            
            const response = await fetch("/api/admin/upload-video", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                fileName: file.name,
                fileData: base64Str
              })
            });
            
            if (!response.ok) {
              const errDetail = await response.json().catch(() => ({}));
              throw new Error(errDetail.error || `Server HTTP Error ${response.status}`);
            }
            
            const responseData = await response.json();
            finalVideoUrl = responseData.url;
          }
        }

        try {
          await saveVideoFile(finalVideoUrl, file);
        } catch (dbErr) {
          console.warn("IndexedDB backup failed:", dbErr);
        }
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
        status: "Published",
        publishedAt: new Date().toISOString()
      };

      // 1. Update videoBulletins document
      await updateDoc(doc(db, "videoBulletins", editingVideo.id), updatedFields);

      // 2. Keep standard dual collection mapped
      try {
        await updateDoc(doc(db, "videos", editingVideo.id), {
          title: editTitle.trim(),
          description: editDescription.trim(),
          url: finalVideoUrl
        });
      } catch (err) {
        console.warn("Dual update to legacy collection skipped:", err);
      }

      setSuccessMsg(`Information: Video Bulletin "${editTitle}" successfully updated.`);
      setEditingVideo(null);
      setReplaceFile(null);

    } catch (err: any) {
      console.error("Editing Video Bulletin entry failed: ", err);
      setErrorMsg(err.message || "Failed to update metadata records.");
    } finally {
      setEditUploading(false);
      setEditProgress(0);
    }
  };

  // Remove completely from Storage and Firestore collections
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

  // Filtering list elements computed properties
  const filteredVideos = videos.filter((vid) => {
    const matchesSearch = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vid.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryFilter === "all" || 
      vid.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });  return (
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
            <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={14} />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && !publishedSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-750 p-3.5 rounded text-xs leading-relaxed mb-4 flex items-start gap-2 animate-fadeIn">
            <CheckCircle className="shrink-0 mt-0.5 text-green-600" size={14} />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {publishedSuccess ? (
          <div className="space-y-6 animate-fadeIn py-2" id="publish-video-success-panel">
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h4 className="text-base font-extrabold text-neutral-900 tracking-tight">✓ Video Published Successfully</h4>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                The administrative news bulletin is live. All public feeds and newsroom segments have synchronized automatically.
              </p>
            </div>

            {/* Video preview meta report block */}
            <div className="bg-neutral-50 border border-neutral-150 p-4 rounded-lg space-y-3">
              <div className="relative aspect-video bg-neutral-900 rounded overflow-hidden shadow-inner">
                <img 
                  src={publishedSuccess.thumbnailUrl || "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&q=80&w=640"}
                  alt={publishedSuccess.title}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all shadow-md">
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-bold text-white font-mono">
                  {publishedSuccess.duration || "0:00"}
                </span>
                {publishedSuccess.status && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] uppercase font-mono tracking-widest font-black rounded shadow-md ${
                    publishedSuccess.status === "Published" ? "bg-red-700 text-white" :
                    publishedSuccess.status === "Scheduled" ? "bg-amber-600 text-white" :
                    "bg-neutral-600 text-neutral-200"
                  }`}>
                    {publishedSuccess.status}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-neutral-950 line-clamp-1">{publishedSuccess.title}</h5>
                <p className="text-[10px] text-neutral-500 font-mono">
                  CLASSIFIED: {publishedSuccess.category.toUpperCase()} • BY {publishedSuccess.author}
                </p>
              </div>
            </div>

            {/* Action panel */}
            <div className="space-y-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => {
                  const viewUrl = `${window.location.origin}/?video=${publishedSuccess.id}`;
                  window.open(viewUrl, "_blank");
                }}
                className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white text-xs tracking-wider uppercase font-extrabold rounded text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Eye size={13} />
                View Video Bulletin
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingVideo(publishedSuccess);
                  setEditTitle(publishedSuccess.title);
                  setEditDescription(publishedSuccess.description);
                  setEditCategory(publishedSuccess.category || "general");
                  setReplaceFile(null);
                  setPublishedSuccess(null);
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 text-neutral-700 text-xs tracking-wider uppercase font-extrabold rounded border border-neutral-250 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 size={13} />
                Edit Video Bulletin
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishedSuccess(null);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-900 text-white text-xs tracking-wider uppercase font-extrabold rounded text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} />
                Back To Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitVideo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Bulletin Title</label>
              <input
                type="text"
                required
                disabled={uploading}
                placeholder="e.g. BREAKING: Major legislative bill passes consensus vote"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:border-neutral-450 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Description / Briefing Synopsis</label>
              <textarea
                required
                rows={4}
                disabled={uploading}
                placeholder="Supply summary highlights for the dynamic coverage briefings player..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:border-neutral-450 focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Category desk</label>
                <select
                  disabled={uploading}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none cursor-pointer focus:bg-white font-medium"
                >
                  {VIDEO_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Reporting Author</label>
                <input
                  type="text"
                  disabled
                  placeholder="Desk credentials..."
                  value={author}
                  className="w-full bg-neutral-100 border border-neutral-200 rounded p-2 text-xs cursor-not-allowed text-neutral-450"
                />
              </div>
            </div>

            {/* Source Type selection */}
            <div className="pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Video Feed Source</span>
              <div className="grid grid-cols-2 gap-2 border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setSourceType("upload")}
                  className={`py-2 px-3 text-xs font-medium rounded border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sourceType === "upload" 
                      ? "bg-neutral-900 border-neutral-900 text-white" 
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Upload size={13} />
                  Local HD Upload
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setSourceType("url")}
                  className={`py-2 px-3 text-xs font-medium rounded border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sourceType === "url" 
                      ? "bg-neutral-900 border-neutral-900 text-white" 
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <LinkIcon size={13} />
                  Video Feed URL
                </button>
              </div>
            </div>

            {sourceType === "upload" ? (
              <div className="space-y-3 animate-fadeIn">
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer select-none ${
                    dragActive 
                      ? "border-red-500 bg-red-50/30" 
                      : selectedFile 
                        ? "border-green-400 bg-green-50/20" 
                        : "border-neutral-200 hover:border-neutral-350 bg-neutral-50/40"
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
                    <div className="space-y-1.5 animate-fadeIn">
                      <FileVideo className="mx-auto text-green-500" size={28} />
                      <p className="text-xs font-semibold text-neutral-800 break-all">{selectedFile.name}</p>
                      <p className="text-[10px] text-neutral-450 font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Standard Format Detected
                      </p>
                      <span className="inline-block text-[10px] font-bold bg-neutral-100 text-neutral-650 px-2.5 py-0.5 rounded-full mt-2 hover:bg-neutral-250 cursor-pointer transition-all">
                        Repoint file
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-neutral-450">
                      <Upload className="mx-auto text-neutral-400 mb-1" size={24} />
                      <p className="text-xs font-semibold text-neutral-700">Drag & Drop Broadcast Video, or Browse</p>
                      <p className="text-[10px]">MP4, MOV, WEBM, MKV, FLV down to 150MB</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1 animate-fadeIn">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Live Video URL / External Feed</label>
                <div className="relative">
                  <input
                    type="url"
                    required={sourceType === "url"}
                    disabled={uploading}
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2.5 pl-8 text-xs focus:outline-none focus:border-neutral-450 focus:bg-white font-mono"
                  />
                  <LinkIcon size={12} className="absolute left-2.5 top-3.5 text-neutral-400" />
                </div>
                <p className="text-[10px] text-neutral-450 leading-relaxed font-mono mt-1">
                  Supports YouTube watch links, stream embeds, or public server video pathways.
                </p>
              </div>
            )}

            {/* Publishing Status & Scheduling parameters */}
            <div className="grid grid-cols-1 gap-3 pt-1 border-t border-neutral-100 mt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Publishing Status Options</label>
                <select
                  disabled={uploading}
                  value={publishStatus}
                  onChange={(e) => setPublishStatus(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none cursor-pointer focus:bg-white font-medium"
                >
                  <option value="Published">Immediate Broadcast (Published)</option>
                  <option value="Scheduled">Scheduled Release Window (Scheduled)</option>
                  <option value="Draft">Draft Mode Workspace (Draft)</option>
                </select>
              </div>

              {publishStatus === "Scheduled" && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Scheduled Time (Local)</label>
                  <input
                    type="datetime-local"
                    required={publishStatus === "Scheduled"}
                    disabled={uploading}
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-xs focus:outline-none focus:bg-white font-mono"
                  />
                  <p className="text-[10px] text-neutral-450 leading-normal">
                    Bulletin will remain hidden from standard public feeds until this local timestamp threshold is reached.
                  </p>
                </div>
              )}
            </div>

            {/* Simple Progress Bar */}
            {uploading && (
              <div className="bg-neutral-50 p-3 rounded border border-neutral-150 space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-600 font-mono">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={11} className="animate-spin text-red-600" />
                    <span>{currentStatusText}</span>
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-600 h-full transition-all duration-350"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sticky Action Button on Mobile, normal on Desktop */}
            <div className="pt-2 md:relative fixed bottom-0 left-0 right-0 md:bottom-auto bg-white p-4 md:p-0 border-t border-neutral-200 md:border-t-0 z-40 select-none">
              <button
                type="submit"
                disabled={uploading}
                className={`w-full py-3 px-4 rounded text-xs tracking-wider uppercase font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                  uploading
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg active:scale-[0.985]"
                }`}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Broadcasting Reporting...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>PUBLISH VIDEO BULLETIN</span>
                  </>
                )}
              </button>
            </div>
            {/* Prevent bottom elements clip on mobile due to sticky */}
            <div className="h-16 md:hidden" />
          </form>
        )}
      </div>

      {/* COLUMN 2/3: Video briefing feed catalog */}
      <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="border-b border-neutral-100 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase font-bold flex items-center gap-2">
              <Clock size={16} className="text-neutral-500" />
              ACTIVE DIGITAL COVERAGE MODULES ({videos.length})
            </h3>

            {/* Quick Filter Section */}
            <div className="flex gap-2 items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Query feeds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 text-xs rounded py-1 px-2.5 pl-7 focus:outline-none focus:bg-white focus:border-neutral-350 font-mono"
                />
                <Search size={11} className="absolute left-2 top-2 text-neutral-400" />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-xs rounded py-1 px-2 cursor-pointer focus:outline-none"
              >
                <option value="all">All Desks</option>
                {VIDEO_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse flex flex-col items-center justify-center gap-2 text-neutral-450 text-xs font-mono">
              <RefreshCw className="animate-spin text-neutral-300" size={32} />
              <span>Resolving digital broadcast feed catalogs...</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-neutral-100 rounded-lg bg-neutral-50/30 select-none flex flex-col items-center justify-center gap-2 text-neutral-450 animate-fadeIn">
              <Radio size={36} className="text-neutral-200" />
              <p className="text-xs font-semibold text-neutral-700">No matching news broadcasts listed.</p>
              <p className="text-[11px] max-w-sm leading-relaxed px-4">
                Use the column creator to upload high-fidelity bulleting items directly or stream continuous YouTube live urls.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
              {filteredVideos.map((vid) => {
                const categoryObj = VIDEO_CATEGORIES.find(c => c.id === vid.category);
                const isSelectedForDelete = deleteConfirmId === vid.id;

                return (
                  <div 
                    key={vid.id}
                    className="border border-neutral-200 hover:border-neutral-350 rounded-lg overflow-hidden flex flex-col justify-between bg-neutral-50/20 group transition-all"
                  >
                    {/* Upper Thumbnail card */}
                    <div className="relative aspect-video bg-neutral-900 overflow-hidden select-none">
                      <img 
                        src={vid.thumbnailUrl || "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=640"} 
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85 group-hover:scale-103 transition-all duration-350"
                      />
                      
                      {vid.duration && (
                        <span className="absolute bottom-2 right-2 bg-neutral-950/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-extrabold shadow-sm">
                          {vid.duration}
                        </span>
                      )}

                      <span className="absolute top-2 left-2 bg-white/90 text-neutral-850 font-mono text-[9px] px-2 py-0.5 rounded font-extrabold select-none shadow-sm capitalize">
                        {categoryObj?.name || "General Desk"}
                      </span>

                      {/* Display public page link status */}
                      <span className="absolute top-2 right-2 bg-green-100 text-green-750 font-mono text-[9px] px-2 py-0.5 rounded font-extrabold select-none shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                        Live on Page
                      </span>

                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <a 
                          href={vid.videoUrl || vid.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-white/95 text-neutral-900 rounded-full p-2.5 hover:scale-110 shadow transition-all cursor-pointer"
                        >
                          <Play size={16} fill="currentColor" className="text-neutral-900 pl-0.5" />
                        </a>
                      </div>
                    </div>

                    {/* Metadata body */}
                    <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[12.5px] font-bold text-neutral-850 leading-snug group-hover:text-red-655 transition-all line-clamp-1">{vid.title}</h4>
                        <p className="text-[11px] text-neutral-450 leading-relaxed line-clamp-2 mt-1">{vid.description}</p>
                      </div>

                      <div className="border-t border-neutral-100 pt-3 mt-3 flex items-center justify-between text-[10px] font-mono font-medium text-neutral-450 select-none">
                        <span className="flex items-center gap-1 truncate max-w-[130px]">
                          <User size={11} className="text-neutral-400" />
                          <span className="truncate">{vid.author || "system-desk"}</span>
                        </span>
                        
                        <span>
                          {vid.createdAt ? new Date(vid.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "Active"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-neutral-50 border-t border-neutral-100 py-2.5 px-3.5 flex justify-between items-center select-none">
                      {isSelectedForDelete ? (
                        <div className="w-full flex items-center justify-between text-[11px] font-bold animate-fadeIn">
                          <span className="text-red-700 flex items-center gap-1 font-mono">Confirm deletion?</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteVideoPermanently(vid)}
                              className="text-red-600 hover:text-red-800 underline uppercase cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-neutral-500 hover:text-neutral-800 underline uppercase cursor-pointer"
                            >
                              Abort
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 text-[10px] text-neutral-500 font-bold font-mono">
                            <span className="text-neutral-400">Views:</span>
                            <span className="text-neutral-700">{vid.views || 0}</span>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setEditingVideo(vid);
                                setEditTitle(vid.title);
                                setEditDescription(vid.description);
                                setEditCategory(vid.category || "general");
                                setReplaceFile(null);
                              }}
                              className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all hover:underline"
                            >
                              <Edit3 size={11} />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(vid.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all hover:underline"
                            >
                              <Trash2 size={11} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Informative Help Footer */}
        <div className="mt-8 border-t border-neutral-100 pt-4 text-[10.5px] leading-relaxed text-neutral-450 select-none flex items-start gap-1.5 font-mono">
          <Info size={14} className="shrink-0 text-red-500 mt-0.5" />
          <p>
            Newly added video briefings appear instantly in the <span className="text-neutral-700 font-semibold">"Fast Coverage Bulletins"</span> carousel widget on the public page for real-time news delivery. No publishing queue is required.
          </p>
        </div>
      </div>

      {/* EDIT MODAL DIALOG POPUP */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-xs font-mono font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
                <Edit3 size={14} className="text-red-655" />
                EDIT VIDEO BULLETIN
              </h3>
              <button 
                onClick={() => {
                  setEditingVideo(null);
                  setReplaceFile(null);
                }}
                disabled={editUploading}
                className="text-neutral-450 hover:text-neutral-850 cursor-pointer p-0.5 hover:bg-neutral-100 rounded transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEditVideoCommit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 font-mono">Edit Title</label>
                <input
                  type="text"
                  required
                  disabled={editUploading}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 focus:outline-none focus:border-neutral-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 font-mono">Edit Synopsis</label>
                <textarea
                  required
                  rows={4}
                  disabled={editUploading}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 focus:outline-none focus:border-neutral-400 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 font-mono">desk category</label>
                <select
                  disabled={editUploading}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 focus:outline-none cursor-pointer focus:bg-white font-medium"
                >
                  {VIDEO_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Replace Video File option (Optional) */}
              <div className="bg-neutral-50 p-3.5 rounded border border-neutral-155 space-y-1 text-center font-mono select-none">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-450 mb-1.5">Replace Video File (Optional)</span>
                
                <input
                  type="file"
                  accept="video/*"
                  disabled={editUploading}
                  onChange={handleReplaceFileChange}
                  className="hidden text-[10px] w-full"
                  id="replace-file-picker-input-id"
                />

                {replaceFile ? (
                  <div className="space-y-1 text-neutral-700 animate-fadeIn">
                    <FileCheck className="mx-auto text-green-500" size={18} />
                    <p className="font-semibold text-[10px] text-neutral-800 break-all">{replaceFile.name}</p>
                    <p className="text-[9px] text-neutral-500">{(replaceFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    <button
                      type="button"
                      disabled={editUploading}
                      onClick={() => setReplaceFile(null)}
                      className="text-red-500 text-[9px] font-bold hover:underline cursor-pointer uppercase mt-1 block mx-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={editUploading}
                    onClick={() => document.getElementById("replace-file-picker-input-id")?.click()}
                    className="py-1.5 px-3 bg-white border border-neutral-200 rounded hover:border-neutral-350 text-[10px] text-neutral-600 font-bold transition-all cursor-pointer inline-flex items-center gap-1 hover:bg-neutral-50"
                  >
                    <Upload size={10} />
                    Browse replacement video
                  </button>
                )}
              </div>

              {/* Edit Progress Bar */}
              {editUploading && (
                <div className="bg-neutral-50 p-3 rounded border border-neutral-150 space-y-1 animate-fadeIn">
                  <div className="flex justify-between items-center text-[9px] font-bold text-neutral-600 font-mono">
                    <span className="flex items-center gap-1 text-red-600">
                      <RefreshCw size={10} className="animate-spin" />
                      Uploading replacements...
                    </span>
                    <span>{editProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full transition-all duration-350"
                      style={{ width: `${editProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-neutral-100 select-none">
                <button
                  type="submit"
                  disabled={editUploading}
                  className="flex-1 py-2 bg-neutral-900 text-white font-extrabold hover:bg-black rounded text-[11px] tracking-wider uppercase transition-all cursor-pointer shadow-xs"
                >
                  {editUploading ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={editUploading}
                  onClick={() => {
                    setEditingVideo(null);
                    setReplaceFile(null);
                  }}
                  className="flex-1 py-2 bg-neutral-100 border border-neutral-200 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 rounded text-[11px] tracking-wider uppercase transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
