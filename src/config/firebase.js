// Production sector Firebase init — uses VITE_FIREBASE_* (Vercel) or VITE_FIREBASE_CONFIG JSON fallback.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function resolveFirebaseConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : process.env;
  if (env?.VITE_FIREBASE_API_KEY && env?.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };
  }
  if (env?.VITE_FIREBASE_CONFIG) {
    try {
      return JSON.parse(env.VITE_FIREBASE_CONFIG);
    } catch {
      console.error('VITE_FIREBASE_CONFIG is not valid JSON');
    }
  }
  return null;
}

const firebaseConfig = resolveFirebaseConfig();
if (!firebaseConfig?.apiKey) {
  console.warn('[firebase] Missing VITE_FIREBASE_* or VITE_FIREBASE_CONFIG — Firestore will not initialize.');
}

const app = firebaseConfig?.apiKey ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export default app;
