/**
 * Shared test setup and utilities
 *
 * This module is used by Jest's setupFilesAfterEnv to manage the server lifecycle.
 * We import from app.ts to get the Express app without starting a server.
 * Supertest works directly with the Express app.
 */

import { app } from '../src/app.js';

// Test user ID headers for E2E test bypass (non-production only)
export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_ID_2 = 'test-user-456';

// Export app for use in tests
export { app };
