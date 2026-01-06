import { test, expect } from '@playwright/test';
import { signInWithTestUser } from './test-utils';

test.describe('URL Routing', () => {
  test.describe('Basic URL Navigation', () => {
    test('should show home page when navigating to root', async ({ page }) => {
      await page.goto('/');

      // Should be on root URL
      expect(page.url()).toMatch(/\/$/);

      // HomePage should be visible (shows Photo Album header)
      await expect(
        page.locator('text=Photo Album').first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should redirect unknown routes to root', async ({ page }) => {
      await page.goto('/some/unknown/path');

      // Should redirect to root
      await expect(page).toHaveURL('/');
    });

    test('should handle album URL pattern', async ({ page }) => {
      // Navigate to an album URL (album may not exist)
      await page.goto('/album/test-album-123');

      // URL should maintain the album path format
      expect(page.url()).toContain('/album/');
    });

    test('should handle album with page URL pattern', async ({ page }) => {
      // Navigate to an album with page URL
      await page.goto('/album/test-album-123/page/2');

      // URL should maintain the album/page path format
      expect(page.url()).toContain('/album/');
      expect(page.url()).toContain('/page/');
    });
  });

  test.describe('Home Button Navigation', () => {
    test('should have clickable home button in header', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find the home button (Photo Album text with Home icon)
      const homeButton = page.locator('header button, header a').filter({ hasText: 'Photo Album' }).first();

      await expect(homeButton).toBeVisible();
    });
  });

  test.describe('localStorage Integration', () => {
    test('should read and write lastVisited to localStorage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Set a value in localStorage
      await page.evaluate(() => {
        const data = {
          albumId: 'test-album-999',
          timestamp: Date.now(),
        };
        localStorage.setItem('lastVisited', JSON.stringify(data));
      });

      // Verify it was set
      const stored = await page.evaluate(() => {
        return localStorage.getItem('lastVisited');
      });

      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.albumId).toBe('test-album-999');
    });

    test('should clear localStorage when clicking home', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // First set a lastVisited value
      await page.evaluate(() => {
        const data = {
          albumId: 'test-album-to-clear',
          timestamp: Date.now(),
        };
        localStorage.setItem('lastVisited', JSON.stringify(data));
      });

      // Click the home button
      const homeButton = page.locator('header').locator('button, a').filter({ hasText: 'Photo Album' }).first();
      if (await homeButton.isVisible()) {
        await homeButton.click();

        // Wait for any state changes
        await page.waitForTimeout(500);

        // localStorage should be cleared
        const stored = await page.evaluate(() => {
          return localStorage.getItem('lastVisited');
        });

        expect(stored).toBeNull();
      }
    });
  });

  test.describe('Authenticated URL navigation', () => {
    test.beforeEach(async ({ page }) => {
      await signInWithTestUser(page);
    });

    test('should update URL when selecting an album', async ({ page }) => {
      await page.goto('/');

      // Wait for albums to load
      await page.waitForLoadState('networkidle');

      // If there are existing albums, click the first one
      const albumCard = page.locator('[data-testid="album-card"]').first();
      const hasAlbums = (await albumCard.count()) > 0;

      if (hasAlbums) {
        await albumCard.click();

        // URL should now include /album/
        await expect(page).toHaveURL(/\/album\/[a-zA-Z0-9-]+/);
      }
    });

    test('should go back to dashboard when clicking home button', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find and click the home/logo button
      const homeButton = page
        .locator('header button, header a')
        .filter({ hasText: /Photo Album/ })
        .first();

      if (await homeButton.isVisible()) {
        await homeButton.click();
        await expect(page).toHaveURL('/');
      }
    });

    test('should persist album ID in URL after page refresh', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Create a new album to get a valid album ID
      const createButton = page.locator('button').filter({ hasText: /Create New|New Album/ }).first();
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill in album name
        const nameInput = page.locator('input[id="album-name"]');
        await nameInput.fill('Test URL Album');

        // Click create
        const submitButton = page.locator('button').filter({ hasText: 'Create Album' });
        await submitButton.click();

        // Wait for navigation to album
        await page.waitForURL(/\/album\/[a-zA-Z0-9-]+/, { timeout: 10000 });

        // Get the current URL
        const albumUrl = page.url();
        expect(albumUrl).toMatch(/\/album\/[a-zA-Z0-9-]+/);

        // Refresh the page
        await page.reload();

        // URL should remain the same
        expect(page.url()).toBe(albumUrl);

        // Album should still be loaded
        await expect(page.locator('text=Test URL Album')).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });

  test.describe('localStorage persistence', () => {
    test('should save last visited album to localStorage', async ({ page }) => {
      await signInWithTestUser(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Create a new album
      const createButton = page.locator('button').filter({ hasText: /Create New|New Album/ }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.locator('input[id="album-name"]').fill('LocalStorage Test');
        await page.locator('button').filter({ hasText: 'Create Album' }).click();

        // Wait for album to load
        await page.waitForURL(/\/album\/[a-zA-Z0-9-]+/, { timeout: 10000 });

        // Check localStorage
        const lastVisited = await page.evaluate(() => {
          return localStorage.getItem('lastVisited');
        });

        expect(lastVisited).toBeTruthy();
        const parsed = JSON.parse(lastVisited!);
        expect(parsed.albumId).toBeTruthy();
        expect(parsed.timestamp).toBeTruthy();
      }
    });
  });

  test.describe('Browser back/forward navigation', () => {
    test.beforeEach(async ({ page }) => {
      await signInWithTestUser(page);
    });

    test('should support browser back navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Store initial URL
      const dashboardUrl = page.url();

      // If there's an album, navigate to it
      const albumCard = page.locator('[data-testid="album-card"]').first();
      if ((await albumCard.count()) > 0) {
        await albumCard.click();
        await page.waitForURL(/\/album\//);

        // Now go back
        await page.goBack();

        // Should be back on dashboard
        expect(page.url()).toBe(dashboardUrl);
      }
    });
  });
});
