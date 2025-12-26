/**
 * Album Creation E2E Integration Tests
 *
 * Tests the full album creation flow with actual Firebase storage:
 * - Create album → verify stored in Firebase
 * - Retrieve album → verify data matches
 * - Delete album → verify cleanup
 */

import request from 'supertest';
import { app, TEST_USER_ID } from '../setup.js';

// Generate unique test IDs to avoid conflicts
const generateTestId = () =>
  `test-album-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

describe('Album E2E Integration Tests', () => {
  // Track created albums for cleanup
  const createdAlbumIds: string[] = [];

  afterAll(async () => {
    // Clean up any albums created during tests
    for (const albumId of createdAlbumIds) {
      try {
        await request(app)
          .delete(`/api/albums/${albumId}`)
          .set('X-Test-User-Id', TEST_USER_ID);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Album Creation Flow', () => {
    it('should create an album and store it in Firebase', async () => {
      const albumName = `E2E Test Album ${generateTestId()}`;
      const albumSize = '8x8';

      // Step 1: Create album
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: albumName, size: albumSize });

      // Log response for debugging
      console.log('Create response status:', createResponse.status);
      console.log('Create response body:', JSON.stringify(createResponse.body, null, 2));

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.album).toBeDefined();
      expect(createResponse.body.album.id).toBeDefined();
      expect(createResponse.body.album.name).toBe(albumName);
      expect(createResponse.body.album.size).toBe(albumSize);

      const albumId = createResponse.body.album.id;
      createdAlbumIds.push(albumId);

      // Step 2: Retrieve the album to verify it was stored
      const getResponse = await request(app)
        .get(`/api/albums/${albumId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      console.log('Get response status:', getResponse.status);
      console.log('Get response body:', JSON.stringify(getResponse.body, null, 2));

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.album).toBeDefined();
      expect(getResponse.body.album.id).toBe(albumId);
      expect(getResponse.body.album.name).toBe(albumName);
      expect(getResponse.body.album.size).toBe(albumSize);
      expect(getResponse.body.album.pages).toBeDefined();
      expect(Array.isArray(getResponse.body.album.pages)).toBe(true);
    });

    it('should list the created album in user albums', async () => {
      const albumName = `E2E List Test ${generateTestId()}`;

      // Create album
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: albumName, size: '10x10' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;
      createdAlbumIds.push(albumId);

      // List albums and verify our album is in the list
      const listResponse = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      console.log('List response status:', listResponse.status);
      console.log('List response body:', JSON.stringify(listResponse.body, null, 2));

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.albums).toBeDefined();
      expect(Array.isArray(listResponse.body.albums)).toBe(true);

      const foundAlbum = listResponse.body.albums.find(
        (a: { id: string }) => a.id === albumId
      );
      expect(foundAlbum).toBeDefined();
      expect(foundAlbum.name).toBe(albumName);
    });

    it('should update album name and persist to Firebase', async () => {
      const originalName = `E2E Update Test ${generateTestId()}`;
      const updatedName = `Updated Name ${generateTestId()}`;

      // Create album
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: originalName, size: '12x12' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;
      createdAlbumIds.push(albumId);

      // Update album name
      const updateResponse = await request(app)
        .put(`/api/albums/${albumId}`)
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: updatedName });

      console.log('Update response status:', updateResponse.status);
      console.log('Update response body:', JSON.stringify(updateResponse.body, null, 2));

      expect(updateResponse.status).toBe(200);

      // Verify the update persisted
      const getResponse = await request(app)
        .get(`/api/albums/${albumId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.album.name).toBe(updatedName);
    });

    it('should delete album from Firebase', async () => {
      const albumName = `E2E Delete Test ${generateTestId()}`;

      // Create album
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: albumName, size: '8x8' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;

      // Delete album
      const deleteResponse = await request(app)
        .delete(`/api/albums/${albumId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      console.log('Delete response status:', deleteResponse.status);

      expect(deleteResponse.status).toBe(204);

      // Verify album is gone
      const getResponse = await request(app)
        .get(`/api/albums/${albumId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Album Pages Flow', () => {
    it('should add a page to an album and persist to Firebase', async () => {
      const albumName = `E2E Page Test ${generateTestId()}`;

      // Create album
      const createResponse = await request(app)
        .post('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ name: albumName, size: '8x8' });

      expect(createResponse.status).toBe(201);
      const albumId = createResponse.body.album.id;
      createdAlbumIds.push(albumId);

      // Add a page
      const pageData = {
        order: 0,
        layoutId: 'single-photo',
        background: '#ffffff',
        slots: [
          {
            id: 'slot-1',
            photoId: null,
            position: { x: 50, y: 50 },
            scale: 1,
            rotation: 0,
          },
        ],
      };

      const addPageResponse = await request(app)
        .post(`/api/albums/${albumId}/pages`)
        .set('X-Test-User-Id', TEST_USER_ID)
        .send(pageData);

      console.log('Add page response status:', addPageResponse.status);
      console.log('Add page response body:', JSON.stringify(addPageResponse.body, null, 2));

      expect(addPageResponse.status).toBe(201);
      expect(addPageResponse.body.page).toBeDefined();
      expect(addPageResponse.body.page.id).toBeDefined();

      const pageId = addPageResponse.body.page.id;

      // Verify page is in album
      const getResponse = await request(app)
        .get(`/api/albums/${albumId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.album.pages).toBeDefined();
      expect(getResponse.body.album.pages.length).toBeGreaterThanOrEqual(1);

      const foundPage = getResponse.body.album.pages.find(
        (p: { id: string }) => p.id === pageId
      );
      expect(foundPage).toBeDefined();
    });
  });
});
