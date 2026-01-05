/**
 * Storage Service Interface
 *
 * Abstract interface for photo storage operations.
 * Implementations can use Firebase Storage, local filesystem, S3, etc.
 */

export interface UploadResult {
  fullSizeUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface StorageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export interface IStorageService {
  /**
   * Upload a photo with automatic thumbnail generation
   * @param userId - The user ID to organize storage
   * @param file - The file to upload
   * @returns Upload result with URLs and dimensions
   */
  uploadPhoto(userId: string, file: StorageFile): Promise<UploadResult>;

  /**
   * Delete a photo and its thumbnail from storage
   * @param fullSizeUrl - URL of the full-size image
   * @param thumbnailUrl - URL of the thumbnail image
   */
  deletePhoto(fullSizeUrl: string, thumbnailUrl: string): Promise<void>;

  /**
   * Delete all photos for a user
   * @param userId - The user ID whose photos should be deleted
   */
  deleteAllUserPhotos(userId: string): Promise<void>;

  /**
   * Get the storage directory path (for local storage serving)
   * Returns null for remote storage implementations
   */
  getStorageDir(): string | null;

  /**
   * Get the storage type identifier
   */
  getType(): 'firebase' | 'local' | 'cloudinary';
}
