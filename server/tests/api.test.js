import request from 'supertest';
import { app, server } from '../src/index.js';

afterAll((done) => {
  server.close(done);
});

describe('API Routes', () => {
  describe('GET /api/hello', () => {
    it('should return Hello World message', async () => {
      const response = await request(app).get('/api/hello');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello World' });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/foo', () => {
    it('should return foo value', async () => {
      const response = await request(app).get('/api/foo');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ value: 'foo' });
    });
  });
});
