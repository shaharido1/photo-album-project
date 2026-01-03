/**
 * Development Auth Service
 *
 * Provides mock authentication for development and testing without requiring Firebase.
 * Enable by setting VITE_DEV_AUTH_ENABLED=true in .env
 */

import type { AuthUser } from './authService';

// Default dev user
const devEmail = import.meta.env.VITE_DEV_AUTH_EMAIL || 'dev@example.com';
const DEV_USER: AuthUser = {
  uid: `dev-user-${devEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
  email: devEmail,
  displayName: 'Dev User',
  photoURL: null,
};

// Storage key for dev auth state
const DEV_AUTH_KEY = 'dev_auth_user';
const DEV_TOKEN_COOKIE = 'dev_auth_token';

/**
 * Helper to set a cookie
 */
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

/**
 * Helper to get a cookie
 */
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Check if dev auth is enabled
 */
export const isDevAuthEnabled = (): boolean => {
  // Explicitly disabled
  if (import.meta.env.VITE_DEV_AUTH_ENABLED === 'false') return false;
  // Enabled if explicitly set OR if in development mode OR in test mode
  return (
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test' ||
    import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
  );
};

/**
 * Get stored dev user
 */
export const getDevUser = (): AuthUser | null => {
  if (!isDevAuthEnabled()) return null;

  // In test environment, return default dev user if none stored
  if (import.meta.env.MODE === 'test') {
    return DEV_USER;
  }

  try {
    // Try cookie first (preferred for persistence as requested)
    const cookieStored = getCookie(DEV_AUTH_KEY);
    if (cookieStored) {
      return JSON.parse(decodeURIComponent(cookieStored));
    }

    // Fallback to localStorage
    const localStored = localStorage.getItem(DEV_AUTH_KEY);
    return localStored ? JSON.parse(localStored) : null;
  } catch {
    return null;
  }
};

// Observers for auth state changes
type AuthListener = (user: AuthUser | null) => void;
const listeners: AuthListener[] = [];

/**
 * Notify all listeners of state change
 */
const notifyListeners = (user: AuthUser | null) => {
  listeners.forEach((listener) => listener(user));
};

/**
 * Sign in as dev user
 */
export const devSignIn = (customUser?: Partial<AuthUser>): AuthUser => {
  const user: AuthUser = {
    ...DEV_USER,
    ...customUser,
  };

  const userStr = JSON.stringify(user);
  const encodedUser = encodeURIComponent(userStr);

  // Persist to both localStorage and Cookie
  localStorage.setItem(DEV_AUTH_KEY, userStr);
  setCookie(DEV_AUTH_KEY, encodedUser);

  // Also cache token in cookie
  setCookie(DEV_TOKEN_COOKIE, `dev-token:${user.uid}`);

  notifyListeners(user);
  return user;
};

/**
 * Sign out dev user
 */
export const devSignOut = (): void => {
  localStorage.removeItem(DEV_AUTH_KEY);
  document.cookie = `${DEV_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${DEV_AUTH_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  notifyListeners(null);
};

/**
 * Generate a mock ID token for dev user
 * This token is recognized by the server's X-Test-User-Id header
 */
export const getDevIdToken = (): string | null => {
  // Check cookie first (persistent cache)
  const cachedToken = getCookie(DEV_TOKEN_COOKIE);
  if (cachedToken) return cachedToken;

  const user = getDevUser();
  if (!user) return null;

  // Return the user ID which the server will accept
  const token = `dev-token:${user.uid}`;
  setCookie(DEV_TOKEN_COOKIE, token);
  return token;
};

/**
 * Subscribe to dev auth changes
 */
export const subscribeToDevAuthChanges = (
  callback: AuthListener
): (() => void) => {
  // Get current user from storage/cookies
  const user = getDevUser();

  // Immediately call with current state
  callback(user);

  // Add to listeners
  listeners.push(callback);

  // Listen for storage changes (for multi-tab support)
  const handleStorage = (e: StorageEvent): void => {
    if (e.key === DEV_AUTH_KEY) {
      const newUser = e.newValue ? JSON.parse(e.newValue) : null;
      // We don't notify all listeners here to avoid loops if the change originated here 
      // (though storage events don't fire on same tab anyway)
      callback(newUser);
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    window.removeEventListener('storage', handleStorage);
  };
};
