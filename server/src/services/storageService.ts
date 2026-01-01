/**
 * Storage Service
 *
 * Re-exports from the storage module for backward compatibility.
 * The actual implementation is selected based on USE_LOCAL_STORAGE environment variable:
 * - USE_LOCAL_STORAGE=true  → Local filesystem storage (development/testing)
 * - USE_LOCAL_STORAGE=false → Firebase Storage (production)
 */

export {
  storageService,
  isValidImageType,
  type IStorageService,
  type UploadResult,
  type StorageFile,
} from './storage/index.js';
