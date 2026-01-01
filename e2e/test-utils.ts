/**
 * Shared E2E Test Utilities
 */

import type { APIRequestContext } from '@playwright/test';

// Backend runs on port 4001 during E2E tests
export const BACKEND_URL = 'http://localhost:4001';

/**
 * Helper to wait for backend to be ready
 */
export const waitForBackend = async (
  request: APIRequestContext,
  maxAttempts = 30
): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await request.get(`${BACKEND_URL}/healthz`, {
        timeout: 2000,
      });
      if (response.ok()) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Backend not ready after maximum attempts');
};
