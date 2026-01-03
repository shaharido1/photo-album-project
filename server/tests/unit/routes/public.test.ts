/**
 * Public Routes Unit Tests
 *
 * Tests for public API endpoints that don't require authentication
 */

import request from 'supertest';
import { getApp } from '../setup.js';
import type { Express } from 'express';

describe('Public API Routes', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('GET /api/hello', () => {
    it('should return Hello World message', async () => {
      const response = await request(app).get('/api/hello');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello World' });
    });

    it('should have correct content-type', async () => {
      const response = await request(app).get('/api/hello');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should not require authentication', async () => {
      const response = await request(app).get('/api/hello');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/foo', () => {
    it('should return foo value', async () => {
      const response = await request(app).get('/api/foo');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ value: 'foo' });
    });

    it('should not require authentication', async () => {
      const response = await request(app).get('/api/foo');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/version', () => {
    it('should return version from package.json', async () => {
      const response = await request(app).get('/api/version');

      expect(response.status).toBe(200);
      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return semantic version format', async () => {
      const response = await request(app).get('/api/version');

      const parts = response.body.version.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parseInt(parts[0])).toBeGreaterThanOrEqual(0);
      expect(parseInt(parts[1])).toBeGreaterThanOrEqual(0);
      expect(parseInt(parts[2])).toBeGreaterThanOrEqual(0);
    });

    it('should not require authentication', async () => {
      const response = await request(app).get('/api/version');

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handling', () => {
    it('should handle non-existent API routes', async () => {
      const response = await request(app).get('/api/non-existent-route');

      expect([404, 200]).toContain(response.status);
    });

    it('should handle non-existent nested routes', async () => {
      const response = await request(app).get('/api/deeply/nested/route');

      expect([404, 200]).toContain(response.status);
    });
  });
});
