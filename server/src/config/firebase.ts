/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin SDK for server-side operations:
 * - Firestore database access
 * - Authentication token verification
 */

import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for credentials (recommended for production)
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // Handle escaped newlines in environment variables
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    projectId,
  });

  isInitialized = true;
  return firebaseApp;
};

/**
 * Check if Firebase is initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Get Firestore database instance
 */
export const getFirestore = (): admin.firestore.Firestore => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.firestore();
};

/**
 * Get Firebase Auth instance
 */
export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth();
};

export default admin;
