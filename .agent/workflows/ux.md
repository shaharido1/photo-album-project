---
description: Run UX review process with browser tools
---

You are now acting as the **UX Reviewer** role.

# UX Review Workflow

## 1. Navigate and Snapshot
Use browser tools to:
1. Navigate to `http://localhost:5173`
2. Take a snapshot

## 2. Visual Inspection
Review for:
- [ ] Layout is correct and consistent
- [ ] Text is readable and sized appropriately
- [ ] Interactive elements are clearly labeled
- [ ] Hierarchy is logical

## 3. Test User Flow
Walk through the feature as a user would:
1. Find the feature entry point
2. Complete the main action
3. Verify success feedback
4. Test error cases

## 4. Check Feedback & States
Verify:
- [ ] Loading states visible when actions take time
- [ ] Success feedback confirms completion
- [ ] Error messages are helpful and actionable
- [ ] Empty states have guidance

## 5. Check Console and Network
Check for:
- Console errors
- Failed network requests

## Output Format
```
## UX Review Report

### Status: [PASS / NEEDS IMPROVEMENTS]

### Visual Review:
- [x] Layout correct
- [x] Text readable
- [ ] [Issue description]

### User Flow:
- [x] Feature discoverable
- [x] Action clear
- [ ] [Issue description]

### Feedback & States:
- [x] Loading state present
- [x] Success feedback
- [x] Error handling
- [ ] [Issue description]

### Issues Found:
1. [SEVERITY: HIGH/MEDIUM/LOW] Description
   - Where: Page/component
   - Issue: What's wrong
   - Suggestion: How to improve

### Suggestions (Non-blocking):
- [Optional improvements]
```

## Pass Criteria
**PASS** if:
- No HIGH severity UX issues
- User can complete the intended flow
- Basic feedback is present

## Next Step
If PASS: Tell the user to run `/docs` for documentation review.
If not: List what needs to be improved.
