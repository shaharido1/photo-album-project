/**
 * Google Photos Integration Type Definitions
 * Types for Google Photos API integration and OAuth
 */

import { z } from 'zod';
import type { TimestampLike } from './firestore-types.js';

// =============================================================================
// Google Photos API Types (from Google Photos Library API)
// =============================================================================

/**
 * Google Photos album as returned by the API
 */
export const GooglePhotosAlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  productUrl: z.string().url().optional(),
  mediaItemsCount: z.string().optional(), // Google returns count as string
  coverPhotoBaseUrl: z.string().optional(),
  coverPhotoMediaItemId: z.string().optional(),
});

export type GooglePhotosAlbum = z.infer<typeof GooglePhotosAlbumSchema>;

/**
 * Google Photos media item metadata
 */
export const GooglePhotosMediaMetadataSchema = z.object({
  creationTime: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  photo: z
    .object({
      cameraMake: z.string().optional(),
      cameraModel: z.string().optional(),
      focalLength: z.number().optional(),
      apertureFNumber: z.number().optional(),
      isoEquivalent: z.number().optional(),
      exposureTime: z.string().optional(),
    })
    .optional(),
});

export type GooglePhotosMediaMetadata = z.infer<typeof GooglePhotosMediaMetadataSchema>;

/**
 * Google Photos media item (photo/video)
 */
export const GooglePhotosMediaItemSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  productUrl: z.string().url().optional(),
  baseUrl: z.string(), // URL without size params, expires in ~60 min
  mimeType: z.string(),
  mediaMetadata: GooglePhotosMediaMetadataSchema.optional(),
  filename: z.string(),
});

export type GooglePhotosMediaItem = z.infer<typeof GooglePhotosMediaItemSchema>;

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from listing albums
 */
export const GooglePhotosAlbumsResponseSchema = z.object({
  albums: z.array(GooglePhotosAlbumSchema),
  nextPageToken: z.string().nullable(),
});

export type GooglePhotosAlbumsResponse = z.infer<typeof GooglePhotosAlbumsResponseSchema>;

/**
 * Response from listing photos
 */
export const GooglePhotosListResponseSchema = z.object({
  photos: z.array(GooglePhotosMediaItemSchema),
  nextPageToken: z.string().nullable(),
});

export type GooglePhotosListResponse = z.infer<typeof GooglePhotosListResponseSchema>;

/**
 * Connection status response
 */
export const GooglePhotosStatusResponseSchema = z.object({
  connected: z.boolean(),
  email: z.string().email().optional(),
  connectedAt: z.string().datetime({ offset: true }).optional(),
});

export type GooglePhotosStatusResponse = z.infer<typeof GooglePhotosStatusResponseSchema>;

// =============================================================================
// Import Types
// =============================================================================

/**
 * Storage type for imported photos
 */
export const PhotoStorageTypeSchema = z.enum(['firebase', 'google-reference']);
export type PhotoStorageType = z.infer<typeof PhotoStorageTypeSchema>;

/**
 * Source of the photo
 */
export const PhotoSourceSchema = z.enum(['upload', 'google']);
export type PhotoSource = z.infer<typeof PhotoSourceSchema>;

/**
 * Options for importing photos from Google Photos
 */
export const ImportOptionsSchema = z.object({
  storageType: PhotoStorageTypeSchema,
});

export type ImportOptions = z.infer<typeof ImportOptionsSchema>;

/**
 * Request to import photos
 */
export const ImportPhotosRequestSchema = z.object({
  photoIds: z.array(z.string()).min(1).max(50),
  options: ImportOptionsSchema,
});

export type ImportPhotosRequest = z.infer<typeof ImportPhotosRequestSchema>;

/**
 * Result for a single photo import
 */
export const ImportPhotoResultSchema = z.object({
  googlePhotoId: z.string(),
  success: z.boolean(),
  photoId: z.string().optional(), // ID in our system if successful
  error: z.string().optional(),
});

export type ImportPhotoResult = z.infer<typeof ImportPhotoResultSchema>;

/**
 * Response from import operation
 */
export const ImportPhotosResponseSchema = z.object({
  results: z.array(ImportPhotoResultSchema),
  imported: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export type ImportPhotosResponse = z.infer<typeof ImportPhotosResponseSchema>;

// =============================================================================
// OAuth Types
// =============================================================================

/**
 * OAuth start response
 */
export const OAuthStartResponseSchema = z.object({
  authUrl: z.string().url(),
});

export type OAuthStartResponse = z.infer<typeof OAuthStartResponseSchema>;

// =============================================================================
// Firestore Types for Google Photos Auth
// =============================================================================

/**
 * Google Photos authentication data stored in Firestore
 */
export interface FirestoreGooglePhotosAuth {
  userId: string;
  encryptedRefreshToken: string;
  scopes: string[];
  googleEmail: string;
  connectedAt: TimestampLike;
  lastUsedAt: TimestampLike;
}

// =============================================================================
// Extended Photo Fields for Google Photos Source
// =============================================================================

/**
 * Additional fields for photos imported from Google Photos
 * These extend the base FirestorePhoto interface
 */
export interface GooglePhotoExtension {
  source: PhotoSource;
  storageType: PhotoStorageType;
  googlePhotoId?: string;
  googlePhotoUrl?: string; // For reference storage type
  googlePhotoUrlExpiry?: TimestampLike; // When the URL expires
}
