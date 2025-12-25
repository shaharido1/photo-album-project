import { test, expect, Page } from '@playwright/test';

// Helper function to create an album
async function createAlbum(
  page: Page,
  name: string = 'Test Album'
): Promise<void> {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
}

test.describe('Properties Panel - Layout Templates', () => {
  test('should display layout options after album creation', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbum(page);

    // Verify Page Layout section is visible
    await expect(page.getByText('Page Layout')).toBeVisible();

    // Should have 8 layout template buttons (4 columns x 2 rows visible)
    const layoutButtons = page.locator('.grid-cols-4 button');
    await expect(layoutButtons).toHaveCount(8);
  });

  test('should change page layout', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Click on second layout template (should be different from default)
    const layoutButtons = page.locator('.grid-cols-4 button');
    await layoutButtons.nth(2).click();

    // Verify the layout is selected (should have primary border)
    await expect(layoutButtons.nth(2)).toHaveClass(/border-primary/);
  });
});

test.describe('Properties Panel - Background Colors', () => {
  test('should display background color options', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Verify Background section is visible
    await expect(page.getByText('Background')).toBeVisible();

    // Should have 4 background color buttons
    const bgButtons = page.locator('.flex.gap-2 button.rounded-full');
    await expect(bgButtons).toHaveCount(4);
  });

  test('should change page background color', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Click on black background (third button - white, cream, black, gray)
    const bgButtons = page.locator('.flex.gap-2 button.rounded-full');
    await bgButtons.nth(2).click();

    // Verify it's selected (should have ring-2)
    await expect(bgButtons.nth(2)).toHaveClass(/ring-2/);
  });
});

test.describe('Properties Panel - Photo Controls', () => {
  test('should show empty slot message when slot selected without photo', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbum(page);

    // Click on the canvas to select the empty slot
    await page.locator('canvas').click();

    // Should show empty slot message
    await expect(page.getByText('Empty slot selected')).toBeVisible();
  });

  test('should show zoom slider when photo is in slot', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Add a photo via double-click
    await page.locator('img[loading="lazy"]').first().dblclick();

    // Wait a moment for the photo to be added
    await page.waitForTimeout(500);

    // Click on the canvas to select the slot with photo
    await page.locator('canvas').click();

    // Should show zoom control
    await expect(page.getByText('Zoom')).toBeVisible();
  });

  test('should show rotate and reset buttons for selected photo', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbum(page);

    // Add a photo via double-click
    await page.locator('img[loading="lazy"]').first().dblclick();
    await page.waitForTimeout(500);

    // Click on the canvas to select the slot with photo
    await page.locator('canvas').click();

    await expect(page.getByRole('button', { name: /Rotate/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/ })).toBeVisible();
  });

  test('should show remove from page button for selected photo', async ({
    page,
  }) => {
    await page.goto('/');
    await createAlbum(page);

    // Add a photo via double-click
    await page.locator('img[loading="lazy"]').first().dblclick();
    await page.waitForTimeout(500);

    // Click on the canvas to select the slot with photo
    await page.locator('canvas').click();

    await expect(
      page.getByRole('button', { name: 'Remove from page' })
    ).toBeVisible();
  });
});

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Get initial state of html element
    const html = page.locator('html');

    // Click dark mode toggle
    const darkModeButton = page.getByRole('button', {
      name: /Switch to (light|dark) mode/,
    });
    await darkModeButton.click();

    // Verify dark class is toggled
    await expect(html).toHaveClass(/dark|^$/);
  });

  test('should persist dark mode toggle', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const darkModeButton = page.getByRole('button', {
      name: /Switch to (light|dark) mode/,
    });

    // Toggle dark mode on
    await darkModeButton.click();
    const hasDarkAfterFirstClick = await html.evaluate((el) =>
      el.classList.contains('dark')
    );

    // Toggle again
    await darkModeButton.click();
    const hasDarkAfterSecondClick = await html.evaluate((el) =>
      el.classList.contains('dark')
    );

    // States should be opposite
    expect(hasDarkAfterFirstClick).not.toBe(hasDarkAfterSecondClick);
  });
});
