/**
 * Albums API Unit Tests
 *
 * Tests for /api/albums endpoints - validation and auth only
 * Uses mocked Firebase - no actual database calls
 */

import request from 'supertest';
import { getApp, TEST_USER_ID } from '../setup.js';
import type { Express } from 'express';

describe('Albums API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('GET /api/albums', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/albums');

      expect(response.status).toBe(401);
    });

    it('should return albums with authentication', async () => {
      const response = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.albums).toBeDefined();
      expect(Array.isArray(response.body.albums)).toBe(true);
    });
  });

  describe('GET /api/albums/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/albums/some-album-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent album', async () => {
      const response = await request(app)
        .get('/api/albums/non-existent-album-id')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/albums', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/albums')
        .send({ name: 'Test Album', size: '8x8' });

      expect(response.status).toBe(401);
    });

    it('should create album with authentication', async () => {
      const albumData = {
        name: 'Test Album',
        size: '8x8',
      };

      const response = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(albumData);

      expect(response.status).toBe(201);
      expect(response.body.album).toBeDefined();
      expect(response.body.album.name).toBe(albumData.name);
      expect(response.body.album.size).toBe(albumData.size);
    });

    it('should return album with id on creation', async () => {
      const albumData = {
        name: 'Album With ID Test',
        size: '10x10',
      };

      const response = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(albumData);

      expect(response.status).toBe(201);
      expect(response.body.album.id).toBeDefined();
      expect(typeof response.body.album.id).toBe('string');
    });

    it('should initialize album with empty pages', async () => {
      const albumData = {
        name: 'Empty Pages Album',
        size: '8x8',
      };

      const response = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(albumData);

      expect(response.status).toBe(201);
      expect(response.body.album.pages).toBeDefined();
      expect(Array.isArray(response.body.album.pages)).toBe(true);
    });
  });

  describe('PUT /api/albums/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/albums/some-album-id')
        .send({ name: 'Updated Album' });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent album', async () => {
      const response = await request(app)
        .put('/api/albums/non-existent-album-id')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: 'Updated Album' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/albums/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/albums/some-album-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent album', async () => {
      const response = await request(app)
        .delete('/api/albums/non-existent-album-id')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(404);
    });
  });
});

describe('Album Pages API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('POST /api/albums/:id/pages', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/albums/some-album-id/pages')
        .send({ order: 0, photos: [] });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/albums/:id/pages/:pageId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/albums/some-album-id/pages/some-page-id')
        .send({ order: 1 });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/albums/:id/pages/:pageId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).delete(
        '/api/albums/some-album-id/pages/some-page-id'
      );

      expect(response.status).toBe(401);
    });
  });
});
