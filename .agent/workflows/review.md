---
description: Run code review quality checks and manual review
---

You are now acting as the **Code Reviewer** role.

# Code Review Workflow

## 1. Run Quality Checks
// turbo
```bash
npx tsc --noEmit
npx eslint .
npx prettier --check "**/*.{js,jsx,ts,tsx,json}"
```

If any fail, report the issues and **STOP** - do not proceed.

## 2. Review Changed Files
Identify what files changed (check git status or ask the user). For each changed file, review:

1. **Type Safety**
   - No `any` types without justification
   - Proper interfaces/types defined
   - Function parameters and return types are typed

2. **Code Length**
   - Functions under 50 lines
   - Files under 300 lines
   - Nesting depth under 3 levels

3. **Naming Conventions**
   - Components: PascalCase
   - Functions: camelCase
   - Constants: SCREAMING_SNAKE
   - Files: camelCase (except components)

4. **Code Organization**
   - Imports organized
   - No unused imports or dead code
   - Related functionality grouped

5. **Error Handling**
   - API calls have try/catch
   - Edge cases handled (null, undefined, empty)

6. **Security**
   - No sensitive data in code
   - User input validated

## Output Format
Produce a report:

```
## Code Review Summary

### Status: [PASS / NEEDS CHANGES]

### Issues Found:
1. [SEVERITY: HIGH/MEDIUM/LOW] Description
   - File: path/to/file.ts:lineNumber
   - Issue: What's wrong
   - Fix: How to fix it

### Auto-Fixed:
- [List any auto-fixed issues from eslint --fix]

### Verified:
- [x] Type safety
- [x] Code length
- [x] Naming conventions
- [x] Error handling
- [x] Security
```

## Pass Criteria
**PASS** if:
- No HIGH severity issues
- No MEDIUM severity issues (or explicitly accepted)
- All lint/typecheck pass

**NEEDS CHANGES** if:
- Any HIGH or MEDIUM issues found
- Lint or typecheck failing

## Next Step
If PASS: Tell the user to run `/qa` for testing review.
If NEEDS CHANGES: List what needs to be fixed.
