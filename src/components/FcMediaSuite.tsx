import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, Trash2, Image as ImageIcon, CheckCircle, RefreshCw, AlertCircle, 
  Layers, FileImage, Terminal, Cpu, Wifi, Check, Sparkles, BarChart3
} from "lucide-react";
import { Article } from "../types";
import { ref as firebaseRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";
import { getFallbackImage } from "../utils/imageHelpers";

interface FcMediaSuiteProps {
  article: Partial<Article>;
  adminToken: string;
  onChangeArticle: (updatedFields: Partial<Article>) => void;
}

interface UploadingTask {
  id: string;
  filename: string;
  progress: number;
  status: "idle" | "processing" | "uploading" | "success" | "error";
  errorMessage?: string;
  file?: File;
  target: "featured" | "gallery";
  speed?: string;
  eta?: string;
  attempts: number;
  debugLogs: string[];
}

// Memory-efficient, client-side ObjectURL loader (never creates base64 strings)
const loadImageInCpu = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up memory reference immediately
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to decode the selected graphic image."));
    };
    img.src = url;
  });
};

// High-speed, client-side canvas scaling and WebP (or JPEG fallback) renderer
const resizePreloadedImage = (
  img: HTMLImageElement,
  maxWidth: number,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    let width = img.width;
    let height = img.height;

    // Constrain dimensions proportionately (never upscale)
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Failed to initialize canvas context."));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);
    
    // Perform superfast native WebP compilation
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Robust JPEG fallback for older Safari / browsers which do not support canvas webp
          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob) {
                resolve(jpegBlob);
              } else {
                reject(new Error("Could not output canvas buffer."));
              }
            },
            "image/jpeg",
            quality
          );
        }
      },
      "image/webp",
      quality
    );
  });
};

const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Standard safe UUID generator fallback
const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function FcMediaSuite({
  article,
  adminToken,
  onChangeArticle
}: FcMediaSuiteProps) {
  const [tasks, setTasks] = useState<UploadingTask[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  // Track already uploaded file signatures in this session to prevent duplicate uploads
  const uploadedSignatures = useRef<Set<string>>(new Set());

  // Input click handlers references
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the live telemetry log console
  useEffect(() => {
    if (showConsole && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [systemLogs, showConsole]);

  // Clear notifications after timeout
  useEffect(() => {
    if (infoMessage) {
      const timer = setTimeout(() => setInfoMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [infoMessage]);

  useEffect(() => {
    if (errorLogs) {
      const timer = setTimeout(() => setErrorLogs(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorLogs]);

  const addSystemLog = (taskName: string, message: string) => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    const logLine = `[${timeStr}] [${taskName.slice(0, 20)}] ${message}`;
    setSystemLogs(prev => [...prev, logLine]);
  };

  // Validates file size and constraints
  const validateFile = (file: File): string | null => {
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      return `"${file.name}" rejected. Supported types: JPG, JPEG, PNG, WEBP.`;
    }
    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSize) {
      return `"${file.name}" rejected. Exceeds the administrative maximum upload size threshold of 100 MB.`;
    }
    return null;
  };

  const startUploadWorkflow = async (file: File, target: "featured" | "gallery") => {
    const valError = validateFile(file);
    if (valError) {
      setErrorLogs(valError);
      addSystemLog(file.name, `Validation failed: ${valError}`);
      return;
    }

    // Check duplicate uploads in this session
    const signature = `${file.name}-${file.size}-${target}`;
    if (uploadedSignatures.current.has(signature)) {
      setErrorLogs(`"${file.name}" upload bypassed. This file was already integrated on this layout during this session.`);
      addSystemLog(file.name, `Bypassed: duplicate file found in session.`);
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTask: UploadingTask = {
      id: taskId,
      filename: file.name,
      progress: 5, // Start progress instantly! (instant start visual response)
      status: "processing",
      file,
      target,
      attempts: 1,
      debugLogs: [`[${new Date().toTimeString().split(" ")[0]}] Task initialized instantly.`]
    };

    setTasks(prev => [...prev, newTask]);
    addSystemLog(file.name, `Queued parallel task [Target: ${target}].`);

    try {
      await runSingleTask(newTask);
    } catch (err: any) {
      console.error("Upload workflow error", err);
      addSystemLog(file.name, `Fatal workflow escalation: ${err.message || err}`);
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: "error", progress: 0, errorMessage: err.message || "Upload interrupted" } : t)
      );
    }
  };

  const runSingleTask = async (task: UploadingTask) => {
    const { id: taskId, file, target } = task;
    if (!file) return;

    const taskLogs: string[] = [];
    const logLocal = (msg: string) => {
      const tStr = new Date().toTimeString().split(" ")[0];
      const line = `[${tStr}] ${msg}`;
      taskLogs.push(line);
      addSystemLog(file.name, msg);
    };

    const updateStatus = (
      status: UploadingTask["status"],
      progress: number,
      errorMsg?: string,
      extraFields?: Partial<UploadingTask>
    ) => {
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { 
          ...t, 
          status, 
          progress, 
          errorMessage: errorMsg,
          debugLogs: [...t.debugLogs, `[${new Date().toTimeString().split(" ")[0]}] changed to ${status} (${progress}%)`],
          ...extraFields 
        } : t)
      );
    };

    // Auto-Retry-capable uploader helper
    const uploadWithRetry = (
      refObj: any,
      blob: Blob | File,
      meta: any,
      onProgress: (percent: number, speed: string, eta: string) => void,
      label: string
    ): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        let attempts = 1;
        let uploadTaskObj: any = null;
        let isFinished = false;

        const executeAttempt = async () => {
          const uploadStart = Date.now();
          let connectionTime = 0;
          let lastUploadedBytes = 0;
          let lastTime = Date.now();
          let stuckTimer: any = null;

          logLocal(`Starting ${label} upload (Attempt #${attempts}/3).`);
          updateStatus("uploading", 35, undefined, { attempts });

          // Prevent stuck at 0%: If we transfer 0 bytes for over 15 seconds, trigger auto-retry immediately!
          const resetStuckTimer = () => {
            if (stuckTimer) clearTimeout(stuckTimer);
            stuckTimer = setTimeout(() => {
              if (!isFinished && lastUploadedBytes === 0) {
                logLocal(`[Timeout Alert] ${label} stuck at 0% for 15 seconds on attempt #${attempts}. Auto-cancelling.`);
                cleanup(true);
                if (attempts < 3) {
                  attempts++;
                  executeAttempt();
                } else {
                  reject(new Error(`Storage response timed out. Stuck at 0% after 3 attempts.`));
                }
              }
            }, 15000); // 15s maximum freeze tolerance for slow connection hands
          };

          resetStuckTimer();

          const cleanup = (cancelUpload = false) => {
            if (stuckTimer) {
              clearTimeout(stuckTimer);
              stuckTimer = null;
            }
            if (cancelUpload) {
              try {
                if (uploadTaskObj) {
                  uploadTaskObj.cancel();
                }
              } catch (e) {}
            }
          };

          // Try primary local server route with cloud replication (highly resilient, instant preview integration)
          try {
            logLocal(`[Server Upload] Initiating high-speed API transfer for ${label}.`);
            const base64Data = await fileToBase64(blob);
            const safeName = refObj?.name || `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
            
            const res = await fetch("/api/admin/upload-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                fileName: safeName,
                fileData: base64Data
              })
            });

            if (res.ok) {
              const resData = await res.json();
              if (resData && resData.success && resData.url) {
                isFinished = true;
                cleanup(false);
                onProgress(100, "Secure API Link", "0s");
                logLocal(`[Server Upload Success] Managed media replicated to storage path successfully: ${resData.url}`);
                resolve(resData.url);
                return;
              }
            }
            throw new Error(`Server returned response code: ${res.status}`);
          } catch (apiErr: any) {
            logLocal(`[Server Upload Warning] Managed API post fell back to standard Firebase Storage: ${apiErr.message || apiErr}`);
          }

          // Direct Firebase Storage Upload (Bypassing local server uploads to guarantee cloud persistence)
          logLocal(`[Firebase Storage] Initiating direct cloud upload for ${label}.`);
          uploadTaskObj = uploadBytesResumable(refObj, blob, meta);

          uploadTaskObj.on(
            "state_changed",
            (snapshot: any) => {
              if (isFinished) return;

              // Record network handshake connection speed
              if (connectionTime === 0 && snapshot.bytesTransferred > 0) {
                connectionTime = Date.now() - uploadStart;
                logLocal(`CDN Connection established in ${connectionTime}ms.`);
                if (stuckTimer) {
                  clearTimeout(stuckTimer);
                  stuckTimer = null;
                }
              }

              const now = Date.now();
              const timeDelta = (now - lastTime) / 1000;
              const byteDelta = snapshot.bytesTransferred - lastUploadedBytes;

              let speedString = "Calculating...";
              let etaString = "Estimating...";

              if (timeDelta > 0.25) {
                const speedBytesPerSec = byteDelta / timeDelta;
                if (speedBytesPerSec > 0) {
                  if (speedBytesPerSec > 1024 * 1024) {
                    speedString = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
                  } else if (speedBytesPerSec > 1024) {
                    speedString = `${(speedBytesPerSec / 1024).toFixed(0)} KB/s`;
                  } else {
                    speedString = `${speedBytesPerSec.toFixed(0)} B/s`;
                  }

                  const remainingBytes = snapshot.totalBytes - snapshot.bytesTransferred;
                  const etaSeconds = remainingBytes / speedBytesPerSec;
                  if (isFinite(etaSeconds) && etaSeconds >= 0) {
                    etaString = `${Math.ceil(etaSeconds)}s remaining`;
                  }
                }
                lastUploadedBytes = snapshot.bytesTransferred;
                lastTime = now;
              }

              const percent = snapshot.totalBytes > 0 
                ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) 
                : 0;

              onProgress(percent, speedString, etaString);
            },
            (err: any) => {
              if (isFinished) return;
              cleanup();
              logLocal(`[Network Disrupted] Attempt #${attempts} failed: ${err.message || err.code}`);
              if (attempts < 3) {
                attempts++;
                executeAttempt();
              } else {
                reject(err);
              }
            },
            async () => {
              if (isFinished) return;
              isFinished = true;
              cleanup();
              const uploadDuration = Date.now() - uploadStart;
              logLocal(`Upload of ${label} finished successfully in ${uploadDuration}ms.`);
              try {
                const dlUrl = await getDownloadURL(uploadTaskObj.snapshot.ref);
                resolve(dlUrl);
              } catch (urlErr: any) {
                reject(urlErr);
              }
            }
          );
        };

        executeAttempt();
      });
    };

    try {
      // Step 1: Pre-decode visual image file instantly in client RAM
      logLocal(`Triggered client-side CPU loading.`);
      updateStatus("processing", 10);
      const decodeTimerStart = Date.now();
      const img = await loadImageInCpu(file);
      logLocal(`Successfully decoded visual bitmap to host RAM in ${Date.now() - decodeTimerStart}ms.`);
      
      const articleId = article.id || "art_unnamed";
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();

      const filenameGallery = `${randomId}_gallery.webp`;
      const filename1200 = `${randomId}_1200.webp`;
      const filename800 = `${randomId}_800.webp`;
      const filename400 = `${randomId}_400.webp`;
      const filenameBackup = `backup_${randomId}_${cleanName}`;

      // Firebase Storage CDN cache metadata settings
      const metadataHeaders = {
        cacheControl: "public,max-age=31536000",
        contentType: "image/webp"
      };

      // ---------------- GALLERY INJECTION TARGET ----------------
      if (target === "gallery") {
        logLocal(`Target identified: complementary gallery item.`);
        updateStatus("processing", 20);

        const optimizeStart = Date.now();
        const webpB1200 = await resizePreloadedImage(img, 1200, 0.70); // Light, beautiful space-saving WebP
        logLocal(`WebP layout scaling finished in ${Date.now() - optimizeStart}ms (Quality 0.70, resized width 1200px. Compression: ${Math.round((1 - webpB1200.size / file.size) * 100)}% smaller).`);

        // Start instantaneous progress increment animation to never stay at 0%
        let simulatedPercent = 20;
        const speedInterval = setInterval(() => {
          if (simulatedPercent < 35) {
            simulatedPercent += 2;
            updateStatus("processing", simulatedPercent);
          }
        }, 100);

        const webpRef = firebaseRef(storage, `articles/${articleId}/${timestamp}-${filenameGallery}`);
        
        try {
          const w1200Url = await uploadWithRetry(
            webpRef,
            webpB1200,
            metadataHeaders,
            (percent, speed, eta) => {
              clearInterval(speedInterval);
              // Shift progress into 35% - 100% bracket
              const realProgress = Math.max(35, Math.round(35 + (percent / 100) * 65));
              updateStatus("uploading", realProgress, undefined, { speed, eta });
            },
            "Gallery Image"
          );

          clearInterval(speedInterval);
          updateStatus("success", 100, undefined, { speed: "Complete", eta: "0s remaining" });
          uploadedSignatures.current.add(`${file.name}-${file.size}-${target}`);

          const currentGallery = article.imageGallery || [];
          onChangeArticle({
            imageGallery: [...currentGallery, w1200Url]
          });
          setInfoMessage("Gallery photo added successfully!");
        } catch (uploadErr: any) {
          clearInterval(speedInterval);
          throw uploadErr;
        }
        return;
      }

      // ---------------- FEATURED MEDIA TARGET ----------------
      logLocal(`Target identified: Featured Primary Asset.`);
      updateStatus("processing", 15);

      const compStart = Date.now();
      // Generate all scales concurrently in browser sandbox
      const [webpB1200, webpB800, webpB400] = await Promise.all([
        resizePreloadedImage(img, 1200, 0.72), // Elegant, crisp high-res layout
        resizePreloadedImage(img, 800, 0.68),  // Responsive medium tablet viewports
        resizePreloadedImage(img, 400, 0.58)   // Lightweight custom Thumbnail
      ]);
      logLocal(`Concurrency Scale optimization finished in ${Date.now() - compStart}ms.`);

      let simulatedPercent = 15;
      const speedInterval = setInterval(() => {
        if (simulatedPercent < 35) {
          simulatedPercent += 2;
          updateStatus("processing", simulatedPercent);
        }
      }, 80);

      const webpRef1200 = firebaseRef(storage, `articles/${articleId}/${timestamp}-${filename1200}`);

      try {
        // We block only on the main lightweight primary WebP image to ensure instant UI responsiveness!
        const w1200Url = await uploadWithRetry(
          webpRef1200,
          webpB1200,
          metadataHeaders,
          (percent, speed, eta) => {
            clearInterval(speedInterval);
            const realProgress = Math.max(35, Math.round(35 + (percent / 100) * 65));
            updateStatus("uploading", realProgress, undefined, { speed, eta });
          },
          "Featured Primary 1200px"
        );

        clearInterval(speedInterval);

        // Instantly unlock GUI layout for the journalist with the primary optimized photo!
        onChangeArticle({
          featuredImage: w1200Url,
          imageFileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          imageMime: "image/webp",
          imageDimensions: "Multi-scale WebP (Optimized)"
        });

        updateStatus("success", 100, undefined, { speed: "Complete", eta: "0s" });
        setInfoMessage("Featured image updated successfully!");
        uploadedSignatures.current.add(`${file.name}-${file.size}-${target}`);

        // Silently queue supporting resolutions and raw storage backups in background thread
        const webpRef800 = firebaseRef(storage, `articles/${articleId}/${timestamp}-${filename800}`);
        const webpRef400 = firebaseRef(storage, `articles/${articleId}/${timestamp}-${filename400}`);
        const rawBackupRef = firebaseRef(storage, `articles/${articleId}/${timestamp}-${filenameBackup}`);

        logLocal("Kicking off secondary supporting scales in background queue.");
        Promise.all([
          uploadWithRetry(rawBackupRef, file, { cacheControl: "public,max-age=31536000", contentType: file.type }, () => {}, "Featured Raw Backup Copy"),
          uploadWithRetry(webpRef800, webpB800, metadataHeaders, () => {}, "Featured Medium 800px"),
          uploadWithRetry(webpRef400, webpB400, metadataHeaders, () => {}, "Featured Thumbnail 400px")
        ]).then(([backupUrl, w800Url, w400Url]: [string, string, string]) => {
          onChangeArticle({
            featuredImageBackup: backupUrl,
            featuredImage800: w800Url,
            featuredImage400: w400Url
          });
          logLocal("Background responsive scaling components updated silently.");
        }).catch((bgError) => {
          logLocal(`Background scaled compilation completed with warning (non-fatal): ${bgError.message}`);
        });

      } catch (uploadErr: any) {
        clearInterval(speedInterval);
        throw uploadErr;
      }

    } catch (e: any) {
      console.error("Firebase Storage image upload failed:", e);
      updateStatus("error", 0, e.message || "Execution exception occurred during task lifecycle.");
      logLocal(`[CRITICAL TRACE] Task aborted: ${e.message}`);
    }
  };

  const triggerRetry = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.file) return;

    addSystemLog(task.file.name, "Manual user retry initialized.");
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { 
        ...t, 
        status: "processing", 
        progress: 10, 
        errorMessage: undefined,
        attempts: t.attempts + 1 
      } : t)
    );

    try {
      await runSingleTask(task);
    } catch (err: any) {
      addSystemLog(task.file.name, `Manual retry failed: ${err.message}`);
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: "error", errorMessage: err.message || "Retry upload failed." } : t)
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, target: "featured" | "gallery") => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      if (target === "featured") {
        await startUploadWorkflow(filesArray[0], "featured");
      } else {
        // Parallel batch loop safely
        filesArray.forEach(f => {
          startUploadWorkflow(f, "gallery");
        });
      }
    }
  };

  const handleDeleteFeatured = async () => {
    if (!window.confirm("Verify: Are you sure you wish to delete this featured corporate image?")) return;
    
    addSystemLog("Featured Image", "Admin deletion invoked.");
    const imageUrl = article.featuredImage;
    onChangeArticle({
      featuredImage: "",
      featuredImageBackup: "",
      featuredImage800: "",
      featuredImage400: "",
      imageDimensions: "",
      imageFileSize: "",
      imageMime: ""
    });

    setInfoMessage("Featured image removed.");

    if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const fileRef = firebaseRef(storage, imageUrl);
        await deleteObject(fileRef);
        addSystemLog("Featured Image", "Firebase storage asset purged.");
      } catch (err: any) {
        addSystemLog("Featured Image", `Purge warning skipped: ${err.message}`);
      }
    }
  };

  const handleDeleteGalleryItem = async (index: number) => {
    const gallery = article.imageGallery || [];
    const imageUrlToDelete = gallery[index];
    const updatedGallery = gallery.filter((_, i) => i !== index);
    
    addSystemLog(`Gallery [Index ${index}]`, "Admin deleted item.");
    onChangeArticle({
      imageGallery: updatedGallery
    });

    setInfoMessage("Gallery image removed from collection sheet.");

    if (imageUrlToDelete && imageUrlToDelete.includes("firebasestorage.googleapis.com")) {
      try {
        const fileRef = firebaseRef(storage, imageUrlToDelete);
        await deleteObject(fileRef);
        addSystemLog(`Gallery [Index ${index}]`, "Firebase storage asset purged.");
      } catch (err: any) {
        addSystemLog(`Gallery [Index ${index}]`, `Purge warning skipped: ${err.message}`);
      }
    }
  };

  const setArticleStatus = (status: "Published" | "Draft") => {
    onChangeArticle({ status });
    setInfoMessage(`Article publish state updated to: "${status}"`);
  };

  // Compute Overall Statistics counters for Gallery Uploads
  const galleryTasks = tasks.filter(t => t.target === "gallery");
  const activeGalleryCount = galleryTasks.filter(t => t.status === "processing" || t.status === "uploading").length;
  const completedGalleryCount = galleryTasks.filter(t => t.status === "success").length;
  const failedGalleryCount = galleryTasks.filter(t => t.status === "error").length;
  const totalGalleryCount = galleryTasks.length;

  const averageGalleryProgress = totalGalleryCount > 0 
    ? Math.round(galleryTasks.reduce((sum, t) => sum + t.progress, 0) / totalGalleryCount) 
    : 0;

  return (
    <div className="bg-neutral-900 text-neutral-100 border border-neutral-800 p-5 rounded-lg space-y-6 shadow-md" id="fc_media_manager_suite">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div>
          <h4 className="text-xs font-mono font-black uppercase tracking-wider text-red-500 flex items-center gap-2 select-none">
            <Layers size={14} />
            <span>Fast Coverage Newsroom Uploader</span>
          </h4>
          <p className="text-[10px] text-neutral-400 mt-1">
            Real-time parallel GPU resizing and automatic WebP CDN optimization with auto-retry engine.
          </p>
        </div>

        {/* Article Publish / Draft controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArticleStatus("Draft")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase font-bold transition cursor-pointer flex items-center gap-1 ${
              article.status === "Draft" 
                ? "bg-amber-600 text-white shadow-md border border-amber-500 animate-pulse" 
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            }`}
            id="btn_status_draft"
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => setArticleStatus("Published")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase font-bold transition cursor-pointer flex items-center gap-1 ${
              article.status === "Published" 
                ? "bg-green-600 text-white shadow-md border border-green-500 font-black" 
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            }`}
            id="btn_status_publish"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Dynamic log/notification area */}
      {errorLogs && (
        <div className="bg-red-950/50 border border-red-800 rounded p-3 text-xs text-red-400 flex items-start gap-2 select-none animate-fadeIn" id="system_log_error">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <p>{errorLogs}</p>
        </div>
      )}

      {infoMessage && (
        <div className="bg-blue-950/40 border border-blue-900 rounded p-3 text-xs text-blue-300 flex items-start gap-2 select-none animate-fadeIn" id="system_log_info">
          <CheckCircle size={15} className="shrink-0 mt-0.5" />
          <p>{infoMessage}</p>
        </div>
      )}

      {/* FEATURED MEDIA AREA */}
      <div className="space-y-3" id="featured_media_container_box">
        <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-neutral-400 block select-none">
          1. Key Featured Banner
        </span>

        {article.featuredImage ? (
          <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 relative group">
            <div className="aspect-[16/9] w-full relative flex items-center justify-center bg-neutral-950">
              <img
                src={article.featuredImage}
                alt="Featured preview banner"
                className="max-h-full max-w-full object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackImage(article.title || "", article.categoryId || "politics");
                }}
              />
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => featuredInputRef.current?.click()}
                  className="bg-black/90 hover:bg-black text-white text-[10px] uppercase font-mono font-black tracking-widest px-2.5 py-1.5 rounded shadow border border-neutral-700 cursor-pointer flex items-center gap-1.5"
                  title="Replace main image"
                >
                  <RefreshCw size={11} className="animate-spin-slow" />
                  <span>Replace banner</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteFeatured}
                  className="bg-red-900 hover:bg-red-800 text-white text-[11px] p-2 rounded shadow-lg flex items-center justify-center cursor-pointer border border-red-750"
                  title="Delete featured image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Featured Image Metadata and Stats layout details */}
            <div className="bg-neutral-900/95 p-3.5 border-t border-neutral-800 text-[11px] font-mono grid grid-cols-1 md:grid-cols-3 gap-2.5 text-neutral-400">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5">Asset Reference CDN URL</span>
                <p className="text-neutral-200 truncate pr-2" title={article.featuredImage}>{article.featuredImage}</p>
              </div>
              {article.imageDimensions && (
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5">Resolution Spec</span>
                  <p className="text-neutral-200 flex items-center gap-1">
                    <Cpu size={12} className="text-red-500" />
                    <span>{article.imageDimensions}</span>
                  </p>
                </div>
              )}
              {article.imageFileSize && (
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5">Primary Source Weight</span>
                  <p className="text-neutral-200">{article.imageFileSize}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "featured")}
            onClick={() => featuredInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-800 hover:border-red-650 rounded-lg p-10 bg-neutral-950/40 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
            id="drop_zone_featured"
          >
            <div className="bg-neutral-900 p-4 rounded-full border border-neutral-800 group-hover:scale-105 group-hover:border-red-800/40 transition duration-300">
              <Upload size={24} className="text-neutral-500 group-hover:text-red-500 transition duration-300" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-neutral-200 block">
                Drag-and-drop file to initialize main preview image
              </span>
              <p className="text-[10px] text-neutral-500 mt-1">
                or click to locate from system (PNG, JPG, JPEG, WEBP)
              </p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={featuredInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              startUploadWorkflow(e.target.files[0], "featured");
            }
          }}
          className="hidden"
          accept="image/*"
        />
      </div>

      {/* MULTI IMAGE COLLECTION (GALLERY) */}
      <div className="space-y-3 pt-3 border-t border-neutral-800" id="gallery_media_container_box">
        <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-neutral-400 block select-none">
          2. Supplement Multi-Image Gallery
        </span>

        {article.imageGallery && article.imageGallery.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {article.imageGallery.map((imgUrl, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded overflow-hidden aspect-square relative group">
                <img
                  src={imgUrl}
                  alt={`Gallery piece ${idx}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryItem(idx)}
                  className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-red-800 text-white p-1 rounded shadow cursor-pointer transition border border-neutral-750 opacity-100 sm:opacity-0 group-hover:opacity-100"
                  title="Remove image from gallery"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drag & Drop gallery area */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "gallery")}
          onClick={() => galleryInputRef.current?.click()}
          className="border border-dashed border-neutral-800 hover:border-neutral-750 hover:bg-neutral-900/20 rounded p-6 text-center cursor-pointer transition flex items-center justify-center gap-3 select-none"
          id="drop_zone_gallery"
        >
          <FileImage size={15} className="text-neutral-500 animate-pulse" />
          <span className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200">
            Drag files here or click to add multiple complementary gallery pictures
          </span>
        </div>

        <input
          type="file"
          ref={galleryInputRef}
          multiple
          onChange={(e) => {
            if (e.target.files) {
              const filesArray = Array.from(e.target.files) as File[];
              filesArray.forEach(f => {
                startUploadWorkflow(f, "gallery");
              });
            }
          }}
          className="hidden"
          accept="image/*"
        />
      </div>

      {/* OVERALL GALLERY GRAPHIC PROGRESS MONITOR */}
      {totalGalleryCount > 0 && activeGalleryCount > 0 && (
        <div className="border border-neutral-800 bg-neutral-950 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 select-none animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/40 rounded-full border border-red-900/40">
              <BarChart3 size={18} className="text-red-500 animate-pulse" />
            </div>
            <div>
              <h5 className="text-[11px] font-mono font-black uppercase text-neutral-300">
                Batch Gallery Sync Engine
              </h5>
              <p className="text-[10px] text-neutral-500">
                Processed: {completedGalleryCount} of {totalGalleryCount} files ({averageGalleryProgress}% aggregated progress)
              </p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
              <span>Overall Progress</span>
              <span>{averageGalleryProgress}%</span>
            </div>
            <div className="w-full bg-neutral-850 rounded-full h-2 relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 ease-out"
                style={{ width: `${averageGalleryProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-right text-[10px] font-mono">
            {failedGalleryCount > 0 ? (
              <span className="text-red-500 font-bold bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                {failedGalleryCount} Uploads Faulty
              </span>
            ) : (
              <span className="text-neutral-400">
                Syncing {activeGalleryCount} streams in parallel
              </span>
            )}
          </div>
        </div>
      )}

      {/* PARALLEL TASK SCHEDULERS PROGRESS LIST */}
      {tasks.length > 0 && (
        <div className="border border-neutral-850 rounded-lg bg-neutral-950 p-4 space-y-3 shadow-inner" id="parallel_upload_task_schedulers">
          <div className="flex justify-between items-center bg-neutral-900/80 px-3 py-1.5 rounded border border-neutral-800">
            <span className="text-[10px] font-mono text-neutral-300 uppercase font-black tracking-wider flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              <span>Active Newsroom Upload Telemetry</span>
            </span>
            <button
              type="button"
              onClick={() => setTasks([])}
              className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 uppercase cursor-pointer transition hover:underline"
            >
              Clear Finished Tasks
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 select-none">
            {tasks.map(t => (
              <div key={t.id} className="text-[11px] font-mono bg-neutral-900/60 p-3 border border-neutral-850 rounded-md relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-neutral-350 mb-1.5">
                    <span className="truncate max-w-[150px] text-neutral-200 font-bold font-sans" title={t.filename}>
                      {t.filename}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-neutral-400 bg-neutral-850 px-1.5 py-0.5 rounded uppercase">
                        {t.target}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        t.status === "success" ? "bg-green-950/50 text-green-400 border-green-900/60" :
                        t.status === "error" ? "bg-red-950/50 text-red-500 border-red-900/60" :
                        t.status === "processing" ? "bg-blue-950/50 text-blue-400 border-blue-900/60 animate-pulse" :
                        "bg-amber-950/50 text-amber-500 border-amber-900/60 animate-pulse"
                      }`}>
                        {t.status === "error" && t.attempts > 1 ? `Error (Att: ${t.attempts}/3)` : t.status}
                      </span>
                    </div>
                  </div>

                  {/* Real-time speed and remaining estimates during upload phase */}
                  {t.status === "uploading" && (
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 mb-1">
                      <span className="flex items-center gap-1">
                        <Wifi size={11} className="text-neutral-600 animate-pulse" />
                        <span>Speed: {t.speed || "Calculating"}</span>
                      </span>
                      <span>{t.eta || "Estimating"}</span>
                    </div>
                  )}

                  {/* Progressive bar tracking */}
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 relative overflow-hidden my-2 border border-neutral-850/40">
                    <div 
                      className={`h-full duration-300 ease-out transition-all ${
                        t.status === "success" ? "bg-green-500" :
                        t.status === "error" ? "bg-red-500 text-red-100" :
                        "bg-gradient-to-r from-red-600 to-red-400"
                      }`}
                      style={{ width: `${t.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1 pb-1">
                  <span className="flex items-center gap-1 text-neutral-400">
                    {t.status === "success" ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <Check size={12} className="stroke-[3]" />
                        <span>Ready in CDN</span>
                      </span>
                    ) : (
                      <span>Progress: {t.progress}%</span>
                    )}
                  </span>

                  {t.errorMessage && (
                    <span className="text-red-450 italic font-sans max-w-[150px] truncate" title={t.errorMessage}>
                      Err: {t.errorMessage}
                    </span>
                  )}

                  {t.status === "error" && (
                    <button
                      type="button"
                      onClick={() => triggerRetry(t.id)}
                      className="bg-neutral-800 hover:bg-neutral-700 hover:text-white text-white text-[9px] uppercase px-2 py-0.5 rounded cursor-pointer border border-neutral-700 transition"
                    >
                      Retry Manual
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TELEMETRY ENGINE LOGGER CONSOLE PANEL */}
      <div className="border border-neutral-850 rounded-lg overflow-hidden bg-neutral-950">
        <button
          type="button"
          onClick={() => setShowConsole(!showConsole)}
          className="w-full flex items-center justify-between p-3.5 bg-neutral-900/60 hover:bg-neutral-900 text-left text-neutral-300 cursor-pointer transition select-none border-b border-neutral-850"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <Terminal size={13} className="text-red-500" />
            <span>Developer Upload Telemetry logs</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            {showConsole ? "Collapse [-]" : `Show console logs (${systemLogs.length}) [+]`}
          </span>
        </button>

        {showConsole && (
          <div className="p-3.5 bg-black/95 font-mono text-[10px] text-zinc-450 space-y-1.5 h-44 overflow-y-auto select-text scrollbar-thin scrollbar-thumb-neutral-850">
            {systemLogs.length === 0 ? (
              <p className="text-zinc-650 italic">No upload event captured during this newsroom session.</p>
            ) : (
              systemLogs.map((log, i) => (
                <p key={i} className="leading-relaxed hover:bg-neutral-950/60 px-1 py-0.5 rounded transition">
                  <span className="text-red-500/80 mr-1">&gt;</span>
                  <span className="text-zinc-300">{log}</span>
                </p>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
