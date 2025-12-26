# Playwright MCP Guide for QA

This guide covers using Playwright MCP tools for QA testing during development.

## Important: When to Use Playwright MCP

**Playwright MCP is SLOW.** Use it only AFTER:
1. Unit tests have passed
2. E2E tests have passed
3. You need visual/manual verification

Do NOT use Playwright MCP as a substitute for automated tests.

## Quick Reference

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Go to a URL |
| `browser_snapshot` | Get page structure (preferred) |
| `browser_take_screenshot` | Capture visual screenshot |
| `browser_click` | Click elements |
| `browser_type` | Type into inputs |
| `browser_fill_form` | Fill multiple fields |
| `browser_press_key` | Press keyboard keys |
| `browser_wait_for` | Wait for text/element |
| `browser_console_messages` | View console logs/errors |
| `browser_network_requests` | View API calls |
| `browser_close` | Close browser |

## Standard QA Workflow

### Step 1: Start the Application

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Step 2: Navigate to the App

```
browser_navigate → http://localhost:5173
```

### Step 3: Get Page Snapshot

```
browser_snapshot
```

This returns the accessibility tree with element refs. Use these refs for interactions.

### Step 4: Check for Console Errors

```
browser_console_messages (level: "error")
```

**Important:** Do this on every page load to catch JavaScript errors.

### Step 5: Interact and Verify

Use refs from the snapshot to interact:

```
browser_click → element: "Login button", ref: "button[Login]"
browser_type → element: "Email input", ref: "textbox[Email]", text: "test@example.com"
```

### Step 6: Check Network Requests

```
browser_network_requests
```

Look for:
- Failed requests (4xx, 5xx status codes)
- Unexpected requests
- Missing requests (API not called when expected)

### Step 7: Clean Up

```
browser_close
```

## QA Checklist with Playwright MCP

For each feature, verify:

### Page Load
- [ ] Page loads without console errors
- [ ] All expected elements are visible
- [ ] No broken images or missing assets

### User Interactions
- [ ] Buttons are clickable and respond
- [ ] Form inputs accept input
- [ ] Form validation shows errors appropriately
- [ ] Success states display correctly

### API Integration
- [ ] API calls complete successfully
- [ ] Loading states show while waiting
- [ ] Error states display when API fails
- [ ] Data displays correctly after fetch

### Navigation
- [ ] Links navigate to correct pages
- [ ] Browser back/forward works
- [ ] URL updates appropriately

### Auth (if applicable)
- [ ] Login flow works
- [ ] Protected pages redirect unauthenticated users
- [ ] Logout clears user state

## Example QA Session

```
# 1. Navigate
browser_navigate → http://localhost:5173

# 2. Check initial state
browser_snapshot
browser_console_messages (level: "error")

# 3. Test login flow
browser_click → element: "Login button", ref: "button[Sign in]"
browser_snapshot  # Check login modal appeared

# 4. Verify after login
browser_console_messages (level: "error")
browser_network_requests  # Check auth API call

# 5. Test main feature
browser_click → element: "Create Album", ref: "button[Create Album]"
browser_snapshot

# 6. Fill form
browser_fill_form → fields: [
  { name: "Album name", type: "textbox", ref: "textbox[Name]", value: "Test Album" }
]

# 7. Submit and verify
browser_click → element: "Save button", ref: "button[Save]"
browser_wait_for → text: "Album created"
browser_snapshot

# 8. Clean up
browser_close
```

## Common Issues to Check

### Console Errors
```
browser_console_messages (level: "error")
```
- React hydration errors
- Undefined variable access
- Failed imports

### Network Failures
```
browser_network_requests
```
- 401: Auth token expired/invalid
- 403: Permission denied
- 404: Wrong endpoint URL
- 500: Server error

### Visual Issues
```
browser_snapshot
```
- Missing elements
- Wrong text content
- Incorrect element state (disabled when should be enabled)

## Tips

1. **Always snapshot first** - Get element refs before trying to interact
2. **Check console after each navigation** - Catch errors early
3. **Use descriptive element names** - Makes the session easier to follow
4. **Verify after interactions** - Snapshot again to confirm state changed
5. **Close browser when done** - Clean up resources
