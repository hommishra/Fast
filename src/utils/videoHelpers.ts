/**
 * Pure client-side video processing utilities
 * Avoids any server overhead or external video transcoders
 */

/**
 * Generates a beautiful video thumbnail from a File or Blob using HTML5 Canvas.
 * Seeks to 1.5 seconds (or mid-point if the video is extremely short)
 * Returns a high-quality compressed JPEG Blob.
 */
export function generateVideoThumbnail(
  videoFileOrUrl: File | Blob | string
): Promise<{ thumbnail: Blob; durationSeconds: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    let objectUrl: string | null = null;
    if (typeof videoFileOrUrl === "string") {
      video.src = videoFileOrUrl;
    } else {
      objectUrl = URL.createObjectURL(videoFileOrUrl);
      video.src = objectUrl;
    }

    // Set timeout to reject if video takes too long to load/resolve
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Thumbnail generation timed out after 2s"));
    }, 2000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    video.onloadedmetadata = () => {
      // Seek to 1 second or half duration
      const seekTime = Math.min(1.5, video.duration / 2 || 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        // Keep default aspect ratio but limit size for super fast cloud writes
        const targetWidth = 640;
        const scaleFactor = targetWidth / (video.videoWidth || 640);
        canvas.width = targetWidth;
        canvas.height = (video.videoHeight || 360) * scaleFactor;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                resolve({
                  thumbnail: blob,
                  durationSeconds: video.duration || 0,
                });
              } else {
                reject(new Error("Canvas conversion returned null blob"));
              }
            },
            "image/jpeg",
            0.85
          );
        } else {
          cleanup();
          reject(new Error("Canvas 2D context unavailable"));
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video format parameters"));
    };
  });
}

/**
 * Formats duration in seconds to "MM:SS" or "HH:MM:SS" readable string
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedSecs = secs < 10 ? `0${secs}` : secs;
  if (hours > 0) {
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    return `${hours}:${formattedMins}:${formattedSecs}`;
  }
  return `${mins}:${formattedSecs}`;
}

/**
 * Converts a data URI / Base64 string directly to a physical Binary Blob
 */
export function base64ToBlob(base64DataUri: string): Blob {
  const parts = base64DataUri.split(";base64,");
  const contentType = parts[0].split(":")[1] || "video/mp4";
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}
