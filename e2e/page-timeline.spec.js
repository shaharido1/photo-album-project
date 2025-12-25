import { test, expect } from '@playwright/test';

// Helper function to create an album
async function createAlbum(page, name = 'Test Album') {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
}

test.describe('Page Timeline', () => {
  test('should display page timeline after album creation', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbum(page, 'Timeline Test');

    // Verify page timeline shows first page and add button
    await expect(
      page.getByRole('button', { name: 'Add new page' })
    ).toBeVisible();
  });

  test('should add new page', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Click add page button
    await page.getByRole('button', { name: 'Add new page' }).click();

    // Verify second page exists (look for page numbers)
    await expect(
      page.locator('.bg-black\\/60').filter({ hasText: '2' })
    ).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Add a second page
    await page.getByRole('button', { name: 'Add new page' }).click();

    // Click on page 2 thumbnail (look for the page with number 2)
    await page
      .locator('.bg-black\\/60')
      .filter({ hasText: '2' })
      .locator('..')
      .click();

    // The second page should now be selected (have the primary border)
    await expect(
      page
        .locator('.border-primary')
        .locator('.bg-black\\/60')
        .filter({ hasText: '2' })
    ).toBeVisible();
  });

  test('should remove page when multiple pages exist', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Add a second page
    await page.getByRole('button', { name: 'Add new page' }).click();
    await expect(
      page.locator('.bg-black\\/60').filter({ hasText: '2' })
    ).toBeVisible();

    // Hover over first page thumbnail to show delete button and click it
    const firstPageThumbnail = page.locator('.w-16.h-16').first();
    await firstPageThumbnail.hover();
    await firstPageThumbnail.locator('button').click();

    // Only one page should remain
    await expect(
      page.locator('.bg-black\\/60').filter({ hasText: '2' })
    ).not.toBeVisible();
  });
});
