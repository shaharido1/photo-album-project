/**
 * Firebase Admin SDK Mock for Testing
 *
 * Provides mock implementations for firebase-admin to enable unit testing
 * without actual Firebase connections.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firestore document data
const mockDocData: Record<string, any> = {};

// Mock Firestore snapshot
const createMockSnapshot = (
  exists: boolean,
  id: string,
  data: any = null
): any => ({
  exists,
  id,
  data: () => data,
  ref: { id },
});

// Mock Firestore collection/document chain
const createMockFirestore = (): any => {
  const mockCollection: any = {
    doc: jest.fn((id: string) => ({
      get: jest.fn(() =>
        Promise.resolve(
          createMockSnapshot(
            !!mockDocData[id],
            id,
            mockDocData[id] || null
          )
        )
      ),
      set: jest.fn((data: any) => {
        mockDocData[id] = data;
        return Promise.resolve();
      }),
      update: jest.fn((data: any) => {
        mockDocData[id] = { ...mockDocData[id], ...data };
        return Promise.resolve();
      }),
      delete: jest.fn(() => {
        delete mockDocData[id];
        return Promise.resolve();
      }),
      collection: jest.fn(() => mockCollection),
    })),
    add: jest.fn((data: any) => {
      const id = `mock-${Date.now()}`;
      mockDocData[id] = data;
      return Promise.resolve({
        id,
        get: () => Promise.resolve(createMockSnapshot(true, id, data)),
      });
    }),
    where: jest.fn(() => mockCollection),
    orderBy: jest.fn(() => mockCollection),
    limit: jest.fn(() => mockCollection),
    get: jest.fn(() =>
      Promise.resolve({
        docs: Object.entries(mockDocData).map(([id, data]) =>
          createMockSnapshot(true, id, data)
        ),
        empty: Object.keys(mockDocData).length === 0,
      })
    ),
  };

  return {
    collection: jest.fn(() => mockCollection),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
  };
};

// Mock Auth
const createMockAuth = (): any => ({
  verifyIdToken: jest.fn((token: string) => {
    // Accept any token in tests, return mock user
    if (token === 'invalid-token') {
      return Promise.reject(new Error('Invalid token'));
    }
    return Promise.resolve({
      uid: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    });
  }),
  createUser: jest.fn(),
  getUser: jest.fn(),
  deleteUser: jest.fn(),
});

// Mock App
const mockApp: any = {
  name: '[DEFAULT]',
  options: {},
};

// Mock Firestore and Auth instances
const mockFirestore = createMockFirestore();
const mockAuth = createMockAuth();

// Export mock
const firebaseAdmin = {
  initializeApp: jest.fn(() => mockApp),
  credential: {
    cert: jest.fn(() => ({})),
  },
  firestore: jest.fn(() => mockFirestore),
  auth: jest.fn(() => mockAuth),
  apps: [mockApp],
};

export default firebaseAdmin;

// Named exports for direct imports
export const initializeApp = firebaseAdmin.initializeApp;
export const credential = firebaseAdmin.credential;
export const firestore = firebaseAdmin.firestore;
export const auth = firebaseAdmin.auth;

// Export mock instances for test assertions
export const __mockFirestore = mockFirestore;
export const __mockAuth = mockAuth;
export const __mockDocData = mockDocData;

// Helper to reset mock data between tests
export const __resetMocks = (): void => {
  Object.keys(mockDocData).forEach((key) => delete mockDocData[key]);
  jest.clearAllMocks();
};
