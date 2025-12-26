/**
 * @photo-album/types
 *
 * Single source of truth for all data schemas and types.
 * Uses Zod for runtime validation and TypeScript type inference.
 *
 * Usage:
 *   import { Photo, PhotoSchema, parsePhoto } from '@photo-album/types';
 *
 *   // Type annotation
 *   const photo: Photo = { ... };
 *
 *   // Runtime validation
 *   const validPhoto = parsePhoto(apiResponse);
 *
 *   // Safe parsing (no throw)
 *   const result = safeParsePhoto(apiResponse);
 *   if (result.success) {
 *     console.log(result.data);
 *   }
 */

// Re-export everything from domain modules
export * from './photo.js';
export * from './album.js';
export * from './user.js';
export * from './api.js';
export * from './firestore-types.js';
export * from './google-photos.js';

// Re-export Zod for convenience
export { z } from 'zod';
export type { ZodError, ZodIssue } from 'zod';
