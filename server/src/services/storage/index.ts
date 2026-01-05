/**
 * Storage Service Factory
 *
 * Creates the appropriate storage service based on environment configuration.
 * Priority:
 * 1. USE_LOCAL_STORAGE=true -> Local filesystem storage (development/testing)
 * 2. USE_CLOUDINARY_STORAGE=true -> Cloudinary storage
 * 3. Default -> Firebase Storage (production)
 */

import type { IStorageService, UploadResult, StorageFile } from './IStorageService.js';
import { FirebaseStorageService } from './FirebaseStorageService.js';
import { LocalStorageService } from './LocalStorageService.js';
import { CloudinaryStorageService } from './CloudinaryStorageService.js';

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
  const useCloudinaryStorage = process.env.USE_CLOUDINARY_STORAGE === 'true';

  if (useLocalStorage) {
    // eslint-disable-next-line no-console
    console.log('Using local storage service');
    storageServiceInstance = new LocalStorageService();
  } else if (useCloudinaryStorage) {
    // eslint-disable-next-line no-console
    console.log('Using Cloudinary storage service');
    storageServiceInstance = new CloudinaryStorageService();
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

  getType(): 'firebase' | 'local' | 'cloudinary' {
    return getStorageServiceInstance().getType();
  },
};

// Re-export types
export type { IStorageService, UploadResult, StorageFile };
