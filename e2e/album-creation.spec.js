import { test, expect } from '@playwright/test';

// Helper function to create an album
async function createAlbum(page, name = 'Test Album') {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
}

test.describe('Album Creation', () => {
  test('should open create album dialog', async ({ page }) => {
    await page.goto('/');

    // Click New Album button
    await page.getByRole('button', { name: 'New Album' }).click();

    // Verify dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create New Album')).toBeVisible();
    await expect(page.getByLabel('Album Name')).toBeVisible();
  });

  test('should display all album size options', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Album' }).click();

    // Verify all size options are visible (using first() to avoid strict mode issues with preview)
    await expect(page.getByText('8×8"').first()).toBeVisible();
    await expect(page.getByText('10×10"').first()).toBeVisible();
    await expect(page.getByText('12×12"').first()).toBeVisible();
    await expect(page.getByText('A4 Landscape').first()).toBeVisible();
    await expect(page.getByText('A4 Portrait').first()).toBeVisible();
  });

  test('should select different album size', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Album' }).click();

    // Click on 12x12 size
    await page.getByText('12×12"').click();

    // Verify it's selected (has border-primary class via visual inspection)
    // The preview should update to show the selected size
    await expect(
      page.locator('.text-center .font-medium').filter({ hasText: '12×12"' })
    ).toBeVisible();
  });

  test('should create a new album', async ({ page }) => {
    await page.goto('/');

    // Click New Album button
    await page.getByRole('button', { name: 'New Album' }).click();

    // Fill in album name and press Enter to submit
    await page.getByLabel('Album Name').fill('My Test Album');
    await page.getByLabel('Album Name').press('Enter');

    // Verify dialog closed and album name appears
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('My Test Album')).toBeVisible();
  });

  test('should create album via Create Album button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Album' }).click();
    await page.getByLabel('Album Name').fill('Button Create Test');

    // Click Create Album button instead of pressing Enter
    await page.getByRole('button', { name: 'Create Album' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Button Create Test')).toBeVisible();
  });

  test('should not create album with empty name', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Album' }).click();

    // Create Album button should be disabled when name is empty
    await expect(
      page.getByRole('button', { name: 'Create Album' })
    ).toBeDisabled();
  });

  test('should close dialog on Cancel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Album' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should show Save and Export buttons after album creation', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbum(page);

    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });
});
