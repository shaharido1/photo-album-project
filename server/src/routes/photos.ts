import { Router, Request, Response } from 'express';
import { mockPhotos } from '../mock/photos.js';
import { isFirebaseInitialized } from '../config/firebase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { photoService } from '../services/firebaseService.js';

const router = Router();

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

router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await photoService.delete(req.params.id, req.user!.uid);
      if (!success) {
        res.status(404).json({ error: 'Photo not found' });
        return;
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
