/**
 * Firebase Storage Service Implementation
 *
 * Handles file upload, download, and deletion operations using Firebase Storage.
 * - Uploads original photos and generates thumbnails
 * - Returns public URLs for stored files
 * - Organizes files by user ID in storage bucket
 */

import { getBucket } from '../../config/firebase.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type {
  IStorageService,
  UploadResult,
  StorageFile,
} from './IStorageService.js';

// Thumbnail settings
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

/**
 * Generate a unique filename for storage
 */
const generateFilename = (
  userId: string,
  originalname: string,
  suffix = ''
): string => {
  const uuid = uuidv4();
  const extension = originalname.split('.').pop() || 'jpg';
  const safeName = suffix ? `${uuid}_${suffix}` : uuid;
  return `photos/${userId}/${safeName}.${extension}`;
};

/**
 * Get public URL for a file in the bucket
 */
const getPublicUrl = (bucketName: string, filename: string): string => {
  return `https://storage.googleapis.com/${bucketName}/${filename}`;
};

/**
 * Generate a thumbnail from an image buffer
 */
const generateThumbnail = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();
};

/**
 * Get image dimensions from buffer
 */
const getImageDimensions = async (
  buffer: Buffer
): Promise<{ width: number; height: number }> => {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
};

/**
 * Firebase Storage Service
 */
export class FirebaseStorageService implements IStorageService {
  /**
   * Upload a buffer to Firebase Storage and make it publicly accessible
   */
  private async uploadBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const bucket = getBucket();
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    return getPublicUrl(bucket.name, filename);
  }

  /**
   * Upload a photo with automatic thumbnail generation
   */
  async uploadPhoto(userId: string, file: StorageFile): Promise<UploadResult> {
    // Get original image dimensions
    const dimensions = await getImageDimensions(file.buffer);

    // Generate filenames
    const fullSizeFilename = generateFilename(
      userId,
      file.originalname,
      'full'
    );
    const thumbnailFilename = generateFilename(
      userId,
      file.originalname,
      'thumb'
    );

    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(file.buffer);

    // Upload both files in parallel
    const [fullSizeUrl, thumbnailUrl] = await Promise.all([
      this.uploadBuffer(file.buffer, fullSizeFilename, file.mimetype),
      this.uploadBuffer(thumbnailBuffer, thumbnailFilename, 'image/jpeg'),
    ]);

    return {
      fullSizeUrl,
      thumbnailUrl,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  /**
   * Delete a photo and its thumbnail from storage
   */
  async deletePhoto(fullSizeUrl: string, thumbnailUrl: string): Promise<void> {
    const bucket = getBucket();

    // Extract filenames from URLs
    const extractFilename = (url: string): string | null => {
      const bucketName = bucket.name;
      const prefix = `https://storage.googleapis.com/${bucketName}/`;
      if (url.startsWith(prefix)) {
        return url.substring(prefix.length);
      }
      return null;
    };

    const fullSizeFilename = extractFilename(fullSizeUrl);
    const thumbnailFilename = extractFilename(thumbnailUrl);

    const deletePromises: Promise<unknown>[] = [];

    if (fullSizeFilename) {
      deletePromises.push(
        bucket
          .file(fullSizeFilename)
          .delete()
          .catch(() => {
            // Ignore errors if file doesn't exist
          })
      );
    }

    if (thumbnailFilename) {
      deletePromises.push(
        bucket
          .file(thumbnailFilename)
          .delete()
          .catch(() => {
            // Ignore errors if file doesn't exist
          })
      );
    }

    await Promise.all(deletePromises);
  }

  /**
   * Delete all photos for a user
   */
  async deleteAllUserPhotos(userId: string): Promise<void> {
    const bucket = getBucket();
    const prefix = `photos/${userId}/`;

    const [files] = await bucket.getFiles({ prefix });

    if (files.length > 0) {
      await Promise.all(files.map((file) => file.delete().catch(() => {})));
    }
  }

  /**
   * Get the storage directory (not applicable for Firebase)
   */
  getStorageDir(): string | null {
    return null;
  }

  /**
   * Get the storage type
   */
  getType(): 'firebase' | 'local' {
    return 'firebase';
  }
}
