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
  API_ENDPOINTS,
  ImportPhotosRequestSchema,
  type GooglePhotosAlbumsResponse,
  type GooglePhotosListResponse,
  type GooglePhotosStatusResponse,
  type OAuthStartResponse,
  type ImportPhotosResponse,
  type ImportStreamEvent,
} from '@photo-album/types';
import { photoService } from '../services/firebaseService.js';

const router = Router();

// Sub-paths relative to /api/google-photos
const AUTH_START = API_ENDPOINTS.GOOGLE_PHOTOS_AUTH_START.replace('/api/google-photos', '');
const AUTH_CALLBACK = '/auth/callback'; // Callback is hardcoded in Google Console usually
const STATUS = API_ENDPOINTS.GOOGLE_PHOTOS_STATUS.replace('/api/google-photos', '');
const DISCONNECT = API_ENDPOINTS.GOOGLE_PHOTOS_DISCONNECT.replace('/api/google-photos', '');
const ALBUMS = API_ENDPOINTS.GOOGLE_PHOTOS_ALBUMS.replace('/api/google-photos', '');
const PHOTOS = API_ENDPOINTS.GOOGLE_PHOTOS_PHOTOS.replace('/api/google-photos', '');
const IMPORT = API_ENDPOINTS.GOOGLE_PHOTOS_IMPORT.replace('/api/google-photos', '');
const IMPORT_STREAM = API_ENDPOINTS.GOOGLE_PHOTOS_IMPORT_STREAM.replace('/api/google-photos', '');
const PICKER_START = API_ENDPOINTS.GOOGLE_PHOTOS_PICKER_START.replace('/api/google-photos', '');
const PICKER_STATUS = API_ENDPOINTS.GOOGLE_PHOTOS_PICKER_STATUS.replace('/api/google-photos', '');
const PROXY_IMAGE = API_ENDPOINTS.GOOGLE_PHOTOS_PROXY_IMAGE.replace('/api/google-photos', '');
const DEBUG_TOKEN = '/debug/token-info';



/**
 * GET /api/google-photos/auth/start
 * Initiate OAuth flow - returns authorization URL
 */
router.get(
  AUTH_START,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      console.log(`[GooglePhotosRoute] Starting OAuth for user: ${req.user!.uid}`);
      const authUrl = googleOAuthService.generateAuthUrl(req.user!.uid);

      const response: OAuthStartResponse = { authUrl };
      res.json(response);
    } catch (error) {
      console.error('[GooglePhotosRoute] Error generating OAuth URL:', error);
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
router.get(AUTH_CALLBACK, async (req, res): Promise<void> => {
  try {
    const { code, state, error } = req.query;
    console.log(`[GooglePhotosRoute] OAuth callback received. State: ${state}`);

    if (error) {
      console.error(`[GooglePhotosRoute] OAuth error from Google: ${error}`);
      res.redirect(`/?google_photos_error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code || !state) {
      console.error('[GooglePhotosRoute] Missing code or state in callback');
      res.redirect('/?google_photos_error=missing_params');
      return;
    }

    const userId = googleOAuthService.validateState(String(state));
    if (!userId) {
      console.error('[GooglePhotosRoute] Invalid or expired state');
      res.redirect('/?google_photos_error=invalid_state');
      return;
    }

    console.log(`[GooglePhotosRoute] Exchanging code for user: ${userId}`);
    await googleOAuthService.exchangeCodeForTokens(
      String(code),
      userId
    );

    console.log(`[GooglePhotosRoute] OAuth success for user: ${userId}`);
    res.redirect('/?google_photos_connected=true');
  } catch (error) {
    console.error('[GooglePhotosRoute] OAuth callback error:', error);
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
  STATUS,
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
  DISCONNECT,
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
  ALBUMS,
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
  PHOTOS,
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
  IMPORT,
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

      const { items, options } = parseResult.data;
      console.log(`[GooglePhotosRoute] Importing ${items.length} photos for user ${req.user!.uid}`);

      const accessToken = await googleOAuthService.getValidAccessToken(
        req.user!.uid
      );

      const result = await googlePhotosService.importPhotos(
        req.user!.uid,
        accessToken,
        items,
        options
      );

      console.log(`[GooglePhotosRoute] Import complete. Success: ${result.imported}, Failed: ${result.failed}`);

      const response: ImportPhotosResponse = {
        results: result.results,
        imported: result.imported,
        failed: result.failed,
      };

      res.json(response);
    } catch (error) {
      console.error('[GooglePhotosRoute] Error importing photos:', error);

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

/**
 * POST /api/google-photos/import/stream
 * Import selected photos from Google Photos with Server-Sent Events streaming
 * Each photo is sent to the client as soon as it's imported
 */
router.post(
  IMPORT_STREAM,
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

      const { items, options } = parseResult.data;
      console.log(`[GooglePhotosRoute] Starting streaming import of ${items.length} photos for user ${req.user!.uid}`);

      const accessToken = await googleOAuthService.getValidAccessToken(
        req.user!.uid
      );

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      res.flushHeaders();

      // Helper to send SSE event
      const sendEvent = (event: ImportStreamEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      let imported = 0;
      let failed = 0;

      // Stream each photo import
      for await (const progress of googlePhotosService.importPhotosStream(
        req.user!.uid,
        accessToken,
        items,
        options
      )) {
        // If the photo was successfully imported, fetch the full photo data
        if (progress.success && progress.photoId) {
          try {
            const photo = await photoService.getById(req.user!.uid, progress.photoId);
            if (photo) {
              sendEvent({
                ...progress,
                photo, // Include full photo data for immediate UI update
              } as ImportStreamEvent);
            } else {
              sendEvent(progress);
            }
          } catch {
            sendEvent(progress);
          }
        } else {
          sendEvent(progress);
        }

        imported = progress.imported;
        failed = progress.failed;
      }

      // Send completion event
      sendEvent({
        type: 'complete',
        imported,
        failed,
        total: items.length,
      });

      console.log(`[GooglePhotosRoute] Streaming import complete. Success: ${imported}, Failed: ${failed}`);

      res.end();
    } catch (error) {
      console.error('[GooglePhotosRoute] Error in streaming import:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to import photos';

      // If headers haven't been sent yet, send JSON error
      if (!res.headersSent) {
        if (errorMessage.includes('not connected')) {
          res.status(401).json({ error: 'Google Photos not connected' });
          return;
        }
        res.status(500).json({ error: errorMessage });
      } else {
        // Headers already sent, send error as SSE event
        const errorEvent: ImportStreamEvent = {
          type: 'error',
          error: errorMessage,
        };
        res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        res.end();
      }
    }
  }
);

/**
 * GET /api/google-photos/debug/token-info
 * Debug endpoint to check current access token info and scopes
 */
router.get(
  DEBUG_TOKEN,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const accessToken = await googleOAuthService.getValidAccessToken(
        req.user!.uid
      );

      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
      );

      const tokenInfo = (await tokenInfoResponse.json()) as {
        scope?: string;
        [key: string]: unknown;
      };

      res.json({
        tokenInfo,
        expectedScopes: [
          'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
          'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
        ],
        hasRequiredScopes:
          tokenInfo.scope &&
          tokenInfo.scope.includes(
            'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata'
          ) &&
          tokenInfo.scope.includes(
            'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'
          ),
      });

    } catch (error) {
      console.error('Error fetching token info:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch token info',
      });
    }
  }
);

/**
 * POST /api/google-photos/picker/start
 * Start a Google Photos Picker session
 */
router.post(
  PICKER_START,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const accessToken = await googleOAuthService.getValidAccessToken(req.user!.uid);
      const session = await googlePhotosService.createPickerSession(accessToken);
      res.json(session);
    } catch (error) {
      console.error('Error starting picker session:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to start picker session',
      });
    }
  }
);

/**
 * GET /api/google-photos/picker/status
 * Check picker session status and list items if ready
 */
router.get(
  PICKER_STATUS,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.query;

      if (!sessionId) {
        res.status(400).json({ error: 'Missing sessionId' });
        return;
      }

      const accessToken = await googleOAuthService.getValidAccessToken(req.user!.uid);
      const status = await googlePhotosService.getPickerSession(
        accessToken,
        String(sessionId)
      );

      if (status.ready) {
        const items = await googlePhotosService.listPickerItems(
          accessToken,
          String(sessionId)
        );
        res.json({ ready: true, items });
      } else {
        res.json({ ready: false });
      }
    } catch (error) {
      console.error('Error checking picker status:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to check picker status',
      });
    }
  }
);

/**
 * GET /api/google-photos/proxy-image
 * Proxy an image from Google Photos to avoid CORs/403 errors
 */
router.get(
  PROXY_IMAGE,
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { url } = req.query;

      if (!url) {
        res.status(400).json({ error: 'Missing url parameter' });
        return;
      }

      console.log(`[GooglePhotosRoute] Proxying URL: ${url}`);

      const accessToken = await googleOAuthService.getValidAccessToken(req.user!.uid);
      const { buffer, contentType } = await googlePhotosService.proxyImage(
        accessToken,
        String(url)
      );

      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } catch (error) {
      console.error('[GooglePhotosRoute] Error proxying image:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to proxy image',
      });
    }
  }
);

export default router;

