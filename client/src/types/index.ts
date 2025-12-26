/**
 * Central Type Exports
 *
 * Re-exports shared types from @photo-album/types
 * and adds client-specific types.
 */

// Re-export all shared types
export * from '@photo-album/types';

// Client-specific types (extends shared types)
export * from './photos';
