import { Router, Request, Response, NextFunction } from 'express';
import { mockPhotos } from '../mock/photos.js';
import { isFirebaseInitialized } from '../config/firebase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';
import { photoService } from '../services/firebaseService.js';
import { storageService, type StorageFile } from '../services/storageService.js';

const router = Router();

// Extend Request type for file uploads
interface UploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  // If Firebase is not initialized, return mock data
  if (!isFirebaseInitialized()) {
    res.json({ photos: mockPhotos });
    return;
  }

  // Use auth middleware for Firebase mode
  authMiddleware(req as AuthenticatedRequest, res, async () => {
    try {
      const authReq = req as AuthenticatedRequest;
      const photos = await photoService.getAll(authReq.user!.uid);
      res.json({ photos });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching photos:', error);
      res.status(500).json({ error: 'Failed to fetch photos' });
    }
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  // If Firebase is not initialized, return mock data
  if (!isFirebaseInitialized()) {
    const photo = mockPhotos.find((p) => p.id === req.params.id);
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    res.json({ photo });
    return;
  }

  // Use auth middleware for Firebase mode
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
      res.json({ photo });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching photo:', error);
      res.status(500).json({ error: 'Failed to fetch photo' });
    }
  });
});

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const photo = await photoService.create(req.user!.uid, req.body);
      res.status(201).json({ photo });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating photo:', error);
      res.status(500).json({ error: 'Failed to create photo' });
    }
  }
);

// Upload a single photo
router.post(
  '/upload',
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

      res.status(201).json({ photo });
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
  '/upload/batch',
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

          return photoService.create(userId, {
            name: photoName,
            thumbnail: uploadResult.thumbnailUrl,
            fullSize: uploadResult.fullSizeUrl,
            width: uploadResult.width,
            height: uploadResult.height,
          });
        })
      );

      const photos = results
        .filter(
          (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof photoService.create>>> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value);

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
  '/:id',
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
