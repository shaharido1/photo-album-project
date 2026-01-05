/**
 * Tests for PDF Export Types and Calculations
 */

import {
  calculatePageDimensions,
  calculateSpineWidth,
  estimateFileSize,
  EXPORT_PRESETS,
  PAPER_TYPES,
  DEFAULT_EXPORT_OPTIONS,
  ALBUM_DIMENSIONS,
} from './types';

describe('Export Types', () => {
  describe('EXPORT_PRESETS', () => {
    it('should have three presets', () => {
      expect(EXPORT_PRESETS).toHaveLength(3);
    });

    it('should have professional, modern, and digital presets', () => {
      const presetIds = EXPORT_PRESETS.map((p) => p.id);
      expect(presetIds).toContain('professional');
      expect(presetIds).toContain('modern');
      expect(presetIds).toContain('digital');
    });

    it('should mark modern preset as recommended', () => {
      const modernPreset = EXPORT_PRESETS.find((p) => p.id === 'modern');
      expect(modernPreset?.recommended).toBe(true);
    });

    it('professional preset should use CMYK simulation', () => {
      const professionalPreset = EXPORT_PRESETS.find((p) => p.id === 'professional');
      expect(professionalPreset?.options.colorSpace).toBe('cmyk-simulation');
    });

    it('digital preset should have no bleed', () => {
      const digitalPreset = EXPORT_PRESETS.find((p) => p.id === 'digital');
      expect(digitalPreset?.options.bleedMm).toBe(0);
    });

    it('print presets should have 300 DPI resolution', () => {
      const printPresets = EXPORT_PRESETS.filter((p) => p.id !== 'digital');
      printPresets.forEach((preset) => {
        expect(preset.options.resolution).toBe(300);
      });
    });

    it('digital preset should have 150 DPI resolution', () => {
      const digitalPreset = EXPORT_PRESETS.find((p) => p.id === 'digital');
      expect(digitalPreset?.options.resolution).toBe(150);
    });
  });

  describe('PAPER_TYPES', () => {
    it('should have four paper types', () => {
      expect(PAPER_TYPES).toHaveLength(4);
    });

    it('should have standard, premium, photo, and thick paper types', () => {
      const paperIds = PAPER_TYPES.map((p) => p.id);
      expect(paperIds).toContain('standard');
      expect(paperIds).toContain('premium');
      expect(paperIds).toContain('photo');
      expect(paperIds).toContain('thick');
    });

    it('should have decreasing PPI as paper gets thicker', () => {
      const standard = PAPER_TYPES.find((p) => p.id === 'standard')!;
      const premium = PAPER_TYPES.find((p) => p.id === 'premium')!;
      const photo = PAPER_TYPES.find((p) => p.id === 'photo')!;
      const thick = PAPER_TYPES.find((p) => p.id === 'thick')!;

      expect(standard.ppi).toBeGreaterThan(premium.ppi);
      expect(premium.ppi).toBeGreaterThan(photo.ppi);
      expect(photo.ppi).toBeGreaterThan(thick.ppi);
    });

    it('should have increasing weight as paper gets thicker', () => {
      const standard = PAPER_TYPES.find((p) => p.id === 'standard')!;
      const premium = PAPER_TYPES.find((p) => p.id === 'premium')!;
      const photo = PAPER_TYPES.find((p) => p.id === 'photo')!;
      const thick = PAPER_TYPES.find((p) => p.id === 'thick')!;

      expect(standard.gramsPerSqm).toBeLessThan(premium.gramsPerSqm);
      expect(premium.gramsPerSqm).toBeLessThan(photo.gramsPerSqm);
      expect(photo.gramsPerSqm).toBeLessThan(thick.gramsPerSqm);
    });
  });

  describe('ALBUM_DIMENSIONS', () => {
    it('should have all album size keys', () => {
      const keys = Object.keys(ALBUM_DIMENSIONS);
      expect(keys).toContain('8x8');
      expect(keys).toContain('10x10');
      expect(keys).toContain('12x12');
      expect(keys).toContain('a4-landscape');
      expect(keys).toContain('a4-portrait');
    });

    it('should have square dimensions for square albums', () => {
      expect(ALBUM_DIMENSIONS['8x8'].widthInches).toBe(8);
      expect(ALBUM_DIMENSIONS['8x8'].heightInches).toBe(8);
      expect(ALBUM_DIMENSIONS['10x10'].widthInches).toBe(10);
      expect(ALBUM_DIMENSIONS['10x10'].heightInches).toBe(10);
      expect(ALBUM_DIMENSIONS['12x12'].widthInches).toBe(12);
      expect(ALBUM_DIMENSIONS['12x12'].heightInches).toBe(12);
    });

    it('should have correct A4 dimensions', () => {
      // A4 is 210mm x 297mm = 8.27" x 11.69"
      expect(ALBUM_DIMENSIONS['a4-landscape'].widthInches).toBeCloseTo(11.69, 1);
      expect(ALBUM_DIMENSIONS['a4-landscape'].heightInches).toBeCloseTo(8.27, 1);
      expect(ALBUM_DIMENSIONS['a4-portrait'].widthInches).toBeCloseTo(8.27, 1);
      expect(ALBUM_DIMENSIONS['a4-portrait'].heightInches).toBeCloseTo(11.69, 1);
    });
  });

  describe('DEFAULT_EXPORT_OPTIONS', () => {
    it('should default to modern preset', () => {
      expect(DEFAULT_EXPORT_OPTIONS.preset).toBe('modern');
    });

    it('should default to 300 DPI', () => {
      expect(DEFAULT_EXPORT_OPTIONS.resolution).toBe(300);
    });

    it('should default to 3mm bleed', () => {
      expect(DEFAULT_EXPORT_OPTIONS.bleedMm).toBe(3);
    });

    it('should default to RGB color space', () => {
      expect(DEFAULT_EXPORT_OPTIONS.colorSpace).toBe('rgb');
    });

    it('should have all print marks enabled by default', () => {
      expect(DEFAULT_EXPORT_OPTIONS.printMarks.cropMarks).toBe(true);
      expect(DEFAULT_EXPORT_OPTIONS.printMarks.bleedArea).toBe(true);
      expect(DEFAULT_EXPORT_OPTIONS.printMarks.registrationMarks).toBe(true);
      expect(DEFAULT_EXPORT_OPTIONS.printMarks.pageInfo).toBe(true);
    });

    it('should default to not exporting cover separately', () => {
      expect(DEFAULT_EXPORT_OPTIONS.cover.exportSeparately).toBe(false);
    });

    it('should default to photo paper for cover', () => {
      expect(DEFAULT_EXPORT_OPTIONS.cover.paperType).toBe('photo');
    });
  });
});

describe('calculatePageDimensions', () => {
  it('should calculate dimensions without bleed', () => {
    const dims = calculatePageDimensions('10x10', 0, 300);

    expect(dims.widthInches).toBe(10);
    expect(dims.heightInches).toBe(10);
    expect(dims.widthPx).toBe(3000); // 10 * 300
    expect(dims.heightPx).toBe(3000);
    expect(dims.widthPt).toBe(720); // 10 * 72
    expect(dims.heightPt).toBe(720);
  });

  it('should add bleed to dimensions', () => {
    const dims = calculatePageDimensions('10x10', 3, 300);
    const bleedInches = 3 / 25.4; // ~0.118 inches

    expect(dims.widthInches).toBeCloseTo(10 + bleedInches * 2, 2);
    expect(dims.heightInches).toBeCloseTo(10 + bleedInches * 2, 2);
  });

  it('should scale pixel dimensions with resolution', () => {
    const dims150 = calculatePageDimensions('8x8', 0, 150);
    const dims300 = calculatePageDimensions('8x8', 0, 300);
    const dims450 = calculatePageDimensions('8x8', 0, 450);

    expect(dims150.widthPx).toBe(1200); // 8 * 150
    expect(dims300.widthPx).toBe(2400); // 8 * 300
    expect(dims450.widthPx).toBe(3600); // 8 * 450
  });

  it('should calculate correct mm dimensions', () => {
    const dims = calculatePageDimensions('10x10', 0, 300);

    // 10 inches = 254mm
    expect(dims.widthMm).toBeCloseTo(254, 0);
    expect(dims.heightMm).toBeCloseTo(254, 0);
  });

  it('should handle A4 landscape dimensions', () => {
    const dims = calculatePageDimensions('a4-landscape', 0, 300);

    expect(dims.widthInches).toBeCloseTo(11.69, 1);
    expect(dims.heightInches).toBeCloseTo(8.27, 1);
  });

  it('should handle 6mm bleed', () => {
    const dims = calculatePageDimensions('12x12', 6, 300);
    const bleedInches = 6 / 25.4; // ~0.236 inches

    expect(dims.widthInches).toBeCloseTo(12 + bleedInches * 2, 2);
    expect(dims.heightInches).toBeCloseTo(12 + bleedInches * 2, 2);
  });
});

describe('calculateSpineWidth', () => {
  it('should return 0 for single page', () => {
    const spineWidth = calculateSpineWidth(1, 'photo');
    expect(spineWidth).toBe(0);
  });

  it('should return 0 for 2 pages (1 sheet)', () => {
    const spineWidth = calculateSpineWidth(2, 'photo');
    // 1 sheet / 200 PPI = 0.005 inches = 0.127mm, rounds to 0
    expect(spineWidth).toBeCloseTo(0, 0);
  });

  it('should calculate spine width for multiple pages', () => {
    // 100 pages = 50 sheets
    // With photo paper (200 PPI): 50/200 = 0.25 inches = 6.35mm
    const spineWidth = calculateSpineWidth(100, 'photo');
    expect(spineWidth).toBeCloseTo(6.5, 0.5);
  });

  it('should return thicker spine for thicker paper', () => {
    const standardSpine = calculateSpineWidth(100, 'standard');
    const photoSpine = calculateSpineWidth(100, 'photo');
    const thickSpine = calculateSpineWidth(100, 'thick');

    expect(standardSpine).toBeLessThan(photoSpine);
    expect(photoSpine).toBeLessThan(thickSpine);
  });

  it('should round to nearest 0.5mm', () => {
    // Test that results are rounded to 0.5mm increments
    const spineWidth = calculateSpineWidth(50, 'photo');
    const fractionalPart = (spineWidth * 2) % 1;
    expect(fractionalPart).toBe(0);
  });

  it('should handle standard paper spine calculation', () => {
    // 200 pages = 100 sheets
    // With standard paper (500 PPI): 100/500 = 0.2 inches = 5.08mm
    const spineWidth = calculateSpineWidth(200, 'standard');
    expect(spineWidth).toBeCloseTo(5, 0.5);
  });
});

describe('estimateFileSize', () => {
  it('should return size in MB', () => {
    const size = estimateFileSize(10, 300, '10x10');
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThan(0);
  });

  it('should increase with more pages', () => {
    const size10 = estimateFileSize(10, 300, '10x10');
    const size20 = estimateFileSize(20, 300, '10x10');

    expect(size20).toBeGreaterThan(size10);
    // Allow for some variance in file size estimation (within 5%)
    expect(size20).toBeGreaterThan(size10 * 1.9);
    expect(size20).toBeLessThan(size10 * 2.1);
  });

  it('should increase with higher resolution', () => {
    const size150 = estimateFileSize(10, 150, '10x10');
    const size300 = estimateFileSize(10, 300, '10x10');
    const size450 = estimateFileSize(10, 450, '10x10');

    expect(size300).toBeGreaterThan(size150);
    expect(size450).toBeGreaterThan(size300);
  });

  it('should increase with larger album size', () => {
    const size8x8 = estimateFileSize(10, 300, '8x8');
    const size10x10 = estimateFileSize(10, 300, '10x10');
    const size12x12 = estimateFileSize(10, 300, '12x12');

    expect(size10x10).toBeGreaterThan(size8x8);
    expect(size12x12).toBeGreaterThan(size10x10);
  });

  it('should return reasonable estimate for typical album', () => {
    // 20 page album at 300 DPI, 10x10"
    const size = estimateFileSize(20, 300, '10x10');

    // Should be somewhere between 10-100 MB for a typical photo album
    expect(size).toBeGreaterThan(10);
    expect(size).toBeLessThan(100);
  });
});
