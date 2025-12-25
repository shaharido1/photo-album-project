import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mockPhotos } from '../mock/photos.js';
import type { PackageJson } from '../types/index.js';

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
const rootPackageJson: PackageJson = JSON.parse(
  readFileSync(packageJsonPath, 'utf-8')
);
const appVersion = rootPackageJson.version;

const router = Router();

router.get('/hello', (_req: Request, res: Response): void => {
  res.json({ message: 'Hello World' });
});

router.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/foo', (_req: Request, res: Response): void => {
  res.json({ value: 'foo' });
});

router.get('/version', (_req: Request, res: Response): void => {
  res.json({ version: appVersion });
});

// Photos API - mock data for development
router.get('/photos', (_req: Request, res: Response): void => {
  res.json({ photos: mockPhotos });
});

router.get('/photos/:id', (req: Request, res: Response): void => {
  const photo = mockPhotos.find((p) => p.id === req.params.id);
  if (!photo) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }
  res.json({ photo });
});

export default router;
