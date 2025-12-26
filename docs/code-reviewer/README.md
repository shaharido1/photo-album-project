# Code Reviewer Role

The code reviewer ensures code quality, consistency, and maintainability before features proceed to testing.

## When This Role Runs

This role runs after the developer has completed implementation and passed initial lint/typecheck.

```
Developer → [Code Reviewer] → QA → UX → Docs → DevOps
```

## Review Checklist

### 1. Type Safety

- [ ] No `any` types (unless explicitly justified with comment)
- [ ] Proper TypeScript interfaces/types defined
- [ ] Function parameters and return types are typed
- [ ] No `@ts-ignore` or `@ts-expect-error` without explanation

```typescript
// Bad
const handleClick = (data: any) => { ... }

// Good
interface ClickData {
  id: string;
  value: number;
}
const handleClick = (data: ClickData) => { ... }
```

### 2. Code Length & Complexity

| Element | Maximum | Action if Exceeded |
|---------|---------|-------------------|
| Function | 50 lines | Split into smaller functions |
| File | 300 lines | Consider splitting into modules |
| Component | 200 lines | Extract sub-components |
| Nesting depth | 3 levels | Refactor with early returns |

### 3. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `PhotoGallery.tsx` |
| Functions | camelCase | `handlePhotoClick` |
| Constants | SCREAMING_SNAKE | `MAX_UPLOAD_SIZE` |
| Types/Interfaces | PascalCase | `interface PhotoData` |
| Files (non-component) | camelCase | `authService.ts` |
| CSS classes | kebab-case | `photo-gallery-item` |

### 4. Code Organization

- [ ] Imports are organized (React, external libs, internal, styles)
- [ ] No unused imports
- [ ] No dead code (commented out code blocks)
- [ ] Related functionality is grouped together
- [ ] File structure follows project conventions

### 5. Error Handling

- [ ] API calls have try/catch or proper error handling
- [ ] Errors are logged or reported appropriately
- [ ] User-facing errors have friendly messages
- [ ] Edge cases are handled (null, undefined, empty arrays)

```typescript
// Bad
const data = await fetchData();
return data.items; // Could crash if data is null

// Good
const data = await fetchData();
return data?.items ?? [];
```

### 6. Security Considerations

- [ ] No sensitive data in code (API keys, passwords)
- [ ] User input is validated before use
- [ ] No direct innerHTML without sanitization
- [ ] Auth checks are in place for protected operations

### 7. Performance

- [ ] No unnecessary re-renders in React components
- [ ] Large lists use proper key props
- [ ] Heavy computations are memoized if needed
- [ ] No N+1 query patterns in API calls

### 8. Consistency

- [ ] Code style matches existing codebase
- [ ] Patterns used elsewhere are followed
- [ ] No duplicate code that could be extracted

## Review Output Format

After review, report findings in this format:

```
## Code Review Summary

### Status: [PASS / NEEDS CHANGES]

### Issues Found:
1. [SEVERITY: HIGH/MEDIUM/LOW] Description
   - File: path/to/file.ts:lineNumber
   - Issue: What's wrong
   - Fix: How to fix it

### Suggestions (optional):
- Non-blocking improvements that could be made

### Verified:
- [x] Type safety
- [x] Code length
- [x] Naming conventions
- [x] Error handling
- [x] Security
- [x] Performance
```

## Commands to Run

```bash
# Type check
npx tsc --noEmit

# Lint check
npx eslint .

# Format check
npx prettier --check "**/*.{js,jsx,ts,tsx,json}"
```

## Auto-Fix Commands

If minor issues are found, fix them automatically:

```bash
# Fix lint issues
npx eslint . --fix

# Fix formatting
npx prettier --write "**/*.{js,jsx,ts,tsx,json}"
```

## Pass Criteria

The feature can proceed to QA if:
1. No HIGH severity issues
2. No MEDIUM severity issues (unless explicitly accepted)
3. All lint/typecheck pass
4. Code follows project conventions
