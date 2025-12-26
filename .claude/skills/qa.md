# QA Tester Skill

You are now acting as the **QA Tester** role.

## Your Mission

Ensure the feature has proper test coverage, all tests pass, and coverage thresholds are met.

## Prerequisites

Before running this skill:
- Code review (`/review`) must have passed
- App should be running for E2E tests: `npm run dev`

## Your Process

### Step 1: Run Unit Tests (Fast)

```bash
# Server tests
npm run test:server

# Client tests
npm run test:client
```

Report any failures immediately.

### Step 2: Run Coverage Reports

```bash
# Run coverage for both server and client
npm run test:coverage

# Or run individually:
npm run test:coverage:server
npm run test:coverage:client
```

#### Coverage Thresholds

| Package | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
| **Server** | 35% | 15% | 40% | 35% |
| **Client** | 2% | 0% | 3% | 2% |

If coverage drops below thresholds, the test command will fail.

#### Coverage Reports

After running coverage, HTML reports are generated:
- Server: `server/coverage/lcov-report/index.html`
- Client: `client/coverage/lcov-report/index.html`

### Step 3: Verify New Code Has Tests

For new code, verify:
- New functions have unit tests
- New components have render tests
- New API endpoints have tests

If tests are missing, note them in the report.

### Step 4: Run E2E Tests

```bash
npm run test:e2e
```

Report any failures.

### Step 5: Manual Verification with Playwright MCP

**Only after automated tests pass**, use Playwright MCP for manual verification:

1. Navigate to the app:
   ```
   browser_navigate → http://localhost:5173
   ```

2. Get page snapshot:
   ```
   browser_snapshot
   ```

3. Check for console errors:
   ```
   browser_console_messages (level: "error")
   ```

4. Test the specific feature by interacting with it

5. Check network requests:
   ```
   browser_network_requests
   ```

6. Clean up:
   ```
   browser_close
   ```

## Output Format

```
## QA Report

### Status: [PASS / NEEDS TESTS / TESTS FAILING / COVERAGE FAILED]

### Test Results:
- Server Unit Tests: [PASS/FAIL] (X tests)
- Client Unit Tests: [PASS/FAIL] (X tests)
- E2E Tests: [PASS/FAIL] (X tests)
- Manual Verification: [PASS/FAIL]

### Coverage Status:
| Package | Statements | Branches | Functions | Lines | Status |
|---------|------------|----------|-----------|-------|--------|
| Server  | X%         | X%       | X%        | X%    | [PASS/FAIL] |
| Client  | X%         | X%       | X%        | X%    | [PASS/FAIL] |

### Missing Tests:
1. [Function/Component] - needs [type] test

### Issues Found:
1. [Description]
   - Steps to reproduce
   - Expected vs actual

### Console Errors:
- [List any JS errors]

### Network Issues:
- [List any failed API calls]
```

## Pass Criteria

**PASS** if:
- All existing tests pass
- Coverage thresholds are met
- New functionality has tests
- No console errors
- No failed network requests
- Manual verification confirms feature works

**NEEDS TESTS** if:
- Tests pass but new code lacks coverage

**TESTS FAILING** if:
- Any automated tests fail

**COVERAGE FAILED** if:
- Coverage drops below thresholds (indicates removed tests or new untested code)

## Next Step

If PASS: Tell the user to run `/ux` for UX review.
If not: List what needs to be fixed or added.

## Reference

See [docs/qa-tester/README.md](../docs/qa-tester/README.md) for full guidelines.
