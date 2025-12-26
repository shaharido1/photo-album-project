import { test, expect } from '@playwright/test';

test.describe('Initial Load & Layout', () => {
  test('should load the editor layout', async ({ page }) => {
    await page.goto('/');

    // Verify the main header is visible
    await expect(
      page.getByRole('heading', { name: 'Photo Album' })
    ).toBeVisible({ timeout: 10000 });
    // Before album creation, app shows book view (empty state)
    // Photo Library and Properties panels only show in edit mode after album creation
    await expect(page.getByText('Create an album to start')).toBeVisible();
  });

  test('should show empty state before creating album', async ({ page }) => {
    await page.goto('/');

    // Check for empty state message
    await expect(page.getByText('Create an album to start')).toBeVisible();
    await expect(page.getByText('Create an album to see pages')).toBeVisible();
  });

  test('should show "No album" text in header before album creation', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByText('No album')).toBeVisible();
  });
});

test.describe('API Endpoints', () => {
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
});
