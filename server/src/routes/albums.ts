import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { albumService } from '../services/firebaseService.js';

const router = Router();

// ============================================
// Albums CRUD
// ============================================

router.get(
  '/',
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
  '/:id',
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
  '/',
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
  '/:id',
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
  '/:id',
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

// ============================================
// Album Pages
// ============================================

router.post(
  '/:id/pages',
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
  '/:id/pages/:pageId',
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
  '/:id/pages/:pageId',
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
