/**
 * Development Auth Service
 *
 * Provides mock authentication for development and testing without requiring Firebase.
 * Enable by setting VITE_DEV_AUTH_ENABLED=true in .env
 */

import type { AuthUser } from './authService';

// Default dev user
const DEV_USER: AuthUser = {
  uid: 'dev-user-123',
  email: 'dev@example.com',
  displayName: 'Dev User',
  photoURL: null,
};

// Storage key for dev auth state
const DEV_AUTH_KEY = 'dev_auth_user';

/**
 * Check if dev auth is enabled
 */
export const isDevAuthEnabled = (): boolean => {
  return import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
};

/**
 * Get stored dev user from localStorage
 */
export const getDevUser = (): AuthUser | null => {
  if (!isDevAuthEnabled()) return null;

  try {
    const stored = localStorage.getItem(DEV_AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Sign in as dev user
 */
export const devSignIn = (customUser?: Partial<AuthUser>): AuthUser => {
  const user: AuthUser = {
    ...DEV_USER,
    ...customUser,
  };

  localStorage.setItem(DEV_AUTH_KEY, JSON.stringify(user));
  return user;
};

/**
 * Sign out dev user
 */
export const devSignOut = (): void => {
  localStorage.removeItem(DEV_AUTH_KEY);
};

/**
 * Generate a mock ID token for dev user
 * This token is recognized by the server's X-Test-User-Id header
 */
export const getDevIdToken = (): string | null => {
  const user = getDevUser();
  if (!user) return null;

  // Return the user ID which the server will accept via X-Test-User-Id header
  return `dev-token:${user.uid}`;
};

/**
 * Subscribe to dev auth changes (for compatibility with real auth service)
 */
export const subscribeToDevAuthChanges = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  // Immediately call with current state
  callback(getDevUser());

  // Listen for storage changes (for multi-tab support)
  const handleStorage = (e: StorageEvent): void => {
    if (e.key === DEV_AUTH_KEY) {
      callback(e.newValue ? JSON.parse(e.newValue) : null);
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};
