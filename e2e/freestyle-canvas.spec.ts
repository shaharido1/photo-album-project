import { test, expect, Page } from '@playwright/test';

// Helper function to create an album and switch to edit mode
async function createAlbum(
  page: Page,
  name: string = 'Test Album'
): Promise<void> {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  // Switch to Edit mode to see Photo Library and canvas
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
}

// Helper function to switch to freestyle layout
async function switchToFreestyle(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Freestyle Canvas' }).click();
}

// Helper function to add a photo to freestyle canvas via drag and drop
async function addPhotoToFreestyleCanvas(page: Page, photoIndex: number = 0): Promise<void> {
  const photo = page.locator('img[loading="lazy"]').nth(photoIndex);
  const canvas = page.locator('.konvajs-content');
  await photo.dragTo(canvas);
  // Wait for the photo to be added
  await page.waitForTimeout(500);
}

test.describe('Freestyle Canvas - Basic Functionality', () => {
  test('should show freestyle canvas option in layout selector', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Test');

    // Verify Freestyle Canvas button is visible
    await expect(page.getByRole('button', { name: 'Freestyle Canvas' })).toBeVisible();
  });

  test('should switch to freestyle canvas mode', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Test');
    await switchToFreestyle(page);

    // Verify freestyle mode is active by checking for the freestyle label
    await expect(page.getByText('Freestyle', { exact: true })).toBeVisible();
  });

  test('should show drop hint when freestyle canvas is empty', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Test');
    await switchToFreestyle(page);

    // Should show the drop hint text
    await expect(page.getByText('Freestyle Canvas')).toBeVisible();
    await expect(page.getByText('Drop photos anywhere to place them freely')).toBeVisible();
  });

  test('should show Back to Book button in freestyle mode', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Test');
    await switchToFreestyle(page);

    await expect(page.getByRole('button', { name: 'Back to Book' })).toBeVisible();
  });
});

test.describe('Freestyle Canvas - Photo Operations', () => {
  test('should add photo to freestyle canvas via drag and drop', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Drag Test');
    await switchToFreestyle(page);

    // Wait for photos to load
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Drag photo to canvas
    await addPhotoToFreestyleCanvas(page);

    // Drop hint should disappear when photos are added
    await expect(page.getByText('Drop photos anywhere to place them freely')).not.toBeVisible();
  });

  test('should select photo on click in freestyle canvas', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Select Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    // Click on the canvas to select the photo
    await page.locator('.konvajs-content').click();

    // Should show "Selected Photo" in the properties panel
    await expect(page.getByText('Selected Photo')).toBeVisible();
  });

  test('should show layer information for selected freestyle item', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Freestyle Layer Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    // Click on canvas to select
    await page.locator('.konvajs-content').click();

    // Should show layer information
    await expect(page.getByText(/Layer:/)).toBeVisible();
  });
});

test.describe('Freestyle Canvas - Layer Controls', () => {
  test('should show layer order buttons in properties panel', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Layer Controls Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    // Click on canvas to select
    await page.locator('.konvajs-content').click();

    // Should show Layer Order section with all buttons in sidebar
    await expect(page.getByText('Layer Order')).toBeVisible();
    await expect(page.locator('[title="Bring to Front"]').first()).toBeVisible();
    await expect(page.locator('[title="Bring Forward"]').first()).toBeVisible();
    await expect(page.locator('[title="Send Backward"]').first()).toBeVisible();
    await expect(page.locator('[title="Send to Back"]').first()).toBeVisible();
  });

  test('should add multiple photos with correct layer order', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Multi Layer Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Add first photo
    await addPhotoToFreestyleCanvas(page, 0);

    // Add second photo
    await addPhotoToFreestyleCanvas(page, 1);

    // Click on canvas to select the last added photo
    await page.locator('.konvajs-content').click();

    // Should show layer 1 (second photo on top)
    await expect(page.getByText('Layer: 1')).toBeVisible();
  });

  test('should show on-image layer controls when multiple photos exist', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'On-Image Controls Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Add two photos
    await addPhotoToFreestyleCanvas(page, 0);
    await addPhotoToFreestyleCanvas(page, 1);

    // On-image layer controls should appear (floating near the selected image)
    // These are the controls directly on the canvas, not in the sidebar
    const onImageControls = page.locator('.absolute.z-50');
    await expect(onImageControls).toBeVisible();
  });

  test('should not show on-image layer controls with only one photo', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Single Photo Controls Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Add only one photo
    await addPhotoToFreestyleCanvas(page, 0);

    // On-image layer controls should NOT appear when there's only one photo
    const onImageControls = page.locator('.absolute.z-50.flex-col');
    await expect(onImageControls).not.toBeVisible();
  });

  test('should reorder layers using Send to Back', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Reorder Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });

    // Add two photos
    await addPhotoToFreestyleCanvas(page, 0);
    await addPhotoToFreestyleCanvas(page, 1);

    // Second photo should be Layer: 1
    await expect(page.getByText('Layer: 1')).toBeVisible();

    // Click Send to Back (first one is the on-image control)
    await page.getByRole('button', { name: 'Send to Back' }).first().click();

    // Layer should now be -1 (behind the first photo)
    await expect(page.getByText('Layer: -1')).toBeVisible();
  });
});

test.describe('Freestyle Canvas - Layout Change Confirmation', () => {
  test('should show confirmation dialog when changing from freestyle to template with content', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Layout Change Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    // Try to change to a different layout
    await page.getByRole('button', { name: 'Single Photo' }).click();

    // Confirmation dialog should appear
    await expect(page.getByText('Change Page Layout?')).toBeVisible();
    await expect(page.getByText('This page has content')).toBeVisible();
  });

  test('should cancel layout change when clicking Cancel', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Cancel Layout Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    // Try to change layout
    await page.getByRole('button', { name: 'Single Photo' }).click();

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Should still be in freestyle mode
    await expect(page.getByText('Freestyle', { exact: true })).toBeVisible();
  });

  test('should change layout when clicking Change Layout', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Confirm Layout Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    // Try to change layout
    await page.getByRole('button', { name: 'Single Photo' }).click();

    // Click Change Layout
    await page.getByRole('button', { name: 'Change Layout' }).click();

    // Should no longer be in freestyle mode
    await expect(page.getByText('Freestyle', { exact: true })).not.toBeVisible();
  });

  test('should not show confirmation when changing from empty freestyle', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Empty Freestyle Test');
    await switchToFreestyle(page);

    // Change layout without adding any photos
    await page.getByRole('button', { name: 'Single Photo' }).click();

    // No dialog should appear - layout should change immediately
    await expect(page.getByText('Change Page Layout?')).not.toBeVisible();
    await expect(page.getByText('Freestyle', { exact: true })).not.toBeVisible();
  });
});

test.describe('Freestyle Canvas - Photo Controls', () => {
  test('should show rotate button for freestyle item', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Rotate Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    await page.locator('.konvajs-content').click();

    await expect(page.getByRole('button', { name: '+90' })).toBeVisible();
  });

  test('should show remove from page button for freestyle item', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Remove Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    await page.locator('.konvajs-content').click();

    await expect(page.getByRole('button', { name: 'Remove from page' })).toBeVisible();
  });

  test('should show filter presets for freestyle item', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Filter Test');
    await switchToFreestyle(page);

    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({ timeout: 10000 });
    await addPhotoToFreestyleCanvas(page);

    await page.locator('.konvajs-content').click();

    await expect(page.getByText('Filter Presets')).toBeVisible();
  });
});

test.describe('Freestyle Canvas - Page Timeline', () => {
  test('should show freestyle label in page timeline', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Timeline Test');
    await switchToFreestyle(page);

    // The freestyle badge should be visible in the page indicator
    await expect(page.getByText('Freestyle', { exact: true })).toBeVisible();
  });

  test('should navigate back to book view', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page, 'Navigate Test');
    await switchToFreestyle(page);

    // Click Back to Book
    await page.getByRole('button', { name: 'Back to Book' }).click();

    // Should no longer see the freestyle indicator
    await expect(page.getByText('Freestyle', { exact: true })).not.toBeVisible();
  });
});
