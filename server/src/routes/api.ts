import { Router } from 'express';
import publicRoutes from './public.js';
import authRoutes from './auth.js';
import photosRoutes from './photos.js';
import albumsRoutes from './albums.js';
import feedbackRoutes from './feedback.js';
import googlePhotosRoutes from './googlePhotos.js';
import settingsRoutes from './settings.js';
import { API_ENDPOINTS } from '@photo-album/types';

const router = Router();

// Helper to remove /api prefix for mounting
const stripApi = (path: string) => path.replace(/^\/api/, '');

// Mount route modules using shared constants
router.use(stripApi(API_ENDPOINTS.HELLO).replace('/hello', '/'), publicRoutes);
router.use(stripApi(API_ENDPOINTS.AUTH_VERIFY).replace('/verify', ''), authRoutes);
router.use(stripApi(API_ENDPOINTS.PHOTOS), photosRoutes);
router.use(stripApi(API_ENDPOINTS.ALBUMS), albumsRoutes);
router.use(stripApi(API_ENDPOINTS.FEEDBACK), feedbackRoutes);
router.use(stripApi(API_ENDPOINTS.GOOGLE_PHOTOS_STATUS).replace('/status', ''), googlePhotosRoutes);
router.use(stripApi(API_ENDPOINTS.SETTINGS), settingsRoutes);

export default router;
