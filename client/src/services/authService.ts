/**
 * Authentication Service
 *
 * Provides Google Sign-In and Email/Password functionality using Firebase Auth.
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
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
  // Clear any legacy dev tokens that might be lingering
  document.cookie = `dev_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `dev_auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  localStorage.removeItem('dev_auth_user');

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
    return () => { };
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

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  const result = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(result.user);
};

/**
 * Create a new account with email and password
 */
export const createAccountWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Update profile with display name if provided
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }

  return toAuthUser(result.user);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  await sendPasswordResetEmail(auth, email);
};
