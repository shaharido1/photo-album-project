/**
 * PDF Export Types and Presets
 * Professional print-ready PDF export with industry-standard settings
 */

import type { AlbumSizeKey } from '@/types';

// =============================================================================
// Export Preset Types
// =============================================================================

/**
 * Export preset identifier
 * - professional: PDF/X-1a compatible, CMYK, flattened (universal printer support)
 * - modern: PDF/X-4 style, RGB preserved, transparency OK (modern digital presses)
 * - digital: Web preview, lower DPI, no print marks
 */
export type ExportPresetId = 'professional' | 'modern' | 'digital';

/**
 * Color space for export
 * Note: jsPDF supports CMYK simulation but true CMYK requires post-processing
 */
export type ColorSpace = 'rgb' | 'cmyk-simulation';

/**
 * Resolution in DPI (dots per inch)
 */
export type Resolution = 150 | 300 | 450;

/**
 * Bleed amount in millimeters
 */
export type BleedMm = 0 | 3 | 6;

/**
 * Paper type for spine calculation (affects PPI - pages per inch)
 */
export type PaperType = 'standard' | 'premium' | 'photo' | 'thick';

/**
 * Paper type configuration for spine calculation
 */
export interface PaperTypeConfig {
  id: PaperType;
  name: string;
  description: string;
  ppi: number; // Pages per inch (how many pages fit in 1 inch of thickness)
  gramsPerSqm: number; // Paper weight in g/m²
}

/**
 * Available paper types with their PPI values
 */
export const PAPER_TYPES: PaperTypeConfig[] = [
  {
    id: 'standard',
    name: 'Standard Paper',
    description: '80gsm uncoated paper',
    ppi: 500, // ~0.002" per page
    gramsPerSqm: 80,
  },
  {
    id: 'premium',
    name: 'Premium Matte',
    description: '120gsm matte coated',
    ppi: 350, // ~0.003" per page
    gramsPerSqm: 120,
  },
  {
    id: 'photo',
    name: 'Photo Paper',
    description: '180gsm glossy photo paper',
    ppi: 200, // ~0.005" per page
    gramsPerSqm: 180,
  },
  {
    id: 'thick',
    name: 'Thick Card Stock',
    description: '250gsm card stock',
    ppi: 130, // ~0.008" per page
    gramsPerSqm: 250,
  },
];

// =============================================================================
// Export Options
// =============================================================================

/**
 * Print marks configuration
 */
export interface PrintMarksOptions {
  cropMarks: boolean;
  bleedArea: boolean;
  registrationMarks: boolean;
  pageInfo: boolean;
}

/**
 * Cover export options
 */
export interface CoverExportOptions {
  exportSeparately: boolean;
  paperType: PaperType;
  includeSpineGuide: boolean;
}

/**
 * Full export options
 */
export interface ExportOptions {
  preset: ExportPresetId;
  resolution: Resolution;
  bleedMm: BleedMm;
  colorSpace: ColorSpace;
  printMarks: PrintMarksOptions;
  cover: CoverExportOptions;
  includePageNumbers: boolean;
}

/**
 * Export preset configuration
 */
export interface ExportPreset {
  id: ExportPresetId;
  name: string;
  description: string;
  recommended?: boolean;
  options: Omit<ExportOptions, 'preset' | 'cover'>;
}

/**
 * Predefined export presets
 */
export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'professional',
    name: 'Professional Print (PDF/X-1a)',
    description: 'Universal compatibility with all print houses, including legacy equipment',
    options: {
      resolution: 300,
      bleedMm: 3,
      colorSpace: 'cmyk-simulation',
      printMarks: {
        cropMarks: true,
        bleedArea: true,
        registrationMarks: true,
        pageInfo: true,
      },
      includePageNumbers: false,
    },
  },
  {
    id: 'modern',
    name: 'Modern Print (PDF/X-4)',
    description: 'Best quality for modern digital and offset presses',
    recommended: true,
    options: {
      resolution: 300,
      bleedMm: 3,
      colorSpace: 'rgb',
      printMarks: {
        cropMarks: true,
        bleedArea: true,
        registrationMarks: true,
        pageInfo: true,
      },
      includePageNumbers: false,
    },
  },
  {
    id: 'digital',
    name: 'Digital Preview',
    description: 'Smaller file size for email, screen viewing, or home printing',
    options: {
      resolution: 150,
      bleedMm: 0,
      colorSpace: 'rgb',
      printMarks: {
        cropMarks: false,
        bleedArea: false,
        registrationMarks: false,
        pageInfo: false,
      },
      includePageNumbers: true,
    },
  },
];

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  preset: 'modern',
  resolution: 300,
  bleedMm: 3,
  colorSpace: 'rgb',
  printMarks: {
    cropMarks: true,
    bleedArea: true,
    registrationMarks: true,
    pageInfo: true,
  },
  cover: {
    exportSeparately: false,
    paperType: 'photo',
    includeSpineGuide: true,
  },
  includePageNumbers: false,
};

// =============================================================================
// Export State Types
// =============================================================================

/**
 * Export progress state
 */
export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'generating' | 'complete' | 'error';
  currentPage: number;
  totalPages: number;
  message: string;
  error?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  mainPdf: Blob;
  coverPdf?: Blob;
  filename: string;
  coverFilename?: string;
  spineWidth?: number; // in mm
}

// =============================================================================
// Dimension Calculations
// =============================================================================

/**
 * Page dimensions in various units
 */
export interface PageDimensions {
  widthInches: number;
  heightInches: number;
  widthMm: number;
  heightMm: number;
  widthPt: number; // PDF points (72 pt = 1 inch)
  heightPt: number;
  widthPx: number; // At specified DPI
  heightPx: number;
}

/**
 * Album size configurations with physical dimensions
 */
export const ALBUM_DIMENSIONS: Record<AlbumSizeKey, { widthInches: number; heightInches: number }> = {
  '8x8': { widthInches: 8, heightInches: 8 },
  '10x10': { widthInches: 10, heightInches: 10 },
  '12x12': { widthInches: 12, heightInches: 12 },
  'a4-landscape': { widthInches: 11.69, heightInches: 8.27 },
  'a4-portrait': { widthInches: 8.27, heightInches: 11.69 },
};

/**
 * Calculate page dimensions with bleed
 */
export function calculatePageDimensions(
  albumSize: AlbumSizeKey,
  bleedMm: BleedMm,
  resolution: Resolution
): PageDimensions {
  const base = ALBUM_DIMENSIONS[albumSize];
  const bleedInches = bleedMm / 25.4; // Convert mm to inches

  const widthInches = base.widthInches + bleedInches * 2;
  const heightInches = base.heightInches + bleedInches * 2;

  return {
    widthInches,
    heightInches,
    widthMm: widthInches * 25.4,
    heightMm: heightInches * 25.4,
    widthPt: widthInches * 72, // 72 points per inch
    heightPt: heightInches * 72,
    widthPx: Math.round(widthInches * resolution),
    heightPx: Math.round(heightInches * resolution),
  };
}

/**
 * Calculate spine width based on page count and paper type
 */
export function calculateSpineWidth(pageCount: number, paperType: PaperType): number {
  const paper = PAPER_TYPES.find((p) => p.id === paperType) || PAPER_TYPES[0];
  // Each sheet = 2 pages (front and back)
  const sheetCount = Math.ceil(pageCount / 2);
  const spineInches = sheetCount / paper.ppi;
  const spineMm = spineInches * 25.4;
  // Round to nearest 0.5mm for practical use
  return Math.round(spineMm * 2) / 2;
}

/**
 * Get estimated file size in MB (rough estimate)
 */
export function estimateFileSize(
  pageCount: number,
  resolution: Resolution,
  albumSize: AlbumSizeKey
): number {
  const dims = calculatePageDimensions(albumSize, 0, resolution);
  // Rough estimate: compressed JPEG in PDF ~0.3 bytes per pixel
  const bytesPerPage = dims.widthPx * dims.heightPx * 0.3;
  const totalBytes = bytesPerPage * pageCount;
  return Math.round((totalBytes / (1024 * 1024)) * 10) / 10; // Round to 1 decimal
}
