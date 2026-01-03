import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { settingsService } from '../services/firebaseService.js';
import {
  type SettingsResponse,
  type UpdateSettingsRequest,
  UpdateSettingsRequestSchema,
} from '@photo-album/types';

const router = Router();

/**
 * GET /api/settings
 * Fetch user settings
 */
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const settings = await settingsService.get(req.user!.uid);
      const response: SettingsResponse = { settings };
      res.json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }
);

/**
 * PATCH /api/settings
 * Update user settings (partial update)
 */
router.patch(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const parseResult = UpdateSettingsRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Invalid settings data',
          details: parseResult.error.errors,
        });
        return;
      }

      const updates: UpdateSettingsRequest = parseResult.data;

      await settingsService.update(req.user!.uid, updates);
      const settings = await settingsService.get(req.user!.uid);
      const response: SettingsResponse = { settings };
      res.json(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

export default router;
