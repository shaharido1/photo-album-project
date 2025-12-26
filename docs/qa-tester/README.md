# QA Tester Role

The QA tester ensures features are properly tested with unit tests, integration tests, and E2E tests before visual review.

## When This Role Runs

This role runs after code review has passed.

```
Developer → Code Review → [QA Tester] → UX → Docs → DevOps
```

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /----\     - User flows
     /      \    - Critical paths
    /--------\
   /          \  Integration Tests
  /------------\ - API endpoints
 /              \- Component integration
/----------------\
      Unit Tests
  - Functions
  - Components
  - Redux slices
```

### Priority Order

1. **Unit Tests** - Fast, run first
2. **Integration Tests** - Medium speed
3. **E2E Tests** - Slow, run last
4. **Playwright MCP** - Manual verification after automated tests pass

## QA Checklist

### 1. Unit Test Coverage

- [ ] New functions have unit tests
- [ ] Edge cases are tested (null, empty, error states)
- [ ] Redux slices have tests for all reducers
- [ ] React components have render tests

### 2. Run Unit Tests

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test

# Run both
npm test
```

### 3. E2E Test Coverage

- [ ] New user flows have E2E tests
- [ ] Critical paths are covered
- [ ] Auth flows are tested (if applicable)

### 4. Run E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# Run with UI for debugging
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

### 5. Manual Verification with Playwright MCP

**After automated tests pass**, use Playwright MCP for visual verification:

```bash
# Make sure the app is running
npm run dev
```

Then use Playwright MCP tools:
1. `browser_navigate` to http://localhost:5173
2. `browser_snapshot` to see page structure
3. `browser_click` / `browser_type` to interact
4. `browser_console_messages` to check for errors
5. `browser_network_requests` to verify API calls

See [playwright-mcp.md](./playwright-mcp.md) for detailed usage.

## Test File Locations

| Type | Location | Framework |
|------|----------|-----------|
| Server Unit | `server/tests/*.test.ts` | Jest |
| Client Unit | `client/src/**/*.test.tsx` | Jest + RTL |
| E2E | `e2e/*.spec.ts` | Playwright |

## Writing New Tests

### Unit Test Template (Jest)

```typescript
// server/tests/example.test.ts
describe('functionName', () => {
  it('should handle normal case', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    const result = functionName(null);
    expect(result).toBeNull();
  });

  it('should throw on invalid input', () => {
    expect(() => functionName(invalid)).toThrow();
  });
});
```

### Component Test Template (RTL)

```typescript
// client/src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Template (Playwright)

```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete user flow', async ({ page }) => {
    // Arrange
    await page.getByRole('button', { name: 'Start' }).click();

    // Act
    await page.getByLabel('Name').fill('Test User');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Coverage Requirements

| Type | Minimum Coverage |
|------|-----------------|
| Unit Tests | New code should have tests |
| E2E Tests | Critical user flows must be covered |
| Edge Cases | Null, empty, error states should be tested |

## QA Report Format

After QA, report findings:

```
## QA Report

### Status: [PASS / NEEDS TESTS]

### Test Results:
- Unit Tests: [PASS/FAIL] (X tests)
- E2E Tests: [PASS/FAIL] (X tests)
- Manual Verification: [PASS/FAIL]

### Missing Tests:
1. [Feature/Function] - needs [type] test
   - What to test: description

### Issues Found During Testing:
1. [Description of bug/issue]
   - Steps to reproduce
   - Expected vs actual behavior

### Console Errors:
- List any JavaScript errors found

### Network Issues:
- List any failed API calls
```

## Pass Criteria

The feature can proceed to UX review if:
1. All existing tests pass
2. New functionality has appropriate tests
3. No console errors during testing
4. No failed network requests
5. Manual verification with Playwright MCP confirms feature works
