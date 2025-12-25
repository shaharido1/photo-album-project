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
  if (process.env.NODE_ENV !== 'production' && req.headers['x-test-user-id']) {
    req.user = {
      uid: req.headers['x-test-user-id'] as string,
      email: 'test@example.com',
      name: 'Test User',
    };
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);

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
    console.error('Auth error:', error);
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
