/**
 * Local Storage Service Implementation
 *
 * Stores files locally in firebase-storage-mock directory for development/testing.
 * This allows the app to work without a real Firebase Storage bucket.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type {
  IStorageService,
  UploadResult,
  StorageFile,
} from './IStorageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage directory
// Use STORAGE_PATH_FOLDER from env, or fall back to the mock directory relative to server root
const STORAGE_DIR = process.env.STORAGE_PATH_FOLDER
  ? (path.isAbsolute(process.env.STORAGE_PATH_FOLDER)
    ? process.env.STORAGE_PATH_FOLDER
    : path.join(process.env.PWD || process.cwd(), process.env.STORAGE_PATH_FOLDER))
  : path.join(__dirname, '../../../firebase-storage-mock');

// Thumbnail settings
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

/**
 * Ensure the storage directory exists
 */
const ensureStorageDir = async (subPath: string): Promise<string> => {
  const fullPath = path.join(STORAGE_DIR, subPath);
  await fs.mkdir(fullPath, { recursive: true });
  return fullPath;
};

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
 * Get the local URL for serving files
 * Files are served from /api/storage/
 */
const getLocalUrl = (filename: string): string => {
  const port = process.env.PORT || 3001;
  return `http://localhost:${port}/api/storage/${filename}`;
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
 * Local Storage Service
 */
export class LocalStorageService implements IStorageService {
  /**
   * Save a buffer to local storage
   */
  private async saveBuffer(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(STORAGE_DIR, filename);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return getLocalUrl(filename);
  }

  /**
   * Upload a photo with automatic thumbnail generation
   */
  async uploadPhoto(userId: string, file: StorageFile): Promise<UploadResult> {
    // Ensure base storage directory exists
    await ensureStorageDir('');

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

    // Save both files in parallel
    const [fullSizeUrl, thumbnailUrl] = await Promise.all([
      this.saveBuffer(file.buffer, fullSizeFilename),
      this.saveBuffer(thumbnailBuffer, thumbnailFilename),
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
    const extractFilename = (url: string): string | null => {
      const prefix = `/api/storage/`;
      const idx = url.indexOf(prefix);
      if (idx !== -1) {
        return url.substring(idx + prefix.length);
      }
      return null;
    };

    const fullSizeFilename = extractFilename(fullSizeUrl);
    const thumbnailFilename = extractFilename(thumbnailUrl);

    const deletePromises: Promise<void>[] = [];

    if (fullSizeFilename) {
      const filePath = path.join(STORAGE_DIR, fullSizeFilename);
      deletePromises.push(
        fs.unlink(filePath).catch(() => {
          // Ignore errors if file doesn't exist
        })
      );
    }

    if (thumbnailFilename) {
      const filePath = path.join(STORAGE_DIR, thumbnailFilename);
      deletePromises.push(
        fs.unlink(filePath).catch(() => {
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
    const userDir = path.join(STORAGE_DIR, 'photos', userId);

    try {
      await fs.rm(userDir, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  }

  /**
   * Get the storage directory path (for serving static files)
   */
  getStorageDir(): string | null {
    return STORAGE_DIR;
  }

  /**
   * Get the storage type
   */
  getType(): 'firebase' | 'local' | 'cloudinary' {
    return 'local';
  }
}
