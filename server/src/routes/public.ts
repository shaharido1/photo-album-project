import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { PackageJson } from '../types/index.js';
import {
  API_ENDPOINTS,
  type HelloResponse,
  type HealthResponse,
  type FooResponse,
  type VersionResponse,
} from '@photo-album/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from root package.json
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

// Paths are relative to /api (or whatever is mounted)
// But since public routes are often mounted at / by the stripApi helper in api.ts,
// we should be careful.
// Let's just use the relative part.
const rel = (full: string) => full.replace('/api', '');

router.get(rel(API_ENDPOINTS.HELLO), (_req: Request, res: Response): void => {
  const response: HelloResponse = { message: 'Hello World' };
  res.json(response);
});

router.get(rel(API_ENDPOINTS.HEALTH), (_req: Request, res: Response): void => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

router.get(rel(API_ENDPOINTS.FOO), (_req: Request, res: Response): void => {
  const response: FooResponse = { value: 'foo' };
  res.json(response);
});

router.get(rel(API_ENDPOINTS.VERSION), (_req: Request, res: Response): void => {
  const response: VersionResponse = { version: appVersion };
  res.json(response);
});

export default router;
