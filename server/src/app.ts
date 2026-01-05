import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root BEFORE other imports
const envPath = path.join(__dirname, '../../.env');
console.log('[ENV] Loading .env from:', envPath);
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
  console.error('[ENV] Error loading .env:', dotenvResult.error);
}
console.log('[ENV] USE_CLOUDINARY_STORAGE:', process.env.USE_CLOUDINARY_STORAGE);
console.log('[ENV] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET');

import express, { Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { initializeFirebase } from './config/firebase.js';
import { storageService } from './services/storageService.js';

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
  // eslint-disable-next-line no-console
  console.log('Firebase initialized successfully');
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('Firebase initialization skipped:', (error as Error).message);
  // Don't exit - allow server to run without Firebase for development/testing
}

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint for container orchestration (Render, K8s)
app.get('/healthz', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve local storage files when USE_LOCAL_STORAGE is enabled
const localStorageDir = storageService.getStorageDir();
if (localStorageDir) {
  // eslint-disable-next-line no-console
  console.log('Local storage enabled, serving files from:', localStorageDir);
  app.use('/api/storage', express.static(localStorageDir));
} else {
  // Return 404 for storage requests when not using local storage (prevents redirect loop)
  app.use('/api/storage', (_req: Request, res: Response): void => {
    res.status(404).json({ error: 'Local storage not enabled' });
  });
}

app.use('/api', apiRoutes);

// Only serve static files in production
// In development, the Vite dev server handles the frontend
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (_req: Request, res: Response): void => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // In development, redirect non-API routes to the Vite dev server
  const VITE_DEV_SERVER = process.env.VITE_DEV_URL || 'http://localhost:5173';

  app.get('*', (_req: Request, res: Response): void => {
    // Preserve query params for OAuth callbacks
    const queryString = Object.keys(_req.query).length
      ? '?' + new URLSearchParams(_req.query as Record<string, string>).toString()
      : '';
    res.redirect(`${VITE_DEV_SERVER}${_req.path}${queryString}`);
  });
}

export { app };
