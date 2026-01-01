/**
 * Authentication Routes Tests
 *
 * Tests for /api/auth endpoints and authentication middleware
 */

import request from 'supertest';
import { app, TEST_USER_ID, TEST_USER_ID_2 } from '../setup.js';

describe('Authentication', () => {
  describe('GET /api/auth/verify', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should return user info with test user header (dev mode)', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(TEST_USER_ID);
    });

    it('should return different user for different test user ID', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('X-Test-User-Id', TEST_USER_ID_2);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(TEST_USER_ID_2);
    });

    it('should return 401 with invalid Bearer token format', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'InvalidToken');

      expect(response.status).toBe(401);
    });

    it('should return 401 with empty Bearer token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
    });

    it('should return 401 with malformed Bearer token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
    });

    it('should return user email in test mode', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return user name in test mode', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('X-Test-User-Id', TEST_USER_ID);

      expect(response.status).toBe(200);
      expect(response.body.user.displayName).toBe('Test User');
    });
  });

  describe('Authentication Middleware', () => {
    it('should protect routes that require authentication', async () => {
      const response = await request(app).get('/api/albums');

      expect(response.status).toBe(401);
    });

    it('should allow access with valid test header', async () => {
      const response = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      // Should pass auth, may fail on Firebase
      expect([200, 500]).toContain(response.status);
    });
  });
});
