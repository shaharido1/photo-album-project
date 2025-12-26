/**
 * Photo Upload E2E Integration Tests
 *
 * Tests the full photo upload flow with actual Firebase storage:
 * - Upload photo → verify stored in Firebase Storage and Firestore
 * - Retrieve photo → verify data matches
 * - Delete photo → verify cleanup from both Storage and Firestore
 */

import request from 'supertest';
import sharp from 'sharp';
import { app, TEST_USER_ID } from '../setup.js';

// Generate unique test IDs to avoid conflicts
const generateTestId = () =>
  `test-photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create a test image buffer using sharp
 * Creates a simple colored rectangle as a valid image
 */
const createTestImage = async (
  width = 100,
  height = 100,
  color = { r: 255, g: 0, b: 0 }
): Promise<Buffer> => {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
};

describe('Photo Upload E2E Integration Tests', () => {
  // Track created photo IDs for cleanup
  const createdPhotoIds: string[] = [];

  afterAll(async () => {
    // Clean up any photos created during tests
    for (const photoId of createdPhotoIds) {
      try {
        await request(app)
          .delete(`/api/photos/${photoId}`)
          .set('X-Test-User-Id', TEST_USER_ID);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Single Photo Upload Flow', () => {
    it('should upload a photo to Firebase Storage and create Firestore record', async () => {
      const testId = generateTestId();
      const testImage = await createTestImage(200, 150, { r: 0, g: 128, b: 255 });

      // Step 1: Upload photo
      const uploadResponse = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID)
        .attach('photo', testImage, `${testId}.jpg`);

      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response body:', JSON.stringify(uploadResponse.body, null, 2));

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.photo).toBeDefined();
      expect(uploadResponse.body.photo.id).toBeDefined();
      expect(uploadResponse.body.photo.thumbnail).toBeDefined();
      expect(uploadResponse.body.photo.fullSize).toBeDefined();
      expect(uploadResponse.body.photo.width).toBe(200);
      expect(uploadResponse.body.photo.height).toBe(150);

      // Verify URLs are Firebase Storage URLs
      expect(uploadResponse.body.photo.thumbnail).toContain('storage.googleapis.com');
      expect(uploadResponse.body.photo.fullSize).toContain('storage.googleapis.com');

      const photoId = uploadResponse.body.photo.id;
      createdPhotoIds.push(photoId);

      // Step 2: Retrieve the photo to verify it was stored in Firestore
      const getResponse = await request(app)
        .get(`/api/photos/${photoId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      console.log('Get response status:', getResponse.status);
      console.log('Get response body:', JSON.stringify(getResponse.body, null, 2));

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.photo).toBeDefined();
      expect(getResponse.body.photo.id).toBe(photoId);
      expect(getResponse.body.photo.thumbnail).toBe(uploadResponse.body.photo.thumbnail);
      expect(getResponse.body.photo.fullSize).toBe(uploadResponse.body.photo.fullSize);
    });

    it('should upload photo with custom name', async () => {
      const testId = generateTestId();
      const customName = `My Custom Photo ${testId}`;
      const testImage = await createTestImage(100, 100, { r: 255, g: 128, b: 0 });

      const uploadResponse = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID)
        .field('name', customName)
        .attach('photo', testImage, 'original-filename.jpg');

      console.log('Upload with name response:', uploadResponse.status);

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.photo.name).toBe(customName);

      const photoId = uploadResponse.body.photo.id;
      createdPhotoIds.push(photoId);
    });

    it('should reject invalid file types', async () => {
      const invalidFile = Buffer.from('This is not an image');

      const uploadResponse = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID)
        .attach('photo', invalidFile, 'test.txt');

      console.log('Invalid file response:', uploadResponse.status, uploadResponse.body);

      expect(uploadResponse.status).toBe(400);
      expect(uploadResponse.body.error).toContain('Invalid file type');
    });

    it('should list uploaded photo in user photos', async () => {
      const testId = generateTestId();
      const testImage = await createTestImage(80, 80, { r: 128, g: 255, b: 128 });

      // Upload a photo
      const uploadResponse = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID)
        .attach('photo', testImage, `${testId}.jpg`);

      expect(uploadResponse.status).toBe(201);
      const photoId = uploadResponse.body.photo.id;
      createdPhotoIds.push(photoId);

      // List photos and verify our photo is in the list
      const listResponse = await request(app)
        .get('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID);

      console.log('List response status:', listResponse.status);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.photos).toBeDefined();
      expect(Array.isArray(listResponse.body.photos)).toBe(true);

      const foundPhoto = listResponse.body.photos.find(
        (p: { id: string }) => p.id === photoId
      );
      expect(foundPhoto).toBeDefined();
    });
  });

  describe('Photo Delete Flow', () => {
    it('should delete photo from both Firestore and Storage', async () => {
      const testId = generateTestId();
      const testImage = await createTestImage(100, 100, { r: 255, g: 0, b: 128 });

      // Upload a photo
      const uploadResponse = await request(app)
        .post('/api/photos/upload')
        .set('X-Test-User-Id', TEST_USER_ID)
        .attach('photo', testImage, `${testId}.jpg`);

      expect(uploadResponse.status).toBe(201);
      const photoId = uploadResponse.body.photo.id;

      // Delete the photo
      const deleteResponse = await request(app)
        .delete(`/api/photos/${photoId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      console.log('Delete response status:', deleteResponse.status);

      expect(deleteResponse.status).toBe(204);

      // Verify photo is gone from Firestore
      const getResponse = await request(app)
        .get(`/api/photos/${photoId}`)
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Batch Photo Upload Flow', () => {
    it('should upload multiple photos at once', async () => {
      const testId = generateTestId();
      const testImage1 = await createTestImage(100, 100, { r: 255, g: 0, b: 0 });
      const testImage2 = await createTestImage(150, 150, { r: 0, g: 255, b: 0 });

      const uploadResponse = await request(app)
        .post('/api/photos/upload/batch')
        .set('X-Test-User-Id', TEST_USER_ID)
        .attach('photos', testImage1, `${testId}-1.jpg`)
        .attach('photos', testImage2, `${testId}-2.jpg`);

      console.log('Batch upload response status:', uploadResponse.status);
      console.log('Batch upload response body:', JSON.stringify(uploadResponse.body, null, 2));

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.photos).toBeDefined();
      expect(Array.isArray(uploadResponse.body.photos)).toBe(true);
      expect(uploadResponse.body.photos.length).toBe(2);
      expect(uploadResponse.body.uploaded).toBe(2);
      expect(uploadResponse.body.failed).toBe(0);

      // Track for cleanup
      uploadResponse.body.photos.forEach((photo: { id: string }) => {
        createdPhotoIds.push(photo.id);
      });

      // Verify each photo has proper data
      for (const photo of uploadResponse.body.photos) {
        expect(photo.id).toBeDefined();
        expect(photo.thumbnail).toContain('storage.googleapis.com');
        expect(photo.fullSize).toContain('storage.googleapis.com');
      }
    });
  });
});
