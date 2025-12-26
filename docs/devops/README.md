# DevOps Role

The DevOps role handles deployment, monitoring, and ensures the feature is successfully released to production.

## When This Role Runs

This role runs after documentation is complete - it's the final step before a feature is considered done.

```
Developer → Code Review → QA → UX → Docs → [DevOps]
```

## Deployment Checklist

### Pre-Deployment

- [ ] All previous roles have passed
- [ ] Code is merged to main (or ready to merge)
- [ ] Version has been bumped appropriately
- [ ] All tests pass locally (`npm run ci:local`)

### Deployment

- [ ] CI pipeline passes (GitHub Actions)
- [ ] Docker image built and pushed to GHCR
- [ ] Render deployment triggered
- [ ] Deployment completes without errors

### Post-Deployment

- [ ] Application is accessible
- [ ] Health endpoint returns OK
- [ ] Version endpoint shows new version
- [ ] Core functionality works
- [ ] No errors in logs

## Deployment Commands

### Run Local CI (Pre-Push)

```bash
npm run ci:local
```

This runs the full pipeline locally:
- TypeScript typecheck
- ESLint
- Prettier
- Server unit tests
- Client unit tests
- E2E tests (Playwright)
- Production Docker build

### Check GitHub Actions Status

```bash
# List recent workflow runs
gh run list --repo shaharido1/photo-album-project

# Watch a specific run
gh run watch <run-id>

# View run details
gh run view <run-id> --log
```

### Trigger Manual Deploy

```bash
# Deploy to Render
curl -X POST 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys' \
  -H 'Authorization: Bearer $RENDER_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Check Deploy Status

```bash
curl 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys?limit=1' \
  -H 'Authorization: Bearer $RENDER_API_KEY'
```

### Verify Deployment

```bash
# Check health
curl https://photo-album-project.onrender.com/api/health

# Check version
curl https://photo-album-project.onrender.com/api/version
```

## Version Management

### Automatic (Recommended)

Version is bumped automatically on push to main via pre-push hook.

### Manual Bumping

```bash
# Bump patch (1.0.0 → 1.0.1)
npm run version:bump

# Bump minor (1.0.0 → 1.1.0)
npm run version:bump:minor

# Bump major (1.0.0 → 2.0.0)
npm run version:bump:major
```

## Rollback Procedures

### Rollback to Previous Docker Image

```bash
# List available tags
# Go to: https://github.com/shaharido1/photo-album-project/pkgs/container/photo-album-project

# Update render.yaml to use specific version
# image:
#   url: ghcr.io/shaharido1/photo-album-project:1.0.5

# Trigger deploy
```

### Rollback to Git Tag

```bash
# List version tags
git tag -l "v*"

# Checkout specific version
git checkout v1.0.5
```

## Key Files

| File | Purpose |
|------|---------|
| [cicd.md](./cicd.md) | CI/CD pipeline details |
| [versioning.md](./versioning.md) | Version management |
| [monitoring.md](./monitoring.md) | Error monitoring & logs |

## DevOps Report Format

After deployment, report status:

```
## Deployment Report

### Status: [SUCCESS / FAILED]

### Pre-Deployment:
- [x] Local CI passed
- [x] Tests passed
- [x] Version bumped: 1.0.5 → 1.0.6

### Deployment:
- [x] GitHub Actions: PASSED
- [x] Docker image: ghcr.io/shaharido1/photo-album-project:1.0.6
- [x] Render deploy: COMPLETED

### Verification:
- [x] Health check: OK
- [x] Version check: 1.0.6
- [x] Core functionality: Working

### Issues Found:
- None (or list any issues)

### Live URL:
https://photo-album-project.onrender.com
```

## Pass Criteria (Feature Complete)

The feature is complete when:
1. Successfully deployed to production
2. Health check passes
3. Version endpoint shows new version
4. No errors in production logs
5. Core functionality verified working
