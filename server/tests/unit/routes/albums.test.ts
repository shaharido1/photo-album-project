/**
 * Albums API Unit Tests
 *
 * Tests for /api/albums endpoints - validation and auth only
 * Uses mocked Firebase - no actual database calls
 */

import request from 'supertest';
import { getApp, TEST_USER_ID } from '../setup.js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
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

  describe('PUT /api/albums/:id/full', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/albums/some-album-id/full')
        .send({ name: 'Updated Album' });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put('/api/albums/some-album-id/full')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ pages: 'not-an-array' });

      expect(response.status).toBe(400);
    });

    it('should return 200 for valid bulk update', async () => {
      // Create album first to get a valid ID
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: 'Bulk Test Base', size: '10x10' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;

      const response = await request(app)
        .put(`/api/albums/${albumId}/full`)
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({
          name: 'Bulk Updated Album',
          pages: [
            {
              layoutId: 'single',
              background: '#ffffff',
              slots: [],
            },
          ],
        });

      expect(response.status).toBe(200);
    });

    it('should accept freestyle pages with freestyleItems', async () => {
      // Create album first
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: 'Freestyle Test Album', size: 'a4-portrait' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;

      const freestyleItems = [
        {
          id: 'item-1',
          photoId: 'photo-123',
          photoUrl: 'https://example.com/photo.jpg',
          x: 10,
          y: 20,
          width: 30,
          height: 25,
          rotation: 0,
          zIndex: 0,
        },
        {
          id: 'item-2',
          photoId: 'photo-456',
          photoUrl: 'https://example.com/photo2.jpg',
          x: 50,
          y: 30,
          width: 40,
          height: 35,
          rotation: 15,
          zIndex: 1,
        },
      ];

      const response = await request(app)
        .put(`/api/albums/${albumId}/full`)
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({
          name: 'Freestyle Album Updated',
          pages: [
            {
              id: 'page-freestyle-1',
              layoutId: 'freestyle',
              background: '#ffffff',
              slots: [],
              freestyleItems,
            },
          ],
        });

      expect(response.status).toBe(200);
    });

    it('should accept mixed pages with template and freestyle layouts', async () => {
      // Create album first
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: 'Mixed Layout Album', size: '10x10' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;

      const response = await request(app)
        .put(`/api/albums/${albumId}/full`)
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({
          pages: [
            {
              id: 'page-1',
              layoutId: 'single',
              background: '#ffffff',
              slots: [
                {
                  id: 'slot-1',
                  photoId: 'photo-1',
                  photoUrl: 'https://example.com/photo.jpg',
                  position: { x: 0, y: 0 },
                  scale: 1,
                  rotation: 0,
                },
              ],
            },
            {
              id: 'page-2',
              layoutId: 'freestyle',
              background: '#f0f0f0',
              slots: [],
              freestyleItems: [
                {
                  id: 'freestyle-item-1',
                  photoId: 'photo-2',
                  photoUrl: 'https://example.com/photo2.jpg',
                  x: 25,
                  y: 25,
                  width: 50,
                  height: 50,
                  rotation: 45,
                  zIndex: 0,
                },
              ],
            },
          ],
        });

      expect(response.status).toBe(200);
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
