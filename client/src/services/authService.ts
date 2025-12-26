/**
 * Authentication Service
 *
 * Provides Google Sign-In and Email/Password functionality using Firebase Auth.
 * Also supports dev mode authentication bypass.
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
import {
  isDevAuthEnabled,
  devSignIn,
  devSignOut,
  getDevIdToken,
  subscribeToDevAuthChanges,
} from './devAuthService';

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
  // Dev mode bypass
  if (isDevAuthEnabled()) {
    return devSignIn({ displayName: 'Dev User (Google)' });
  }

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
  // Dev mode bypass
  if (isDevAuthEnabled()) {
    devSignOut();
    return;
  }

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
  // Dev mode bypass
  if (isDevAuthEnabled()) {
    return getDevIdToken();
  }

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
  // Dev mode bypass
  if (isDevAuthEnabled()) {
    return subscribeToDevAuthChanges(callback);
  }

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
  // Dev auth is always available when enabled
  if (isDevAuthEnabled()) {
    return true;
  }
  return isFirebaseConfigured();
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  // Dev mode bypass - accept any email/password
  if (isDevAuthEnabled()) {
    return devSignIn({ email, displayName: email.split('@')[0] });
  }

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
  // Dev mode bypass - just sign in with provided details
  if (isDevAuthEnabled()) {
    return devSignIn({
      email,
      displayName: displayName || email.split('@')[0],
    });
  }

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
  // Dev mode bypass - just log and return
  if (isDevAuthEnabled()) {
    // eslint-disable-next-line no-console
    console.log(`[Dev Auth] Password reset requested for: ${email}`);
    return;
  }

  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  await sendPasswordResetEmail(auth, email);
};
