# CI/CD Pipeline

This document describes the Continuous Integration and Continuous Deployment pipeline.

## Overview

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

Runs ESLint and Prettier:

```yaml
- name: Run ESLint
  run: npx eslint .

- name: Run Prettier check
  run: npx prettier --check "**/*.{js,jsx,ts,tsx,json}" --ignore-path .gitignore
```

### 2. Test Server Job

Runs Jest tests for Express API:

```bash
cd server && npm test
```

### 3. Test Client Job

Runs Jest + React Testing Library tests:

```bash
cd client && npm test
```

### 4. Test E2E Job

Runs Playwright browser tests:

```bash
npm run test:e2e
```

### 5. Build & Push Docker Image

Only runs on `main` branch after tests pass:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: |
      ghcr.io/shaharido1/photo-album-project:${{ version }}
      ghcr.io/shaharido1/photo-album-project:${{ sha }}
      ghcr.io/shaharido1/photo-album-project:latest
```

### 6. Create Git Tag

Creates version tag for traceability:

```yaml
- name: Create git tag
  run: |
    VERSION="v${{ version }}"
    git tag "$VERSION"
    git push origin "$VERSION"
```

### 7. Trigger Render Deploy

Optional webhook to trigger deployment:

```yaml
- name: Trigger Render deploy
  run: curl -X POST "$RENDER_DEPLOY_HOOK_URL"
```

## GitHub Secrets Required

| Secret | Description | How to Get |
|--------|-------------|------------|
| `GITHUB_TOKEN` | Auto-provided | Automatic |
| `RENDER_DEPLOY_HOOK_URL` | Render webhook | Render Dashboard → Service → Settings |
| `FIREBASE_*` | Firebase credentials | Firebase Console |
| `VITE_FIREBASE_*` | Client Firebase config | Firebase Console |

## Local CI Pipeline

Before pushing, run the full pipeline locally:

```bash
npm run ci:local
```

This runs in Docker matching the GitHub Actions environment:
- TypeScript typecheck
- ESLint
- Prettier
- Server unit tests
- Client unit tests
- E2E tests (Playwright)
- Production Docker build

## Render Configuration

```yaml
# render.yaml
services:
  - type: web
    name: photo-album-project
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

Key settings:
- `runtime: image` - Pulls pre-built image
- `autoDeploy: false` - Deploys triggered by GitHub Actions

## Benefits

1. **No Redundant Builds** - GitHub builds once, Render pulls
2. **Fast Deploys** - ~10 seconds on Render
3. **Consistent Images** - Same image tested = deployed
4. **Audit Trail** - Images tagged with version + SHA
5. **Rollback Capability** - Deploy any previous version

## Workflow File

Full configuration: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
