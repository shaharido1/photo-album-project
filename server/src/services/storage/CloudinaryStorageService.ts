/**
 * Cloudinary Storage Service Implementation
 *
 * Handles file upload, download, and deletion operations using Cloudinary.
 * - Uploads original photos and generates thumbnails via Cloudinary transformations
 * - Returns optimized URLs for stored files
 * - Organizes files by user ID using folder structure
 */

import { v2 as cloudinary } from 'cloudinary';
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
 * Initialize Cloudinary configuration
 */
const initCloudinary = (): void => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary configuration missing. Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
};

/**
 * Generate a unique public ID for Cloudinary
 */
const generatePublicId = (userId: string, suffix = ''): string => {
  const uuid = uuidv4();
  const safeName = suffix ? `${uuid}_${suffix}` : uuid;
  return `photos/${userId}/${safeName}`;
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
 * Upload buffer to Cloudinary
 */
const uploadToCloudinary = (
  buffer: Buffer,
  publicId: string,
  folder?: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        } else {
          reject(new Error('No result from Cloudinary upload'));
        }
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Get optimized thumbnail URL using Cloudinary transformations
 */
const getThumbnailUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    crop: 'fill',
    gravity: 'auto',
    fetch_format: 'auto',
    quality: 'auto',
  });
};

/**
 * Get optimized full-size URL
 */
const getOptimizedUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
  });
};

/**
 * Extract public ID from Cloudinary URL
 */
const extractPublicId = (url: string): string | null => {
  // Cloudinary URLs look like:
  // https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  // or with transformations:
  // https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/v{version}/{public_id}.{format}
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find 'upload' index and get everything after version number
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Skip transformations and version (starts with 'v' followed by numbers)
    let startIndex = uploadIndex + 1;
    for (let i = startIndex; i < pathParts.length; i++) {
      if (/^v\d+$/.test(pathParts[i])) {
        startIndex = i + 1;
        break;
      }
      // Skip transformation segments (contain commas or known transform prefixes)
      if (pathParts[i].includes(',') || pathParts[i].includes('_')) {
        continue;
      }
    }

    // Join remaining parts and remove file extension
    const publicIdWithExt = pathParts.slice(startIndex).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId || null;
  } catch {
    return null;
  }
};

/**
 * Cloudinary Storage Service
 */
export class CloudinaryStorageService implements IStorageService {
  private initialized = false;

  /**
   * Ensure Cloudinary is configured
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      initCloudinary();
      this.initialized = true;
    }
  }

  /**
   * Upload a photo with automatic thumbnail generation via Cloudinary transformations
   */
  async uploadPhoto(userId: string, file: StorageFile): Promise<UploadResult> {
    this.ensureInitialized();

    // Get original image dimensions
    const dimensions = await getImageDimensions(file.buffer);

    // Generate public ID for the image
    const publicId = generatePublicId(userId, 'full');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.buffer, publicId);

    // Get optimized URLs (thumbnail is generated via transformation, not separate upload)
    const fullSizeUrl = getOptimizedUrl(result.public_id);
    const thumbnailUrl = getThumbnailUrl(result.public_id);

    return {
      fullSizeUrl,
      thumbnailUrl,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  /**
   * Delete a photo from Cloudinary
   * Note: Thumbnail doesn't need separate deletion since it's a transformation of the same image
   */
  async deletePhoto(fullSizeUrl: string, _thumbnailUrl: string): Promise<void> {
    this.ensureInitialized();

    const publicId = extractPublicId(fullSizeUrl);

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Ignore errors if image doesn't exist
      }
    }
  }

  /**
   * Delete all photos for a user
   */
  async deleteAllUserPhotos(userId: string): Promise<void> {
    this.ensureInitialized();

    const prefix = `photos/${userId}`;

    try {
      // Delete all resources with the user's prefix
      await cloudinary.api.delete_resources_by_prefix(prefix);
      // Also try to delete the folder
      await cloudinary.api.delete_folder(prefix).catch(() => {
        // Folder might not exist or might not be empty
      });
    } catch {
      // Ignore errors if folder/resources don't exist
    }
  }

  /**
   * Get the storage directory (not applicable for Cloudinary)
   */
  getStorageDir(): string | null {
    return null;
  }

  /**
   * Get the storage type
   */
  getType(): 'firebase' | 'local' | 'cloudinary' {
    return 'cloudinary';
  }
}
