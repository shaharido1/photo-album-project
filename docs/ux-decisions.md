# UX Decisions Log

This document tracks all UX decisions made during development, including rationale and alternatives considered.

---

## Design System

### Decision: Shadcn/ui + Tailwind CSS

**Date:** 2024-12-25

**Rationale:**
- Clean, minimal aesthetic that won't compete with user photos
- Highly customizable - we own the components
- Tailwind allows rapid iteration on custom styles
- Accessible by default (built on Radix primitives)
- Modern look appropriate for a creative/photo app

**Alternatives Considered:**
- Material UI: Too "Google-y", might distract from photos
- Chakra UI: Good option but slightly heavier
- Ant Design: Too enterprise-focused for a creative app

---

## Visual Design

### Decision: Neutral Color Palette with Subtle Accent

**Date:** 2024-12-25

**Rationale:**
- Photos should be the hero - UI should recede
- Neutral grays for chrome, minimal color in UI
- Single accent color for primary actions (blue or violet)
- Light mode default, dark mode supported

**Color Tokens:**
```
Background: neutral-50 (#fafafa)
Surface: white
Border: neutral-200
Text Primary: neutral-900
Text Secondary: neutral-500
Accent: violet-600 (primary actions)
Accent Hover: violet-700
Success: green-600
Warning: amber-500
Error: red-600
```

### Decision: Dark Mode from Start

**Date:** 2024-12-25

**Rationale:**
- Photo editing apps often use dark mode (photos pop more)
- Easier to implement from start than retrofit
- User preference respected via system setting + toggle

---

## Layout & Navigation

### Decision: Three-Panel Layout for Editor

**Date:** 2024-12-25

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│  Header (project name, save status, export)         │
├──────────┬─────────────────────────┬────────────────┤
│          │                         │                │
│  Photo   │    Canvas/Page Editor   │   Properties   │
│  Library │                         │   Panel        │
│  Panel   │                         │                │
│          │                         │                │
├──────────┴─────────────────────────┴────────────────┤
│  Page Thumbnails / Timeline                         │
└─────────────────────────────────────────────────────┘
```

**Rationale:**
- Familiar pattern (Canva, Google Slides, Figma)
- Left panel: source content (photos)
- Center: main workspace
- Right panel: contextual properties
- Bottom: page navigation

**Alternatives Considered:**
- Two-panel (no right panel): Less cluttered but properties need modal/popover
- Floating panels: More flexible but more complex, less predictable

---

## Interactions

### Decision: Drag-and-Drop as Primary Interaction

**Date:** 2024-12-25

**Rationale:**
- Natural metaphor for placing photos
- Immediate visual feedback
- Works well for reordering pages too

**Fallback:**
- Click photo, then click slot (for accessibility/preference)
- Right-click context menus for additional actions

### Decision: Auto-Save with Manual Export

**Date:** 2024-12-25

**Rationale:**
- Users shouldn't lose work (auto-save to Google Drive)
- But export is intentional action (don't spam their downloads)
- Show save status in header ("Saved" / "Saving..." / "Offline")

---

## Empty States

### Decision: Actionable Empty States

**Date:** 2024-12-25

**Pattern:**
Every empty state should:
1. Explain what will appear here
2. Provide primary action to populate it
3. Use friendly illustration (optional)

**Examples:**
- Empty photo library: "No photos yet" + [Upload Photos] + [Connect Google Photos]
- Empty album: "Drag photos here to start" + illustration
- No albums: "Create your first album" + [New Album]

---

## Loading States

### Decision: Skeleton Loaders over Spinners

**Date:** 2024-12-25

**Rationale:**
- Skeletons show structure, reduce perceived wait time
- Spinners are jarring and don't show progress
- Use shimmer animation for polish

**Exceptions:**
- Brief operations (<300ms): No loader needed
- Export/upload progress: Use progress bar with percentage

---

## Error Handling

### Decision: Inline Errors with Recovery Actions

**Date:** 2024-12-25

**Pattern:**
- Show errors near the source (not just toast)
- Always provide a recovery action
- Use friendly language, avoid technical jargon

**Examples:**
- Upload failed: "Couldn't upload photo.jpg" + [Try Again]
- Google auth failed: "Couldn't connect to Google Photos" + [Try Again] + [Upload Instead]
- Export failed: "Export failed - the image might be too large" + [Try Again] + [Reduce Quality]

---

## Feedback & Microinteractions

### Decision: Confirm Destructive Actions Only

**Date:** 2024-12-25

**Rationale:**
- Don't confirm every action (annoying)
- Only confirm irreversible/destructive actions
- Provide undo where possible instead of confirmation

**Confirm:**
- Delete album
- Remove all photos from album
- Clear entire page

**Don't Confirm (use undo instead):**
- Remove single photo from page
- Delete single page
- Change layout (can change back)

---

## Accessibility

### Decision: WCAG 2.1 AA Compliance

**Date:** 2024-12-25

**Requirements:**
- Keyboard navigation for all features
- Focus indicators visible
- 4.5:1 contrast ratio for text
- Alt text for images (user-provided captions or filename)
- Screen reader announcements for dynamic changes
- Reduced motion support

---

## UX Review Template

When reviewing a feature, evaluate:

```markdown
## Feature: [Name]

### Intuitiveness
- [ ] Can complete primary task without instructions
- [ ] Labels and icons are clear
- [ ] Follows established patterns

### Consistency
- [ ] Uses design system components
- [ ] Matches existing interaction patterns
- [ ] Spacing/typography follows scale

### Feedback
- [ ] Actions have visual feedback
- [ ] Loading states present
- [ ] Success/error states clear

### Error Handling
- [ ] Errors are user-friendly
- [ ] Recovery actions provided
- [ ] Edge cases handled gracefully

### Accessibility
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] Contrast sufficient

### Edge Cases
- [ ] Empty state handled
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Overflow/long content handled

### Notes
[Additional observations]

### Required Changes
1. ...
2. ...
```

---

## Decision Log

| Date | Decision | Category | Notes |
|------|----------|----------|-------|
| 2024-12-25 | Shadcn/ui + Tailwind | Design System | Minimal, customizable |
| 2024-12-25 | Neutral palette + violet accent | Colors | Let photos be the hero |
| 2024-12-25 | Dark mode from start | Colors | Photo apps benefit from dark |
| 2024-12-25 | Three-panel layout | Layout | Familiar Canva/Figma pattern |
| 2024-12-25 | Drag-and-drop primary | Interaction | Natural for photo placement |
| 2024-12-25 | Auto-save to Drive | Data | Never lose work |
| 2024-12-25 | Skeleton loaders | Loading | Better perceived performance |
| 2024-12-25 | Undo over confirmation | Feedback | Less friction |
| 2024-12-25 | WCAG 2.1 AA | Accessibility | Baseline requirement |
