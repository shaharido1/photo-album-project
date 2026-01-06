import { test, expect, Page } from '@playwright/test';

/**
 * Export Visual Regression Tests
 *
 * These tests verify that the PDF export rendering matches the editor rendering
 * by comparing screenshots of the debug preview panel.
 */

// Helper function to create an album
async function createAlbum(
  page: Page,
  name: string = 'Export Test Album'
): Promise<void> {
  await page.getByRole('button', { name: 'New Album' }).click();
  await page.getByLabel('Album Name').fill(name);
  await page.getByLabel('Album Name').press('Enter');
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
}

// Helper function to add a photo to the canvas
async function addPhotoToCanvas(page: Page): Promise<void> {
  // Wait for photos to load
  await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
    timeout: 10000,
  });

  // Switch to Edit mode
  await page.getByRole('button', { name: 'Edit', exact: true }).click();

  // Double-click first photo to add it
  await page.locator('img[loading="lazy"]').first().dblclick();
  await page.waitForTimeout(500);
}

// Helper function to open the debug preview
async function openDebugPreview(page: Page): Promise<void> {
  // Press Ctrl+Shift+D to open debug preview
  await page.keyboard.press('Control+Shift+D');
  await expect(page.getByText('Export Debug Preview')).toBeVisible({
    timeout: 5000,
  });
}

// Helper function to generate PDF preview
async function generatePdfPreview(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Generate PDF Preview' }).click();
  // Wait for the preview to be generated (the button text changes while generating)
  await expect(page.getByRole('button', { name: 'Generate PDF Preview' })).toBeEnabled({
    timeout: 10000,
  });
  // Wait for the image to appear
  await expect(page.locator('img[alt="PDF Preview"]')).toBeVisible({
    timeout: 5000,
  });
}

test.describe('Export Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debug preview panel opens with Ctrl+Shift+D', async ({ page }) => {
    await createAlbum(page);
    await openDebugPreview(page);

    // Verify the debug panel is visible
    await expect(page.getByText('Editor (Konva)')).toBeVisible();
    await expect(page.getByText('PDF Export (Canvas)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate PDF Preview' })).toBeVisible();
  });

  test('debug preview shows correct page info', async ({ page }) => {
    await createAlbum(page);
    await openDebugPreview(page);

    // Check debug info shows correct layout
    await expect(page.getByText(/Page:.*single/)).toBeVisible();
    await expect(page.getByText(/Background:/)).toBeVisible();
    await expect(page.getByText(/Album Size:/)).toBeVisible();
  });

  test('editor and PDF preview match for empty page', async ({ page }) => {
    await createAlbum(page);
    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Take screenshots of both previews
    const editorCanvas = page.locator('canvas').first();
    const pdfPreview = page.locator('img[alt="PDF Preview"]');

    // Both should be visible
    await expect(editorCanvas).toBeVisible();
    await expect(pdfPreview).toBeVisible();

    // Visual comparison - screenshot the entire debug panel
    const debugPanel = page.locator('.bg-white.rounded-lg.max-w-4xl');
    await expect(debugPanel).toHaveScreenshot('empty-page-comparison.png', {
      maxDiffPixelRatio: 0.05, // Allow 5% difference for anti-aliasing
    });
  });

  test('editor and PDF preview match with single photo', async ({ page }) => {
    await createAlbum(page);
    await addPhotoToCanvas(page);
    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Visual comparison
    const debugPanel = page.locator('.bg-white.rounded-lg.max-w-4xl');
    await expect(debugPanel).toHaveScreenshot('single-photo-comparison.png', {
      maxDiffPixelRatio: 0.1, // Allow 10% for image loading differences
    });
  });

  test('editor and PDF preview match with multiple photos', async ({ page }) => {
    await createAlbum(page);

    // Switch to Edit mode
    await page.getByRole('button', { name: 'Edit', exact: true }).click();

    // Wait for photos
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Change layout to 4-grid
    await page.getByRole('button', { name: 'Four Grid' }).click();
    await page.waitForTimeout(300);

    // Add 4 photos
    for (let i = 0; i < 4; i++) {
      await page.locator('img[loading="lazy"]').nth(i).dblclick();
      await page.waitForTimeout(300);
    }

    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Visual comparison
    const debugPanel = page.locator('.bg-white.rounded-lg.max-w-4xl');
    await expect(debugPanel).toHaveScreenshot('grid-photo-comparison.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('slot positions match between editor and PDF', async ({ page }) => {
    await createAlbum(page);
    await addPhotoToCanvas(page);
    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Check debug info shows slot position details
    await expect(page.getByText(/Slot 0: pos\(/)).toBeVisible();

    // The positions should show x=0, y=0 for default position
    await expect(page.getByText(/pos\(0\.0, 0\.0\)/)).toBeVisible();
  });

  test('debug preview closes with Ctrl+Shift+D', async ({ page }) => {
    await createAlbum(page);
    await openDebugPreview(page);

    // Verify it's open
    await expect(page.getByText('Export Debug Preview')).toBeVisible();

    // Close it
    await page.keyboard.press('Control+Shift+D');

    // Verify it's closed
    await expect(page.getByText('Export Debug Preview')).not.toBeVisible();
  });

  test('debug preview closes with close button', async ({ page }) => {
    await createAlbum(page);
    await openDebugPreview(page);

    // Click close button
    await page.getByRole('button', { name: /Close/ }).click();

    // Verify it's closed
    await expect(page.getByText('Export Debug Preview')).not.toBeVisible();
  });
});

test.describe('Export Visual Regression - Freestyle', () => {
  test('freestyle page renders correctly in both views', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Switch to Edit mode
    await page.getByRole('button', { name: 'Edit', exact: true }).click();

    // Wait for photos
    await expect(page.locator('img[loading="lazy"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Change to freestyle layout
    await page.getByRole('button', { name: 'Freestyle Canvas' }).click();
    await page.waitForTimeout(500);

    // Add a photo to freestyle canvas (drag and drop simulation)
    const photo = page.locator('img[loading="lazy"]').first();
    const canvas = page.locator('canvas').first();

    // Get canvas bounds for drop target
    const canvasBounds = await canvas.boundingBox();
    if (canvasBounds) {
      await photo.dragTo(canvas, {
        targetPosition: {
          x: canvasBounds.width / 2,
          y: canvasBounds.height / 2,
        },
      });
    }

    await page.waitForTimeout(500);

    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Visual comparison
    const debugPanel = page.locator('.bg-white.rounded-lg.max-w-4xl');
    await expect(debugPanel).toHaveScreenshot('freestyle-comparison.png', {
      maxDiffPixelRatio: 0.15, // Higher tolerance for freestyle positioning variations
    });
  });
});

test.describe('Export Rendering Consistency', () => {
  test('background color renders correctly in PDF', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);

    // Switch to Edit mode
    await page.getByRole('button', { name: 'Edit', exact: true }).click();

    // Change background color if there's a color picker
    // This test ensures background is consistent

    await openDebugPreview(page);
    await generatePdfPreview(page);

    // The PDF preview should not have black background (unless that's the page color)
    const pdfPreview = page.locator('img[alt="PDF Preview"]');
    await expect(pdfPreview).toBeVisible();

    // Screenshot just the PDF preview to check for black areas
    await expect(pdfPreview).toHaveScreenshot('pdf-background-check.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('image aspect ratios are preserved', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);
    await addPhotoToCanvas(page);
    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Get both canvases/images for dimension comparison
    const editorCanvas = page.locator('canvas').first();
    const pdfPreview = page.locator('img[alt="PDF Preview"]');

    const editorBox = await editorCanvas.boundingBox();
    const pdfBox = await pdfPreview.boundingBox();

    expect(editorBox).not.toBeNull();
    expect(pdfBox).not.toBeNull();

    if (editorBox && pdfBox) {
      // Aspect ratios should match (within small tolerance)
      const editorAspect = editorBox.width / editorBox.height;
      const pdfAspect = pdfBox.width / pdfBox.height;
      expect(Math.abs(editorAspect - pdfAspect)).toBeLessThan(0.1);
    }
  });

  test('no black borders appear around images in PDF', async ({ page }) => {
    await page.goto('/');
    await createAlbum(page);
    await addPhotoToCanvas(page);
    await openDebugPreview(page);
    await generatePdfPreview(page);

    // Take a screenshot for visual inspection
    // This will fail if there are unexpected black borders
    const pdfPreview = page.locator('img[alt="PDF Preview"]');
    await expect(pdfPreview).toHaveScreenshot('no-black-borders.png', {
      maxDiffPixelRatio: 0.1,
    });
  });
});
