/**
 * Unit Test Setup
 *
 * Unit tests focus on API validation, auth, and response structure.
 * Firebase is initialized but tests don't rely on Firebase data.
 */

import { jest, beforeAll, afterAll } from '@jest/globals';
import { app } from '../../src/app.js';

// Test user ID headers for E2E test bypass (non-production only)
export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_ID_2 = 'test-user-456';

// Silence console output during unit tests for cleaner output
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Export getApp for compatibility with test files
export const getApp = async () => app;

// Export app for use in tests
export { app };
