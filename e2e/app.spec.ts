import { test, expect } from '@playwright/test';
import { BACKEND_URL, waitForBackend } from './test-utils';

test.describe('Initial Load & Layout', () => {
  test('should load the editor layout', async ({ page }) => {
    await page.goto('/');

    // Verify the main header is visible
    await expect(
      page.getByRole('heading', { name: 'Photo Album' })
    ).toBeVisible({ timeout: 10000 });
    // Before album creation, app shows landing page with hero section
    await expect(page.getByText('Memories worth keeping.')).toBeVisible();
  });

  test('should show empty state before creating album', async ({ page }) => {
    await page.goto('/');

    // Check for landing page content
    await expect(page.getByText('Memories worth keeping.')).toBeVisible();
    await expect(page.getByText('Create New Album')).toBeVisible();
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
    // Wait for backend to be ready
    await waitForBackend(request);

    const response = await request.get(`${BACKEND_URL}/api/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
  });

  test('should have API photos endpoint working', async ({ request }) => {
    // Wait for backend to be ready
    await waitForBackend(request);

    const response = await request.get(`${BACKEND_URL}/api/photos`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.photos).toBeDefined();
    expect(Array.isArray(body.photos)).toBe(true);
    expect(body.photos.length).toBeGreaterThan(0);
  });
});
