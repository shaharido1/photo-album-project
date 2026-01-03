/**
 * Settings API Unit Tests
 *
 * Tests for /api/settings endpoints - validation and auth only
 * Uses mocked Firebase - no actual database calls
 */

import request from 'supertest';
import { getApp, TEST_USER_ID } from '../setup.js';
import type { Express } from 'express';

describe('Settings API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('GET /api/settings', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(401);
    });

    it('should return 200 with settings when authenticated', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.settings).toBeDefined();
      expect(typeof response.body.settings.autoImageTagging).toBe('boolean');
    });

    it('should return default settings for new user', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', 'new-user-id-12345');

      expect(response.status).toBe(200);
      expect(response.body.settings.autoImageTagging).toBe(false);
    });

    it('should have correct content-type', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('PATCH /api/settings', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .send({ autoImageTagging: true });

      expect(response.status).toBe(401);
    });

    it('should update autoImageTagging to true', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: true });

      expect(response.status).toBe(200);
      expect(response.body.settings).toBeDefined();
      expect(response.body.settings.autoImageTagging).toBe(true);
    });

    it('should update autoImageTagging to false', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: false });

      expect(response.status).toBe(200);
      expect(response.body.settings.autoImageTagging).toBe(false);
    });

    it('should return 400 for invalid setting value', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: 'not-a-boolean' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid settings data');
    });

    it('should return 400 for unknown settings fields', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ unknownField: 'value' });

      expect(response.status).toBe(400);
    });

    it('should accept empty request body', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.settings).toBeDefined();
    });

    it('should have correct content-type', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: true });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Other HTTP methods', () => {
    it('should return 404 for PUT /api/settings', async () => {
      const response = await request(app)
        .put('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: true });

      expect(response.status).toBe(404);
    });

    it('should return 404 for DELETE /api/settings', async () => {
      const response = await request(app)
        .delete('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(404);
    });

    it('should return 404 for POST /api/settings', async () => {
      const response = await request(app)
        .post('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: true });

      expect(response.status).toBe(404);
    });
  });
});
