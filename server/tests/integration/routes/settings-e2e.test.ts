/**
 * Settings API Integration Tests
 *
 * Tests for /api/settings endpoints with real Firebase connections.
 * Verifies complete flows with actual database operations.
 */

import request from 'supertest';
import { app, TEST_USER_ID, TEST_USER_ID_2 } from '../setup.js';

describe('Settings API Integration', () => {
  describe('Settings Persistence', () => {
    const testUserId = `settings-test-${Date.now()}`;

    it('should persist settings across requests', async () => {
      // First, set a value
      const updateResponse = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', testUserId)
        .send({ autoImageTagging: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.settings.autoImageTagging).toBe(true);

      // Then, retrieve and verify it persisted
      const getResponse = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', testUserId);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.settings.autoImageTagging).toBe(true);
    });

    it('should maintain settings separately for different users', async () => {
      // Set different values for two users
      await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: true });

      await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID_2)
        .send({ autoImageTagging: false });

      // Verify each user has their own settings
      const user1Response = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID);

      const user2Response = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID_2);

      expect(user1Response.body.settings.autoImageTagging).toBe(true);
      expect(user2Response.body.settings.autoImageTagging).toBe(false);
    });
  });

  describe('Settings Toggle Flow', () => {
    const toggleUserId = `toggle-test-${Date.now()}`;

    it('should start with default settings (autoImageTagging: false)', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', toggleUserId);

      expect(response.status).toBe(200);
      expect(response.body.settings.autoImageTagging).toBe(false);
    });

    it('should toggle autoImageTagging on and off', async () => {
      // Enable auto tagging
      let response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', toggleUserId)
        .send({ autoImageTagging: true });

      expect(response.body.settings.autoImageTagging).toBe(true);

      // Disable auto tagging
      response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', toggleUserId)
        .send({ autoImageTagging: false });

      expect(response.body.settings.autoImageTagging).toBe(false);

      // Re-enable auto tagging
      response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', toggleUserId)
        .send({ autoImageTagging: true });

      expect(response.body.settings.autoImageTagging).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send('not valid json');

      expect(response.status).toBe(400);
    });

    it('should validate setting types', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid settings data');
    });

    it('should reject unknown fields in strict mode', async () => {
      const response = await request(app)
        .patch('/api/settings')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({ autoImageTagging: true, maliciousField: 'data' });

      expect(response.status).toBe(400);
    });
  });

  describe('Concurrent Updates', () => {
    const concurrentUserId = `concurrent-test-${Date.now()}`;

    it('should handle rapid sequential updates', async () => {
      // Rapid fire updates
      const updates = [true, false, true, false, true];

      for (const value of updates) {
        const response = await request(app)
          .patch('/api/settings')
          .set('X-Test-User-Id', concurrentUserId)
          .send({ autoImageTagging: value });

        expect(response.status).toBe(200);
        expect(response.body.settings.autoImageTagging).toBe(value);
      }

      // Final state should be the last update
      const finalResponse = await request(app)
        .get('/api/settings')
        .set('X-Test-User-Id', concurrentUserId);

      expect(finalResponse.body.settings.autoImageTagging).toBe(true);
    });
  });
});
