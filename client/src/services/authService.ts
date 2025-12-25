/**
 * Authentication Service
 *
 * Provides Google Sign-In functionality using Firebase Auth
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/config/firebase';

/**
 * User info returned from authentication
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Convert Firebase User to AuthUser
 */
const toAuthUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
});

/**
 * Sign in with Google popup
 */
export const signInWithGoogle = async (): Promise<AuthUser> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  const provider = new GoogleAuthProvider();
  // Request email and profile scopes
  provider.addScope('email');
  provider.addScope('profile');

  const result = await signInWithPopup(auth, provider);
  return toAuthUser(result.user);
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  await firebaseSignOut(auth);
};

/**
 * Get the current user's ID token for API requests
 */
export const getIdToken = async (): Promise<string | null> => {
  const auth = getFirebaseAuth();

  if (!auth || !auth.currentUser) {
    return null;
  }

  return auth.currentUser.getIdToken();
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  const auth = getFirebaseAuth();

  if (!auth) {
    // If Firebase is not configured, immediately call with null
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user ? toAuthUser(user) : null);
  });
};

/**
 * Check if Firebase auth is available
 */
export const isAuthAvailable = (): boolean => {
  return isFirebaseConfigured();
};
