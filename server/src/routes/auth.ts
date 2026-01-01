import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { API_ENDPOINTS, type AuthVerifyResponse } from '@photo-album/types';

const router = Router();

// Endpoint is relative to /api/auth
const VERIFY_PATH = API_ENDPOINTS.AUTH_VERIFY.replace('/api/auth', '');

router.get(
  VERIFY_PATH,
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    const response: AuthVerifyResponse = {
      authenticated: true,
      user: req.user
        ? {
          id: req.user.uid,
          email: req.user.email,
          displayName: req.user.name,
          photoURL: null, // AuthUser doesn't have photoURL currently
        }
        : undefined,
    };
    res.json(response);
  }
);

export default router;
