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
  uid: `dev-user-${devEmail.replace(/[^a-zA-Z0-0]/g, '-')}`,
  email: devEmail,
  displayName: 'Dev User',
  photoURL: null,
};

const DEV_AUTH_PASSWORD = import.meta.env.VITE_DEV_AUTH_PASSWORD || '';

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
  // Enabled if explicitly set OR if in development mode
  return import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';
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

  // Also cache token in cookie
  setCookie(DEV_TOKEN_COOKIE, `dev-token:${user.uid}`);

  return user;
};

/**
 * Sign out dev user
 */
export const devSignOut = (): void => {
  localStorage.removeItem(DEV_AUTH_KEY);
  document.cookie = `${DEV_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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
 * Subscribe to dev auth changes (for compatibility with real auth service)
 */
export const subscribeToDevAuthChanges = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  // Get current user
  let user = getDevUser();

  // Auto-login: If no user and dev auth is enabled, automatically sign in
  if (!user && isDevAuthEnabled()) {
    // Check if auto-login is explicitly disabled
    if (import.meta.env.VITE_DEV_AUTH_AUTO_LOGIN !== 'false') {
      user = devSignIn();
    }
  }

  // Immediately call with current state
  callback(user);

  // Listen for storage changes (for multi-tab support)
  const handleStorage = (e: StorageEvent): void => {
    if (e.key === DEV_AUTH_KEY) {
      callback(e.newValue ? JSON.parse(e.newValue) : null);
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};
