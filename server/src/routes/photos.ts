import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';
import { photoService, settingsService } from '../services/firebaseService.js';
import { storageService, type StorageFile } from '../services/storageService.js';
import { imageAnalysisService } from '../services/imageAnalysis/index.js';
import {
  API_ENDPOINTS,
  type PhotosResponse,
  type PhotoResponse,
  type Photo,
  PhotoSchema,
} from '@photo-album/types';

const router = Router();

// Endpoint is relative to /api/photos
// Constants for sub-paths
const PHOTOS_ROOT = '/';
const PHOTO_BY_ID = '/:id';
const PHOTO_UPLOAD = '/upload';
const PHOTO_UPLOAD_BATCH = '/upload/batch';

// Extend Request type for file uploads
interface UploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

/**
 * Process auto-tagging for a photo if enabled
 * Runs in the background and doesn't block the upload response
 */
async function processAutoTagging(
  userId: string,
  photoId: string,
  imageBuffer: Buffer
): Promise<void> {
  try {
    // Check if auto-tagging is enabled for this user
    const settings = await settingsService.get(userId);
    if (!settings.autoImageTagging) {
      return;
    }

    // Check if image analysis service is available
    const isAvailable = await imageAnalysisService.isAvailable();
    if (!isAvailable) {
      // eslint-disable-next-line no-console
      console.log('Image analysis service not available, skipping auto-tagging');
      return;
    }

    // Analyze the image
    const analysis = await imageAnalysisService.analyzeImage(imageBuffer);

    // Update photo with AI data
    await photoService.updateAiData(photoId, userId, {
      caption: analysis.caption,
      tags: analysis.tags,
      aiProcessed: true,
      aiProvider: analysis.provider,
    });

    // eslint-disable-next-line no-console
    console.log(`Auto-tagged photo ${photoId}: ${analysis.tags.length} tags, provider: ${analysis.provider}`);
  } catch (error) {
    // Don't fail the upload if auto-tagging fails
    // eslint-disable-next-line no-console
    console.error('Auto-tagging failed for photo:', photoId, error);
  }
}

router.get(PHOTOS_ROOT, async (req: Request, res: Response): Promise<void> => {
  // Use auth middleware - handles both real auth and dev test headers
  authMiddleware(req as AuthenticatedRequest, res, async () => {
    try {
      const authReq = req as AuthenticatedRequest;
      const photos = await photoService.getAll(authReq.user!.uid);
      const response: PhotosResponse = { photos };
      res.json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching photos:', error);
      res.status(500).json({ error: 'Failed to fetch photos' });
    }
  });
});

router.get(PHOTO_BY_ID, async (req: Request, res: Response): Promise<void> => {
  // Use auth middleware
  authMiddleware(req as AuthenticatedRequest, res, async () => {
    try {
      const authReq = req as AuthenticatedRequest;
      const photo = await photoService.getById(
        req.params.id,
        authReq.user!.uid
      );
      if (!photo) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }
      const response: PhotoResponse = { photo };
      res.json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching photo:', error);
      res.status(500).json({ error: 'Failed to fetch photo' });
    }
  });
});

router.post(
  PHOTOS_ROOT,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validation using Zod
      const parseResult = PhotoSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid photo data', details: parseResult.error.errors });
        return;
      }

      const photo = await photoService.create(req.user!.uid, req.body);
      const response: PhotoResponse = { photo };
      res.status(201).json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating photo:', error);
      res.status(500).json({ error: 'Failed to create photo' });
    }
  }
);

// Upload a single photo
router.post(
  PHOTO_UPLOAD,
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const uploadReq = req as UploadRequest;

    if (!uploadReq.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const userId = uploadReq.user!.uid;
      const file: StorageFile = {
        buffer: uploadReq.file.buffer,
        mimetype: uploadReq.file.mimetype,
        originalname: uploadReq.file.originalname,
      };

      // Upload to Firebase Storage
      const uploadResult = await storageService.uploadPhoto(userId, file);

      // Save metadata to Firestore
      const photoName =
        uploadReq.body.name ||
        uploadReq.file.originalname.replace(/\.[^/.]+$/, '');

      const photo = await photoService.create(userId, {
        name: photoName,
        thumbnail: uploadResult.thumbnailUrl,
        fullSize: uploadResult.fullSizeUrl,
        width: uploadResult.width,
        height: uploadResult.height,
      });

      // Trigger auto-tagging in the background (don't await)
      processAutoTagging(userId, photo.id, uploadReq.file!.buffer).catch(() => {
        // Error already logged in processAutoTagging
      });

      const response: PhotoResponse = { photo };
      res.status(201).json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading photo:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload photo',
      });
    }
  }
);

// Upload multiple photos
router.post(
  PHOTO_UPLOAD_BATCH,
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    uploadMultiple(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const uploadReq = req as UploadRequest;

    if (!uploadReq.files || uploadReq.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    try {
      const userId = uploadReq.user!.uid;
      const results = await Promise.allSettled(
        uploadReq.files.map(async (file) => {
          const storageFile: StorageFile = {
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          };

          const uploadResult = await storageService.uploadPhoto(
            userId,
            storageFile
          );

          const photoName = file.originalname.replace(/\.[^/.]+$/, '');

          const photo = await photoService.create(userId, {
            name: photoName,
            thumbnail: uploadResult.thumbnailUrl,
            fullSize: uploadResult.fullSizeUrl,
            width: uploadResult.width,
            height: uploadResult.height,
          });

          // Return both photo and buffer for auto-tagging
          return { photo, buffer: file.buffer };
        })
      );

      const successResults = results
        .filter(
          (result): result is PromiseFulfilledResult<{ photo: Photo; buffer: Buffer }> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value);

      const photos = successResults.map((r) => r.photo);

      // Trigger auto-tagging for all successfully uploaded photos in the background
      for (const { photo, buffer } of successResults) {
        processAutoTagging(userId, photo.id, buffer).catch(() => {
          // Error already logged in processAutoTagging
        });
      }

      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected'
        )
        .map((result) => result.reason?.message || 'Unknown error');

      res.status(201).json({
        photos,
        errors: errors.length > 0 ? errors : undefined,
        uploaded: photos.length,
        failed: errors.length,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading photos:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to upload photos',
      });
    }
  }
);

router.delete(
  PHOTO_BY_ID,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Get the photo first to retrieve storage URLs
      const photo = await photoService.getById(req.params.id, req.user!.uid);
      if (!photo) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }

      // Delete from Firestore
      const success = await photoService.delete(req.params.id, req.user!.uid);
      if (!success) {
        res.status(404).json({ error: 'Photo not found' });
        return;
      }

      // Delete from Storage (don't fail if storage delete fails)
      try {
        await storageService.deletePhoto(photo.fullSize, photo.thumbnail);
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Failed to delete photo from storage:', req.params.id);
      }

      res.status(204).send();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting photo:', error);
      res.status(500).json({ error: 'Failed to delete photo' });
    }
  }
);

export default router;
