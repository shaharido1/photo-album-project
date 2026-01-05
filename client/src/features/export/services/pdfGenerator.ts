/**
 * PDF Generator Service
 * Main service for generating print-ready PDFs from photo albums
 */

import { jsPDF } from 'jspdf';
import type { Album, AlbumPage, Photo } from '@/types';
import { getLayoutById } from '@/features/layouts/layoutTemplates';
import type {
  ExportOptions,
  ExportProgress,
  ExportResult,
  PageDimensions,
} from '../types';
import {
  calculatePageDimensions,
  calculateSpineWidth,
  ALBUM_DIMENSIONS,
} from '../types';
import { drawPrintMarks, getMarkMarginPt, drawSpineGuide } from './printMarks';
import {
  processSlotImage,
  processFreestyleImage,
  renderPageToCanvas,
  type ImagePlacement,
} from './imageProcessor';

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: ExportProgress) => void;

/**
 * Generate PDF from album with export options
 */
export async function generatePDF(
  album: Album,
  photos: Photo[],
  options: ExportOptions,
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  const totalPages = album.pages.length;

  // Report initial progress
  onProgress?.({
    status: 'preparing',
    currentPage: 0,
    totalPages,
    message: 'Preparing export...',
  });

  // Calculate dimensions
  const dimensions = calculatePageDimensions(
    album.size,
    options.bleedMm,
    options.resolution
  );

  // Calculate margin for print marks
  const markMargin = options.printMarks.cropMarks ? getMarkMarginPt() : 0;

  // Create main PDF document
  // Page size includes bleed + mark margins
  const pageWidthPt = dimensions.widthPt + markMargin * 2;
  const pageHeightPt = dimensions.heightPt + markMargin * 2;

  const mainDoc = new jsPDF({
    orientation: dimensions.widthPt > dimensions.heightPt ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pageWidthPt, pageHeightPt],
  });

  // Process pages (skip cover if exporting separately)
  const startIndex = options.cover.exportSeparately ? 1 : 0;

  for (let i = startIndex; i < album.pages.length; i++) {
    const page = album.pages[i];
    const pageNumber = options.cover.exportSeparately ? i : i + 1;

    onProgress?.({
      status: 'rendering',
      currentPage: i + 1,
      totalPages,
      message: `Rendering page ${i + 1} of ${totalPages}...`,
    });

    // Add new page (except for first)
    if (i > startIndex) {
      mainDoc.addPage([pageWidthPt, pageHeightPt]);
    }

    // Render page content
    await renderPageToPDF(
      mainDoc,
      page,
      photos,
      dimensions,
      options,
      markMargin,
      pageNumber,
      album.pages.length - startIndex,
      album.name
    );
  }

  // Generate cover PDF if requested
  let coverPdf: Blob | undefined;
  let coverFilename: string | undefined;
  let spineWidth: number | undefined;

  if (options.cover.exportSeparately && album.pages.length > 0) {
    onProgress?.({
      status: 'rendering',
      currentPage: totalPages,
      totalPages,
      message: 'Generating cover spread...',
    });

    const coverResult = await generateCoverPDF(
      album,
      photos,
      options,
      dimensions
    );
    coverPdf = coverResult.pdf;
    coverFilename = coverResult.filename;
    spineWidth = coverResult.spineWidth;
  }

  onProgress?.({
    status: 'generating',
    currentPage: totalPages,
    totalPages,
    message: 'Finalizing PDF...',
  });

  // Generate blob from main PDF
  const mainPdfBlob = mainDoc.output('blob');
  const filename = `${sanitizeFilename(album.name)}_${getDateString()}.pdf`;

  onProgress?.({
    status: 'complete',
    currentPage: totalPages,
    totalPages,
    message: 'Export complete!',
  });

  return {
    mainPdf: mainPdfBlob,
    coverPdf,
    filename,
    coverFilename,
    spineWidth,
  };
}

/**
 * Render a single page to the PDF document
 */
async function renderPageToPDF(
  doc: jsPDF,
  page: AlbumPage,
  photos: Photo[],
  dimensions: PageDimensions,
  options: ExportOptions,
  markMargin: number,
  pageNumber: number,
  totalPages: number,
  albumName: string
): Promise<void> {
  const { widthPx, heightPx, widthPt, heightPt } = dimensions;

  // Get image placements
  const placements = await getPageImagePlacements(
    page,
    photos,
    widthPx,
    heightPx,
    options.colorSpace
  );

  // Render page content to canvas
  const pageDataUrl = await renderPageToCanvas(
    placements,
    widthPx,
    heightPx,
    page.background
  );

  // Add the rendered page image to PDF
  // Position it inside the mark margins
  doc.addImage(
    pageDataUrl,
    'JPEG',
    markMargin,
    markMargin,
    widthPt,
    heightPt
  );

  // Draw print marks if enabled
  if (hasAnyPrintMark(options.printMarks)) {
    // Create dimensions that include the full page with margins
    const fullDimensions = {
      ...dimensions,
      widthPt: widthPt + markMargin * 2,
      heightPt: heightPt + markMargin * 2,
    };

    drawPrintMarks(
      doc,
      fullDimensions,
      options.bleedMm,
      options.printMarks,
      pageNumber,
      totalPages,
      albumName
    );
  }

  // Draw page number if enabled (inside the trim area)
  if (options.includePageNumbers) {
    const bleedPt = (options.bleedMm / 25.4) * 72;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      String(pageNumber),
      markMargin + widthPt / 2,
      markMargin + heightPt - bleedPt - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }
}

/**
 * Get image placements for a page
 */
async function getPageImagePlacements(
  page: AlbumPage,
  photos: Photo[],
  canvasWidth: number,
  canvasHeight: number,
  colorSpace: ExportOptions['colorSpace']
): Promise<ImagePlacement[]> {
  const placements: ImagePlacement[] = [];

  if (page.layoutId === 'freestyle') {
    // Process freestyle items
    if (page.freestyleItems) {
      for (const item of page.freestyleItems) {
        const photo = photos.find((p) => p.id === item.photoId) || null;
        const placement = await processFreestyleImage(
          item,
          photo,
          canvasWidth,
          canvasHeight,
          colorSpace
        );
        if (placement) {
          placements.push(placement);
        }
      }
    }
  } else {
    // Process template slots
    const layout = getLayoutById(page.layoutId);
    if (layout) {
      for (let i = 0; i < layout.slots.length; i++) {
        const slot = page.slots[i];
        const slotDef = layout.slots[i];
        if (!slot) continue;

        const photo = slot.photoId
          ? photos.find((p) => p.id === slot.photoId) || null
          : null;

        const placement = await processSlotImage(
          slot,
          slotDef,
          photo,
          canvasWidth,
          canvasHeight,
          colorSpace
        );
        if (placement) {
          placements.push(placement);
        }
      }
    }
  }

  return placements;
}

/**
 * Generate cover PDF as a spread (back + spine + front)
 */
async function generateCoverPDF(
  album: Album,
  photos: Photo[],
  options: ExportOptions,
  _dimensions: PageDimensions
): Promise<{ pdf: Blob; filename: string; spineWidth: number }> {
  // Calculate spine width
  const pageCount = album.pages.length;
  const spineWidth = calculateSpineWidth(pageCount, options.cover.paperType);
  const spineWidthPt = (spineWidth / 25.4) * 72;

  // Cover spread dimensions: back + spine + front
  const baseDimensions = ALBUM_DIMENSIONS[album.size];
  const bleedInches = options.bleedMm / 25.4;

  // Single page width + spine + single page width + bleed on all sides
  const spreadWidthInches = baseDimensions.widthInches * 2 + (spineWidth / 25.4) + bleedInches * 2;
  const spreadHeightInches = baseDimensions.heightInches + bleedInches * 2;

  const spreadWidthPt = spreadWidthInches * 72;
  const spreadHeightPt = spreadHeightInches * 72;

  // Add margin for print marks
  const markMargin = options.printMarks.cropMarks ? getMarkMarginPt() : 0;
  const fullWidthPt = spreadWidthPt + markMargin * 2;
  const fullHeightPt = spreadHeightPt + markMargin * 2;

  const coverDoc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [fullWidthPt, fullHeightPt],
  });

  // Get cover page (first page)
  const coverPage = album.pages[0];
  if (coverPage) {
    // Render cover page at higher resolution for the spread
    const pageWidthPx = Math.round((baseDimensions.widthInches + bleedInches) * options.resolution);
    const pageHeightPx = Math.round((baseDimensions.heightInches + bleedInches * 2) * options.resolution);

    const placements = await getPageImagePlacements(
      coverPage,
      photos,
      pageWidthPx,
      pageHeightPx,
      options.colorSpace
    );

    const pageDataUrl = await renderPageToCanvas(
      placements,
      pageWidthPx,
      pageHeightPx,
      coverPage.background
    );

    // Position: front cover is on the right side of the spread
    const frontX = markMargin + (baseDimensions.widthInches + bleedInches) * 72 + spineWidthPt;
    const pageWidthPt = (baseDimensions.widthInches + bleedInches) * 72;
    const pageHeightPt = spreadHeightPt;

    coverDoc.addImage(
      pageDataUrl,
      'JPEG',
      frontX,
      markMargin,
      pageWidthPt,
      pageHeightPt
    );

    // Fill back cover with background color (or could be last page)
    coverDoc.setFillColor(coverPage.background);
    coverDoc.rect(
      markMargin,
      markMargin,
      pageWidthPt,
      pageHeightPt,
      'F'
    );

    // Fill spine with background color
    coverDoc.rect(
      markMargin + pageWidthPt,
      markMargin,
      spineWidthPt,
      pageHeightPt,
      'F'
    );
  }

  // Draw spine guide if requested
  if (options.cover.includeSpineGuide) {
    drawSpineGuide(
      coverDoc,
      spreadWidthPt + markMargin * 2,
      spreadHeightPt + markMargin * 2,
      spineWidth,
      markMargin + (options.bleedMm / 25.4) * 72
    );
  }

  // Draw print marks
  if (hasAnyPrintMark(options.printMarks)) {
    const coverDimensions = {
      widthPt: fullWidthPt,
      heightPt: fullHeightPt,
      widthInches: spreadWidthInches + (markMargin * 2) / 72,
      heightInches: spreadHeightInches + (markMargin * 2) / 72,
      widthMm: (spreadWidthInches + (markMargin * 2) / 72) * 25.4,
      heightMm: (spreadHeightInches + (markMargin * 2) / 72) * 25.4,
      widthPx: Math.round(fullWidthPt),
      heightPx: Math.round(fullHeightPt),
    };

    drawPrintMarks(
      coverDoc,
      coverDimensions,
      options.bleedMm,
      options.printMarks,
      1,
      1,
      `${album.name} - Cover`
    );
  }

  const coverPdfBlob = coverDoc.output('blob');
  const filename = `${sanitizeFilename(album.name)}_cover_${getDateString()}.pdf`;

  return {
    pdf: coverPdfBlob,
    filename,
    spineWidth,
  };
}

/**
 * Check if any print mark option is enabled
 */
function hasAnyPrintMark(marks: ExportOptions['printMarks']): boolean {
  return marks.cropMarks || marks.bleedArea || marks.registrationMarks || marks.pageInfo;
}

/**
 * Sanitize filename for safe file system use
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Get formatted date string for filename
 */
function getDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
