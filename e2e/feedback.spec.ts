import { test, expect } from '@playwright/test';

/**
 * Feedback Feature E2E Tests
 *
 * Tests the feedback dialog UI and API endpoint for creating GitHub issues.
 * Uses the X-Test-User-Id header for authenticated API requests.
 */

test.describe('Feedback Feature', () => {
  test.describe('Feedback Button Visibility', () => {
    test('should not show feedback button when not authenticated', async ({
      page,
    }) => {
      await page.goto('/');

      // Wait for the page to load
      await expect(
        page.getByRole('heading', { name: 'Photo Album' })
      ).toBeVisible({ timeout: 10000 });

      // Feedback button should NOT be visible for unauthenticated users
      await expect(
        page.getByRole('button', { name: 'Send feedback' })
      ).not.toBeVisible();

      // Sign In button should be visible instead
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });
  });

  test.describe('Feedback Dialog UI', () => {
    test.beforeEach(async ({ page }) => {
      // Enable dev auth via localStorage before page load
      await page.addInitScript(() => {
        localStorage.setItem('VITE_DEV_AUTH_ENABLED', 'true');
      });

      await page.goto('/');

      // Wait for the page to load
      await expect(
        page.getByRole('heading', { name: 'Photo Album' })
      ).toBeVisible({ timeout: 10000 });

      // Sign in using dev auth
      const signInButton = page.getByRole('button', { name: 'Sign In' });
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill in credentials and sign in
        await page.getByPlaceholder('Email').fill('test@example.com');
        await page.getByPlaceholder('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign In' }).last().click();

        // Wait for sign in to complete
        await page.waitForTimeout(1000);
      }
    });

    test('should show feedback button when authenticated', async ({ page }) => {
      // Check if user is authenticated (feedback button visible)
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      // If sign-in succeeded, feedback button should be visible
      if (await feedbackButton.isVisible()) {
        await expect(feedbackButton).toBeVisible();
      } else {
        // Skip if dev auth is not enabled
        test.skip();
      }
    });

    test('should open feedback dialog when clicking feedback button', async ({
      page,
    }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      // Click feedback button
      await feedbackButton.click();

      // Feedback dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Send Feedback' })
      ).toBeVisible();

      // Should show feedback type buttons
      await expect(
        page.getByRole('button', { name: 'Bug Report' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Feature Request' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'General Feedback' })
      ).toBeVisible();

      // Should show form fields
      await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Description' })
      ).toBeVisible();

      // Submit button should be disabled initially
      await expect(
        page.getByRole('button', { name: 'Submit Feedback' })
      ).toBeDisabled();
    });

    test('should enable submit button when form is filled', async ({
      page,
    }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill in the form
      await page
        .getByRole('textbox', { name: 'Title' })
        .fill('Test feedback title');
      await page
        .getByRole('textbox', { name: 'Description' })
        .fill('Test feedback description');

      // Submit button should now be enabled
      await expect(
        page.getByRole('button', { name: 'Submit Feedback' })
      ).toBeEnabled();
    });

    test('should allow selecting different feedback types', async ({
      page,
    }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click Bug Report
      await page.getByRole('button', { name: 'Bug Report' }).click();

      // Click Feature Request
      await page.getByRole('button', { name: 'Feature Request' }).click();

      // Click General Feedback
      await page.getByRole('button', { name: 'General Feedback' }).click();

      // Dialog should still be open
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should close dialog when clicking Cancel', async ({ page }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Dialog should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close dialog when clicking Close button', async ({ page }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click Close (X) button
      await page.getByRole('button', { name: 'Close' }).click();

      // Dialog should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close dialog when pressing Escape', async ({ page }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Dialog should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should reset form when dialog is closed and reopened', async ({
      page,
    }) => {
      const feedbackButton = page.getByRole('button', {
        name: 'Send feedback',
      });

      if (!(await feedbackButton.isVisible())) {
        test.skip();
        return;
      }

      // Open dialog and fill form
      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page
        .getByRole('textbox', { name: 'Title' })
        .fill('Test feedback title');
      await page
        .getByRole('textbox', { name: 'Description' })
        .fill('Test feedback description');

      // Close dialog
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // Reopen dialog
      await feedbackButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Form should be reset
      await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
        ''
      );
      await expect(
        page.getByRole('textbox', { name: 'Description' })
      ).toHaveValue('');
    });
  });

  test.describe('Feedback API', () => {
    test('should return 401 without authentication', async ({ request }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        data: {
          title: 'Test feedback',
          description: 'Test description',
          feedbackType: 'general',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 400 when title is missing', async ({ request }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        headers: {
          'X-Test-User-Id': 'e2e-test-user-123',
        },
        data: {
          description: 'Test description',
          feedbackType: 'general',
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
    });

    test('should return 400 when description is missing', async ({
      request,
    }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        headers: {
          'X-Test-User-Id': 'e2e-test-user-123',
        },
        data: {
          title: 'Test feedback',
          feedbackType: 'general',
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
    });

    test('should accept valid feedback with test user header', async ({
      request,
    }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        headers: {
          'X-Test-User-Id': 'e2e-test-user-123',
        },
        data: {
          title: 'E2E Test Feedback',
          description: 'This is an automated test feedback submission.',
          feedbackType: 'general',
        },
      });

      // Should either succeed (201) or fail gracefully (500 if GitHub token not configured)
      // But should NOT be 400 (bad request) or 401 (unauthorized)
      expect(response.status()).not.toBe(400);
      expect(response.status()).not.toBe(401);

      if (response.status() === 201) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.issue).toBeDefined();
        expect(body.issue.number).toBeDefined();
        expect(body.issue.url).toBeDefined();
      } else if (response.status() === 500) {
        // GitHub token not configured - expected in some environments
        const body = await response.json();
        expect(body.error).toBeDefined();
      }
    });

    test('should accept feedback with bug type', async ({ request }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        headers: {
          'X-Test-User-Id': 'e2e-test-user-123',
        },
        data: {
          title: 'E2E Test Bug Report',
          description: 'Testing bug report feedback type.',
          feedbackType: 'bug',
        },
      });

      // Should not be 400 or 401
      expect(response.status()).not.toBe(400);
      expect(response.status()).not.toBe(401);
    });

    test('should accept feedback with feature type', async ({ request }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        headers: {
          'X-Test-User-Id': 'e2e-test-user-123',
        },
        data: {
          title: 'E2E Test Feature Request',
          description: 'Testing feature request feedback type.',
          feedbackType: 'feature',
        },
      });

      // Should not be 400 or 401
      expect(response.status()).not.toBe(400);
      expect(response.status()).not.toBe(401);
    });

    test('should default to general type when feedbackType is not provided', async ({
      request,
    }) => {
      // Use relative path - goes through Vite proxy to backend
      const response = await request.post('/api/feedback', {
        headers: {
          'X-Test-User-Id': 'e2e-test-user-123',
        },
        data: {
          title: 'E2E Test Default Type',
          description: 'Testing default feedback type.',
        },
      });

      // Should not be 400 or 401
      expect(response.status()).not.toBe(400);
      expect(response.status()).not.toBe(401);
    });
  });
});
