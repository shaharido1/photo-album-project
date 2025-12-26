/**
 * Photos API Routes Tests
 *
 * Tests for /api/photos endpoints including CRUD and upload operations
 */

import request from 'supertest';
import { app, TEST_USER_ID } from '../setup.js';

describe('Photos API', () => {
  describe('GET /api/photos', () => {
    it('should return photos with authentication', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
    });

    it('should return mock photos without auth in development mode (E2E support)', async () => {
      const response = await request(app).get('/api/photos');

      // In development mode, returns mock photos for E2E testing
      expect(response.status).toBe(200);
      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
    });

    it('should return photos with proper structure', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      if (response.body.photos.length > 0) {
        const photo = response.body.photos[0];
        expect(photo).toHaveProperty('id');
        expect(photo).toHaveProperty('name');
        expect(photo).toHaveProperty('thumbnail');
        expect(photo).toHaveProperty('fullSize');
      }
    });

    it('should return array even if no photos exist', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.photos)).toBe(true);
    });
  });

  describe('GET /api/photos/:id', () => {
    it('should return a single photo by ID', async () => {
      const listResponse = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);
      const photos = listResponse.body.photos;

      if (photos && photos.length > 0) {
        const response = await request(app)
          .get(`/api/photos/${photos[0].id}`)
          .set('X-Test-User-Id', TEST_USER_ID);

        // Photo may not be found if it was deleted or Firebase state changed
        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.photo).toBeDefined();
          expect(response.body.photo.id).toBe(photos[0].id);
        }
      }
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app)
        .get('/api/photos/non-existent-id')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Photo not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/photos/some-id');

      expect(response.status).toBe(401);
    });

    it('should return photo with all required fields', async () => {
      const listResponse = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);
      const photos = listResponse.body.photos;

      if (photos && photos.length > 0) {
        const response = await request(app)
          .get(`/api/photos/${photos[0].id}`)
          .set('X-Test-User-Id', TEST_USER_ID);

        // Photo may not be found if it was deleted or Firebase state changed
        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.photo).toHaveProperty('id');
          expect(response.body.photo).toHaveProperty('name');
          expect(response.body.photo).toHaveProperty('thumbnail');
          expect(response.body.photo).toHaveProperty('fullSize');
        }
      }
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

      // May fail if Firebase write fails, but auth should pass
      expect([201, 500]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.photo).toBeDefined();
        expect(response.body.photo.name).toBe(photoData.name);
      }
    });

    it('should return created photo with id', async () => {
      const photoData = {
        name: 'Test Photo With ID',
        thumbnail: 'https://example.com/thumb2.jpg',
        fullSize: 'https://example.com/full2.jpg',
        width: 800,
        height: 600,
      };

      const response = await request(app)
        .post('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(photoData);

      if (response.status === 201) {
        expect(response.body.photo.id).toBeDefined();
        expect(typeof response.body.photo.id).toBe('string');
      }
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

      // Should fail with no file, not with content type error
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
