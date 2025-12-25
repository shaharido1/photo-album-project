import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from root package.json
const rootPackageJson = JSON.parse(
  readFileSync(join(__dirname, '../../../package.json'), 'utf-8')
);
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

export default router;
