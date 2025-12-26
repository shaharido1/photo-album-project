import { Router } from 'express';
import publicRoutes from './public.js';
import authRoutes from './auth.js';
import photosRoutes from './photos.js';
import albumsRoutes from './albums.js';
import feedbackRoutes from './feedback.js';
import googlePhotosRoutes from './googlePhotos.js';

const router = Router();

// Mount route modules
router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/photos', photosRoutes);
router.use('/albums', albumsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/google-photos', googlePhotosRoutes);

export default router;
