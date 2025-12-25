# Playwright MCP Guide

This guide covers using Playwright MCP tools for interactive testing during development.

## When to Use Playwright MCP

Use Playwright MCP tools for:
- **Visual verification** - Checking UI renders correctly after changes
- **Interactive debugging** - Testing user flows manually before writing E2E tests
- **Bug reproduction** - Verifying reported issues exist and are fixed
- **Feature demos** - Walking through new functionality
- **Accessibility checks** - Using `browser_snapshot` to see accessibility tree

## Available Tools

| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Navigate to a URL |
| `mcp__playwright__browser_snapshot` | Get accessibility snapshot (preferred over screenshot) |
| `mcp__playwright__browser_take_screenshot` | Capture visual screenshot |
| `mcp__playwright__browser_click` | Click on elements |
| `mcp__playwright__browser_type` | Type text into inputs |
| `mcp__playwright__browser_fill_form` | Fill multiple form fields at once |
| `mcp__playwright__browser_hover` | Hover over elements |
| `mcp__playwright__browser_select_option` | Select dropdown options |
| `mcp__playwright__browser_press_key` | Press keyboard keys |
| `mcp__playwright__browser_wait_for` | Wait for text/elements |
| `mcp__playwright__browser_console_messages` | View console logs/errors |
| `mcp__playwright__browser_network_requests` | View network requests |
| `mcp__playwright__browser_tabs` | Manage browser tabs |
| `mcp__playwright__browser_close` | Close the browser |

## Typical Workflow

```
1. Start the app: npm run dev (Frontend: localhost:5173, Backend: localhost:3001)
2. Navigate: mcp__playwright__browser_navigate → http://localhost:5173
3. Inspect: mcp__playwright__browser_snapshot → see page structure
4. Interact: mcp__playwright__browser_click → click buttons/links
5. Verify: mcp__playwright__browser_snapshot → confirm expected state
6. Debug: mcp__playwright__browser_console_messages → check for errors
```

## Best Practices

- **Use `browser_snapshot` over screenshots** - Snapshots provide accessible element refs for interaction
- **Check console messages** - Always look for JavaScript errors after page loads
- **Check network requests** - Verify API calls succeed (look for 4xx/5xx errors)
- **Use element refs from snapshots** - Click/type actions need the exact `ref` from snapshots
- **Close browser when done** - Use `browser_close` to clean up

## Test Files Location

| Type        | Location                   | Framework  |
| ----------- | -------------------------- | ---------- |
| Server Unit | `server/tests/*.test.js`   | Jest       |
| Client Unit | `client/src/**/*.test.jsx` | Jest + RTL |
| E2E         | `e2e/*.spec.js`            | Playwright |
