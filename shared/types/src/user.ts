/**
 * User Schema Definitions
 * Single source of truth for user data structures
 */

import { z } from 'zod';
import type { FirestoreUser } from './firestore-types.js';

// Re-export Firestore type for convenience
export type { FirestoreUser } from './firestore-types.js';

// =============================================================================
// API Schemas
// =============================================================================

/**
 * User as returned by the API
 */
export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().url().nullable(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * API response for current user
 */
export const UserResponseSchema = z.object({
  user: UserSchema,
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

// =============================================================================
// Firestore Data Schemas (for validation without Timestamps)
// =============================================================================

/**
 * Firestore user data schema (without timestamps)
 */
export const FirestoreUserDataSchema = z.object({
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().nullable(),
});

export type FirestoreUserData = z.infer<typeof FirestoreUserDataSchema>;

// =============================================================================
// Transformation Helpers
// =============================================================================

/**
 * Transform Firestore user document to API user
 */
export function firestoreUserToApi(doc: FirestoreUser, id: string): User {
  return {
    id,
    email: doc.email,
    displayName: doc.displayName,
    photoURL: doc.photoURL,
  };
}

/**
 * Validate and parse user
 */
export function parseUser(data: unknown): User {
  return UserSchema.parse(data);
}

/**
 * Safely parse user
 */
export function safeParseUser(data: unknown) {
  return UserSchema.safeParse(data);
}
