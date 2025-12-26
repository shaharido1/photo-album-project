/// <reference types="jest" />
import { apiFetch, api, API_ENDPOINTS } from './apiClient';

// Mock the authService
jest.mock('./authService', () => ({
  getIdToken: jest.fn(),
}));

import { getIdToken } from './authService';

const mockGetIdToken = getIdToken as jest.MockedFunction<typeof getIdToken>;

describe('apiClient', () => {
  // Store original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('API_ENDPOINTS', () => {
    it('should have all expected endpoints', () => {
      expect(API_ENDPOINTS.HELLO).toBe('/api/hello');
      expect(API_ENDPOINTS.VERSION).toBe('/api/version');
      expect(API_ENDPOINTS.FOO).toBe('/api/foo');
      expect(API_ENDPOINTS.PHOTOS).toBe('/api/photos');
      expect(API_ENDPOINTS.ALBUMS).toBe('/api/albums');
      expect(API_ENDPOINTS.FEEDBACK).toBe('/api/feedback');
    });
  });

  describe('apiFetch', () => {
    it('should make a GET request by default', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiFetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should add auth headers when authenticated option is true', async () => {
      mockGetIdToken.mockResolvedValueOnce('mock-token');
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiFetch('/api/test', { authenticated: true });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
        body: undefined,
      });
    });

    it('should not add auth headers when no token is available', async () => {
      mockGetIdToken.mockResolvedValueOnce(null);
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiFetch('/api/test', { authenticated: true });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
      });
    });

    it('should add Content-Type header and stringify body for POST requests', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const body = { name: 'test' };
      await apiFetch('/api/test', { method: 'POST', body });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(apiFetch('/api/test')).rejects.toThrow('Not found');
    });

    it('should throw status error when no error message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(apiFetch('/api/test')).rejects.toThrow(
        'Request failed with status 500'
      );
    });

    it('should handle JSON parse error in error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiFetch('/api/test')).rejects.toThrow(
        'Request failed with status 500'
      );
    });

    it('should merge custom headers with auth headers', async () => {
      mockGetIdToken.mockResolvedValueOnce('mock-token');
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiFetch('/api/test', {
        authenticated: true,
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'X-Custom-Header': 'custom-value',
          Authorization: 'Bearer mock-token',
        },
        body: undefined,
      });
    });
  });

  describe('api convenience methods', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    describe('api.get', () => {
      it('should make GET request', async () => {
        await api.get('/api/test');

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'GET',
          headers: {},
          body: undefined,
        });
      });

      it('should pass options correctly', async () => {
        mockGetIdToken.mockResolvedValueOnce('token');
        await api.get('/api/test', { authenticated: true });

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'GET',
          headers: { Authorization: 'Bearer token' },
          body: undefined,
        });
      });
    });

    describe('api.post', () => {
      it('should make POST request with body', async () => {
        const body = { name: 'test' };
        await api.post('/api/test', body);

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      });

      it('should handle POST without body', async () => {
        await api.post('/api/test');

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'POST',
          headers: {},
          body: undefined,
        });
      });
    });

    describe('api.put', () => {
      it('should make PUT request with body', async () => {
        const body = { name: 'updated' };
        await api.put('/api/test', body);

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      });
    });

    describe('api.patch', () => {
      it('should make PATCH request with body', async () => {
        const body = { name: 'patched' };
        await api.patch('/api/test', body);

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      });
    });

    describe('api.delete', () => {
      it('should make DELETE request', async () => {
        await api.delete('/api/test');

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'DELETE',
          headers: {},
          body: undefined,
        });
      });

      it('should pass options correctly', async () => {
        mockGetIdToken.mockResolvedValueOnce('token');
        await api.delete('/api/test', { authenticated: true });

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {
          method: 'DELETE',
          headers: { Authorization: 'Bearer token' },
          body: undefined,
        });
      });
    });
  });

  describe('type safety', () => {
    it('should return typed response', async () => {
      interface TestResponse {
        id: number;
        name: string;
      }

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'test' }),
      });

      const result = await api.get<TestResponse>('/api/test');

      // TypeScript should infer the correct type
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });
  });
});
