import { test, expect, Page } from '@playwright/test';

// Helper function to create an album and switch to edit mode
async function createAlbumAndEdit(
  page: Page,
  name: string = 'Test Album'
): Promise<void> {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  // Switch to Edit mode to see Photo Library
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
}

test.describe('Photo Library', () => {
  test('should load photos in the library', async ({ page }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);

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
    await createAlbumAndEdit(page);
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
    await createAlbumAndEdit(page);
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
    await createAlbumAndEdit(page);
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
    await createAlbumAndEdit(page);
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  });

  test('should show delete and clear buttons when photos are selected', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Select a photo
    await page.locator('img[loading="lazy"]').first().click();

    // Verify delete and clear buttons appear
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('should clear selection when clicking clear button', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Select photos
    await page.locator('img[loading="lazy"]').nth(0).click();
    await page.locator('img[loading="lazy"]').nth(1).click();
    await expect(page.getByText('2 photos selected')).toBeVisible();

    // Click clear
    await page.getByRole('button', { name: 'Clear' }).click();

    // Verify selection is cleared
    await expect(page.getByText('2 photos selected')).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Delete' })
    ).not.toBeVisible();
  });

  test('should show confirmation dialog when clicking delete', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Select a photo
    await page.locator('img[loading="lazy"]').first().click();

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verify confirmation dialog appears
    await expect(page.getByText('Delete photos?')).toBeVisible();
    await expect(
      page.getByText('This will permanently delete 1 photo from your library')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should cancel delete when clicking cancel', async ({ page }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify initial count
    await expect(page.locator('img[loading="lazy"]')).toHaveCount(12);

    // Select a photo
    await page.locator('img[loading="lazy"]').first().click();

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).click();

    // Click cancel in the dialog
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify photo was NOT deleted
    await expect(page.locator('img[loading="lazy"]')).toHaveCount(12);
  });

  test('should delete selected photos after confirmation', async ({ page }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify initial count
    await expect(page.locator('img[loading="lazy"]')).toHaveCount(12);

    // Select first photo
    await page.locator('img[loading="lazy"]').first().click();
    await expect(page.getByText('1 photo selected')).toBeVisible();

    // Click delete button to open dialog
    await page.getByRole('button', { name: 'Delete' }).click();

    // Confirm deletion in dialog
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    // Verify photo was deleted
    await expect(page.locator('img[loading="lazy"]')).toHaveCount(11);
    await expect(
      page.getByRole('button', { name: 'Delete' })
    ).not.toBeVisible();
  });

  test('should delete multiple selected photos after confirmation', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbumAndEdit(page);
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify initial count
    await expect(page.locator('img[loading="lazy"]')).toHaveCount(12);

    // Select multiple photos
    await page.locator('img[loading="lazy"]').nth(0).click();
    await page.locator('img[loading="lazy"]').nth(1).click();
    await page.locator('img[loading="lazy"]').nth(2).click();
    await expect(page.getByText('3 photos selected')).toBeVisible();

    // Click delete button to open dialog
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verify dialog shows correct count
    await expect(
      page.getByText('This will permanently delete 3 photos from your library')
    ).toBeVisible();

    // Confirm deletion
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    // Verify photos were deleted
    await expect(page.locator('img[loading="lazy"]')).toHaveCount(9);
  });
});
