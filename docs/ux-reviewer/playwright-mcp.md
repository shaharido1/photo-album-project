# Playwright MCP Guide for UX Review

This guide covers using Playwright MCP specifically for UX evaluation.

## UX-Focused Workflow

Unlike QA testing (which focuses on "does it work?"), UX review focuses on "is it good?"

### What to Look For

| QA Focus | UX Focus |
|----------|----------|
| Button works | Button is discoverable |
| Form submits | Form is easy to fill |
| Error shows | Error is helpful |
| Page loads | Page loads quickly |

## Key Tools for UX Review

### browser_snapshot (Most Important)

The snapshot shows the accessibility tree - this tells you:
- What elements are on the page
- How they're labeled
- Their hierarchy and relationships

```
browser_snapshot
```

**UX Questions to Ask:**
- Are important elements clearly labeled?
- Is the hierarchy logical?
- Can a screen reader user understand this page?

### browser_take_screenshot

For visual verification when accessibility snapshot isn't enough:

```
browser_take_screenshot → filename: "feature-state.png"
```

Use for:
- Layout issues
- Color/contrast problems
- Visual hierarchy

### browser_wait_for

Test that feedback appears in reasonable time:

```
browser_wait_for → text: "Saved successfully", timeout: 5000
```

If timeout expires, the feedback is too slow or missing.

## UX Evaluation Patterns

### Pattern 1: Feature Discovery

Can users find the feature?

```
# Navigate to main page
browser_navigate → http://localhost:5173
browser_snapshot

# Questions:
# - Is the feature visible without scrolling?
# - Is the call-to-action clear?
# - Does the button/link text describe what it does?
```

### Pattern 2: Form Usability

Is the form easy to complete?

```
browser_snapshot  # Check form structure

# Questions:
# - Are labels associated with inputs?
# - Is tab order logical?
# - Are required fields marked?
# - Is help text available where needed?
```

### Pattern 3: Feedback Timing

Does the user know what's happening?

```
# Trigger action
browser_click → element: "Save", ref: "button[Save]"

# Check for immediate feedback (loading state)
browser_snapshot  # Should show loading indicator

# Wait for completion
browser_wait_for → text: "Saved"

# Check final state
browser_snapshot
```

### Pattern 4: Error Recovery

Can users recover from mistakes?

```
# Trigger validation error
browser_click → element: "Submit", ref: "button[Submit]"
browser_snapshot

# Questions:
# - Is the error message visible near the problem?
# - Does it explain what went wrong?
# - Does it tell the user how to fix it?
# - Can they try again without losing data?
```

### Pattern 5: Empty States

What do users see when there's no data?

```
browser_navigate → http://localhost:5173/albums
browser_snapshot

# Questions:
# - Is there a message explaining the empty state?
# - Is there a clear action to add data?
# - Does it feel welcoming, not like an error?
```

## Interaction Quality Checks

### Click Responsiveness

```
browser_click → element: "Button", ref: "button[Action]"
browser_snapshot

# Questions:
# - Did something happen immediately?
# - Is there visual feedback (button state change)?
# - If async, is there a loading indicator?
```

### Form Input

```
browser_type → element: "Name field", ref: "textbox[Name]", text: "Test"
browser_snapshot

# Questions:
# - Did the text appear in the field?
# - Is there character count if limited?
# - Is real-time validation helpful or annoying?
```

### Navigation

```
browser_click → element: "Menu item", ref: "link[Albums]"
browser_snapshot

# Questions:
# - Did the page change as expected?
# - Is the new page clearly different?
# - Can the user navigate back?
```

## Common UX Issues to Flag

### HIGH Severity

- User can't complete primary task
- Critical information is hidden
- Error provides no recovery path
- Accessibility tree shows unlabeled elements

### MEDIUM Severity

- Confusing labels or text
- Unexpected behavior after action
- Missing loading state (user thinks it's broken)
- Inconsistent patterns with rest of app

### LOW Severity

- Minor visual misalignments
- Could use better empty state
- Transitions could be smoother
- Copy could be clearer

## Reporting UX Issues

When reporting, include:

1. **What**: Clear description of the issue
2. **Where**: Page/feature/element
3. **Why it matters**: Impact on user
4. **Suggestion**: How to improve (if known)

Example:

```
Issue: Error message not visible after form submission
Where: Album creation form
Why: User doesn't know what went wrong
Suggestion: Show error message below the form or near the invalid field
```

## Tips for UX Review

1. **Think like a new user** - Don't assume knowledge of how it works
2. **Check the happy path first** - Then test error cases
3. **Note your confusion** - If you're confused, users will be too
4. **Be specific** - "Confusing" isn't actionable; "Label says X but does Y" is
5. **Prioritize** - Not every issue needs to block the release
