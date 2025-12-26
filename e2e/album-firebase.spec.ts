import { test, expect } from '@playwright/test';

/**
 * Album Firebase Integration E2E Tests
 *
 * Tests that album creation through the UI actually stores data in Firebase.
 * Uses the X-Test-User-Id header for authenticated API requests.
 */

const TEST_USER_ID = 'e2e-album-firebase-test-user';

test.describe('Album Firebase Integration', () => {
  // Clean up any test albums before and after tests
  test.beforeEach(async ({ request }) => {
    // Get all albums for test user and delete them
    const listResponse = await request.get('/api/albums', {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    if (listResponse.ok()) {
      const data = await listResponse.json();
      for (const album of data.albums || []) {
        await request.delete(`/api/albums/${album.id}`, {
          headers: { 'X-Test-User-Id': TEST_USER_ID },
        });
      }
    }
  });

  test.afterEach(async ({ request }) => {
    // Clean up albums created during tests
    const listResponse = await request.get('/api/albums', {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    if (listResponse.ok()) {
      const data = await listResponse.json();
      for (const album of data.albums || []) {
        await request.delete(`/api/albums/${album.id}`, {
          headers: { 'X-Test-User-Id': TEST_USER_ID },
        });
      }
    }
  });

  test('should create album via API and verify it is stored in Firebase', async ({
    request,
  }) => {
    const albumName = `API Test Album ${Date.now()}`;
    const albumSize = '8x8';

    // Create album via API
    const createResponse = await request.post('/api/albums', {
      headers: {
        'X-Test-User-Id': TEST_USER_ID,
        'Content-Type': 'application/json',
      },
      data: { name: albumName, size: albumSize },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    expect(createData.album).toBeDefined();
    expect(createData.album.id).toBeDefined();
    expect(createData.album.name).toBe(albumName);
    expect(createData.album.size).toBe(albumSize);

    const albumId = createData.album.id;

    // Retrieve album to verify it was stored
    const getResponse = await request.get(`/api/albums/${albumId}`, {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    expect(getResponse.status()).toBe(200);
    const getData = await getResponse.json();
    expect(getData.album).toBeDefined();
    expect(getData.album.id).toBe(albumId);
    expect(getData.album.name).toBe(albumName);
    expect(getData.album.size).toBe(albumSize);

    // Verify album appears in list
    const listResponse = await request.get('/api/albums', {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.albums).toBeDefined();
    const foundAlbum = listData.albums.find(
      (a: { id: string }) => a.id === albumId
    );
    expect(foundAlbum).toBeDefined();
    expect(foundAlbum.name).toBe(albumName);
  });

  test('should create album with pages via API', async ({ request }) => {
    const albumName = `Pages Test Album ${Date.now()}`;

    // Create album
    const createResponse = await request.post('/api/albums', {
      headers: {
        'X-Test-User-Id': TEST_USER_ID,
        'Content-Type': 'application/json',
      },
      data: { name: albumName, size: '10x10' },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    const albumId = createData.album.id;

    // Add a page to the album
    const pageData = {
      layoutId: 'single',
      background: '#ffffff',
      order: 0,
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

    const addPageResponse = await request.post(`/api/albums/${albumId}/pages`, {
      headers: {
        'X-Test-User-Id': TEST_USER_ID,
        'Content-Type': 'application/json',
      },
      data: pageData,
    });

    expect(addPageResponse.status()).toBe(201);
    const pageResult = await addPageResponse.json();
    expect(pageResult.page).toBeDefined();
    expect(pageResult.page.id).toBeDefined();

    // Verify page is in album
    const getResponse = await request.get(`/api/albums/${albumId}`, {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    expect(getResponse.status()).toBe(200);
    const getData = await getResponse.json();
    expect(getData.album.pages).toBeDefined();
    expect(getData.album.pages.length).toBe(1);
    expect(getData.album.pages[0].layoutId).toBe('single');
  });

  test('should update album name and persist to Firebase', async ({
    request,
  }) => {
    const originalName = `Original Album ${Date.now()}`;
    const updatedName = `Updated Album ${Date.now()}`;

    // Create album
    const createResponse = await request.post('/api/albums', {
      headers: {
        'X-Test-User-Id': TEST_USER_ID,
        'Content-Type': 'application/json',
      },
      data: { name: originalName, size: '12x12' },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    const albumId = createData.album.id;

    // Update album name
    const updateResponse = await request.put(`/api/albums/${albumId}`, {
      headers: {
        'X-Test-User-Id': TEST_USER_ID,
        'Content-Type': 'application/json',
      },
      data: { name: updatedName },
    });

    expect(updateResponse.status()).toBe(200);

    // Verify update persisted
    const getResponse = await request.get(`/api/albums/${albumId}`, {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    expect(getResponse.status()).toBe(200);
    const getData = await getResponse.json();
    expect(getData.album.name).toBe(updatedName);
  });

  test('should delete album from Firebase', async ({ request }) => {
    const albumName = `Delete Test Album ${Date.now()}`;

    // Create album
    const createResponse = await request.post('/api/albums', {
      headers: {
        'X-Test-User-Id': TEST_USER_ID,
        'Content-Type': 'application/json',
      },
      data: { name: albumName, size: '8x8' },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    const albumId = createData.album.id;

    // Delete album
    const deleteResponse = await request.delete(`/api/albums/${albumId}`, {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    expect(deleteResponse.status()).toBe(204);

    // Verify album is gone
    const getResponse = await request.get(`/api/albums/${albumId}`, {
      headers: { 'X-Test-User-Id': TEST_USER_ID },
    });

    expect(getResponse.status()).toBe(404);
  });
});
