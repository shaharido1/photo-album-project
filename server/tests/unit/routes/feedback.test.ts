/**
 * Feedback API Unit Tests
 *
 * Tests for /api/feedback endpoint - validation only
 * No actual GitHub API calls
 */

import request from 'supertest';
import { getApp, TEST_USER_ID } from '../setup.js';
import type { Express } from 'express';

describe('Feedback API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getApp();
  });

  describe('POST /api/feedback', () => {
    describe('Authentication', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .send({ title: 'Test Feedback', description: 'Test description' });

        expect(response.status).toBe(401);
      });
    });

    describe('Validation', () => {
      it('should return 400 when title is missing', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ description: 'Test description' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid request');
        expect(response.body.details).toBeDefined();
      });

      it('should return 400 when description is missing', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ title: 'Test Feedback' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid request');
        expect(response.body.details).toBeDefined();
      });

      it('should return 400 when both title and description are missing', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid request');
        expect(response.body.details).toBeDefined();
      });

      it('should return 400 with empty title', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ title: '', description: 'Test description' });

        expect(response.status).toBe(400);
      });

      it('should return 400 with empty description', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ title: 'Test Title', description: '' });

        expect(response.status).toBe(400);
      });
    });

    describe('Feedback Types', () => {
      it('should accept general feedback type', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({
            title: 'General Feedback',
            description: 'Test description',
            feedbackType: 'general',
          });

        // Either success (201) or service not configured (500)
        expect([201, 500]).toContain(response.status);
      });

      it('should accept bug feedback type', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({
            title: 'Bug Report',
            description: 'Test bug description',
            feedbackType: 'bug',
          });

        expect([201, 500]).toContain(response.status);
      });

      it('should accept feature feedback type', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({
            title: 'Feature Request',
            description: 'Test feature description',
            feedbackType: 'feature',
          });

        expect([201, 500]).toContain(response.status);
      });
    });
  });
});
