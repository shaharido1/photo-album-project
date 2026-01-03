/**
 * Health Check Endpoint Unit Tests
 *
 * Tests for /healthz and /api/health endpoints - no external dependencies
 */

import request from 'supertest';
import { getApp } from '../setup.js';
import type { Express } from 'express';

describe('Health Check', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('GET /healthz', () => {
    it('should return health status for container orchestration', async () => {
      const response = await request(app).get('/healthz');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/healthz');

      expect(response.status).toBe(200);
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should respond quickly (under 100ms)', async () => {
      const start = Date.now();
      await request(app).get('/healthz');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return timestamp within reasonable range', async () => {
      const before = new Date();
      const response = await request(app).get('/api/health');
      const after = new Date();

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it('should have correct content-type', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
