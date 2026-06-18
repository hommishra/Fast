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
  AlertTriangle 
} from "lucide-react";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface AdminVideosProps {
  adminToken: string;
}

export default function AdminVideos({ adminToken }: AdminVideosProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create video form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<"upload" | "url">("upload");
  const [videoUrl, setVideoUrl] = useState("");
  
  // Live / Scheduled status
  const [isLive, setIsLive] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  
  // Drag and drop / local file tracking
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Read real-time video library index of news from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "videos"), 
      (snap) => {
        const items: VideoItem[] = [];
        snap.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as VideoItem);
        });
        // Sort newest videos first
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setVideos(items);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore read videos collection error:", error);
        setErrorMsg("Failed to synchronize video files directory from Firestore database.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Drag States
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop/selection
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ["video/mp4", "video/quicktime", "video/webm", "video/avi", "video/x-matroska"];
    // Validate file type
    if (!validExtensions.includes(file.type) && !file.name.toLowerCase().endsWith(".mkv")) {
      setErrorMsg("Unauthorized file format. Please drag or select standard video exports (.mp4, .mov, .webm).");
      setSelectedFile(null);
      return;
    }

    // Securely budget file size (35MB limits inside sandbox environment)
    const MAX_SIZE = 35 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg("Video file size exceeds maximum 35MB Administrative Sandbox threshold limit.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    // Populate raw file placeholder in title if empty
    if (!title) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanTitle);
    }
  };

  // Trigger file selection click
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle Video addition form submission
  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg("Title and description are required components.");
      return;
    }

    setUploading(true);

    try {
      let finalUrl = videoUrl.trim();

      // If Source Type is File upload, parse file data into Base64 and POST to backend
      if (sourceType === "upload") {
        if (!selectedFile) {
          setErrorMsg("Please drag, drop, or select a video file payload first.");
          setUploading(false);
          return;
        }

        // Read file stream representation
        const base64Str = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });

        // Trigger POST call to custom server upload pipeline
        const response = await fetch("/api/admin/upload-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileData: base64Str
          })
        });

        const uploadResult = await response.json();
        if (!response.ok || !uploadResult.success) {
          throw new Error(uploadResult.error || "Backend write failure saving video file asset.");
        }

        finalUrl = uploadResult.url;
      } else {
        // If Url selected but empty
        if (!finalUrl) {
          setErrorMsg("Please specify a valid media link, YouTube, or direct MP4 URL stream.");
          setUploading(false);
          return;
        }

        // Simple check to auto-convert YouTube share link to embed link if applicable
        if (finalUrl.includes("youtube.com/watch?v=")) {
          const videoId = finalUrl.split("v=")[1]?.split("&")[0];
          if (videoId) {
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        } else if (finalUrl.includes("youtu.be/")) {
          const videoId = finalUrl.split("youtu.be/")[1]?.split("?")[0];
          if (videoId) {
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
      }

      // Save the complete record metadata directly into Firestore database 'videos'
      const videoDocData = {
        title: title.trim(),
        description: description.trim(),
        url: finalUrl,
        createdAt: new Date().toISOString(),
        views: 0,
        isLive,
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : ""
      };

      await addDoc(collection(db, "videos"), videoDocData);

      setSuccessMsg(`Success: "${title}" video broadcast published onto live public layouts.`);
      
      // Reset form variables
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setSelectedFile(null);
      setIsLive(false);
      setIsScheduled(false);
      setScheduledTime("");
    } catch (err: any) {
      console.error("Addition of news video record failed: ", err);
      setErrorMsg(err?.message || "Failed to finalize and publish video bulletin to database.");
    } finally {
      setUploading(false);
    }
  };

  // Delete video document from collection
  const handleDeleteVideo = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteDoc(doc(db, "videos", id));
      setSuccessMsg("Information: Video entry removed from collection.");
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Could not delete specified video item from active library listings.");
    }
  };

  // Helper to render video formats inside admin lists safely
  const renderPreviewPlayer = (url: string, assetTitle: string) => {
    if (url.includes("youtube.com") || url.includes("youtube") || url.includes("embed")) {
      return (
        <iframe
          src={url}
          title={assetTitle}
          className="w-full h-full rounded"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <video
        src={url}
        controls
        className="w-full h-full object-cover bg-black rounded"
        preload="metadata"
        referrerPolicy="no-referrer"
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans text-neutral-800" id="admin_videos_manager_view">
      
      {/* COLUMN 1: Broadcast Creation and Upload module */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 height-fit shadow-xs">
        <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 mb-5 select-none font-bold flex items-center gap-2">
          <Video size={16} className="text-red-650" />
          PUBLISH VIDEO REPORT
        </h3>

        {/* Global Notifications inside tab */}
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
              rows={4}
              disabled={uploading}
              placeholder="Write detailed summaries or interview excerpts detailing what this coverage displays..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded p-2.5 text-sm focus:outline-none focus:border-red-650"
            />
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
                    ? "bg-red-700 text-white border-red-700" 
                    : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <Upload size={13} />
                <span>LOCAL FILE</span>
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setSourceType("url")}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded text-xs font-bold tracking-tight cursor-pointer transition ${
                  sourceType === "url" 
                    ? "bg-red-700 text-white border-red-700" 
                    : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <LinkIcon size={13} />
                <span>ONLINE LINK</span>
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
                      <FileVideo className="text-red-600 animate-bounce" size={32} />
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
                      <Upload className="text-neutral-400" size={32} />
                      <div className="text-xs space-y-1">
                        <p className="font-extrabold text-neutral-700">Drag & Drop Video report here</p>
                        <p className="text-neutral-400">or click to browse local folders</p>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase mt-2 block">
                        MP4, MOV, WEBM (Max 35MB)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* DIRECT WEB URL ATTRITUBE LINK */
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
              <p className="text-[10px] text-neutral-500 leading-snug font-sans mt-1">
                Direct MP4 link or standard video portal link. YouTube or Vimeo links are auto-formatted into iframe compatible embed streams.
              </p>
            </div>
          )}

          {/* Broadcaster settings: Live or Scheduled status */}
          <div className="bg-neutral-50 p-3.5 rounded border border-neutral-200/80 space-y-3.5">
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
                  <span className="text-[9px] text-neutral-500 block mb-1 font-mono uppercase">SET RELEASE DATE & TIME</span>
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
          </div>

          <button
            type="submit"
            disabled={uploading}
            className={`w-full text-white font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-md flex items-center justify-center gap-2 cursor-pointer transition shadow ${
              uploading ? "bg-neutral-400 cursor-not-allowed" : "bg-red-700 hover:bg-red-800"
            }`}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <span className="w-4.5 h-4.5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>PROCESSING UPLOAD (UP TO 15s)...</span>
              </div>
            ) : (
              <>
                <PlusCircle size={15} />
                <span>PUBLISH VIDEO BULLETIN</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded p-4 flex gap-3 text-amber-900 select-none">
          <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <h5 className="font-extrabold uppercase font-mono text-[9px] tracking-wider mb-1">Administrative Guidelines:</h5>
            <p className="text-amber-800 font-sans">
              All videos published here appear live on the public report pages. Large file uploads take up to 15 seconds to encode base64 streams over sandboxed network proxies.
            </p>
          </div>
        </div>
      </div>

      {/* COLUMN 2 & 3: Library queue list of already uploaded video items */}
      <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-sm font-mono tracking-widest text-neutral-500 uppercase border-b border-neutral-100 pb-3 select-none font-bold flex justify-between items-center">
            <span>PUBLISHED VIDEO DIRECTORY ({videos.length})</span>
            {loading && <span className="text-xs text-neutral-400 font-sans tracking-normal font-normal">Syncing database feed...</span>}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
              <span className="w-8 h-8 border-3 border-red-200 border-t-red-700 rounded-full animate-spin" />
              <p className="text-xs font-mono">Synchronizing live documents...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-24 select-none">
              <FileVideo className="mx-auto text-neutral-300 mb-3" size={48} />
              <h4 className="text-slate-900 font-extrabold text-sm">Video Directory Empty</h4>
              <p className="text-neutral-500 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                No video assets are currently tracked. Use the publisher module to upload your first MP4 report.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid) => (
                <div 
                  key={vid.id}
                  className="bg-neutral-50 border border-neutral-205 rounded-xl overflow-hidden p-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Embedded preview engine */}
                    <div className="aspect-video w-full bg-black rounded overflow-hidden relative shadow-inner">
                      {renderPreviewPlayer(vid.url, vid.title)}
                      {vid.isLive && (
                        <span className="absolute top-2 left-2 bg-red-650 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-10 animate-pulse flex items-center gap-1 select-none">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          LIVE NOW
                        </span>
                      )}
                      {vid.isScheduled && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-10 flex items-center gap-1 select-none">
                          <Clock size={10} />
                          SCHEDULED
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2" title={vid.title}>
                        {vid.title}
                      </h4>
                      {vid.isScheduled && vid.scheduledTime && (
                        <p className="text-[10px] text-blue-600 font-mono font-bold flex items-center gap-1 select-none">
                          <Clock size={10} />
                          Set for: {new Date(vid.scheduledTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 font-sans">
                        {vid.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer status blocks */}
                  <div className="flex justify-between items-center text-[10px] font-mono mt-4 pt-3 border-t border-neutral-200">
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Clock size={11} className="text-neutral-500" />
                      {new Date(vid.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>

                    {deleteConfirmId === vid.id ? (
                      <div className="flex items-center gap-1.5 shrink-0 animate-scaleIn select-none">
                        <span className="text-[9px] text-red-650 font-black">CONFIRM ERASE?</span>
                        <button
                          onClick={() => handleDeleteVideo(vid.id)}
                          className="bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer"
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
                        className="text-red-600 hover:text-red-800 font-extrabold flex items-center gap-1 font-sans text-xs flex-row justify-end"
                        title="Delete video document"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
