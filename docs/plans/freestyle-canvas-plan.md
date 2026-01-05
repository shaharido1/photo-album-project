# Freestyle Canvas Feature - Implementation Plan

## Overview

A new page layout type that provides a freeform canvas where users can:
- Place multiple images anywhere on the canvas
- Rotate images freely (not just 90° increments)
- Resize images independently
- Layer images (z-index control - bring forward/send backward)
- Overlap images for creative compositions

## Current Architecture Context

### Existing System
- **Layout Templates**: 8 predefined layouts with fixed slots (percentage-based positioning)
- **PageSlot Structure**: Already has `position`, `scale`, `rotation`, but rotation is unused in UI
- **Konva.js Canvas**: Already supports transformations via `Transformer`
- **EditorCanvas**: Currently constrains photos to slot boundaries with clipping

### Key Insight
The current slot system clips images to predefined rectangles. Freestyle needs **unconstrained positioning** with **z-ordering**.

---

## Design Decisions

### Option A: New Layout Type (Recommended)
Add a special "freestyle" layout that:
- Has no predefined slots
- Items are created dynamically when photos are dropped
- Each item stores full transform data (x, y, width, height, rotation, zIndex)

**Pros**: Clean separation, existing layouts unchanged, clear UX distinction
**Cons**: Some code duplication

### Option B: Extend Existing Slots
Add "freestyle mode" flag to any page, slots become freely positionable.

**Pros**: Reuses existing slot infrastructure
**Cons**: Complicates existing layout logic, mixing paradigms

### Recommendation: **Option A** - Cleaner architecture, better UX

---

## Data Model Changes

### New Types (`client/src/types/album.ts` or shared types)

```typescript
// Freestyle canvas item (replaces PageSlot concept for freestyle pages)
interface FreestyleItem {
  id: string;
  photoId: string;
  photoUrl: string;

  // Transform (absolute pixels or percentages)
  x: number;        // Position from left (percentage 0-100)
  y: number;        // Position from top (percentage 0-100)
  width: number;    // Width (percentage of canvas)
  height: number;   // Height (percentage of canvas)
  rotation: number; // Degrees (0-360, free rotation)

  // Layering
  zIndex: number;   // Stack order (higher = on top)

  // Optional filters (reuse existing)
  filters?: PhotoFilterValues;
  filterPreset?: string;
}

// Extend AlbumPage to support freestyle
interface AlbumPage {
  id: string;
  layoutId: string;           // 'freestyle' for freestyle pages
  background: string;
  slots: PageSlot[];          // Used for template layouts
  freestyleItems?: FreestyleItem[];  // Used for freestyle layout
}
```

### Layout Template Addition

```typescript
// In layoutTemplates.ts
export const FREESTYLE_LAYOUT: LayoutTemplate = {
  id: 'freestyle',
  name: 'Freestyle Canvas',
  slots: [], // No predefined slots
  isFreestyle: true,
};
```

---

## Component Architecture

### New Components

```
client/src/components/editor/
├── FreestyleCanvas.tsx      # Main Konva canvas for freestyle
├── FreestyleItem.tsx        # Individual draggable/rotatable image
├── FreestyleToolbar.tsx     # Tools: add image, layer controls, etc.
└── LayerPanel.tsx           # Shows z-order, drag to reorder
```

### FreestyleCanvas.tsx
- Konva Stage with Layer
- Renders `FreestyleItem` for each item, sorted by zIndex
- Drop zone for adding new photos
- Click-away deselects current item
- Keyboard shortcuts (Delete, arrow nudge, Cmd+[ / Cmd+])

### FreestyleItem.tsx
- Konva Group containing:
  - KonvaImage (the photo)
  - Transformer (when selected) with rotation enabled
- Draggable within canvas bounds
- Free rotation (not snapped to 90°)
- Maintains aspect ratio on resize (optional toggle)

### FreestyleToolbar.tsx
- Layer controls:
  - "Bring to Front" (max zIndex + 1)
  - "Send to Back" (min zIndex - 1)
  - "Bring Forward" (+1)
  - "Send Backward" (-1)
- Delete selected item
- Duplicate item
- Lock/unlock position (optional)

### LayerPanel.tsx (Optional Enhancement)
- Visual list of all items with thumbnails
- Drag to reorder (updates zIndex)
- Visibility toggle per item
- Click to select

---

## Redux State Changes

### albumSlice.ts Additions

```typescript
// New actions
addFreestyleItem: (state, action: PayloadAction<{
  pageIndex: number;
  item: FreestyleItem;
}>) => { ... },

updateFreestyleItem: (state, action: PayloadAction<{
  pageIndex: number;
  itemId: string;
  updates: Partial<FreestyleItem>;
}>) => { ... },

removeFreestyleItem: (state, action: PayloadAction<{
  pageIndex: number;
  itemId: string;
}>) => { ... },

reorderFreestyleItems: (state, action: PayloadAction<{
  pageIndex: number;
  itemId: string;
  newZIndex: number;
}>) => { ... },

// Utility actions
bringToFront: (state, action: PayloadAction<{ pageIndex: number; itemId: string }>) => { ... },
sendToBack: (state, action: PayloadAction<{ pageIndex: number; itemId: string }>) => { ... },
```

---

## User Interaction Flow

### Adding Photos to Freestyle Canvas
1. User selects "Freestyle Canvas" layout from layout picker
2. Page converts to freestyle mode (empty canvas)
3. User drags photo from library → drops on canvas
4. New `FreestyleItem` created at drop position with default size
5. Item auto-selected, Transformer shown

### Manipulating Items
1. **Move**: Drag item anywhere on canvas
2. **Resize**: Drag Transformer corners (aspect ratio preserved by default)
3. **Rotate**: Drag Transformer rotation handle (top circle)
4. **Layer**: Use toolbar buttons or keyboard shortcuts

### Layering Interactions
- Click item → brings to front? (design choice) OR just selects
- Keyboard: `Cmd+]` bring forward, `Cmd+[` send backward
- Toolbar: Explicit layer controls
- Optional: Layer panel for visual reordering

---

## Implementation Steps

### Phase 1: Core Infrastructure
1. [ ] Add `FreestyleItem` type to shared types
2. [ ] Add `freestyleItems` field to `AlbumPage` type
3. [ ] Add `FREESTYLE_LAYOUT` to layout templates
4. [ ] Add Redux actions for freestyle items

### Phase 2: Basic Canvas
5. [ ] Create `FreestyleCanvas.tsx` component
6. [ ] Create `FreestyleItem.tsx` with Konva Image + Transformer
7. [ ] Integrate into `EditorCanvas.tsx` (conditional render)
8. [ ] Implement drop-to-add functionality

### Phase 3: Transform Controls
9. [ ] Enable free rotation in Transformer
10. [ ] Add resize with aspect ratio lock
11. [ ] Implement drag constraints (stay within canvas)
12. [ ] Add rotation snapping (optional: Shift for 15° snaps)

### Phase 4: Layering
13. [ ] Create `FreestyleToolbar.tsx` with layer controls
14. [ ] Implement z-index management actions
15. [ ] Add keyboard shortcuts for layering
16. [ ] Visual indication of layer order

### Phase 5: Polish
17. [ ] Add to layout picker with preview icon
18. [ ] Save/load freestyle items (Firebase)
19. [ ] Book view rendering for freestyle pages
20. [ ] Undo/redo support for freestyle actions

### Phase 6: Optional Enhancements
21. [ ] LayerPanel component for visual reordering
22. [ ] Duplicate item functionality
23. [ ] Lock/unlock items
24. [ ] Snap to grid / snap to other items
25. [ ] Group multiple items

---

## Technical Considerations

### Canvas Coordinate System
- Store positions as **percentages** (0-100) for responsiveness
- Convert to pixels when rendering based on canvas size
- Same pattern as existing slot positioning

### Z-Index Management
- Start items at zIndex = 0
- "Bring to Front": newZIndex = max(allZIndexes) + 1
- "Send to Back": Renormalize all to 0, 1, 2... then target = -1, renormalize
- Keep zIndexes sparse (allows easy insertion)

### Performance
- Konva handles transforms efficiently
- Consider `listening: false` for non-selected items (reduces hit detection)
- Use image caching for filtered images

### Transformer Configuration
```typescript
<Transformer
  rotateEnabled={true}
  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]} // Optional
  rotationSnapTolerance={5}
  keepRatio={true} // Or false for free resize
  boundBoxFunc={(oldBox, newBox) => {
    // Constrain to canvas bounds
    // Minimum size enforcement
  }}
/>
```

### Book View Rendering
- Freestyle pages render items in z-order
- Use CSS transforms for rotation (or SVG)
- Simpler than Konva - read-only display

---

## UI/UX Decisions Needed

1. **Layout Picker**: How to visually represent "freestyle" option?
   - Suggestion: Icon showing scattered/overlapping photos

2. **Default item size**: When dropping a photo, what size?
   - Suggestion: 30% of canvas width, maintain aspect ratio

3. **Selection behavior**: Click brings to front, or just selects?
   - Suggestion: Just selects (explicit layer control is clearer)

4. **Rotation**: Free rotation or snap to angles?
   - Suggestion: Free by default, hold Shift for 15° snaps

5. **Mixed pages**: Can user switch freestyle page back to template?
   - Suggestion: Yes, but warn that freestyle items will be lost

---

## File Changes Summary

### New Files
- `client/src/components/editor/FreestyleCanvas.tsx`
- `client/src/components/editor/FreestyleItem.tsx`
- `client/src/components/editor/FreestyleToolbar.tsx`
- `client/src/components/editor/LayerPanel.tsx` (optional)

### Modified Files
- `client/src/types/album.ts` or `@photo-album/types` - Add FreestyleItem
- `client/src/features/album/albumSlice.ts` - Add freestyle actions
- `client/src/features/layouts/layoutTemplates.ts` - Add freestyle layout
- `client/src/components/editor/EditorCanvas.tsx` - Conditional freestyle render
- `client/src/components/panels/PropertiesPanel.tsx` - Layer controls for freestyle
- `client/src/components/book/BookPage.tsx` - Render freestyle items
- `server/src/services/firebaseService.ts` - Handle freestyle data

---

## Estimated Complexity

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Infrastructure | Low | Types, Redux |
| Phase 2: Basic Canvas | Medium | Konva knowledge |
| Phase 3: Transform | Medium | Transformer config |
| Phase 4: Layering | Low | Z-index logic |
| Phase 5: Polish | Medium | Integration points |
| Phase 6: Enhancements | Variable | Optional |

**Total**: Medium-sized feature, builds well on existing Konva setup.

---

## Questions for Product Decision

1. Should freestyle items support filters like regular slots?
   - **Recommendation**: Yes, reuse existing filter infrastructure

2. Should there be a max number of items per freestyle page?
   - **Recommendation**: Soft limit of 20 with warning, hard limit of 50

3. Should items be able to extend beyond canvas bounds?
   - **Recommendation**: No, constrain to visible area

4. Priority of LayerPanel vs inline toolbar controls?
   - **Recommendation**: Toolbar first (MVP), LayerPanel as enhancement
