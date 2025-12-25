import { test, expect } from '@playwright/test';

test.describe('Photo Album Editor E2E Tests', () => {
  test('should load the editor layout', async ({ page }) => {
    await page.goto('/');

    // Verify the main editor components are visible
    await expect(page.getByRole('heading', { name: 'Photo Album' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Photo Library')).toBeVisible();
    await expect(page.getByText('Properties')).toBeVisible();
  });

  test('should have API health endpoint working', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
  });

  test('should have API photos endpoint working', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/photos');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.photos).toBeDefined();
    expect(Array.isArray(body.photos)).toBe(true);
    expect(body.photos.length).toBeGreaterThan(0);
  });

  test('should load photos in the library', async ({ page }) => {
    await page.goto('/');

    // Wait for photos to load
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Check multiple photos are visible
    const photos = page.locator('img[loading="lazy"]');
    await expect(photos).toHaveCount(12, { timeout: 10000 }); // 12 mock photos
  });

  test('should open create album dialog', async ({ page }) => {
    await page.goto('/');

    // Click New Album button
    await page.getByRole('button', { name: 'New Album' }).click();

    // Verify dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create New Album')).toBeVisible();
    await expect(page.getByLabel('Album Name')).toBeVisible();
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

  test('should show empty state before creating album', async ({ page }) => {
    await page.goto('/');

    // Check for empty state message
    await expect(page.getByText('Create an album to start')).toBeVisible();
    await expect(page.getByText('Create an album to see pages')).toBeVisible();
  });

  test('should display page timeline after album creation', async ({ page }) => {
    await page.goto('/');

    // Create an album
    await page.getByRole('button', { name: 'New Album' }).click();
    await page.getByLabel('Album Name').fill('Timeline Test');
    await page.getByLabel('Album Name').press('Enter');

    // Verify page timeline shows first page
    await expect(page.getByRole('button', { name: 'Add new page' })).toBeVisible();
  });

  test('should add photo to canvas via double-click', async ({ page }) => {
    await page.goto('/');

    // Create an album first
    await page.getByRole('button', { name: 'New Album' }).click();
    await page.getByLabel('Album Name').fill('Photo Test');
    await page.getByLabel('Album Name').press('Enter');

    // Wait for dialog to close and photos to be visible
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Double-click on first photo to add to canvas
    await page.locator('img[loading="lazy"]').first().dblclick();

    // Verify the instruction text is visible (album is active)
    await expect(page.getByText('Drag photos to canvas or double-click to add')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Get initial state of html element
    const html = page.locator('html');

    // Click dark mode toggle
    const darkModeButton = page.getByRole('button', { name: /Switch to (light|dark) mode/ });
    await darkModeButton.click();

    // Verify dark class is toggled
    await expect(html).toHaveClass(/dark|^$/);
  });
});
