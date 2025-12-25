import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mockPhotos } from '../mock/photos.js';
import type { PackageJson } from '../types/index.js';
import { isFirebaseInitialized } from '../config/firebase.js';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { photoService, albumService } from '../services/firebaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from root package.json
// In production (Docker), the file is at /app/root-package.json
// In development, it's at the project root (../../.. from routes/)
const productionPath = '/app/root-package.json';
const developmentPath = join(__dirname, '../../../package.json');
const packageJsonPath = existsSync(productionPath)
  ? productionPath
  : developmentPath;
const rootPackageJson: PackageJson = JSON.parse(
  readFileSync(packageJsonPath, 'utf-8')
);
const appVersion = rootPackageJson.version;

const router = Router();

// ============================================
// Public Routes (no authentication required)
// ============================================

router.get('/hello', (_req: Request, res: Response): void => {
  res.json({ message: 'Hello World' });
});

router.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/foo', (_req: Request, res: Response): void => {
  res.json({ value: 'foo' });
});

router.get('/version', (_req: Request, res: Response): void => {
  res.json({ version: appVersion });
});

// ============================================
// Auth Routes
// ============================================

router.get(
  '/auth/verify',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    res.json({
      authenticated: true,
      user: req.user,
    });
  }
);

// ============================================
// Photos API (authentication required when Firebase is enabled)
// ============================================

router.get('/photos', async (req: Request, res: Response): Promise<void> => {
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

router.get('/photos/:id', async (req: Request, res: Response): Promise<void> => {
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
      const photo = await photoService.getById(req.params.id, authReq.user!.uid);
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
  '/photos',
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
  '/photos/:id',
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

// ============================================
// Albums API (authentication required)
// ============================================

router.get(
  '/albums',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const albums = await albumService.getAll(req.user!.uid);
      res.json({ albums });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching albums:', error);
      res.status(500).json({ error: 'Failed to fetch albums' });
    }
  }
);

router.get(
  '/albums/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const album = await albumService.getById(req.params.id, req.user!.uid);
      if (!album) {
        res.status(404).json({ error: 'Album not found' });
        return;
      }
      res.json({ album });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching album:', error);
      res.status(500).json({ error: 'Failed to fetch album' });
    }
  }
);

router.post(
  '/albums',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, size } = req.body;
      const album = await albumService.create(req.user!.uid, name, size);
      res.status(201).json({ album });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating album:', error);
      res.status(500).json({ error: 'Failed to create album' });
    }
  }
);

router.put(
  '/albums/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await albumService.update(
        req.params.id,
        req.user!.uid,
        req.body
      );
      if (!success) {
        res.status(404).json({ error: 'Album not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating album:', error);
      res.status(500).json({ error: 'Failed to update album' });
    }
  }
);

router.delete(
  '/albums/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await albumService.delete(req.params.id, req.user!.uid);
      if (!success) {
        res.status(404).json({ error: 'Album not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting album:', error);
      res.status(500).json({ error: 'Failed to delete album' });
    }
  }
);

// Album Pages API
router.post(
  '/albums/:id/pages',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = await albumService.addPage(
        req.params.id,
        req.user!.uid,
        req.body
      );
      res.status(201).json({ page });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding page:', error);
      res.status(500).json({ error: 'Failed to add page' });
    }
  }
);

router.put(
  '/albums/:id/pages/:pageId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await albumService.updatePage(
        req.params.id,
        req.params.pageId,
        req.user!.uid,
        req.body
      );
      if (!success) {
        res.status(404).json({ error: 'Page not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating page:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  }
);

router.delete(
  '/albums/:id/pages/:pageId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await albumService.deletePage(
        req.params.id,
        req.params.pageId,
        req.user!.uid
      );
      if (!success) {
        res.status(404).json({ error: 'Page not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting page:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  }
);

export default router;
