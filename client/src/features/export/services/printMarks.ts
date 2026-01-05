/**
 * Print Marks Renderer
 * Renders professional print marks: crop marks, bleed indicators, registration marks, page info
 */

import type { jsPDF } from 'jspdf';
import type { PrintMarksOptions, BleedMm, PageDimensions } from '../types';

// Mark dimensions in points (72pt = 1 inch)
const CROP_MARK_LENGTH = 18; // 0.25 inch
const CROP_MARK_OFFSET = 6; // Gap between mark and trim edge
const REGISTRATION_MARK_SIZE = 12;
const MARK_LINE_WIDTH = 0.5;

/**
 * Draw all print marks on a PDF page
 */
export function drawPrintMarks(
  doc: jsPDF,
  dimensions: PageDimensions,
  bleedMm: BleedMm,
  options: PrintMarksOptions,
  pageNumber: number,
  totalPages: number,
  albumName: string
): void {
  const bleedPt = (bleedMm / 25.4) * 72; // Convert mm to points

  // Set up drawing style
  doc.setDrawColor(0, 0, 0); // Black
  doc.setLineWidth(MARK_LINE_WIDTH);

  if (options.cropMarks) {
    drawCropMarks(doc, dimensions, bleedPt);
  }

  if (options.bleedArea) {
    drawBleedArea(doc, dimensions, bleedPt);
  }

  if (options.registrationMarks) {
    drawRegistrationMarks(doc, dimensions, bleedPt);
  }

  if (options.pageInfo) {
    drawPageInfo(doc, dimensions, bleedPt, pageNumber, totalPages, albumName);
  }
}

/**
 * Draw crop marks at corners
 * These indicate where the paper should be trimmed
 */
function drawCropMarks(doc: jsPDF, dimensions: PageDimensions, bleedPt: number): void {
  const { widthPt, heightPt } = dimensions;

  // Trim box coordinates (inside bleed)
  const trimLeft = bleedPt;
  const trimRight = widthPt - bleedPt;
  const trimTop = bleedPt;
  const trimBottom = heightPt - bleedPt;

  // Top-left corner
  // Horizontal mark
  doc.line(
    trimLeft - CROP_MARK_OFFSET - CROP_MARK_LENGTH,
    trimTop,
    trimLeft - CROP_MARK_OFFSET,
    trimTop
  );
  // Vertical mark
  doc.line(
    trimLeft,
    trimTop - CROP_MARK_OFFSET - CROP_MARK_LENGTH,
    trimLeft,
    trimTop - CROP_MARK_OFFSET
  );

  // Top-right corner
  doc.line(
    trimRight + CROP_MARK_OFFSET,
    trimTop,
    trimRight + CROP_MARK_OFFSET + CROP_MARK_LENGTH,
    trimTop
  );
  doc.line(
    trimRight,
    trimTop - CROP_MARK_OFFSET - CROP_MARK_LENGTH,
    trimRight,
    trimTop - CROP_MARK_OFFSET
  );

  // Bottom-left corner
  doc.line(
    trimLeft - CROP_MARK_OFFSET - CROP_MARK_LENGTH,
    trimBottom,
    trimLeft - CROP_MARK_OFFSET,
    trimBottom
  );
  doc.line(
    trimLeft,
    trimBottom + CROP_MARK_OFFSET,
    trimLeft,
    trimBottom + CROP_MARK_OFFSET + CROP_MARK_LENGTH
  );

  // Bottom-right corner
  doc.line(
    trimRight + CROP_MARK_OFFSET,
    trimBottom,
    trimRight + CROP_MARK_OFFSET + CROP_MARK_LENGTH,
    trimBottom
  );
  doc.line(
    trimRight,
    trimBottom + CROP_MARK_OFFSET,
    trimRight,
    trimBottom + CROP_MARK_OFFSET + CROP_MARK_LENGTH
  );
}

/**
 * Draw bleed area indicator (dashed line showing bleed boundary)
 */
function drawBleedArea(doc: jsPDF, dimensions: PageDimensions, bleedPt: number): void {
  if (bleedPt <= 0) return;

  const { widthPt, heightPt } = dimensions;

  // Draw dashed rectangle at bleed edge
  doc.setLineDashPattern([3, 3], 0);
  doc.setDrawColor(200, 200, 200); // Light gray

  // Bleed boundary (edge of page)
  doc.rect(0, 0, widthPt, heightPt);

  // Reset line style
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(0, 0, 0);
}

/**
 * Draw registration marks for color alignment
 * Standard crosshair with circle
 */
function drawRegistrationMarks(doc: jsPDF, dimensions: PageDimensions, bleedPt: number): void {
  const { widthPt, heightPt } = dimensions;
  const size = REGISTRATION_MARK_SIZE;
  const offset = bleedPt + CROP_MARK_OFFSET + CROP_MARK_LENGTH + 10;

  // Center positions for registration marks
  const positions = [
    { x: widthPt / 2, y: offset - size / 2 }, // Top center
    { x: widthPt / 2, y: heightPt - offset + size / 2 }, // Bottom center
    { x: offset - size / 2, y: heightPt / 2 }, // Left center
    { x: widthPt - offset + size / 2, y: heightPt / 2 }, // Right center
  ];

  positions.forEach(({ x, y }) => {
    drawRegistrationMark(doc, x, y, size);
  });
}

/**
 * Draw a single registration mark (crosshair with circle)
 */
function drawRegistrationMark(doc: jsPDF, x: number, y: number, size: number): void {
  const halfSize = size / 2;
  const circleRadius = size / 4;

  // Crosshair
  doc.line(x - halfSize, y, x + halfSize, y); // Horizontal
  doc.line(x, y - halfSize, x, y + halfSize); // Vertical

  // Circle
  doc.circle(x, y, circleRadius, 'S');
}

/**
 * Draw page information (page number, album name, date)
 */
function drawPageInfo(
  doc: jsPDF,
  dimensions: PageDimensions,
  bleedPt: number,
  pageNumber: number,
  totalPages: number,
  albumName: string
): void {
  const { widthPt, heightPt } = dimensions;

  // Position for page info (below the page, in the margin)
  const infoY = heightPt - bleedPt + CROP_MARK_OFFSET + CROP_MARK_LENGTH + 25;
  const leftX = bleedPt;
  const rightX = widthPt - bleedPt;
  const centerX = widthPt / 2;

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);

  // Album name (left)
  doc.text(albumName, leftX, infoY);

  // Page number (center)
  doc.text(`Page ${pageNumber} of ${totalPages}`, centerX, infoY, { align: 'center' });

  // Date (right)
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(dateStr, rightX, infoY, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
}

/**
 * Calculate the margin needed for print marks
 * This is added outside the bleed area
 */
export function getMarkMarginPt(): number {
  return CROP_MARK_OFFSET + CROP_MARK_LENGTH + 30; // Extra space for page info
}

/**
 * Draw spine guide on cover spread
 */
export function drawSpineGuide(
  doc: jsPDF,
  spreadWidthPt: number,
  heightPt: number,
  spineWidthMm: number,
  bleedPt: number
): void {
  const spineWidthPt = (spineWidthMm / 25.4) * 72;
  const centerX = spreadWidthPt / 2;
  const spineLeft = centerX - spineWidthPt / 2;
  const spineRight = centerX + spineWidthPt / 2;

  // Draw spine boundaries (dashed lines)
  doc.setLineDashPattern([4, 2], 0);
  doc.setDrawColor(255, 0, 0); // Red for visibility
  doc.setLineWidth(0.5);

  // Left spine edge
  doc.line(spineLeft, bleedPt, spineLeft, heightPt - bleedPt);
  // Right spine edge
  doc.line(spineRight, bleedPt, spineRight, heightPt - bleedPt);

  // Spine label
  doc.setFontSize(6);
  doc.setTextColor(255, 0, 0);
  doc.text(`SPINE: ${spineWidthMm}mm`, centerX, bleedPt - 5, { align: 'center' });

  // Reset styles
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
}
