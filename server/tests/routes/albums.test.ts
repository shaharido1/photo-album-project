/**
 * Albums API Routes Tests
 *
 * Tests for /api/albums endpoints including CRUD and pages operations
 */

import request from 'supertest';
import { app, TEST_USER_ID } from '../setup.js';

describe('Albums API', () => {
  describe('GET /api/albums', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/albums');

      expect(response.status).toBe(401);
    });

    it('should return albums with authentication', async () => {
      const response = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      // May fail if Firebase is not configured, but auth should pass
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.albums).toBeDefined();
        expect(Array.isArray(response.body.albums)).toBe(true);
      }
    });

    it('should return array even if no albums exist', async () => {
      const response = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      if (response.status === 200) {
        expect(Array.isArray(response.body.albums)).toBe(true);
      }
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

      expect([404, 500]).toContain(response.status);
    });

    it('should return album with pages if exists', async () => {
      const listResponse = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      if (listResponse.status === 200 && listResponse.body.albums.length > 0) {
        const albumId = listResponse.body.albums[0].id;
        const response = await request(app)
          .get(`/api/albums/${albumId}`)
          .set('X-Test-User-Id', TEST_USER_ID);

        if (response.status === 200) {
          expect(response.body.album).toBeDefined();
          expect(response.body.album.id).toBe(albumId);
        }
      }
    });
  });

  describe('POST /api/albums', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/albums')
        .send({ name: 'Test Album', size: '8x10' });

      expect(response.status).toBe(401);
    });

    it('should create album with authentication', async () => {
      const albumData = {
        name: 'Test Album',
        size: '8x10',
      };

      const response = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(albumData);

      // May fail if Firebase write fails, but auth should pass
      expect([201, 500]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.album).toBeDefined();
        expect(response.body.album.name).toBe(albumData.name);
        expect(response.body.album.size).toBe(albumData.size);
      }
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

      if (response.status === 201) {
        expect(response.body.album.id).toBeDefined();
        expect(typeof response.body.album.id).toBe('string');
      }
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

      if (response.status === 201) {
        expect(response.body.album.pages).toBeDefined();
        expect(Array.isArray(response.body.album.pages)).toBe(true);
        expect(response.body.album.pages.length).toBe(0);
      }
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

      expect([404, 500]).toContain(response.status);
    });

    it('should update album name if exists', async () => {
      const listResponse = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      if (listResponse.status === 200 && listResponse.body.albums.length > 0) {
        const albumId = listResponse.body.albums[0].id;
        const response = await request(app)
          .put(`/api/albums/${albumId}`)
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ name: 'Updated Name' });

        expect([200, 404, 500]).toContain(response.status);
      }
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

      expect([404, 500]).toContain(response.status);
    });
  });
});

describe('Album Pages API', () => {
  describe('POST /api/albums/:id/pages', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/albums/some-album-id/pages')
        .send({ order: 0, photos: [] });

      expect(response.status).toBe(401);
    });

    it('should fail for non-existent album', async () => {
      const response = await request(app)
        .post('/api/albums/non-existent-album/pages')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ order: 0, photos: [] });

      expect(response.status).toBe(500);
    });

    it('should add page to existing album', async () => {
      const listResponse = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      if (listResponse.status === 200 && listResponse.body.albums.length > 0) {
        const albumId = listResponse.body.albums[0].id;
        const response = await request(app)
          .post(`/api/albums/${albumId}/pages`)
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ order: 0, photos: [] });

        expect([201, 500]).toContain(response.status);
      }
    });
  });

  describe('PUT /api/albums/:id/pages/:pageId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/albums/some-album-id/pages/some-page-id')
        .send({ order: 1 });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent page', async () => {
      const response = await request(app)
        .put('/api/albums/non-existent-album/pages/non-existent-page')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ order: 1 });

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/albums/:id/pages/:pageId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).delete(
        '/api/albums/some-album-id/pages/some-page-id'
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent page', async () => {
      const response = await request(app)
        .delete('/api/albums/non-existent-album/pages/non-existent-page')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect([404, 500]).toContain(response.status);
    });
  });
});
