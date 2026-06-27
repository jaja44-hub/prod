/**
 * Firebase Storage upload helper for browser file uploads.
 *
 * Usage example:
 * import { uploadFile, buildStoragePath } from '../lib/storageClient';
 *
 * async function handleFile(file, tenantId) {
 *   const path = buildStoragePath(tenantId, 'documents', file.name);
 *   const { url } = await uploadFile(file, path, (progress) => {
 *     console.log(`Upload progress: ${progress}%`);
 *   });
 *   return url;
 * }
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import app from '../config/firebase';

function requireStorage() {
  if (!app) {
    throw new Error('Firebase app is not initialized. Ensure VITE_FIREBASE_* env vars are configured.');
  }
  return getStorage(app);
}

export function buildStoragePath(tenantId, category, filename) {
  if (!tenantId || !category || !filename) {
    throw new Error('buildStoragePath requires tenantId, category, and filename.');
  }
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  return `uploads/${tenantId}/${category}/${timestamp}_${safeFilename}`;
}

export async function uploadFile(file, destinationPath, onProgress) {
  if (!file || !(file instanceof File)) {
    throw new Error('uploadFile requires a browser File object as the first argument.');
  }
  if (!destinationPath || typeof destinationPath !== 'string') {
    throw new Error('uploadFile requires a destinationPath string.');
  }

  const storage = requireStorage();
  const storageRef = ref(storage, destinationPath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        reject(new Error(`Firebase Storage upload failed: ${error.message || error}`));
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path: destinationPath });
        } catch (urlError) {
          reject(new Error(`Failed to retrieve download URL: ${urlError.message || urlError}`));
        }
      }
    );
  });
}
