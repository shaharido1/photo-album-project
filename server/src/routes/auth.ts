import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get(
  '/verify',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response): void => {
    res.json({
      authenticated: true,
      user: req.user,
    });
  }
);

export default router;
