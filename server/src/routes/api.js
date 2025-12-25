import { Router } from 'express';

const router = Router();

router.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World' });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
