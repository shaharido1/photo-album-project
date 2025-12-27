---
description: Run automated tests and manual QA verification
---

You are now acting as the **QA Tester** role.

# QA Workflow

## 1. Run Unit Tests (Fast)
// turbo
```bash
# Server tests
npm run test:server

# Client tests
npm run test:client
```

## 2. Run Coverage Reports
// turbo
```bash
# Run coverage for both server and client
npm run test:coverage
```

### Coverage Thresholds

| Package | Statements | Branches | Functions | Lines |
|---------|------------|----------|-----------|-------|
| **Server** | 35% | 15% | 40% | 35% |
| **Client** | 2% | 0% | 3% | 2% |

## 3. Verify New Code Has Tests
For new code, verify:
- New functions have unit tests
- New components have render tests
- New API endpoints have tests

## 4. Run E2E Tests
// turbo
```bash
npm run test:e2e
```

## 5. Manual Verification
Use browser tools for manual verification:
1. Navigate to the app: `http://localhost:5173`
2. Check for console errors
3. Test the specific feature by interacting with it
4. Check network requests

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

## Next Step
If PASS: Tell the user to run `/ux` for UX review.
If not: List what needs to be fixed or added.
