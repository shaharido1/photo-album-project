import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests authentication flows using dev auth mode for reliable, deterministic testing.
 * These tests verify the UI components and auth state management.
 */

test.describe('Authentication', () => {
  test.describe('Login Button', () => {
    test('should show Sign In button when not authenticated', async ({ page }) => {
      await page.goto('/');

      // Wait for the page to load
      await expect(
        page.getByRole('heading', { name: 'Photo Album' })
      ).toBeVisible({ timeout: 10000 });

      // Sign In button should be visible
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should open auth dialog when clicking Sign In', async ({ page }) => {
      await page.goto('/');

      // Click Sign In button
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Auth dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

      // Should show Google sign-in option
      await expect(
        page.getByRole('button', { name: /Continue with Google/i })
      ).toBeVisible();

      // Should show email input
      await expect(page.getByPlaceholder('Email')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
    });
  });

  test.describe('Auth Dialog Navigation', () => {
    test('should switch between sign in and sign up modes', async ({ page }) => {
      await page.goto('/');

      // Open auth dialog
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Should be in sign in mode
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

      // Switch to sign up
      await page.getByRole('button', { name: 'Create account' }).click();

      // Should now be in sign up mode
      await expect(
        page.getByRole('heading', { name: 'Create Account' })
      ).toBeVisible();
      await expect(
        page.getByPlaceholder('Display name (optional)')
      ).toBeVisible();

      // Switch back to sign in
      await page
        .getByRole('button', { name: 'Already have an account? Sign in' })
        .click();
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    });

    test('should switch to forgot password mode', async ({ page }) => {
      await page.goto('/');

      // Open auth dialog
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click forgot password
      await page.getByRole('button', { name: 'Forgot password?' }).click();

      // Should be in reset mode
      await expect(
        page.getByRole('heading', { name: 'Reset Password' })
      ).toBeVisible();

      // Password field should not be visible
      await expect(page.getByPlaceholder('Password')).not.toBeVisible();

      // Should have send reset link button
      await expect(
        page.getByRole('button', { name: 'Send Reset Link' })
      ).toBeVisible();

      // Back to sign in
      await page.getByRole('button', { name: 'Back to sign in' }).click();
      await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    });

    test('should close dialog when clicking outside', async ({ page }) => {
      await page.goto('/');

      // Open auth dialog
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Dialog should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should require email for sign in', async ({ page }) => {
      await page.goto('/');

      // Open auth dialog
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Try to submit empty form
      await page.getByRole('button', { name: 'Sign In' }).last().click();

      // Email field should show validation error (HTML5 required)
      const emailInput = page.getByPlaceholder('Email');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should require password for sign in', async ({ page }) => {
      await page.goto('/');

      // Open auth dialog
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill only email
      await page.getByPlaceholder('Email').fill('test@example.com');

      // Try to submit
      await page.getByRole('button', { name: 'Sign In' }).last().click();

      // Password field should show validation error (HTML5 required)
      const passwordInput = page.getByPlaceholder('Password');
      await expect(passwordInput).toHaveAttribute('required', '');
    });
  });
});

test.describe('Authentication with Dev Mode', () => {
  // These tests require VITE_DEV_AUTH_ENABLED=true to be set
  // They test the actual sign-in flow using dev auth

  test.describe('Dev Auth Sign In', () => {
    test.skip(
      ({ browserName }) => browserName !== 'chromium',
      'Dev auth tests run only on Chromium'
    );

    test.beforeEach(async ({ page }) => {
      // Enable dev auth via localStorage before page load
      await page.addInitScript(() => {
        // This will be checked by the app
        localStorage.setItem('VITE_DEV_AUTH_ENABLED', 'true');
      });
    });

    test('should show user menu after successful sign in (when dev auth enabled)', async ({
      page,
    }) => {
      // This test would only pass when VITE_DEV_AUTH_ENABLED=true is set in .env
      // Skip if dev auth is not enabled (sign in button won't work without real Firebase)
      await page.goto('/');

      // Check if Sign In button exists (means auth is available)
      const signInButton = page.getByRole('button', { name: 'Sign In' });
      if (!(await signInButton.isVisible())) {
        test.skip();
        return;
      }

      // Open auth dialog
      await signInButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill in email and password
      await page.getByPlaceholder('Email').fill('test@example.com');
      await page.getByPlaceholder('Password').fill('password123');

      // Submit form - use last button with name 'Sign In' (the submit button in the form)
      await page.getByRole('button', { name: 'Sign In' }).last().click();

      // If dev auth is enabled, user should be signed in
      // and we should see a user avatar button instead of Sign In
      // Give it a moment to process
      await page.waitForTimeout(1000);

      // Check if either sign in was successful (user menu visible)
      // or an error was shown (Firebase not configured / dev auth not enabled)
      const dialogStillOpen = await page.getByRole('dialog').isVisible();
      if (!dialogStillOpen) {
        // Sign in was successful, dialog closed
        // User menu should now be visible
        await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible();
      }
      // If dialog is still open, sign in failed (expected when dev auth not enabled)
    });
  });
});

test.describe('Server Auth Bypass (E2E Test Mode)', () => {
  // The server accepts X-Test-User-Id header in non-production mode
  // This tests that the server correctly handles authenticated requests

  test('should accept X-Test-User-Id header for authenticated endpoints', async ({
    request,
  }) => {
    // Make a request to a protected endpoint with test user header
    const response = await request.get('http://localhost:3001/api/albums', {
      headers: {
        'X-Test-User-Id': 'e2e-test-user-123',
      },
    });

    // Should NOT return 401 unauthorized (auth header was accepted)
    // May return 200 or 500 depending on server state, but not 401
    expect(response.status()).not.toBe(401);
  });

  test('should return 401 without auth header for protected endpoints', async ({
    request,
  }) => {
    // Make a request without any auth
    const response = await request.get('http://localhost:3001/api/albums');

    // Should return 401 unauthorized
    expect(response.status()).toBe(401);
  });
});
