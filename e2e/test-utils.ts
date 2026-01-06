/**
 * Shared E2E Test Utilities
 */

import type { APIRequestContext, Page } from '@playwright/test';

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

/**
 * Sign in with dev auth mode (for E2E tests)
 * Requires VITE_DEV_AUTH_ENABLED=true
 */
export const signInWithTestUser = async (page: Page): Promise<void> => {
  // Enable dev auth via localStorage before page load
  await page.addInitScript(() => {
    localStorage.setItem('VITE_DEV_AUTH_ENABLED', 'true');
  });

  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if already signed in
  const signInButton = page.getByRole('button', { name: 'Sign In' });
  if (!(await signInButton.isVisible())) {
    // Already signed in or Sign In button not visible
    return;
  }

  // Open auth dialog
  await signInButton.click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });

  // Fill in email and password
  await page.getByPlaceholder('Email').fill('test@example.com');
  await page.getByPlaceholder('Password').fill('password123');

  // Submit form
  await page.getByRole('button', { name: 'Sign In' }).last().click();

  // Wait for sign in to complete (dialog closes)
  await page.waitForTimeout(1000);
};
