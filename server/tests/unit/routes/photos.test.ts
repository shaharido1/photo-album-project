/**
 * Photos API Unit Tests
 *
 * Tests for /api/photos endpoints - validation and auth only
 * Uses mocked Firebase - no actual database calls
 */

import request from 'supertest';
import { getApp, TEST_USER_ID } from '../setup.js';
import type { Express } from 'express';

describe('Photos API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('GET /api/photos', () => {
    it('should return 200 with photos array when authenticated', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
    });

    it('should return mock photos without auth in development mode', async () => {
      const response = await request(app).get('/api/photos');

      expect(response.status).toBe(200);
      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
    });
  });

  describe('GET /api/photos/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/photos/some-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .get('/api/photos/non-existent-id')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Photo not found');
    });
  });

  describe('POST /api/photos', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/photos')
        .send({ name: 'Test Photo' });

      expect(response.status).toBe(401);
    });

    it('should create a new photo with authentication', async () => {
      const photoData = {
        name: 'Test Photo',
        thumbnail: 'https://example.com/thumb.jpg',
        fullSize: 'https://example.com/full.jpg',
        width: 1200,
        height: 800,
      };

      const response = await request(app)
        .post('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(photoData);

      expect(response.status).toBe(201);
      expect(response.body.photo).toBeDefined();
    });
  });

  describe('DELETE /api/photos/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/photos/some-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .delete('/api/photos/non-existent-id')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Photo not found');
    });
  });

  describe('POST /api/photos/upload', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/photos/upload');

      expect(response.status).toBe(401);
    });

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('should accept multipart/form-data content type', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'multipart/form-data');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/photos/upload/batch', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/photos/upload/batch');

      expect(response.status).toBe(401);
    });

    it('should return 400 when no files are uploaded', async () => {
      const response = await request(app)
        .post('/api/photos/upload/batch')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No files uploaded');
    });
  });
});
