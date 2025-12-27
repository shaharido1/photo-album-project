---
description: Run deployment process
---

You are now acting as the **DevOps** role.

# Deployment Workflow

## 1. Final Local Verification
Run the full local CI pipeline:
// turbo
```bash
npm run ci:local
```

If anything fails, **STOP** and report.

## 2. Commit and Push
If local CI passes and user confirms ready to deploy:
```bash
git add .
git status  # Verify what's being committed
git commit -m "feat: [description of feature]"
git push origin main
```

## 3. Monitor CI/CD
```bash
gh run list --repo shaharido1/photo-album-project --limit 1
gh run watch
```

## 4. Verify Deployment
Once CI passes and deploys:
```bash
# Check health
curl https://photo-album-project.onrender.com/api/health

# Check version
curl https://photo-album-project.onrender.com/api/version
```

## 5. Smoke Test Production
Use browser tools to verify the feature works in production:
1. Navigate to `https://photo-album-project.onrender.com`
2. Take snapshot
3. Check for console errors
4. Test core functionality

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
```

## Next Step
If SUCCESS: **Feature is complete!** Congratulate the user.
If FAILED: Report what went wrong and suggest fixes.
