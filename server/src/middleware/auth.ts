/**
 * Authentication Middleware
 *
 * Verifies Firebase ID tokens and attaches user info to requests
 */

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase.js';
import { userService } from '../services/firebaseService.js';

/**
 * Authenticated user info attached to requests
 */
export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

/**
 * Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Authentication middleware - requires valid Firebase ID token
 *
 * Expects: Authorization: Bearer <firebase-id-token>
 *
 * In non-production, allows X-Test-User-Id header for E2E testing
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // E2E test bypass (only in non-production)
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV !== 'production' || process.env.VITE_DEV_AUTH_ENABLED === 'true') {
    let mockUser: AuthUser | null = null;

    // Check for X-Test-User-Id header
    if (req.headers['x-test-user-id']) {
      mockUser = {
        uid: req.headers['x-test-user-id'] as string,
        email: 'test@example.com',
        name: 'Test User',
      };
    }
    // Check for Bearer dev-token: prefix or query param dev-token:
    const queryToken = req.query.token as string;
    if (authHeader?.startsWith('Bearer dev-token:')) {
      const uid = authHeader.substring(17);
      mockUser = {
        uid,
        email: 'dev@example.com',
        name: 'Dev User',
      };
    } else if (queryToken?.startsWith('dev-token:')) {
      const uid = queryToken.substring(10);
      mockUser = {
        uid,
        email: 'dev@example.com',
        name: 'Dev User',
      };
    }

    if (mockUser) {
      req.user = mockUser;

      // eslint-disable-next-line no-console
      console.log(`[Dev Auth] Bypassing auth for user: ${mockUser.email} (${mockUser.uid})`);

      // Ensure user exists in Firestore if available
      try {
        await userService.getOrCreate(
          mockUser.uid,
          mockUser.email,
          mockUser.name
        );
      } catch (e) {
        // Silently fail if Firebase is not fully configured - allowed in dev
        // eslint-disable-next-line no-console
        console.warn(`[Dev Auth] Could not ensure user ${mockUser.uid} in DB (expected if Firebase not configured):`, (e as Error).message);
      }

      next();
      return;
    }
  }

  if (!authHeader?.startsWith('Bearer ') && !req.query.token) {
    console.warn(`[AuthMiddleware] No token provided (header or query) for ${req.method} ${req.url}`);
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token as string);

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || decodedToken.email || 'User',
    };

    // Ensure user exists in Firestore (create if first login)
    await userService.getOrCreate(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || ''
    );

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[AuthMiddleware] Invalid token for ${req.method} ${req.url}:`, error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional auth middleware - attaches user if token present, but doesn't require it
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || decodedToken.email || 'User',
      };
    } catch {
      // Token invalid, proceed without user
    }
  }

  next();
};
