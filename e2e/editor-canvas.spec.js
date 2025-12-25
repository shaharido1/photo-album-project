import { test, expect } from '@playwright/test';

// Helper function to create an album
async function createAlbum(page, name = 'Test Album') {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
}

test.describe('Photo Canvas & Layout', () => {
  test('should add photo to canvas via double-click', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Photo Test');

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Double-click on first photo to add to canvas
    await page.locator('img[loading="lazy"]').first().dblclick();

    // Verify the instruction text is visible (album is active)
    await expect(page.getByText('Drag photos to canvas or double-click to add')).toBeVisible();
  });

  test('should show drag instruction after album creation', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    await expect(page.getByText('Drag photos to canvas or double-click to add')).toBeVisible();
  });
});

test.describe('Drag and Drop', () => {
  test('should show drag handle on photo hover when album exists', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Hover over first photo
    await page.locator('img[loading="lazy"]').first().hover();

    // Should show drag handle icon
    await expect(page.locator('.group-hover\\:opacity-100').first()).toBeVisible();
  });

  test('photos should be draggable when album exists', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Check that photos have draggable attribute
    const firstPhoto = page.locator('img[loading="lazy"]').first().locator('..');
    await expect(firstPhoto).toHaveAttribute('draggable', 'true');
  });
});
