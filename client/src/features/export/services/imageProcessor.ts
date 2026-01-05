/**
 * Image Processor for PDF Export
 * Handles loading, filtering, cropping, and preparing images for PDF embedding
 */

import type { PhotoFilterValues, PageSlot, FreestyleItem, Photo, LayoutSlot } from '@/types';
import { DEFAULT_FILTER_VALUES } from '@/types';
import type { ColorSpace } from '../types';

/**
 * Processed image ready for PDF embedding
 */
export interface ProcessedImage {
  dataUrl: string;
  format: 'JPEG' | 'PNG';
  width: number;
  height: number;
}

/**
 * Image placement info for PDF rendering
 */
export interface ImagePlacement {
  image: ProcessedImage;
  x: number; // Position in percentage (0-100)
  y: number;
  width: number; // Size in percentage
  height: number;
  rotation: number; // Degrees
  zIndex?: number;
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Required for canvas operations
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Apply CSS-like filters to an image using canvas
 */
export function applyFilters(
  ctx: CanvasRenderingContext2D,
  filters: PhotoFilterValues
): void {
  const filterString = buildCanvasFilterString(filters);
  ctx.filter = filterString;
}

/**
 * Build canvas filter string from filter values
 */
function buildCanvasFilterString(filters: PhotoFilterValues): string {
  const parts: string[] = [];

  if (filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`);
  }
  if (filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`);
  }
  if (filters.saturation !== 100) {
    parts.push(`saturate(${filters.saturation}%)`);
  }
  if (filters.hue !== 0) {
    parts.push(`hue-rotate(${filters.hue}deg)`);
  }
  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }
  if (filters.invert > 0) {
    parts.push(`invert(${filters.invert}%)`);
  }
  if (filters.opacity !== 100) {
    parts.push(`opacity(${filters.opacity}%)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Process a slot image: load, apply filters, crop to fit slot
 */
export async function processSlotImage(
  slot: PageSlot,
  slotDef: LayoutSlot,
  photo: Photo | null,
  canvasWidth: number,
  canvasHeight: number,
  colorSpace: ColorSpace
): Promise<ImagePlacement | null> {
  const imageUrl = photo?.fullSize || photo?.thumbnail || slot.photoUrl;
  if (!imageUrl) return null;

  try {
    const img = await loadImage(imageUrl);

    // Calculate slot dimensions in pixels
    const slotWidth = (slotDef.width / 100) * canvasWidth;
    const slotHeight = (slotDef.height / 100) * canvasHeight;

    // Process the image with filters and cropping
    const processedImage = await renderImageToCanvas(
      img,
      slot.filters || DEFAULT_FILTER_VALUES,
      slotWidth,
      slotHeight,
      slot.position,
      slot.scale,
      photo?.width || img.naturalWidth,
      photo?.height || img.naturalHeight,
      colorSpace
    );

    return {
      image: processedImage,
      x: slotDef.x,
      y: slotDef.y,
      width: slotDef.width,
      height: slotDef.height,
      rotation: slot.rotation,
    };
  } catch {
    // Image failed to load - skip this slot
    return null;
  }
}

/**
 * Process a freestyle item image
 * For freestyle items, we use object-fit: fill behavior (stretch to fit)
 * to match how Konva renders images in the editor
 */
export async function processFreestyleImage(
  item: FreestyleItem,
  photo: Photo | null,
  canvasWidth: number,
  canvasHeight: number,
  colorSpace: ColorSpace
): Promise<ImagePlacement | null> {
  const imageUrl = photo?.fullSize || photo?.thumbnail || item.photoUrl;
  if (!imageUrl) return null;

  try {
    const img = await loadImage(imageUrl);

    // Calculate item dimensions in pixels
    const itemWidth = (item.width / 100) * canvasWidth;
    const itemHeight = (item.height / 100) * canvasHeight;

    // For freestyle items, we use "fill" behavior (stretch to fit bounds)
    // This matches how Konva KonvaImage renders - it stretches the image
    // to fill the exact width/height specified
    const processedImage = await renderFreestyleImageToCanvas(
      img,
      item.filters || DEFAULT_FILTER_VALUES,
      itemWidth,
      itemHeight,
      colorSpace
    );

    return {
      image: processedImage,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      rotation: item.rotation,
      zIndex: item.zIndex,
    };
  } catch {
    // Image failed to load - skip this item
    return null;
  }
}

/**
 * Render a freestyle image to canvas with filters (fill/stretch behavior)
 * This matches Konva's default image rendering which stretches to fit bounds
 */
async function renderFreestyleImageToCanvas(
  img: HTMLImageElement,
  filters: PhotoFilterValues,
  targetWidth: number,
  targetHeight: number,
  colorSpace: ColorSpace
): Promise<ProcessedImage> {
  // Create canvas at target size
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(targetWidth);
  canvas.height = Math.round(targetHeight);
  const ctx = canvas.getContext('2d')!;

  // Apply filters
  applyFilters(ctx, filters);

  // Draw the image stretched to fill the entire canvas (object-fit: fill)
  // This matches how Konva KonvaImage renders with explicit width/height
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Apply CMYK simulation if needed
  if (colorSpace === 'cmyk-simulation') {
    applyCMYKSimulation(ctx, canvas.width, canvas.height);
  }

  // Export as JPEG for smaller file size
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl,
    format: 'JPEG',
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Render an image to canvas with filters and proper cropping
 * This matches the editor's behavior: image starts at top-left of slot,
 * with the offset applied, and overflowing content is clipped
 */
async function renderImageToCanvas(
  img: HTMLImageElement,
  filters: PhotoFilterValues,
  targetWidth: number,
  targetHeight: number,
  position: { x: number; y: number },
  scale: number,
  photoWidth: number,
  photoHeight: number,
  colorSpace: ColorSpace
): Promise<ProcessedImage> {
  // Create canvas at target size
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(targetWidth);
  canvas.height = Math.round(targetHeight);
  const ctx = canvas.getContext('2d')!;

  // Apply filters
  applyFilters(ctx, filters);

  // Calculate image dimensions to fit (cover behavior)
  // This matches EditorCanvas.tsx lines 182-196
  const imgAspect = photoWidth / photoHeight;
  const targetAspect = targetWidth / targetHeight;

  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > targetAspect) {
    // Image is wider - fit by height, crop width
    drawHeight = targetHeight * scale;
    drawWidth = drawHeight * imgAspect;
  } else {
    // Image is taller - fit by width, crop height
    drawWidth = targetWidth * scale;
    drawHeight = drawWidth / imgAspect;
  }

  // Apply position offset (percentage of target dimensions)
  // This matches EditorCanvas.tsx lines 179-180:
  // const imageX = slotX + (slot.position.x / 100) * slotWidth;
  // Since we're drawing relative to the canvas (which represents the slot),
  // we just use the offset directly from 0,0
  const drawX = (position.x / 100) * targetWidth;
  const drawY = (position.y / 100) * targetHeight;

  // Draw the image starting from offset position (not centered)
  // The image will overflow and get clipped by the canvas bounds
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  // Apply CMYK simulation if needed (simple desaturation + warm shift)
  if (colorSpace === 'cmyk-simulation') {
    applyCMYKSimulation(ctx, canvas.width, canvas.height);
  }

  // Export as JPEG for smaller file size
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl,
    format: 'JPEG',
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Simple CMYK simulation by adjusting RGB values
 * This mimics how colors might look when converted to CMYK
 */
function applyCMYKSimulation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Get RGB values
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Simulate CMYK by reducing color gamut
    // This is a simplified approximation
    // Real CMYK conversion requires ICC profiles

    // Reduce saturation slightly (CMYK has smaller gamut)
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const saturationFactor = 0.9;
    r = Math.round(gray + (r - gray) * saturationFactor);
    g = Math.round(gray + (g - gray) * saturationFactor);
    b = Math.round(gray + (b - gray) * saturationFactor);

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Render a complete page to canvas (for PDF embedding)
 */
export async function renderPageToCanvas(
  placements: ImagePlacement[],
  pageWidth: number,
  pageHeight: number,
  backgroundColor: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  // Sort by zIndex if present
  const sortedPlacements = [...placements].sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  // Draw each image
  for (const placement of sortedPlacements) {
    const { image, x, y, width, height, rotation } = placement;

    // Convert percentages to pixels
    const px = (x / 100) * pageWidth;
    const py = (y / 100) * pageHeight;
    const pw = (width / 100) * pageWidth;
    const ph = (height / 100) * pageHeight;

    // Load the processed image
    const img = await loadImage(image.dataUrl);

    // Save context state
    ctx.save();

    // Apply rotation around center of image
    if (rotation !== 0) {
      const centerX = px + pw / 2;
      const centerY = py + ph / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw the image
    ctx.drawImage(img, px, py, pw, ph);

    // Restore context state
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
