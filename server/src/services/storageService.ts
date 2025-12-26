/**
 * Firebase Storage Service
 *
 * Handles file upload, download, and deletion operations for photos
 * - Uploads original photos and generates thumbnails
 * - Returns public URLs for stored files
 * - Organizes files by user ID in storage bucket
 */

import { getBucket } from '../config/firebase.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Thumbnail settings
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

// Supported image types
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

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
const getPublicUrl = (filename: string): string => {
  const bucket = getBucket();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
};

/**
 * Upload a buffer to Firebase Storage and make it publicly accessible
 */
const uploadBuffer = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
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

  return getPublicUrl(filename);
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
 * Validate file type
 */
export const isValidImageType = (mimetype: string): boolean => {
  return SUPPORTED_MIME_TYPES.includes(mimetype);
};

/**
 * Storage service with upload, download, and delete operations
 */
export const storageService = {
  /**
   * Upload a photo with automatic thumbnail generation
   */
  async uploadPhoto(userId: string, file: StorageFile): Promise<UploadResult> {
    if (!isValidImageType(file.mimetype)) {
      throw new Error(
        `Invalid file type: ${file.mimetype}. Supported: JPEG, PNG, GIF, WebP`
      );
    }

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
      uploadBuffer(file.buffer, fullSizeFilename, file.mimetype),
      uploadBuffer(thumbnailBuffer, thumbnailFilename, 'image/jpeg'),
    ]);

    return {
      fullSizeUrl,
      thumbnailUrl,
      width: dimensions.width,
      height: dimensions.height,
    };
  },

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
        bucket.file(fullSizeFilename).delete().catch(() => {
          // Ignore errors if file doesn't exist
        })
      );
    }

    if (thumbnailFilename) {
      deletePromises.push(
        bucket.file(thumbnailFilename).delete().catch(() => {
          // Ignore errors if file doesn't exist
        })
      );
    }

    await Promise.all(deletePromises);
  },

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
  },
};
