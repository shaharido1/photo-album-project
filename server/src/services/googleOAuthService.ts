/**
 * Google OAuth Service
 *
 * Handles OAuth 2.0 authentication for Google Photos API access
 * - Generates OAuth authorization URLs
 * - Exchanges authorization codes for tokens
 * - Manages token refresh
 * - Encrypts/decrypts refresh tokens for secure storage
 */

import googleapis from 'googleapis';
const { google } = googleapis;
import crypto from 'crypto';
import { getFirestore } from '../config/firebase.js';
import type { FirestoreGooglePhotosAuth } from '@photo-album/types';
import { Timestamp } from 'firebase-admin/firestore';

// OAuth configuration
const GOOGLE_PHOTOS_SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
  'https://www.googleapis.com/auth/photoslibrary.sharing',
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
  'email',
  'profile',
  'openid',
];


const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// In-memory state store for CSRF protection (in production, use Redis or similar)
const pendingStates = new Map<string, { userId: string; expiresAt: number }>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Get OAuth2 client configured with credentials
 */
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3001/api/google-photos/auth/callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Get encryption key from environment
 */
const getEncryptionKey = (): Buffer => {
  const key = process.env.GOOGLE_PHOTOS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'Encryption key not configured. Set GOOGLE_PHOTOS_ENCRYPTION_KEY environment variable (32-byte hex string).'
    );
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encrypt a string using AES-256-GCM
 */
const encrypt = (text: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a string encrypted with AES-256-GCM
 */
const decrypt = (encryptedText: string): string => {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate a cryptographically secure state parameter
 */
const generateState = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Clean up expired states
 */
const cleanupExpiredStates = () => {
  const now = Date.now();
  for (const [state, data] of pendingStates.entries()) {
    if (data.expiresAt < now) {
      pendingStates.delete(state);
    }
  }
};

export const googleOAuthService = {
  /**
   * Generate OAuth authorization URL for a user
   */
  generateAuthUrl(userId: string): string {
    cleanupExpiredStates();

    const oauth2Client = getOAuth2Client();
    const state = generateState();

    pendingStates.set(state, {
      userId,
      expiresAt: Date.now() + STATE_EXPIRY_MS,
    });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_PHOTOS_SCOPES,

      state,
      prompt: 'consent',
    });

    return authUrl;
  },

  /**
   * Validate state parameter and return associated user ID
   */
  validateState(state: string): string | null {
    cleanupExpiredStates();

    const stateData = pendingStates.get(state);
    if (!stateData) {
      return null;
    }

    pendingStates.delete(state);

    if (stateData.expiresAt < Date.now()) {
      return null;
    }

    return stateData.userId;
  },

  /**
   * Exchange authorization code for tokens and store them
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<void> {
    const oauth2Client = getOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.refresh_token) {
      throw new Error(
        'No refresh token received. User may need to revoke access and re-authorize.'
      );
    }

    // Attempt to get user email
    let googleEmail = 'unknown@gmail.com';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        googleEmail = userInfo.data.email;
      }
    } catch (error) {
      console.warn('Failed to fetch Google user info:', error);
    }


    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    const db = getFirestore();
    const docRef = db.collection('googlePhotosAuth').doc(userId);

    const authData: Omit<FirestoreGooglePhotosAuth, 'connectedAt' | 'lastUsedAt'> & {
      connectedAt: Timestamp;
      lastUsedAt: Timestamp;
    } = {
      userId,
      encryptedRefreshToken,
      scopes: GOOGLE_PHOTOS_SCOPES,

      googleEmail,
      connectedAt: Timestamp.now(),
      lastUsedAt: Timestamp.now(),
    };

    await docRef.set(authData);
  },

  /**
   * Get a valid access token for a user (auto-refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const db = getFirestore();
    const docRef = db.collection('googlePhotosAuth').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Google Photos not connected for this user');
    }

    const data = doc.data() as FirestoreGooglePhotosAuth;
    const refreshToken = decrypt(data.encryptedRefreshToken);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    console.log(`[GoogleOAuthService] Refreshing access token for user: ${userId}`);
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      console.error(`[GoogleOAuthService] Failed to refresh access token for user: ${userId}`);
      throw new Error('Failed to refresh access token');
    }

    await docRef.update({
      lastUsedAt: Timestamp.now(),
    });

    return credentials.access_token;
  },

  /**
   * Check if user has Google Photos connected
   */
  async getConnectionStatus(
    userId: string
  ): Promise<{ connected: boolean; email?: string; connectedAt?: string }> {
    const db = getFirestore();
    const docRef = db.collection('googlePhotosAuth').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { connected: false };
    }

    const data = doc.data() as FirestoreGooglePhotosAuth;

    return {
      connected: true,
      email: data.googleEmail,
      connectedAt: data.connectedAt.toDate().toISOString(),
    };
  },

  /**
   * Disconnect Google Photos (revoke access and delete stored tokens)
   */
  async disconnect(userId: string): Promise<void> {
    const db = getFirestore();
    const docRef = db.collection('googlePhotosAuth').doc(userId);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data() as FirestoreGooglePhotosAuth;

      try {
        const refreshToken = decrypt(data.encryptedRefreshToken);
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(refreshToken);
      } catch {
        // Continue even if revocation fails
      }

      await docRef.delete();
    }
  },
};
