import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { albumService } from '../services/firebaseService.js';
import {
  API_ENDPOINTS,
  type AlbumResponse,
  type AlbumsResponse,
  CreateAlbumPayloadSchema,
  AlbumSchema,
  firestoreAlbumToApi,
  type AlbumSizeKey,
} from '@photo-album/types';

const router = Router();

// Sub-paths
const ALBUMS_ROOT = '/';
const ALBUM_BY_ID = '/:id';
const ALBUM_PAGES = '/:id/pages';
const ALBUM_PAGE_BY_ID = '/:id/pages/:pageId';

// ============================================
// Albums CRUD
// ============================================

router.get(
  ALBUMS_ROOT,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const albums = await albumService.getAll(req.user!.uid);
      const response: AlbumsResponse = {
        albums: albums.map((a) => ({
          id: a.id || null,
          name: a.name,
          size: a.size as AlbumSizeKey,
          currentPageIndex: a.currentPageIndex,
        })),
      };
      res.json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching albums:', error);
      res.status(500).json({ error: 'Failed to fetch albums' });
    }
  }
);

router.get(
  ALBUM_BY_ID,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const album = await albumService.getById(req.params.id, req.user!.uid);
      if (!album) {
        res.status(404).json({ error: 'Album not found' });
        return;
      }
      const response: AlbumResponse = {
        album: firestoreAlbumToApi(album, album.id!),
      };
      res.json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching album:', error);
      res.status(500).json({ error: 'Failed to fetch album' });
    }
  }
);

router.post(
  ALBUMS_ROOT,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parseResult = CreateAlbumPayloadSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid album data', details: parseResult.error.errors });
        return;
      }

      const { name, size } = parseResult.data;
      const album = await albumService.create(req.user!.uid, name!, size!);
      const response: AlbumResponse = {
        album: firestoreAlbumToApi(album, album.id!),
      };
      res.status(201).json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating album:', error);
      res.status(500).json({ error: 'Failed to create album' });
    }
  }
);

router.put(
  ALBUM_BY_ID,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Partial validation for update
      const parseResult = AlbumSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid album data', details: parseResult.error.errors });
        return;
      }

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
  ALBUM_BY_ID,
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
