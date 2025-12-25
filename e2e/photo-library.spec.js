import { test, expect } from '@playwright/test';

test.describe('Photo Library', () => {
  test('should load photos in the library', async ({ page }) => {
    await page.goto('/');

    // Wait for photos to load
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Check multiple photos are visible
    const photos = page.locator('img[loading="lazy"]');
    await expect(photos).toHaveCount(12, { timeout: 10000 }); // 12 mock photos
  });

  test('should select photo on click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Click on first photo to select
    await page.locator('img[loading="lazy"]').first().click();

    // Verify selection indicator appears (check mark)
    await expect(page.getByText('1 photo selected')).toBeVisible();
  });

  test('should select multiple photos', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Click on first and second photos
    await page.locator('img[loading="lazy"]').nth(0).click();
    await page.locator('img[loading="lazy"]').nth(1).click();

    // Verify multiple selection
    await expect(page.getByText('2 photos selected')).toBeVisible();
  });

  test('should deselect photo on second click', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Click to select, then click again to deselect
    await page.locator('img[loading="lazy"]').first().click();
    await expect(page.getByText('1 photo selected')).toBeVisible();

    await page.locator('img[loading="lazy"]').first().click();
    await expect(page.getByText('1 photo selected')).not.toBeVisible();
  });

  test('should show upload and google buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  });
});
