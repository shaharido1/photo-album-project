// Mock for @/services/apiClient

export const API_ENDPOINTS = {
  HELLO: '/api/hello',
  VERSION: '/api/version',
  FOO: '/api/foo',
  PHOTOS: '/api/photos',
  FEEDBACK: '/api/feedback',
} as const;

export const apiFetch = jest.fn(() => Promise.resolve({}));

export const api = {
  get: jest.fn(() => Promise.resolve({})),
  post: jest.fn(() => Promise.resolve({})),
  put: jest.fn(() => Promise.resolve({})),
  patch: jest.fn(() => Promise.resolve({})),
  delete: jest.fn(() => Promise.resolve({})),
};
