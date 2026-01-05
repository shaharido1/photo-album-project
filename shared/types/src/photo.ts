/**
 * Photo Schema Definitions
 * Single source of truth for photo data structures
 */

import { z } from 'zod';
import type { FirestorePhoto } from './firestore-types.js';

// Re-export Firestore type for convenience
export type { FirestorePhoto } from './firestore-types.js';

// =============================================================================
// API Schemas (what flows between client <-> server)
// =============================================================================

/**
 * Photo as returned by the API
 */
export const PhotoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  thumbnail: z.string().url(),
  fullSize: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
  // AI-generated metadata (optional for backwards compatibility)
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  aiProcessed: z.boolean().optional(),
  aiProcessedAt: z.string().datetime({ offset: true }).optional(),
  aiProvider: z.string().optional(),
  // Google Photos integration fields
  source: z.enum(['upload', 'google']).optional(),
  storageType: z.enum(['firebase', 'google-reference', 'local']).optional(),
  googlePhotoId: z.string().optional(),
});

export type Photo = z.infer<typeof PhotoSchema>;

/**
 * Photo with client-specific fields (extends API Photo)
 */
export const ClientPhotoSchema = PhotoSchema.extend({
  isUploaded: z.boolean().optional(),
});

export type ClientPhoto = z.infer<typeof ClientPhotoSchema>;

/**
 * API response for fetching multiple photos
 */
export const PhotosResponseSchema = z.object({
  photos: z.array(PhotoSchema),
});

export type PhotosResponse = z.infer<typeof PhotosResponseSchema>;

/**
 * API response for fetching a single photo
 */
export const PhotoResponseSchema = z.object({
  photo: PhotoSchema,
});

export type PhotoResponse = z.infer<typeof PhotoResponseSchema>;

/**
 * API response for batch photo upload
 */
export const BatchUploadResponseSchema = z.object({
  photos: z.array(PhotoSchema),
  errors: z.array(z.string()).optional(),
  uploaded: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});

export type BatchUploadResponse = z.infer<typeof BatchUploadResponseSchema>;

// =============================================================================
// Firestore Data Schemas (for validation without Timestamps)
// =============================================================================

/**
 * Photo document data in Firestore (without timestamps for validation)
 * Use FirestorePhoto interface for full type with Timestamps
 */
export const FirestorePhotoDataSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  thumbnail: z.string(),
  fullSize: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type FirestorePhotoData = z.infer<typeof FirestorePhotoDataSchema>;

// =============================================================================
// Transformation Helpers
// =============================================================================

/**
 * Transform Firestore photo document to API photo
 */
export function firestorePhotoToApi(doc: FirestorePhoto, id: string): Photo {
  const photo: Photo = {
    id,
    name: doc.name,
    thumbnail: doc.thumbnail,
    fullSize: doc.fullSize,
    width: doc.width,
    height: doc.height,
    createdAt: doc.createdAt.toDate().toISOString(),
  };

  // Include AI fields if present
  if (doc.caption !== undefined) photo.caption = doc.caption;
  if (doc.tags !== undefined) photo.tags = doc.tags;
  if (doc.aiProcessed !== undefined) photo.aiProcessed = doc.aiProcessed;
  if (doc.aiProcessedAt !== undefined) {
    photo.aiProcessedAt = doc.aiProcessedAt.toDate().toISOString();
  }
  if (doc.aiProvider !== undefined) photo.aiProvider = doc.aiProvider;

  // Include Google Photos fields if present
  if (doc.source !== undefined) photo.source = doc.source;
  if (doc.storageType !== undefined) photo.storageType = doc.storageType;
  if (doc.googlePhotoId !== undefined) photo.googlePhotoId = doc.googlePhotoId;

  return photo;
}

/**
 * Validate and parse API photo response
 * Throws ZodError if validation fails
 */
export function parsePhoto(data: unknown): Photo {
  return PhotoSchema.parse(data);
}

/**
 * Safely parse API photo response
 * Returns success/error result instead of throwing
 */
export function safeParsePhoto(data: unknown) {
  return PhotoSchema.safeParse(data);
}

/**
 * Validate and parse photos array response
 */
export function parsePhotosResponse(data: unknown): PhotosResponse {
  return PhotosResponseSchema.parse(data);
}

/**
 * Safely parse photos array response
 */
export function safeParsePhotosResponse(data: unknown) {
  return PhotosResponseSchema.safeParse(data);
}
