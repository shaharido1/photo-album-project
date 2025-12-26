import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root BEFORE other imports
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { initializeFirebase } from './config/firebase.js';

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
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint for container orchestration (Render, K8s)
app.get('/healthz', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

const clientBuildPath =
  process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../client/dist')
    : path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (_req: Request, res: Response): void => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
