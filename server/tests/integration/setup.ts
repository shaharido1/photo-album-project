/**
 * Integration Test Setup - Real Firebase Connections
 *
 * This setup uses actual Firebase for full E2E integration tests.
 * Tests verify complete flows with real database operations.
 */

import { jest, beforeAll, afterAll } from '@jest/globals';
import { app } from '../../src/app.js';

// Test user ID headers for E2E test bypass (non-production only)
export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_ID_2 = 'test-user-456';

// Silence expected console errors during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Export app for use in tests
export { app };
