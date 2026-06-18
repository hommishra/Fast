// Client-side IndexedDB Persistent Cache for Uploaded News Videos
// This ensures uploaded videos persist reliably in the editor's and reviewer's browser
// regardless of ephemeral backend container restarts.

const DB_NAME = "FastCoverageVideoCache";
const STORE_NAME = "videos";
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject(new Error("IndexedDB opening failed: " + (event.target as IDBOpenDBRequest).error?.message));
    };
  });
}

/**
 * Saves a video file Blob in IndexedDB matched by its server URL
 */
export async function saveVideoFile(url: string, fileBlob: Blob | File): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileBlob, url);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (err) {
    console.error("Failed to save video to local cache:", err);
  }
}

/**
 * Retrieves a cached video file Blob from IndexedDB
 */
export async function getVideoFile(url: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result || null);
      };
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (err) {
    console.error("Failed to fetch video from local cache:", err);
    return null;
  }
}

/**
 * Deletes a cached video file from IndexedDB
 */
export async function deleteVideoFile(url: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  } catch (err) {
    console.error("Failed to delete video from local cache:", err);
  }
}
