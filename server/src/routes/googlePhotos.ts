/**
 * Google Photos Integration Routes
 *
 * Handles OAuth authentication and Google Photos API operations:
 * - OAuth flow (start, callback, disconnect)
 * - List albums and photos
 * - Import photos to the app
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { googleOAuthService } from '../services/googleOAuthService.js';
import { googlePhotosService } from '../services/googlePhotosService.js';
import {
  ImportPhotosRequestSchema,
  type GooglePhotosAlbumsResponse,
  type GooglePhotosListResponse,
  type GooglePhotosStatusResponse,
  type OAuthStartResponse,
  type ImportPhotosResponse,
} from '@photo-album/types';

const router = Router();

/**
 * GET /api/google-photos/auth/start
 * Initiate OAuth flow - returns authorization URL
 */
router.get(
  '/auth/start',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const authUrl = googleOAuthService.generateAuthUrl(req.user!.uid);

      const response: OAuthStartResponse = { authUrl };
      res.json(response);
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to start OAuth flow',
      });
    }
  }
);

/**
 * GET /api/google-photos/auth/callback
 * OAuth callback - exchanges code for tokens and stores them
 */
router.get('/auth/callback', async (req, res): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.redirect(`/?google_photos_error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code || !state) {
      res.redirect('/?google_photos_error=missing_params');
      return;
    }

    const userId = googleOAuthService.validateState(String(state));
    if (!userId) {
      res.redirect('/?google_photos_error=invalid_state');
      return;
    }

    await googleOAuthService.exchangeCodeForTokens(
      String(code),
      userId,
      'google-photos-user@gmail.com'
    );

    res.redirect('/?google_photos_connected=true');
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'OAuth callback failed';
    res.redirect(`/?google_photos_error=${encodeURIComponent(errorMessage)}`);
  }
});

/**
 * GET /api/google-photos/status
 * Check if user has Google Photos connected
 */
router.get(
  '/status',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const status = await googleOAuthService.getConnectionStatus(req.user!.uid);

      const response: GooglePhotosStatusResponse = {
        connected: status.connected,
        email: status.email,
        connectedAt: status.connectedAt,
      };

      res.json(response);
    } catch (error) {
      console.error('Error checking connection status:', error);
      res.status(500).json({
        error: 'Failed to check connection status',
      });
    }
  }
);

/**
 * POST /api/google-photos/disconnect
 * Disconnect Google Photos (revoke access)
 */
router.post(
  '/disconnect',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      await googleOAuthService.disconnect(req.user!.uid);
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting Google Photos:', error);
      res.status(500).json({
        error: 'Failed to disconnect Google Photos',
      });
    }
  }
);

/**
 * GET /api/google-photos/albums
 * List user's Google Photos albums
 */
router.get(
  '/albums',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { pageToken } = req.query;

      const accessToken = await googleOAuthService.getValidAccessToken(
        req.user!.uid
      );

      const result = await googlePhotosService.listAlbums(
        accessToken,
        pageToken ? String(pageToken) : undefined
      );

      const response: GooglePhotosAlbumsResponse = {
        albums: result.albums,
        nextPageToken: result.nextPageToken,
      };

      res.json(response);
    } catch (error) {
      console.error('Error listing albums:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to list albums';

      if (errorMessage.includes('not connected')) {
        res.status(401).json({ error: 'Google Photos not connected' });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * GET /api/google-photos/photos
 * List photos from Google Photos library
 */
router.get(
  '/photos',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { albumId, pageToken } = req.query;

      const accessToken = await googleOAuthService.getValidAccessToken(
        req.user!.uid
      );

      const result = await googlePhotosService.listPhotos(
        accessToken,
        albumId ? String(albumId) : undefined,
        pageToken ? String(pageToken) : undefined
      );

      const response: GooglePhotosListResponse = {
        photos: result.photos,
        nextPageToken: result.nextPageToken,
      };

      res.json(response);
    } catch (error) {
      console.error('Error listing photos:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to list photos';

      if (errorMessage.includes('not connected')) {
        res.status(401).json({ error: 'Google Photos not connected' });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * POST /api/google-photos/import
 * Import selected photos from Google Photos
 */
router.post(
  '/import',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parseResult = ImportPhotosRequestSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          error: 'Invalid request',
          details: parseResult.error.errors,
        });
        return;
      }

      const { photoIds, options } = parseResult.data;

      const accessToken = await googleOAuthService.getValidAccessToken(
        req.user!.uid
      );

      const result = await googlePhotosService.importPhotos(
        req.user!.uid,
        accessToken,
        photoIds,
        options
      );

      const response: ImportPhotosResponse = {
        results: result.results,
        imported: result.imported,
        failed: result.failed,
      };

      res.json(response);
    } catch (error) {
      console.error('Error importing photos:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to import photos';

      if (errorMessage.includes('not connected')) {
        res.status(401).json({ error: 'Google Photos not connected' });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
