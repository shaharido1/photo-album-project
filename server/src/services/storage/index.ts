/**
 * Storage Service Factory
 *
 * Creates the appropriate storage service based on environment configuration.
 * Set USE_LOCAL_STORAGE=true for local filesystem storage (development/testing)
 * Otherwise uses Firebase Storage (production)
 */

import type { IStorageService, UploadResult, StorageFile } from './IStorageService.js';
import { FirebaseStorageService } from './FirebaseStorageService.js';
import { LocalStorageService } from './LocalStorageService.js';

// Supported image types
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Validate file type
 */
export const isValidImageType = (mimetype: string): boolean => {
  return SUPPORTED_MIME_TYPES.includes(mimetype);
};

// Lazy singleton - created on first use to allow env vars to be set
let storageServiceInstance: IStorageService | null = null;

/**
 * Get or create the appropriate storage service based on environment
 */
const getStorageServiceInstance = (): IStorageService => {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';

  if (useLocalStorage) {
    // eslint-disable-next-line no-console
    console.log('Using local storage service');
    storageServiceInstance = new LocalStorageService();
  } else {
    // eslint-disable-next-line no-console
    console.log('Using Firebase storage service');
    storageServiceInstance = new FirebaseStorageService();
  }

  return storageServiceInstance;
};

/**
 * Storage service wrapper that validates file types before delegating to implementation
 */
export const storageService = {
  async uploadPhoto(userId: string, file: StorageFile): Promise<UploadResult> {
    if (!isValidImageType(file.mimetype)) {
      throw new Error(
        `Invalid file type: ${file.mimetype}. Supported: JPEG, PNG, GIF, WebP`
      );
    }
    return getStorageServiceInstance().uploadPhoto(userId, file);
  },

  async deletePhoto(fullSizeUrl: string, thumbnailUrl: string): Promise<void> {
    return getStorageServiceInstance().deletePhoto(fullSizeUrl, thumbnailUrl);
  },

  async deleteAllUserPhotos(userId: string): Promise<void> {
    return getStorageServiceInstance().deleteAllUserPhotos(userId);
  },

  getStorageDir(): string | null {
    return getStorageServiceInstance().getStorageDir();
  },

  getType(): 'firebase' | 'local' {
    return getStorageServiceInstance().getType();
  },
};

// Re-export types
export type { IStorageService, UploadResult, StorageFile };
