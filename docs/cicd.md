# CI/CD Pipeline

This document describes the Continuous Integration and Continuous Deployment pipeline.

## Overview

The CI/CD pipeline uses **GitHub Actions** for testing and building, and **Render** for hosting. Docker images are stored in **GitHub Container Registry (GHCR)**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Push to GitHub (main)                        │
│              (Pre-push hook bumps version)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Lint        │ ESLint + Prettier check                       │
│  2. Test Server │ Jest tests for API endpoints                  │
│  3. Test Client │ Jest + RTL tests for React components         │
│  4. Test E2E    │ Playwright browser tests                      │
│  5. Build       │ Docker multi-stage build (with version)       │
│  6. Push        │ Push image to ghcr.io (version + sha tags)    │
│  7. Tag         │ Create git tag (v1.0.1)                       │
│  8. Deploy      │ Trigger Render deploy hook (optional)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Render                                   │
├─────────────────────────────────────────────────────────────────┤
│  • Pulls pre-built image from GHCR                              │
│  • Deploys container (no build needed!)                         │
│  • Deploy time: ~10 seconds                                     │
│                                                                  │
│  URL: https://photo-album-project.onrender.com                  │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Jobs

### 1. Lint Job

Runs ESLint and Prettier to ensure code quality.

```yaml
- name: Run ESLint
  run: npx eslint .

- name: Run Prettier check
  run: npx prettier --check "**/*.{js,jsx,json}" --ignore-path .gitignore
```

**ESLint Configuration:** Uses flat config format (ESLint v9) in `eslint.config.js`.

### 2. Test Server Job

Runs Jest tests for the Express API.

```bash
cd server && npm test
```

Tests:

- `GET /api/hello` - Returns greeting message
- `GET /api/health` - Returns health status

### 3. Test Client Job

Runs Jest + React Testing Library tests.

```bash
cd client && npm test
```

Tests:

- Loading state rendering
- Success state with greeting message
- Error state handling

### 4. Build & Push Docker Image

Only runs on `main` branch after tests pass.

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/shaharido1/photo-album-project:latest
```

**Image Tags:**

- `<version>` - Semantic version from package.json (e.g., `1.0.1`)
- `latest` - Always points to newest build
- `<sha>` - Git commit SHA for traceability

See [Versioning](versioning.md) for details on version management.

### 5. Create Git Tag

After pushing the Docker image, the pipeline creates a Git tag for the version:

```yaml
- name: Create git tag for version
  run: |
    VERSION="v${{ steps.version.outputs.version }}"
    if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
      git tag "$VERSION"
      git push origin "$VERSION"
    fi
```

This creates tags like `v1.0.1`, `v1.0.2`, etc. for each deployment.

**List version tags:**

```bash
git tag -l "v*"
```

**Checkout a specific version:**

```bash
git checkout v1.0.1
```

### 6. Trigger Render Deploy

Optional step that triggers Render deployment via webhook.

```yaml
- name: Trigger Render deploy
  env:
    RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
  run: |
    if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
      curl -X POST "$RENDER_DEPLOY_HOOK_URL"
    fi
```

## GitHub Secrets Required

| Secret                   | Description                     | How to Get                                          |
| ------------------------ | ------------------------------- | --------------------------------------------------- |
| `GITHUB_TOKEN`           | Auto-provided by GitHub Actions | Automatic                                           |
| `RENDER_DEPLOY_HOOK_URL` | Render deploy webhook           | Render Dashboard → Service → Settings → Deploy Hook |

## Render Configuration

The service is configured to pull from GHCR instead of building:

```yaml
# render.yaml
services:
  - type: web
    name: hello-world-app
    runtime: image
    image:
      url: ghcr.io/shaharido1/photo-album-project:latest
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    autoDeploy: false
```

**Key Settings:**

- `runtime: image` - Pulls pre-built image instead of building
- `autoDeploy: false` - Deploys are triggered by GitHub Actions

## Local CI Pipeline

Before pushing to GitHub, you can run the entire CI pipeline locally using Docker:

```bash
npm run ci:local
```

This runs the full pipeline in Docker, matching the GitHub Actions environment:

- TypeScript typecheck
- ESLint
- Prettier
- Server unit tests
- Client unit tests
- E2E tests (Playwright)
- Production Docker build validation

**How it works:**

The `Dockerfile.ci` file defines a multi-stage build that:

1. **Stage 1** - Mirrors the production Dockerfile to verify it builds correctly
2. **Stage 2** - Runs all tests in a Node.js environment with Playwright installed
3. **Final stage** - Reports success/failure

If all checks pass, you'll see:

```
✅ All CI checks passed!
Safe to push to main branch.
```

If any check fails, the build stops and shows the error.

## Manual Operations

### Trigger Deploy via CLI

```bash
# Using Render API
curl -X POST 'https://api.render.com/v1/services/srv-xxx/deploys' \
  -H 'Authorization: Bearer $RENDER_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Check Deploy Status

```bash
curl 'https://api.render.com/v1/services/srv-xxx/deploys?limit=1' \
  -H 'Authorization: Bearer $RENDER_API_KEY'
```

### View GitHub Actions Logs

```bash
gh run list --repo shaharido1/photo-album-project
gh run view <run-id> --log
```

## Workflow File

The complete workflow is defined in [.github/workflows/ci.yml](../.github/workflows/ci.yml).

## Benefits of This Architecture

1. **No Redundant Builds** - GitHub builds once, Render just pulls
2. **Fast Deploys** - ~10 seconds on Render vs ~2 minutes building
3. **Consistent Images** - Same image tested in CI is deployed to production
4. **Semantic Versioning** - Every deploy has a unique version (1.0.1, 1.0.2, etc.)
5. **Audit Trail** - Docker images tagged with version + commit SHA
6. **Rollback Capability** - Can deploy any previous image by version or SHA
7. **Git Tags** - Each version creates a git tag for easy reference

## Related Documentation

- [Versioning](versioning.md) - Version management, hooks, and tagging
- [Architecture](architecture.md) - Tech stack and project structure
