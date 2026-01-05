# PDF Export Feature

Professional print-ready PDF export for photo albums with industry-standard settings.

## Overview

The PDF export feature allows users to export their photo albums as high-quality PDFs suitable for professional printing houses or digital viewing. It supports multiple export presets, print marks, and cover generation with accurate spine width calculations.

## Architecture

```
client/src/
├── features/export/
│   ├── index.ts                    # Public exports
│   ├── types.ts                    # Types, constants, calculation functions
│   ├── types.test.ts               # Unit tests for types
│   └── services/
│       ├── pdfGenerator.ts         # Main PDF generation logic
│       ├── pdfGenerator.test.ts    # Unit tests for PDF generator
│       ├── imageProcessor.ts       # Image loading, filtering, cropping
│       └── printMarks.ts           # Crop marks, registration marks, page info
├── components/export/
│   ├── ExportDialog.tsx            # Export dialog UI component
│   └── ExportDialog.test.tsx       # Component tests
```

## Export Presets

Three presets are available to cover different use cases:

### Professional Print (PDF/X-1a)
- **Color Space**: CMYK simulation
- **Resolution**: 300 DPI
- **Bleed**: 3mm
- **Print Marks**: Full suite enabled
- **Use Case**: Universal compatibility with all print houses, including legacy equipment

### Modern Print (PDF/X-4) - Recommended
- **Color Space**: RGB
- **Resolution**: 300 DPI
- **Bleed**: 3mm
- **Print Marks**: Full suite enabled
- **Use Case**: Modern digital presses with ICC profile support

### Digital Preview
- **Color Space**: RGB
- **Resolution**: 150 DPI
- **Bleed**: None
- **Print Marks**: Disabled
- **Use Case**: Screen viewing, email sharing, web preview

## Technical Specifications

### Resolution Options
- **150 DPI**: Digital preview (smaller file size)
- **300 DPI**: Print standard (recommended)
- **450 DPI**: High-end printing

### Bleed Options
- **None**: For digital viewing
- **3mm**: Standard print bleed
- **6mm**: Extra bleed margin

### Print Marks
- **Crop Marks**: L-shaped marks at corners indicating trim edges
- **Bleed Area**: Dashed outline showing bleed boundary
- **Registration Marks**: Crosshair + circle for color alignment
- **Page Info**: Album name, page number, date in margins

### Album Sizes Supported
- 8" x 8" (20.3cm x 20.3cm)
- 10" x 10" (25.4cm x 25.4cm)
- 12" x 12" (30.5cm x 30.5cm)
- A4 Landscape (297mm x 210mm)
- A4 Portrait (210mm x 297mm)

## Cover Export

When "Export cover separately" is enabled:

1. **Cover PDF is generated as a spread**: Back cover + Spine + Front cover
2. **Spine width is calculated** based on:
   - Number of pages
   - Paper type (affects pages per inch)

### Paper Types for Spine Calculation

| Paper Type | PPI | Weight | Typical Use |
|------------|-----|--------|-------------|
| Standard | 500 | 80gsm | Economy albums |
| Premium | 350 | 120gsm | Standard quality |
| Photo | 200 | 200gsm | Photo books |
| Thick/Art | 150 | 300gsm | Premium lay-flat |

### Spine Width Formula
```
spineWidthMm = (pageCount / 2 / ppi) * 25.4
```
Results are rounded to nearest 0.5mm for practical use.

## API Reference

### Types

```typescript
type ExportPresetId = 'professional' | 'modern' | 'digital';
type ColorSpace = 'rgb' | 'cmyk-simulation';
type Resolution = 150 | 300 | 450;
type BleedMm = 0 | 3 | 6;
type PaperType = 'standard' | 'premium' | 'photo' | 'thick';
```

### Functions

#### `generatePDF(album, photos, options, onProgress?)`
Main export function that generates the PDF.

```typescript
async function generatePDF(
  album: Album,
  photos: Photo[],
  options: ExportOptions,
  onProgress?: ProgressCallback
): Promise<ExportResult>
```

#### `calculatePageDimensions(albumSize, bleedMm, resolution)`
Calculate page dimensions with bleed.

```typescript
function calculatePageDimensions(
  albumSize: AlbumSizeKey,
  bleedMm: BleedMm,
  resolution: Resolution
): PageDimensions
```

#### `calculateSpineWidth(pageCount, paperType)`
Calculate spine width in millimeters.

```typescript
function calculateSpineWidth(
  pageCount: number,
  paperType: PaperType
): number // mm, rounded to 0.5mm
```

#### `estimateFileSize(pageCount, resolution, albumSize)`
Estimate output file size.

```typescript
function estimateFileSize(
  pageCount: number,
  resolution: Resolution,
  albumSize: AlbumSizeKey
): number // MB
```

## Image Processing

### Filter Support
Images are processed through canvas with CSS-style filters:
- Brightness
- Contrast
- Saturation
- Hue rotation
- Blur
- Grayscale
- Sepia
- Invert
- Opacity

### CMYK Simulation
For Professional preset, a simple CMYK simulation is applied:
1. Reduces color saturation by 10%
2. Mimics smaller CMYK gamut

Note: True CMYK conversion requires ICC profiles and post-processing.

### Image Cropping
Images use "cover" behavior:
- Aspect ratio preserved
- Image scaled to fill slot
- Position offset applied for manual adjustment

## Testing

### Running Tests
```bash
# All export tests
npm run test:client -- --testPathPattern="export"

# Specific test files
npx jest src/features/export/types.test.ts
npx jest src/features/export/services/pdfGenerator.test.ts
npx jest src/components/export/ExportDialog.test.tsx
```

### Test Coverage
- **types.test.ts**: 38 tests covering presets, paper types, calculations
- **pdfGenerator.test.ts**: 10 tests covering PDF generation, progress callbacks
- **ExportDialog.test.tsx**: 29 tests covering UI interactions, preset switching

## Dependencies

- **jsPDF**: Client-side PDF generation
- No server-side processing required

## File Size Estimates

| Pages | Resolution | 10x10" Size |
|-------|------------|-------------|
| 10 | 150 DPI | ~6 MB |
| 10 | 300 DPI | ~26 MB |
| 20 | 300 DPI | ~52 MB |
| 50 | 300 DPI | ~128 MB |

## Future Improvements

1. **True CMYK Export**: Add server-side ICC profile conversion
2. **PDF/X Validation**: Verify output against PDF/X specifications
3. **Compression Options**: Allow quality/size tradeoff
4. **Background Export**: Generate in web worker for UI responsiveness
5. **Preview Mode**: Show thumbnail preview before export
