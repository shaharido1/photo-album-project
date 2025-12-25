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
- [x] Delete/remove photos from library

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
  - [ ] Collage (freeform) - **Not implemented**
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

## Infrastructure Features (Planned)

### 1. Authentication Layer

**Goal:** Secure user authentication with Google federation

- [ ] Google OAuth 2.0 integration
- [ ] Sign in with Google button
- [ ] Session management (JWT tokens)
- [ ] Protected routes (frontend)
- [ ] Auth middleware (backend API)
- [ ] User profile storage
- [ ] Sign out functionality
- [ ] Token refresh handling

**Technical Approach:**
| Component | Technology |
| --------- | ---------- |
| OAuth Provider | Google Identity Services |
| Backend Auth | Passport.js with Google Strategy |
| Session Storage | JWT in httpOnly cookies |
| Frontend Auth State | Redux slice + React Context |

**Why Google OAuth:**
- Users already need Google account for Photos API
- Single sign-on for Photos + Drive access
- No password management required
- Trusted authentication provider

---

### 2. Database Layer

**Goal:** Persistent storage for user data, albums, and preferences

- [ ] Firebase project setup
- [ ] Firestore database schema design
- [ ] User document (profile, preferences)
- [ ] Albums collection (metadata, page structure)
- [ ] Photo references collection (Google Photos IDs, local uploads)
- [ ] Security rules (user isolation)
- [ ] Real-time sync for auto-save
- [ ] Offline support (Firestore persistence)

**Proposed Firestore Schema:**
```
users/
  {userId}/
    profile: { email, name, photoUrl, createdAt }
    preferences: { theme, defaultAlbumSize }

albums/
  {albumId}/
    ownerId: string
    name: string
    size: { width, height, unit }
    pages: [{ layoutId, slots: [...], background }]
    createdAt, updatedAt

photos/
  {photoId}/
    ownerId: string
    source: 'google' | 'upload'
    googlePhotoId?: string
    uploadUrl?: string
    thumbnailUrl: string
    metadata: { width, height, takenAt }
```

**Why Firebase/Firestore:**
- Free tier generous (1GB storage, 50K reads/day)
- Real-time sync built-in (great for auto-save)
- Integrates seamlessly with Google Auth
- No server management required
- Offline persistence out of the box
- Scales automatically

---

### 3. Google Photos API Integration

**Goal:** Allow users to import photos from their Google Photos library

- [ ] Google Photos API setup in Cloud Console
- [ ] OAuth scopes for Photos access (`photoslibrary.readonly`)
- [ ] Photo library browser UI
- [ ] Album listing from Google Photos
- [ ] Photo search/filter (by date, album)
- [ ] Thumbnail fetching (for library view)
- [ ] Full-resolution fetch (for export)
- [ ] Pagination handling (large libraries)
- [ ] Rate limiting / quota management
- [ ] Error handling for expired tokens

**API Endpoints Needed:**
| Endpoint | Purpose |
| -------- | ------- |
| `GET /api/google/photos` | List user's photos (paginated) |
| `GET /api/google/albums` | List user's Google Photos albums |
| `GET /api/google/photos/:id` | Get photo metadata & download URL |
| `GET /api/google/photos/:id/thumbnail` | Proxy thumbnail image |

**Quota Considerations:**
- Google Photos API: 10,000 requests/day free
- Implement caching for thumbnails
- Batch requests where possible

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
| Authentication | Google OAuth 2.0 | Planned |
| Database | Firebase Firestore | Planned |
| Auth Library | Passport.js / Firebase Auth | TBD |

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

## Implementation Status & Gaps (Last Updated: Dec 2024)

### Currently Implemented Features

| Feature Area | Status | Notes |
| ------------ | ------ | ----- |
| Photo library grid | ✅ Done | 12 mock photos, thumbnails with lazy loading |
| Photo multi-select | ✅ Done | Click to toggle, visual checkmark indicator |
| Album creation dialog | ✅ Done | Name input, 5 size presets with preview |
| Page timeline | ✅ Done | Add/remove pages, navigation, thumbnails |
| Layout templates | ✅ Done | 8 templates (1-6 photos per page) |
| Background colors | ✅ Done | White, cream, black, gray presets |
| Photo placement | ✅ Done | Drag-drop to canvas, double-click to add |
| Photo manipulation | ✅ Done | Zoom slider, rotate, reset position |
| Remove photo from slot | ✅ Done | Button in properties panel |
| Dark mode | ✅ Done | Toggle in header |

### Missing MVP Features (High Priority)

| Feature | Status | Gap Description |
| ------- | ------ | --------------- |
| Upload photos | ❌ Missing | Button exists but no upload functionality |
| Google Photos import | ❌ Missing | Button exists but no OAuth/API integration |
| Delete photos from library | ❌ Missing | No delete button or functionality |
| Swap photos between slots | ❌ Missing | No drag-between-slots capability |
| Collage (freeform) layout | ❌ Missing | Only fixed grid layouts exist |
| Text/captions | ❌ Missing | No text overlay capability |
| Album flip-through view | ❌ Missing | Only page-by-page editing view |
| Page zoom in/out | ❌ Missing | Canvas is fixed size |
| PDF Export | ❌ Missing | Export button exists but no functionality |
| Image Package Export | ❌ Missing | No ZIP export capability |
| Save to Google Drive | ❌ Missing | Save button exists but no functionality |
| Load from Google Drive | ❌ Missing | No project loading capability |
| Auto-save drafts | ❌ Missing | No local or cloud persistence |
| Auto-arrange photos | ❌ Missing | No smart layout selection |

### UI/UX Gaps Identified

| Issue | Description | Priority |
| ----- | ----------- | -------- |
| Upload button non-functional | Clicking does nothing, no file picker opens | High |
| Google button non-functional | Clicking does nothing, no OAuth flow | High |
| Save button non-functional | Shows "Saved" text but doesn't persist | High |
| Export button non-functional | Opens nothing, no export dialog | High |
| No loading indicator | When fetching photos, loading state could be clearer | Medium |
| No error recovery | Photo API failures show error but retry could be more prominent | Medium |
| Rotation not visual | Rotate button dispatches action but visual rotation not implemented in canvas | Medium |
| No keyboard shortcuts | No documented or implemented shortcuts | Low |

### E2E Test Coverage

Tests are organized into the following spec files:
- `app.spec.js` - Initial load, layout, API endpoints (5 tests)
- `photo-library.spec.js` - Photo grid, selection, buttons (5 tests)
- `album-creation.spec.js` - Dialog, sizes, creation flow (8 tests)
- `page-timeline.spec.js` - Page add/remove/navigate (4 tests)
- `editor-canvas.spec.js` - Canvas interactions, drag-drop (4 tests)
- `properties-panel.spec.js` - Layouts, backgrounds, photo controls, dark mode (10 tests)

**Total: 36 E2E tests covering all implemented functionality**

---

## Notes

- This document will be updated as features are discussed and prioritized
- Check off items as they are implemented
- Move items between MVP and Future as scope changes
