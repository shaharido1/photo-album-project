# Photo Album Builder - Feature Plan

## Overview

A web application for creating photo albums that can be exported for printing at various print shops.

---

## Development Process

### UX Review Gate

**Every feature must pass UX review before being marked complete.**

After implementing a feature:
1. Functional implementation complete
2. **UX Review** - Claude acts as UX reviewer, evaluating:
   - Intuitiveness (can a user figure it out without instructions?)
   - Consistency (matches design system and existing patterns?)
   - Feedback (does the UI respond to user actions appropriately?)
   - Error handling (are errors clear and recoverable?)
   - Accessibility (keyboard navigation, screen reader support, contrast)
   - Edge cases (empty states, loading states, error states)
3. Address UX feedback
4. Feature complete

### Design System

**Selected: Shadcn/ui + Tailwind CSS**

All UI components must:
- Use design system components (no custom one-off styling)
- Follow spacing/typography scales
- Use design tokens for colors
- Maintain consistent interaction patterns

---

## MVP Features (v1.0)

### 1. Photo Management

- [ ] Upload photos from device (drag-and-drop + file picker)
- [ ] Import from Google Photos (OAuth)
- [x] Photo library grid view with thumbnails
- [x] Select multiple photos for album
- [ ] Delete/remove photos from library

### 2. Album Setup

- [x] Create new album (name, size selection)
- [x] Album size presets:
  - 8x8" (20x20 cm)
  - 10x10" (25x25 cm)
  - 12x12" (30x30 cm)
  - A4 landscape
  - A4 portrait
- [x] Set page count (or auto-expand)

### 3. Page Layouts & Templates

- [x] Layout template library:
  - Single photo (full page)
  - Single photo (with margins)
  - 2 photos (horizontal split)
  - 2 photos (vertical split)
  - 3 photos (various arrangements)
  - 4 photos (grid)
  - 6 photos (grid)
  - Collage (freeform)
- [x] Apply template to page
- [x] Drag-and-drop photos into template slots

### 4. Photo Placement

- [x] Drag photo within frame to reposition
- [x] Zoom/scale photo within frame
- [x] Rotate photo (90° increments)
- [ ] Swap photos between slots

### 5. Auto-Arrange

- [ ] Select photos → auto-generate album pages
- [ ] Smart layout selection based on:
  - Photo orientation (landscape/portrait mix)
  - Photo count
- [ ] Date-based ordering option
- [ ] Shuffle/randomize option

### 6. Text & Captions

- [ ] Add text boxes to pages
- [ ] Title/cover page text
- [ ] Basic text styling (font, size, color, alignment)
- [ ] Photo captions (optional per-photo text)

### 7. Page Backgrounds

- [x] Solid color backgrounds
- [x] Preset background colors/themes
- [x] White, black, cream defaults

### 8. Preview

- [x] Page-by-page preview
- [ ] Album flip-through view
- [ ] Zoom in/out on pages

### 9. Export

- [ ] **PDF Export**
  - Print-ready PDF with bleed (3mm)
  - 300 DPI resolution
  - Configurable margins
  - Single PDF with all pages
- [ ] **Image Package Export (ZIP)**
  - Individual page images (JPEG/PNG)
  - 300 DPI resolution
  - Numbered file naming

### 10. Project Management

- [ ] Save project to Google Drive
- [ ] Load project from Google Drive
- [ ] Auto-save drafts
- [ ] Project list/dashboard

---

## Future Features (Backlog)

### Photo Editing

- [ ] Brightness/contrast adjustment
- [ ] Saturation adjustment
- [ ] Basic filters (B&W, sepia, vintage)
- [ ] Red-eye removal
- [ ] Auto-enhance

### Advanced Layouts

- [ ] Custom freeform layout editor
- [ ] Save custom layouts as templates
- [ ] Photo frame styles (borders, shadows, shapes)
- [ ] Overlapping photos

### Smart Features

- [ ] Face detection grouping
- [ ] AI-suggested layouts
- [ ] Duplicate photo detection
- [ ] Best photo selection (blur detection)

### Collaboration (Multi-User)

- [ ] Share album for viewing
- [ ] Share album for editing
- [ ] Comments on pages
- [ ] Real-time collaborative editing
- [ ] Permission levels (view/edit/admin)

### Print Shop Integrations

- [ ] Direct API integration with print services
- [ ] Price comparison across services
- [ ] One-click order placement
- [ ] Order tracking

### Additional Export Options

- [ ] CMYK color profile option
- [ ] Custom bleed/margin settings
- [ ] Cover as separate file
- [ ] Spreads view (2-page layout)
- [ ] IDML export (InDesign)

### Themes & Styling

- [ ] Pre-designed album themes
- [ ] Seasonal templates (wedding, baby, travel, etc.)
- [ ] Custom color palettes
- [ ] Stickers/decorations
- [ ] Pattern backgrounds

### Organization

- [ ] Photo albums/folders
- [ ] Tags and search
- [ ] Favorites
- [ ] Sort by date/name/size

### Import Sources

- [ ] iCloud Photos integration
- [ ] Dropbox integration
- [ ] Instagram integration
- [ ] Facebook Photos integration

### Misc

- [ ] Undo/redo history
- [ ] Keyboard shortcuts
- [ ] Mobile-responsive editing
- [ ] Offline mode (PWA)
- [ ] Album templates (pre-made starting points)

---

## Technical Decisions (TBD)

| Decision | Options | Chosen |
| -------- | ------- | ------ |
| Frontend Framework | React (existing), Vue, Svelte | React |
| Canvas Library | Fabric.js, Konva.js, Paper.js | Konva.js |
| PDF Generation | jsPDF, pdf-lib, Puppeteer | TBD |
| Image Processing | Browser canvas, Sharp (server) | TBD |
| Google APIs | Photos API, Drive API | Both |
| State Management | Redux (existing), Zustand | Redux Toolkit |

---

## Print Specifications Reference

### Standard Album Sizes

| Size | Dimensions (inches) | Dimensions (mm) | Pixels @300DPI |
| ---- | ------------------- | --------------- | -------------- |
| 8x8 | 8 x 8 | 203 x 203 | 2400 x 2400 |
| 10x10 | 10 x 10 | 254 x 254 | 3000 x 3000 |
| 12x12 | 12 x 12 | 305 x 305 | 3600 x 3600 |
| A4 Portrait | 8.27 x 11.69 | 210 x 297 | 2480 x 3508 |
| A4 Landscape | 11.69 x 8.27 | 297 x 210 | 3508 x 2480 |

### Print Requirements

- **Resolution**: 300 DPI minimum
- **Bleed**: 3mm (0.125") on all sides
- **Safe Zone**: Keep important content 5mm from edge
- **Color**: RGB for digital, CMYK for offset printing
- **Format**: PDF/X-1a or PDF/X-4 for professional printing

---

## Notes

- This document will be updated as features are discussed and prioritized
- Check off items as they are implemented
- Move items between MVP and Future as scope changes
