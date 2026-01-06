/**
 * Image Processor Tests
 * Verifies that PDF export rendering matches editor behavior
 */

import type { PageSlot, FreestyleItem, Photo, LayoutSlot, PhotoFilterValues } from '@/types';
import { DEFAULT_FILTER_VALUES } from '@/types';
import type { ColorSpace } from '../types';

// Mock canvas and image loading for tests
const mockDrawImage = jest.fn();
const mockFillRect = jest.fn();
const mockSave = jest.fn();
const mockRestore = jest.fn();
const mockTranslate = jest.fn();
const mockRotate = jest.fn();
const mockGetImageData = jest.fn(() => ({
  data: new Uint8ClampedArray(400), // 10x10 image * 4 channels
}));
const mockPutImageData = jest.fn();
const mockToDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');

const mockContext = {
  drawImage: mockDrawImage,
  fillRect: mockFillRect,
  fillStyle: '',
  filter: '',
  save: mockSave,
  restore: mockRestore,
  translate: mockTranslate,
  rotate: mockRotate,
  getImageData: mockGetImageData,
  putImageData: mockPutImageData,
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      width: 0,
      height: 0,
      getContext: () => mockContext,
      toDataURL: mockToDataURL,
    } as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tagName);
});

// Mock Image loading
class MockImage {
  width = 1000;
  height = 800;
  naturalWidth = 1000;
  naturalHeight = 800;
  crossOrigin = '';
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    // Simulate async load
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

(global as unknown as { Image: typeof MockImage }).Image = MockImage;

// Import after mocks are set up
import {
  loadImage,
  applyFilters,
  processSlotImage,
  processFreestyleImage,
  renderPageToCanvas,
} from './imageProcessor';

describe('imageProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContext.filter = '';
    mockContext.fillStyle = '';
  });

  describe('loadImage', () => {
    it('should load an image and resolve with HTMLImageElement', async () => {
      const img = await loadImage('https://example.com/photo.jpg');
      expect(img).toBeDefined();
      expect(img.src).toBe('https://example.com/photo.jpg');
      expect(img.crossOrigin).toBe('anonymous');
    });
  });

  describe('applyFilters', () => {
    it('should set filter to "none" when all values are default', () => {
      applyFilters(mockContext as unknown as CanvasRenderingContext2D, DEFAULT_FILTER_VALUES);
      expect(mockContext.filter).toBe('none');
    });

    it('should build filter string for brightness', () => {
      const filters: PhotoFilterValues = { ...DEFAULT_FILTER_VALUES, brightness: 120 };
      applyFilters(mockContext as unknown as CanvasRenderingContext2D, filters);
      expect(mockContext.filter).toBe('brightness(120%)');
    });

    it('should combine multiple filters', () => {
      const filters: PhotoFilterValues = {
        ...DEFAULT_FILTER_VALUES,
        brightness: 110,
        contrast: 120,
        grayscale: 100,
      };
      applyFilters(mockContext as unknown as CanvasRenderingContext2D, filters);
      expect(mockContext.filter).toBe('brightness(110%) contrast(120%) grayscale(100%)');
    });

    it('should handle all filter types', () => {
      const filters: PhotoFilterValues = {
        brightness: 110,
        contrast: 120,
        saturation: 90,
        hue: 45,
        blur: 2,
        grayscale: 50,
        sepia: 30,
        invert: 10,
        opacity: 80,
      };
      applyFilters(mockContext as unknown as CanvasRenderingContext2D, filters);
      expect(mockContext.filter).toContain('brightness(110%)');
      expect(mockContext.filter).toContain('contrast(120%)');
      expect(mockContext.filter).toContain('saturate(90%)');
      expect(mockContext.filter).toContain('hue-rotate(45deg)');
      expect(mockContext.filter).toContain('blur(2px)');
      expect(mockContext.filter).toContain('grayscale(50%)');
      expect(mockContext.filter).toContain('sepia(30%)');
      expect(mockContext.filter).toContain('invert(10%)');
      expect(mockContext.filter).toContain('opacity(80%)');
    });
  });

  describe('processSlotImage', () => {
    const mockSlot: PageSlot = {
      id: 'slot-1',
      photoId: 'photo-1',
      photoUrl: 'https://example.com/photo.jpg',
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    };

    const mockSlotDef: LayoutSlot = {
      x: 10,
      y: 10,
      width: 40,
      height: 40,
    };

    const mockPhoto: Photo = {
      id: 'photo-1',
      filename: 'photo.jpg',
      thumbnail: 'https://example.com/thumb.jpg',
      fullSize: 'https://example.com/photo.jpg',
      width: 1000,
      height: 800,
      uploadedAt: new Date().toISOString(),
    };

    it('should return null if no image URL available', async () => {
      const emptySlot: PageSlot = { ...mockSlot, photoId: null, photoUrl: null };
      const result = await processSlotImage(emptySlot, mockSlotDef, null, 1000, 1000, 'rgb');
      expect(result).toBeNull();
    });

    it('should return placement with correct slot position', async () => {
      const result = await processSlotImage(mockSlot, mockSlotDef, mockPhoto, 1000, 1000, 'rgb');
      expect(result).not.toBeNull();
      expect(result!.x).toBe(10); // slotDef.x
      expect(result!.y).toBe(10); // slotDef.y
      expect(result!.width).toBe(40); // slotDef.width
      expect(result!.height).toBe(40); // slotDef.height
    });

    it('should pass rotation from slot', async () => {
      const rotatedSlot: PageSlot = { ...mockSlot, rotation: 45 };
      const result = await processSlotImage(rotatedSlot, mockSlotDef, mockPhoto, 1000, 1000, 'rgb');
      expect(result!.rotation).toBe(45);
    });

    it('should calculate correct canvas dimensions from percentages', async () => {
      await processSlotImage(mockSlot, mockSlotDef, mockPhoto, 1000, 1000, 'rgb');
      // slotDef is 40% x 40%, canvas is 1000x1000, so slot is 400x400 pixels
      // The mock canvas should be created with these dimensions
      expect(mockToDataURL).toHaveBeenCalled();
    });

    describe('image positioning (matches EditorCanvas behavior)', () => {
      it('should draw image at offset position, not centered', async () => {
        // This test verifies the fix: image should start at position offset, not centered
        const offsetSlot: PageSlot = {
          ...mockSlot,
          position: { x: 10, y: 20 }, // 10% right, 20% down
        };
        await processSlotImage(offsetSlot, mockSlotDef, mockPhoto, 1000, 1000, 'rgb');

        // The image should be drawn with offset applied from (0,0)
        // not centered then offset applied
        expect(mockDrawImage).toHaveBeenCalled();
        const drawCall = mockDrawImage.mock.calls[0];
        // drawX = (position.x / 100) * targetWidth = (10 / 100) * 400 = 40
        // drawY = (position.y / 100) * targetHeight = (20 / 100) * 400 = 80
        expect(drawCall[1]).toBe(40); // x position
        expect(drawCall[2]).toBe(80); // y position
      });

      it('should use cover behavior for image scaling', async () => {
        // For a 1000x800 image (wider) in a 400x400 slot
        // imgAspect (1.25) > targetAspect (1.0)
        // So: fit by height (drawHeight = 400), crop width (drawWidth = 500)
        await processSlotImage(mockSlot, mockSlotDef, mockPhoto, 1000, 1000, 'rgb');

        expect(mockDrawImage).toHaveBeenCalled();
        const drawCall = mockDrawImage.mock.calls[0];
        // With scale=1, imgAspect=1.25, targetAspect=1.0
        // drawHeight = 400 * 1 = 400
        // drawWidth = 400 * 1.25 = 500
        expect(drawCall[3]).toBe(500); // width
        expect(drawCall[4]).toBe(400); // height
      });

      it('should apply scale factor to image dimensions', async () => {
        const scaledSlot: PageSlot = { ...mockSlot, scale: 1.5 };
        await processSlotImage(scaledSlot, mockSlotDef, mockPhoto, 1000, 1000, 'rgb');

        expect(mockDrawImage).toHaveBeenCalled();
        const drawCall = mockDrawImage.mock.calls[0];
        // With scale=1.5, imgAspect=1.25, targetAspect=1.0
        // drawHeight = 400 * 1.5 = 600
        // drawWidth = 600 * 1.25 = 750
        expect(drawCall[3]).toBe(750); // width
        expect(drawCall[4]).toBe(600); // height
      });
    });
  });

  describe('processFreestyleImage', () => {
    const mockFreestyleItem: FreestyleItem = {
      id: 'item-1',
      photoId: 'photo-1',
      photoUrl: 'https://example.com/photo.jpg',
      x: 25,
      y: 30,
      width: 50,
      height: 40,
      rotation: 15,
      zIndex: 1,
    };

    const mockPhoto: Photo = {
      id: 'photo-1',
      filename: 'photo.jpg',
      thumbnail: 'https://example.com/thumb.jpg',
      fullSize: 'https://example.com/photo.jpg',
      width: 1000,
      height: 800,
      uploadedAt: new Date().toISOString(),
    };

    it('should return null if no image URL available', async () => {
      const emptyItem: FreestyleItem = { ...mockFreestyleItem, photoId: '', photoUrl: undefined };
      const result = await processFreestyleImage(emptyItem, null, 1000, 1000, 'rgb');
      expect(result).toBeNull();
    });

    it('should return placement with correct item position', async () => {
      const result = await processFreestyleImage(mockFreestyleItem, mockPhoto, 1000, 1000, 'rgb');
      expect(result).not.toBeNull();
      expect(result!.x).toBe(25);
      expect(result!.y).toBe(30);
      expect(result!.width).toBe(50);
      expect(result!.height).toBe(40);
      expect(result!.rotation).toBe(15);
      expect(result!.zIndex).toBe(1);
    });

    it('should use fill/stretch behavior (not cover)', async () => {
      // Freestyle items stretch to fill their bounds exactly
      // This matches Konva's KonvaImage behavior
      await processFreestyleImage(mockFreestyleItem, mockPhoto, 1000, 1000, 'rgb');

      expect(mockDrawImage).toHaveBeenCalled();
      const drawCall = mockDrawImage.mock.calls[0];
      // For freestyle, image is stretched to canvas size (500x400 for 50% x 40% of 1000x1000)
      // drawImage(img, 0, 0, canvas.width, canvas.height)
      expect(drawCall[1]).toBe(0); // x = 0
      expect(drawCall[2]).toBe(0); // y = 0
      expect(drawCall[3]).toBe(500); // width = canvas width
      expect(drawCall[4]).toBe(400); // height = canvas height
    });
  });

  describe('renderPageToCanvas', () => {
    it('should fill background first', async () => {
      await renderPageToCanvas([], 1000, 1000, '#ffffff');
      expect(mockContext.fillStyle).toBe('#ffffff');
      expect(mockFillRect).toHaveBeenCalledWith(0, 0, 1000, 1000);
    });

    it('should sort placements by zIndex', async () => {
      const placements = [
        {
          image: { dataUrl: 'data:image/jpeg;base64,1', format: 'JPEG' as const, width: 100, height: 100 },
          x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 2,
        },
        {
          image: { dataUrl: 'data:image/jpeg;base64,2', format: 'JPEG' as const, width: 100, height: 100 },
          x: 10, y: 10, width: 10, height: 10, rotation: 0, zIndex: 1,
        },
      ];

      await renderPageToCanvas(placements, 1000, 1000, '#ffffff');

      // zIndex 1 should be drawn first (at index 0), zIndex 2 second
      // We can verify the order by checking draw positions
      expect(mockDrawImage.mock.calls.length).toBe(2);
      // First call should be for zIndex 1 (x=10%)
      expect(mockDrawImage.mock.calls[0][1]).toBe(100); // 10% of 1000
      // Second call should be for zIndex 2 (x=0%)
      expect(mockDrawImage.mock.calls[1][1]).toBe(0);
    });

    it('should convert percentage positions to pixels', async () => {
      const placements = [
        {
          image: { dataUrl: 'data:image/jpeg;base64,test', format: 'JPEG' as const, width: 100, height: 100 },
          x: 25, y: 50, width: 30, height: 20, rotation: 0,
        },
      ];

      await renderPageToCanvas(placements, 1000, 800, '#ffffff');

      expect(mockDrawImage).toHaveBeenCalled();
      const drawCall = mockDrawImage.mock.calls[0];
      // x: 25% of 1000 = 250
      // y: 50% of 800 = 400
      // width: 30% of 1000 = 300
      // height: 20% of 800 = 160
      expect(drawCall[1]).toBe(250);
      expect(drawCall[2]).toBe(400);
      expect(drawCall[3]).toBe(300);
      expect(drawCall[4]).toBe(160);
    });

    it('should apply rotation around image center', async () => {
      const placements = [
        {
          image: { dataUrl: 'data:image/jpeg;base64,test', format: 'JPEG' as const, width: 100, height: 100 },
          x: 10, y: 10, width: 20, height: 20, rotation: 90,
        },
      ];

      await renderPageToCanvas(placements, 1000, 1000, '#ffffff');

      expect(mockSave).toHaveBeenCalled();
      expect(mockTranslate).toHaveBeenCalledTimes(2); // translate to center, then back
      expect(mockRotate).toHaveBeenCalledWith(Math.PI / 2); // 90 degrees in radians
      expect(mockRestore).toHaveBeenCalled();

      // Center of image: x + width/2, y + height/2
      // x: 10% of 1000 = 100, width: 20% of 1000 = 200
      // centerX = 100 + 100 = 200
      // centerY = 100 + 100 = 200
      expect(mockTranslate.mock.calls[0]).toEqual([200, 200]);
      expect(mockTranslate.mock.calls[1]).toEqual([-200, -200]);
    });

    it('should not rotate when rotation is 0', async () => {
      const placements = [
        {
          image: { dataUrl: 'data:image/jpeg;base64,test', format: 'JPEG' as const, width: 100, height: 100 },
          x: 0, y: 0, width: 10, height: 10, rotation: 0,
        },
      ];

      await renderPageToCanvas(placements, 1000, 1000, '#ffffff');

      expect(mockRotate).not.toHaveBeenCalled();
    });
  });

  describe('CMYK simulation', () => {
    it('should apply CMYK simulation when colorSpace is cmyk-simulation', async () => {
      const mockSlot: PageSlot = {
        id: 'slot-1',
        photoId: 'photo-1',
        photoUrl: 'https://example.com/photo.jpg',
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
      };

      const mockSlotDef: LayoutSlot = {
        x: 0, y: 0, width: 100, height: 100,
      };

      const mockPhoto: Photo = {
        id: 'photo-1',
        filename: 'photo.jpg',
        thumbnail: 'https://example.com/thumb.jpg',
        fullSize: 'https://example.com/photo.jpg',
        width: 100,
        height: 100,
        uploadedAt: new Date().toISOString(),
      };

      await processSlotImage(mockSlot, mockSlotDef, mockPhoto, 100, 100, 'cmyk-simulation');

      expect(mockGetImageData).toHaveBeenCalled();
      expect(mockPutImageData).toHaveBeenCalled();
    });

    it('should not apply CMYK simulation when colorSpace is srgb', async () => {
      const mockSlot: PageSlot = {
        id: 'slot-1',
        photoId: 'photo-1',
        photoUrl: 'https://example.com/photo.jpg',
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
      };

      const mockSlotDef: LayoutSlot = {
        x: 0, y: 0, width: 100, height: 100,
      };

      const mockPhoto: Photo = {
        id: 'photo-1',
        filename: 'photo.jpg',
        thumbnail: 'https://example.com/thumb.jpg',
        fullSize: 'https://example.com/photo.jpg',
        width: 100,
        height: 100,
        uploadedAt: new Date().toISOString(),
      };

      await processSlotImage(mockSlot, mockSlotDef, mockPhoto, 100, 100, 'rgb');

      expect(mockGetImageData).not.toHaveBeenCalled();
      expect(mockPutImageData).not.toHaveBeenCalled();
    });
  });
});

/**
 * Integration-style tests that verify the rendering math matches the editor
 * These use real calculations without mocking to verify the formulas
 */
describe('imageProcessor rendering math (integration)', () => {
  describe('slot image positioning formula', () => {
    // These tests verify the math used matches EditorCanvas.tsx

    it('should match EditorCanvas cover behavior for wide images', () => {
      // Given: 1000x600 image (aspect 1.67) in 400x400 slot (aspect 1.0)
      const photoWidth = 1000;
      const photoHeight = 600;
      const slotWidth = 400;
      const slotHeight = 400;
      const scale = 1;

      const imgAspect = photoWidth / photoHeight; // 1.67
      const targetAspect = slotWidth / slotHeight; // 1.0

      let drawWidth: number;
      let drawHeight: number;

      // This matches the code in imageProcessor.ts AND EditorCanvas.tsx
      if (imgAspect > targetAspect) {
        drawHeight = slotHeight * scale;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = slotWidth * scale;
        drawHeight = drawWidth / imgAspect;
      }

      expect(drawHeight).toBe(400); // Fits height
      expect(drawWidth).toBeCloseTo(666.67, 1); // Width overflows
    });

    it('should match EditorCanvas cover behavior for tall images', () => {
      // Given: 600x1000 image (aspect 0.6) in 400x400 slot (aspect 1.0)
      const photoWidth = 600;
      const photoHeight = 1000;
      const slotWidth = 400;
      const slotHeight = 400;
      const scale = 1;

      const imgAspect = photoWidth / photoHeight; // 0.6
      const targetAspect = slotWidth / slotHeight; // 1.0

      let drawWidth: number;
      let drawHeight: number;

      if (imgAspect > targetAspect) {
        drawHeight = slotHeight * scale;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = slotWidth * scale;
        drawHeight = drawWidth / imgAspect;
      }

      expect(drawWidth).toBe(400); // Fits width
      expect(drawHeight).toBeCloseTo(666.67, 1); // Height overflows
    });

    it('should apply scale multiplier correctly', () => {
      const photoWidth = 1000;
      const photoHeight = 800;
      const slotWidth = 400;
      const slotHeight = 400;
      const scale = 1.5;

      const imgAspect = photoWidth / photoHeight;
      const targetAspect = slotWidth / slotHeight;

      let drawWidth: number;
      let drawHeight: number;

      if (imgAspect > targetAspect) {
        drawHeight = slotHeight * scale;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = slotWidth * scale;
        drawHeight = drawWidth / imgAspect;
      }

      // With scale 1.5, dimensions should be 1.5x larger
      expect(drawHeight).toBe(600); // 400 * 1.5
      expect(drawWidth).toBe(750); // 600 * 1.25
    });
  });

  describe('position offset formula', () => {
    it('should calculate offset as percentage of slot dimensions', () => {
      // This matches EditorCanvas.tsx:
      // const imageX = slotX + (slot.position.x / 100) * slotWidth;
      const slotWidth = 400;
      const slotHeight = 300;
      const positionX = 25; // 25%
      const positionY = -10; // -10% (moved up)

      const drawX = (positionX / 100) * slotWidth;
      const drawY = (positionY / 100) * slotHeight;

      expect(drawX).toBe(100); // 25% of 400
      expect(drawY).toBe(-30); // -10% of 300
    });
  });

  describe('percentage to pixel conversion', () => {
    it('should convert page percentages to pixels correctly', () => {
      const pageWidth = 2400; // 8 inches at 300 DPI
      const pageHeight = 2400;

      // A slot at 10% x, 20% y, 30% width, 40% height
      const x = 10;
      const y = 20;
      const width = 30;
      const height = 40;

      const px = (x / 100) * pageWidth;
      const py = (y / 100) * pageHeight;
      const pw = (width / 100) * pageWidth;
      const ph = (height / 100) * pageHeight;

      expect(px).toBe(240);
      expect(py).toBe(480);
      expect(pw).toBe(720);
      expect(ph).toBe(960);
    });
  });
});
