# UX Reviewer Role

The UX reviewer evaluates the user experience of features using Playwright MCP for visual inspection and interaction testing.

## When This Role Runs

This role runs after QA testing has passed.

```
Developer → Code Review → QA → [UX Reviewer] → Docs → DevOps
```

## Prerequisites

Before UX review:
1. Unit tests have passed
2. E2E tests have passed
3. QA has verified basic functionality works
4. App is running locally (`npm run dev`)

## UX Review Checklist

### 1. Visual Inspection

- [ ] Layout is correct and consistent
- [ ] Spacing and alignment look proper
- [ ] Text is readable and appropriately sized
- [ ] Colors and contrast are appropriate
- [ ] Icons and images display correctly

### 2. User Flow

- [ ] The feature is discoverable (user can find it)
- [ ] Actions have clear affordances (buttons look clickable)
- [ ] Flow is intuitive (minimal steps to complete task)
- [ ] User can recover from mistakes

### 3. Feedback & States

- [ ] Loading states are visible when actions take time
- [ ] Success feedback confirms action completed
- [ ] Error messages are helpful and actionable
- [ ] Empty states have helpful guidance

### 4. Interaction Patterns

- [ ] Buttons respond to clicks appropriately
- [ ] Forms validate input clearly
- [ ] Modals/dialogs are dismissable
- [ ] Navigation is consistent

### 5. Edge Cases

- [ ] Long text doesn't break layout
- [ ] Empty data states are handled
- [ ] Multiple rapid clicks are handled
- [ ] Browser back/forward works correctly

## UX Review Process

### Step 1: Navigate to the Feature

```
browser_navigate → http://localhost:5173
browser_snapshot
```

### Step 2: Visual Inspection

Take a snapshot to understand the page structure:

```
browser_snapshot
```

Review:
- Are all expected elements present?
- Is the hierarchy logical?
- Are interactive elements clearly labeled?

### Step 3: Test User Flow

Walk through the feature as a user would:

```
# Example: Creating an album
browser_click → element: "Create Album button", ref: "button[Create Album]"
browser_snapshot  # Check modal/form appeared

browser_type → element: "Album name input", ref: "textbox[Name]", text: "My Album"
browser_click → element: "Save button", ref: "button[Save]"

browser_wait_for → text: "Album created"  # Check success feedback
browser_snapshot  # Verify final state
```

### Step 4: Check Error Handling

Test what happens when things go wrong:

```
# Submit empty form
browser_click → element: "Save button", ref: "button[Save]"
browser_snapshot  # Should show validation error
```

### Step 5: Check Console and Network

```
browser_console_messages (level: "error")  # Should be clean
browser_network_requests  # Verify API calls succeed
```

### Step 6: Clean Up

```
browser_close
```

## UX Patterns to Check

### Loading States

```
# Trigger an action that loads data
browser_click → element: "Load Photos", ref: "button[Load Photos]"
browser_snapshot  # Should show loading indicator
browser_wait_for → text: "Photos loaded"
browser_snapshot  # Should show data
```

### Error States

```
# Trigger an error (e.g., network failure)
# Check that user sees helpful message
browser_snapshot
# Look for error messaging in the snapshot
```

### Form Validation

```
# Submit invalid data
browser_type → element: "Email", ref: "textbox[Email]", text: "not-an-email"
browser_click → element: "Submit", ref: "button[Submit]"
browser_snapshot  # Should show validation error
```

### Empty States

```
# Navigate to page with no data
browser_navigate → http://localhost:5173/albums
browser_snapshot
# Check for helpful empty state message
```

## UX Report Format

After review, report findings:

```
## UX Review Report

### Status: [PASS / NEEDS IMPROVEMENTS]

### Visual Review:
- [x] Layout correct
- [x] Spacing appropriate
- [ ] Need larger touch targets for mobile

### User Flow:
- [x] Feature is discoverable
- [x] Clear call to action
- [ ] Success message could be more prominent

### Feedback & States:
- [x] Loading state present
- [x] Error handling works
- [ ] Empty state needs guidance text

### Issues Found:
1. [SEVERITY: HIGH/MEDIUM/LOW] Description
   - Where: Page/component
   - Issue: What's wrong
   - Suggestion: How to improve

### Suggestions (Non-blocking):
- Consider adding animation to transitions
- Button could have hover state

### Screenshots:
- [If any specific issues need visual reference]
```

## Severity Levels

| Level | Meaning | Example |
|-------|---------|---------|
| HIGH | Blocks user from completing task | Submit button doesn't work |
| MEDIUM | Confusing but workaround exists | Unclear error message |
| LOW | Minor polish issue | Slight misalignment |

## Pass Criteria

The feature can proceed to documentation if:
1. No HIGH severity UX issues
2. User can complete the intended flow
3. Error states are handled gracefully
4. Basic feedback (loading, success, error) is present
