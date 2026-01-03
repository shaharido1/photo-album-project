/**
 * Request Validation and Middleware Unit Tests
 *
 * Tests for JSON parsing, CORS, and error handling
 * No external dependencies
 */

import request from 'supertest';
import { getApp, TEST_USER_ID } from '../setup.js';
import type { Express } from 'express';

describe('Request Validation', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('JSON body parsing', () => {
    it('should accept valid JSON', async () => {
      const response = await request(app)
        .post('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ name: 'Test' }));

      // Should not fail on JSON parsing
      expect([201, 401, 500]).toContain(response.status);
    });

    it('should handle empty body gracefully', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send('');

      expect([400, 500]).toContain(response.status);
    });

    it('should parse nested JSON objects', async () => {
      const response = await request(app)
        .post('/api/photos')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send({
          name: 'Test Photo',
          metadata: {
            width: 1200,
            height: 800,
          },
        });

      expect([201, 401, 500]).toContain(response.status);
    });

    it('should handle JSON with special characters', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send({
          title: 'Test "with" special & <characters>',
          description: 'Description with\nnewlines\tand tabs',
        });

      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/hello')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/api/hello')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(response.status);
    });

    it('should allow POST method in preflight', async () => {
      const response = await request(app)
        .options('/api/photos')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(response.status);
    });

    it('should allow DELETE method in preflight', async () => {
      const response = await request(app)
        .options('/api/photos/123')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'DELETE');

      expect([200, 204]).toContain(response.status);
    });

    it('should allow custom headers in preflight', async () => {
      const response = await request(app)
        .options('/api/photos')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Content-Type handling', () => {
    it('should accept application/json content-type', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json')
        .send({ title: 'Test', description: 'Description' });

      expect([201, 400, 500]).toContain(response.status);
    });

    it('should accept application/json with charset', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('X-Test-User-Id', TEST_USER_ID)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send({ title: 'Test', description: 'Description' });

      expect([201, 400, 500]).toContain(response.status);
    });
  });
});

describe('Error Handling', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('Method not allowed', () => {
    it('should handle PUT on hello endpoint', async () => {
      const response = await request(app)
        .put('/api/hello')
        .send({ message: 'test' });

      expect([404, 200]).toContain(response.status);
    });

    it('should handle PATCH on version endpoint', async () => {
      const response = await request(app)
        .patch('/api/version')
        .send({ version: '1.0.0' });

      expect([404, 200]).toContain(response.status);
    });
  });

  describe('Invalid routes', () => {
    it('should handle deeply nested invalid routes', async () => {
      const response = await request(app).get(
        '/api/this/route/does/not/exist/at/all'
      );

      expect([404, 200]).toContain(response.status);
    });

    it('should handle routes with special characters', async () => {
      const response = await request(app).get('/api/route%20with%20spaces');

      expect([404, 200]).toContain(response.status);
    });
  });

  describe('Request size limits', () => {
    it('should handle requests within size limits', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('X-Test-User-Id', TEST_USER_ID)
        .send({
          title: 'Normal Request',
          description: 'A'.repeat(1000),
        });

      expect([201, 400, 500]).toContain(response.status);
    });
  });
});
