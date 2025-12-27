---
description: Run the full feature pipeline (review, qa, ux, docs, deploy)
---

# Full Feature Pipeline

This workflow runs all review roles in sequence to ensure the feature is ready for production.

## Pipeline Sequence
`/review` → `/qa` → `/ux` → `/docs` → `/deploy`

Each step must pass before proceeding to the next.

## 1. Code Review
Run `/review` to check type safety, code quality, and standards.

## 2. QA Testing
Run `/qa` to check automated tests, coverage, and basic functionality.

## 3. UX Review
Run `/ux` to check visual consistency and user flows.

## 4. Documentation
Run `/docs` to ensure documentation matches code changes.

## 5. Deployment
Run `/deploy` to push to production and verify live site.

## Final Report
At the end, produce a summary:

```
## Feature Pipeline Summary

### Overall Status: [COMPLETE / BLOCKED AT {STEP}]

### Step Results:
1. Code Review: [PASS/FAIL]
2. QA Testing: [PASS/FAIL]
3. UX Review: [PASS/FAIL]
4. Documentation: [PASS/FAIL]
5. Deployment: [PASS/FAIL]

### Blocking Issues (if any):
- [List what needs to be fixed]

### Deployed Version: X.X.X
### Live URL: https://photo-album-project.onrender.com
```

## Important Notes
1. **Don't skip steps** - Each step catches different issues.
2. **Stop on failure** - Don't proceed if a step fails.
3. **Get user confirmation** - Before committing/deploying.
