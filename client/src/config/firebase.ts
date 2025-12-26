/**
 * Firebase Client SDK Configuration
 *
 * Initializes Firebase for client-side authentication (Google Sign-In)
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

// Initialize Firebase app (lazy initialization)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
  }

  return app;
};

export const getFirebaseAuth = (): Auth | null => {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    return null;
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
    // Set persistence to local storage (IndexedDB) for session persistence across browser restarts
    // eslint-disable-next-line no-console
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }

  return auth;
};

export { firebaseConfig };
