# Feature Pipeline Skill

You are running the **complete feature pipeline**.

## Your Mission

Run all review roles in sequence to ensure the feature is ready for production.

## Pipeline Sequence

```
/review → /qa → /ux → /docs → /deploy
```

Each step must pass before proceeding to the next.

## Process

### Step 1: Code Review

Run the code review process:

1. Run quality checks:
   ```bash
   npx tsc --noEmit
   npx eslint .
   npx prettier --check "**/*.{js,jsx,ts,tsx,json}"
   ```

2. Review code for:
   - Type safety
   - Code quality
   - Naming conventions
   - Error handling

**If FAIL:** Stop and report issues. User must fix before continuing.

**If PASS:** Proceed to QA.

---

### Step 2: QA Testing

Run the QA process:

1. Run automated tests:
   ```bash
   cd server && npm test
   cd client && npm test
   npm run test:e2e
   ```

2. Use Playwright MCP for manual verification:
   ```
   browser_navigate → http://localhost:5173
   browser_snapshot
   browser_console_messages (level: "error")
   [Test the feature]
   browser_close
   ```

**If FAIL:** Stop and report issues.

**If PASS:** Proceed to UX.

---

### Step 3: UX Review

Run the UX review process:

1. Navigate and inspect:
   ```
   browser_navigate → http://localhost:5173
   browser_snapshot
   ```

2. Walk through user flow
3. Check feedback states
4. Look for UX issues

**If FAIL:** Stop and report issues.

**If PASS:** Proceed to Docs.

---

### Step 4: Documentation Review

Check documentation:

1. Identify what changed
2. Verify relevant docs are accurate
3. Update if needed

**If FAIL:** Stop and report what needs updating.

**If PASS:** Proceed to Deploy.

---

### Step 5: Deployment

Deploy to production:

1. Run local CI:
   ```bash
   npm run ci:local
   ```

2. Commit and push (with user confirmation)

3. Monitor CI/CD

4. Verify production:
   ```bash
   curl https://photo-album-project.onrender.com/api/health
   curl https://photo-album-project.onrender.com/api/version
   ```

5. Smoke test with Playwright MCP

---

## Summary Report

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

1. **Don't skip steps** - Each step catches different issues
2. **Fast checks first** - Lint/type before slow Playwright
3. **Stop on failure** - Don't proceed if a step fails
4. **Get user confirmation** - Before committing/deploying

## Reference

See individual role docs:
- [docs/code-reviewer/](../docs/code-reviewer/)
- [docs/qa-tester/](../docs/qa-tester/)
- [docs/ux-reviewer/](../docs/ux-reviewer/)
- [docs/documenter/](../docs/documenter/)
- [docs/devops/](../docs/devops/)
