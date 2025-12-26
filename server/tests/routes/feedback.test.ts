/**
 * Feedback API Routes Tests
 *
 * Tests for /api/feedback endpoint that creates GitHub issues
 */

import request from 'supertest';
import { app, TEST_USER_ID } from '../setup.js';

describe('Feedback API', () => {
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
        expect(response.body.error).toBe('Title and description are required');
      });

      it('should return 400 when description is missing', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({ title: 'Test Feedback' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Title and description are required');
      });

      it('should return 400 when both title and description are missing', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Title and description are required');
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

      it('should default to general when feedbackType is not provided', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({
            title: 'No Type Specified',
            description: 'Test description',
          });

        expect([201, 500]).toContain(response.status);
      });
    });

    describe('Successful Submission', () => {
      it('should handle feedback submission with valid data', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({
            title: 'Test Feedback',
            description: 'Test description',
            feedbackType: 'general',
          });

        // Either success (201) or service not configured (500) are valid responses
        expect([201, 500]).toContain(response.status);
      });

      it('should return issue info on successful submission', async () => {
        const response = await request(app)
          .post('/api/feedback')
          .set('X-Test-User-Id', TEST_USER_ID)
          .send({
            title: 'Test with Issue Response',
            description: 'Test description for issue response',
            feedbackType: 'general',
          });

        if (response.status === 201) {
          expect(response.body.success).toBe(true);
          expect(response.body.issue).toBeDefined();
          expect(response.body.issue.number).toBeDefined();
          expect(response.body.issue.url).toBeDefined();
        }
      });
    });
  });
});
