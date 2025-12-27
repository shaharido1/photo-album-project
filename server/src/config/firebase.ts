/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin SDK for server-side operations:
 * - Firestore database access
 * - Authentication token verification
 * - Cloud Storage for photo uploads
 */

import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;
let isInitialized = false;
let configuredBucket: string | null = null;

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
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  // Firebase Storage bucket - must be explicitly set via FIREBASE_STORAGE_BUCKET
  // Go to Firebase Console > Storage to find your bucket name
  configuredBucket = storageBucket || `${projectId}.appspot.com`;

  // eslint-disable-next-line no-console
  console.log('Firebase Storage bucket configured:', configuredBucket);

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // Handle escaped newlines in environment variables
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    projectId,
    storageBucket: configuredBucket,
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
    throw new Error(
      'Firebase not initialized. Call initializeFirebase() first.'
    );
  }
  return admin.firestore();
};

/**
 * Get Firebase Auth instance
 */
export const getAuth = (): admin.auth.Auth => {
  if (!firebaseApp) {
    throw new Error(
      'Firebase not initialized. Call initializeFirebase() first.'
    );
  }
  return admin.auth();
};

/**
 * Get Firebase Storage instance
 */
export const getStorage = (): admin.storage.Storage => {
  if (!firebaseApp) {
    throw new Error(
      'Firebase not initialized. Call initializeFirebase() first.'
    );
  }
  return admin.storage();
};

/**
 * Get the default storage bucket
 */
export const getBucket = (): ReturnType<admin.storage.Storage['bucket']> => {
  if (!configuredBucket) {
    throw new Error(
      'Firebase not initialized. Call initializeFirebase() first.'
    );
  }
  return getStorage().bucket(configuredBucket);
};

export default admin;
