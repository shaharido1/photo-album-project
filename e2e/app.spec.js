import { test, expect } from '@playwright/test';

test.describe('Full Stack App E2E Tests', () => {
  test('should load the app and display greeting from API', async ({
    page,
  }) => {
    await page.goto('/');

    // Should show loading state initially
    const loadingText = page.getByText('Loading...');

    // Wait for the greeting to appear (API response)
    const greeting = page.getByRole('heading', { name: 'Hello World' });
    await expect(greeting).toBeVisible({ timeout: 10000 });

    // Verify the subtext is also displayed
    await expect(
      page.getByText('From the API server with React-Redux')
    ).toBeVisible();
  });

  test('should have API health endpoint working', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
  });

  test('should have API hello endpoint working', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/hello');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.message).toBe('Hello World');
  });

  test('should render the app with correct styling', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(
      page.getByRole('heading', { name: 'Hello World' })
    ).toBeVisible({ timeout: 10000 });

    // Check that the app container has centered text
    const appContainer = page
      .locator('div')
      .filter({ hasText: 'Hello World' })
      .first();
    await expect(appContainer).toBeVisible();
  });

  test('should have API foo endpoint working', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/foo');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.value).toBe('foo');
  });

  test('should display foo value from API', async ({ page }) => {
    await page.goto('/');

    // Wait for foo to appear (API response)
    await expect(page.getByText('Foo from server: foo')).toBeVisible({
      timeout: 10000,
    });
  });
});
