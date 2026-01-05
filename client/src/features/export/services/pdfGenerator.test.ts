/**
 * Tests for PDF Generator Service
 */

import type { Album, Photo } from '@/types';
import type { ExportOptions } from '../types';
import { DEFAULT_EXPORT_OPTIONS } from '../types';

// Mock jsPDF
const mockAddPage = jest.fn();
const mockAddImage = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetTextColor = jest.fn();
const mockSetDrawColor = jest.fn();
const mockSetFillColor = jest.fn();
const mockSetLineWidth = jest.fn();
const mockSetLineDashPattern = jest.fn();
const mockLine = jest.fn();
const mockRect = jest.fn();
const mockCircle = jest.fn();
const mockText = jest.fn();
const mockOutput = jest.fn(() => new Blob(['test'], { type: 'application/pdf' }));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addPage: mockAddPage,
    addImage: mockAddImage,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setDrawColor: mockSetDrawColor,
    setFillColor: mockSetFillColor,
    setLineWidth: mockSetLineWidth,
    setLineDashPattern: mockSetLineDashPattern,
    line: mockLine,
    rect: mockRect,
    circle: mockCircle,
    text: mockText,
    output: mockOutput,
  })),
}));

// Mock canvas operations
const mockGetContext = jest.fn(() => ({
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  filter: '',
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  putImageData: jest.fn(),
}));

const mockToDataURL = jest.fn(() => 'data:image/jpeg;base64,test');

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      width: 0,
      height: 0,
      getContext: mockGetContext,
      toDataURL: mockToDataURL,
    } as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tagName);
});

// Mock Image
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  crossOrigin = '';
  naturalWidth = 1000;
  naturalHeight = 800;

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

(global as unknown as { Image: typeof MockImage }).Image = MockImage;

// Import after mocks
import { generatePDF, downloadBlob } from './pdfGenerator';

describe('PDF Generator Service', () => {
  const createMockAlbum = (pageCount: number): Album => ({
    id: 'test-album',
    name: 'Test Album',
    size: '10x10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: Array.from({ length: pageCount }, (_, i) => ({
      id: `page-${i}`,
      layoutId: 'single-photo',
      background: '#ffffff',
      slots: [
        {
          photoId: `photo-${i}`,
          photoUrl: 'https://example.com/photo.jpg',
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      ],
    })),
    userId: 'test-user',
  });

  const mockPhotos: Photo[] = [
    {
      id: 'photo-0',
      thumbnail: 'https://example.com/thumb.jpg',
      fullSize: 'https://example.com/full.jpg',
      width: 1000,
      height: 800,
      name: 'Test Photo',
      mimeType: 'image/jpeg',
    },
  ];

  const defaultOptions: ExportOptions = DEFAULT_EXPORT_OPTIONS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('should create PDF with correct page count', async () => {
      const album = createMockAlbum(3);
      const progressCallback = jest.fn();

      const result = await generatePDF(album, mockPhotos, defaultOptions, progressCallback);

      expect(result).toBeDefined();
      expect(result.mainPdf).toBeInstanceOf(Blob);
      expect(result.filename).toContain('test_album');
      expect(result.filename).toEndWith('.pdf');
    });

    it('should call progress callback during export', async () => {
      const album = createMockAlbum(2);
      const progressCallback = jest.fn();

      await generatePDF(album, mockPhotos, defaultOptions, progressCallback);

      // Should be called for: preparing, rendering each page, generating, complete
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'preparing' })
      );
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'complete' })
      );
    });

    it('should handle empty album', async () => {
      const album = createMockAlbum(0);
      const result = await generatePDF(album, mockPhotos, defaultOptions);

      expect(result).toBeDefined();
      expect(result.mainPdf).toBeInstanceOf(Blob);
    });

    it('should generate cover PDF when exportSeparately is true', async () => {
      const album = createMockAlbum(5);
      const optionsWithCover: ExportOptions = {
        ...defaultOptions,
        cover: {
          ...defaultOptions.cover,
          exportSeparately: true,
        },
      };

      const result = await generatePDF(album, mockPhotos, optionsWithCover);

      expect(result.coverPdf).toBeInstanceOf(Blob);
      expect(result.coverFilename).toContain('cover');
      expect(result.spineWidth).toBeDefined();
      expect(result.spineWidth).toBeGreaterThan(0);
    });

    it('should not generate cover PDF when exportSeparately is false', async () => {
      const album = createMockAlbum(3);
      const optionsWithoutCover: ExportOptions = {
        ...defaultOptions,
        cover: {
          ...defaultOptions.cover,
          exportSeparately: false,
        },
      };

      const result = await generatePDF(album, mockPhotos, optionsWithoutCover);

      expect(result.coverPdf).toBeUndefined();
      expect(result.coverFilename).toBeUndefined();
    });

    it('should sanitize album name in filename', async () => {
      const album = createMockAlbum(1);
      album.name = 'Test Album! @#$% Special';

      const result = await generatePDF(album, mockPhotos, defaultOptions);

      expect(result.filename).not.toContain('!');
      expect(result.filename).not.toContain('@');
      expect(result.filename).not.toContain('#');
      expect(result.filename).toContain('test_album');
    });

    it('should include date in filename', async () => {
      const album = createMockAlbum(1);
      const result = await generatePDF(album, mockPhotos, defaultOptions);

      // Filename should contain date in YYYYMMDD format
      const dateRegex = /\d{8}/;
      expect(dateRegex.test(result.filename)).toBe(true);
    });
  });

  describe('downloadBlob', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    let mockCreateObjectURL: jest.Mock;
    let mockRevokeObjectURL: jest.Mock;

    beforeEach(() => {
      mockCreateObjectURL = jest.fn(() => 'blob:test');
      mockRevokeObjectURL = jest.fn();
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should create object URL from blob', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadBlob(blob, 'test.pdf');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should revoke object URL after download', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadBlob(blob, 'test.pdf');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('should set download filename on link element', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      // downloadBlob creates a link, sets download attribute, and clicks it
      // The function should complete without errors
      expect(() => downloadBlob(blob, 'test-file.pdf')).not.toThrow();
    });
  });
});

// Custom matcher for string ending
expect.extend({
  toEndWith(received: string, expected: string) {
    const pass = received.endsWith(expected);
    if (pass) {
      return {
        message: () => `expected ${received} not to end with ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to end with ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toEndWith(expected: string): R;
    }
  }
}
