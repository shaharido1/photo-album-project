/**
 * Server Type Definitions
 *
 * Re-exports shared types from @photo-album/types
 * and adds server-specific types.
 */

// Re-export all shared types
export * from '@photo-album/types';

// =============================================================================
// Server-specific types
// =============================================================================

// Package.json type (partial)
export interface PackageJson {
  version: string;
  name?: string;
  [key: string]: unknown;
}
