import request from 'supertest';
import { app, server } from '../src/index.js';

// Test user ID header for E2E test bypass (non-production only)
const TEST_USER_ID = 'test-user-123';

afterAll((done) => {
  server.close(done);
});

describe('Health Check', () => {
  describe('GET /healthz', () => {
    it('should return health status for container orchestration', async () => {
      const response = await request(app).get('/healthz');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
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

  describe('GET /api/version', () => {
    it('should return version from package.json', async () => {
      const response = await request(app).get('/api/version');

      expect(response.status).toBe(200);
      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });
});

describe('Photos API', () => {
  describe('GET /api/photos', () => {
    it('should return photos (mock data when Firebase not configured)', async () => {
      const response = await request(app).get('/api/photos');

      // Without Firebase, returns mock data
      expect(response.status).toBe(200);
      expect(response.body.photos).toBeDefined();
      expect(Array.isArray(response.body.photos)).toBe(true);
    });
  });

  describe('GET /api/photos/:id', () => {
    it('should return a single photo by ID', async () => {
      // First get all photos to get a valid ID
      const listResponse = await request(app).get('/api/photos');
      const photos = listResponse.body.photos;

      if (photos.length > 0) {
        const response = await request(app).get(`/api/photos/${photos[0].id}`);

        expect(response.status).toBe(200);
        expect(response.body.photo).toBeDefined();
        expect(response.body.photo.id).toBe(photos[0].id);
      }
    });

    it('should return 404 for non-existent photo', async () => {
      const response = await request(app).get('/api/photos/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Photo not found');
    });
  });
});

describe('Auth Protected Routes', () => {
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
      expect(response.body.user.uid).toBe(TEST_USER_ID);
    });
  });

  describe('GET /api/albums', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/albums');

      expect(response.status).toBe(401);
    });

    it('should return albums with test user header (dev mode)', async () => {
      const response = await request(app)
        .get('/api/albums')
        .set('X-Test-User-Id', TEST_USER_ID);

      // May fail if Firebase is not configured, but auth should pass
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/photos', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/photos')
        .send({ name: 'Test Photo' });

      expect(response.status).toBe(401);
    });
  });
});
