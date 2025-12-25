import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mockPhotos } from '../mock/photos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from root package.json
// In production (Docker), the file is at /app/root-package.json
// In development, it's at the project root (../../.. from routes/)
const productionPath = '/app/root-package.json';
const developmentPath = join(__dirname, '../../../package.json');
const packageJsonPath = existsSync(productionPath)
  ? productionPath
  : developmentPath;
const rootPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const appVersion = rootPackageJson.version;

const router = Router();

router.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World' });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/foo', (_req, res) => {
  res.json({ value: 'foo' });
});

router.get('/version', (_req, res) => {
  res.json({ version: appVersion });
});

// Photos API - mock data for development
router.get('/photos', (_req, res) => {
  res.json({ photos: mockPhotos });
});

router.get('/photos/:id', (req, res) => {
  const photo = mockPhotos.find((p) => p.id === req.params.id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  res.json({ photo });
});

export default router;
