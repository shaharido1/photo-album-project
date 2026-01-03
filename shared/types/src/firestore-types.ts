/**
 * Firestore Type Definitions
 *
 * These types represent the shape of documents in Firestore.
 * They use a generic Timestamp type to avoid requiring firebase-admin
 * as a direct dependency.
 *
 * Usage in server (with firebase-admin):
 *   import { Timestamp } from 'firebase-admin/firestore';
 *   import type { FirestorePhoto } from '@photo-album/types';
 *   // FirestorePhoto will use Timestamp for createdAt/updatedAt
 */

// =============================================================================
// Generic Timestamp Type
// =============================================================================

/**
 * Generic timestamp interface that matches Firebase Timestamp API
 * This allows the shared types to work without firebase-admin dependency
 */
export interface TimestampLike {
  toDate(): Date;
  toMillis(): number;
}

// =============================================================================
// Photo
// =============================================================================

export interface FirestorePhoto {
  userId: string;
  name: string;
  thumbnail: string;
  fullSize: string;
  width: number;
  height: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  // Google Photos integration fields (optional for backwards compatibility)
  source?: 'upload' | 'google';
  storageType?: 'firebase' | 'google-reference';
  googlePhotoId?: string;
  googlePhotoUrl?: string;
  googlePhotoUrlExpiry?: TimestampLike;
  // AI-generated metadata (optional for backwards compatibility)
  caption?: string;
  tags?: string[];
  aiProcessed?: boolean;
  aiProcessedAt?: TimestampLike;
  aiProvider?: string; // e.g., 'moondream', 'openai', etc.
}

// =============================================================================
// User
// =============================================================================

export interface FirestoreUser {
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  // User settings (optional for backwards compatibility)
  settings?: {
    autoImageTagging?: boolean;
  };
}

// =============================================================================
// Album
// =============================================================================

export interface FirestorePageSlot {
  id: string;
  photoId: string | null;
  photoUrl?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

export interface FirestoreAlbumPage {
  id?: string;
  layoutId: string;
  background: string;
  order: number;
  slots: FirestorePageSlot[];
}

export interface FirestoreAlbum {
  id?: string;
  userId: string;
  name: string;
  size: string;
  currentPageIndex: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface FirestoreAlbumWithPages extends FirestoreAlbum {
  pages: FirestoreAlbumPage[];
}
