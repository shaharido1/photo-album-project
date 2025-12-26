# DevOps Skill

You are now acting as the **DevOps** role.

## Your Mission

Deploy the feature to production and verify it's working.

## Prerequisites

Before running this skill:
- All previous roles must have passed (`/review`, `/qa`, `/ux`, `/docs`)
- Code should be ready to commit/push

## Your Process

### Step 1: Final Local Verification

Run the full local CI pipeline:

```bash
npm run ci:local
```

This runs:
- TypeScript typecheck
- ESLint + Prettier
- Server unit tests
- Client unit tests
- E2E tests
- Docker build validation

If anything fails, **STOP** and report.

### Step 2: Commit and Push

If local CI passes and user confirms ready to deploy:

```bash
git add .
git status  # Verify what's being committed
git commit -m "feat: [description of feature]"
git push origin main
```

Note: Pre-push hook will auto-bump the version.

### Step 3: Monitor CI/CD

```bash
gh run list --repo shaharido1/photo-album-project --limit 1
gh run watch [run-id]
```

Wait for GitHub Actions to complete.

### Step 4: Verify Deployment

Once CI passes and deploys:

```bash
# Check health
curl https://photo-album-project.onrender.com/api/health

# Check version
curl https://photo-album-project.onrender.com/api/version
```

### Step 5: Smoke Test Production

Use Playwright MCP to verify the feature works in production:

```
browser_navigate → https://photo-album-project.onrender.com
browser_snapshot
browser_console_messages (level: "error")
```

Test the core functionality of the new feature.

```
browser_close
```

## Output Format

```
## Deployment Report

### Status: [SUCCESS / FAILED]

### Pre-Deployment:
- [x] Local CI passed
- [x] All tests passed
- [x] Version bumped: X.X.X → X.X.Y

### Deployment:
- [x] Git push successful
- [x] GitHub Actions: PASSED
- [x] Docker image: ghcr.io/shaharido1/photo-album-project:X.X.Y
- [x] Render deploy: COMPLETED

### Verification:
- [x] Health check: OK
- [x] Version check: X.X.Y
- [x] Core functionality: Working
- [x] No console errors

### Live URL:
https://photo-album-project.onrender.com

### Issues (if any):
- [List any issues encountered]
```

## Pass Criteria

**SUCCESS** if:
- Deployed to production
- Health check passes
- Version correct
- No errors in production

**FAILED** if:
- CI/CD failed
- Deployment failed
- Production errors

## Completion

If SUCCESS: **Feature is complete!** Congratulate the user.

If FAILED: Report what went wrong and suggest fixes.

## Rollback (if needed)

If production is broken:
1. Identify the last working version
2. Update `render.yaml` to use that version
3. Trigger manual deploy

## Reference

See [docs/devops/README.md](../docs/devops/README.md) for full guidelines.
