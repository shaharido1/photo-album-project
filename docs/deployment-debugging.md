# Deployment Debugging Guide

This guide helps diagnose and fix deployment issues when the live site doesn't match the latest code.

## Quick Diagnosis

Run the comprehensive debug scripts to identify issues:

```bash
# Full version comparison (local vs GHCR vs Render)
npm run debug:versions

# GitHub Actions workflow status
npm run debug:workflow

# Render service and deployment status
npm run debug:render

# Run all debug scripts
npm run debug:all

# Simple deployment check
npm run check:deployment
```

---

## Debug Scripts Reference

| Script             | Command                    | Purpose                                   |
| ------------------ | -------------------------- | ----------------------------------------- |
| `debug:versions`   | `npm run debug:versions`   | Compare versions across local/GHCR/Render |
| `debug:workflow`   | `npm run debug:workflow`   | Inspect GitHub Actions runs and failures  |
| `debug:render`     | `npm run debug:render`     | Check Render service status and deploys   |
| `debug:all`        | `npm run debug:all`        | Run all debug scripts sequentially        |
| `check:deployment` | `npm run check:deployment` | Quick check if deployed version matches   |

### What Each Script Does

#### `debug:versions` (scripts/debug-versions.js)

- Shows local package.json version and git commit
- Checks if local is ahead/behind origin/main
- Fetches GHCR container image versions and tags
- Queries deployed /api/version endpoint
- Gets latest CI workflow run info
- **Compares all SHAs and reports mismatches**

#### `debug:workflow` (scripts/debug-github-workflow.js)

- Lists recent GitHub Actions workflow runs
- Shows job-level status (lint, test, build, deploy)
- Compares local HEAD with latest CI run SHA
- **Displays failed job logs automatically**
- Provides quick gh commands for further inspection

#### `debug:render` (scripts/debug-render.js)

- Checks Render API key validity
- Shows service status (including suspended state)
- Lists recent deployments with status
- Tests live endpoints (/, /api/health, /api/version, /api/hello)
- Shows environment variables
- **Can trigger new deployment with `--deploy` flag**

---

## Common Issues and Fixes

### 1. CI Pipeline Failed (Most Common)

**Symptom:** Latest commit shows `failure` in CI workflow

**Diagnosis:**

```bash
npm run debug:workflow
# Look for ❌ in job status and check failed job logs
```

**Common Causes:**

- ESLint errors (prop-types, unused variables)
- Test failures
- Prettier formatting issues

**Fix:**

```bash
# Fix lint issues
npx eslint . --fix
npx prettier --write .

# Run tests locally
npm test
npm run test:e2e

# Commit fixes and push
git add .
git commit -m "Fix lint/test issues"
git push
```

### 2. Render Service Suspended

**Symptom:** `debug:render` shows `Suspended: ⚠️ YES`

**Diagnosis:**

```bash
npm run debug:render
# Check "Suspended" field in Service Status
```

**Cause:** Free tier services are suspended after 15 minutes of inactivity.

**Fix:**

1. Visit the live URL to wake it up: https://photo-album-project.onrender.com
2. Or trigger a manual deploy:

```bash
node scripts/debug-render.js --deploy
```

### 3. Version Mismatch (GHCR vs Deployed)

**Symptom:** GHCR image SHA differs from deployed SHA

**Diagnosis:**

```bash
npm run debug:versions
# Compare "GHCR :latest" row with "Render Deployed" row
```

**Cause:** Render didn't pull the latest image after CI pushed it.

**Fix:**

```bash
# Trigger new Render deployment
node scripts/debug-render.js --deploy

# Or via curl
curl -X POST 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys' \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### 4. Local Changes Not Pushed

**Symptom:** Local SHA differs from CI run SHA

**Diagnosis:**

```bash
npm run debug:versions
# Look for "Local is X commit(s) AHEAD of origin/main"
```

**Fix:**

```bash
git push origin main
```

### 5. New Endpoints Return HTML

**Symptom:** API endpoints return HTML instead of JSON

**Diagnosis:**

```bash
# Check endpoint locally
curl http://localhost:3001/api/your-endpoint

# Check on production
curl https://photo-album-project.onrender.com/api/your-endpoint
```

If local works but production returns HTML, the deployment is stale.

**Fix:** Follow steps for "Version Mismatch" above.

---

## Step-by-Step Debugging

### Step 1: Run Version Comparison

```bash
npm run debug:versions
```

This will show you:

- Whether your local code is pushed
- Whether CI built and pushed an image
- Whether Render deployed the latest image

### Step 2: Check CI Status

If CI shows failure:

```bash
npm run debug:workflow
```

Look at the failed job logs and fix the issues locally.

### Step 3: Check Render Status

```bash
npm run debug:render
```

Look for:

- **Suspended: YES** → Service needs to wake up
- **Recent deploys with UPDATE_FAILED** → Check Render logs in dashboard
- **Endpoints returning errors** → Check application logs

### Step 4: Trigger Manual Deploy (if needed)

```bash
# Via script
node scripts/debug-render.js --deploy

# Via Render API
curl -X POST 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys' \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Via Render Dashboard
# Go to Dashboard → Service → Manual Deploy → Clear build cache & deploy
```

---

## Manual Debugging Commands

### GitHub Actions

```bash
# List recent workflow runs
gh run list --repo shaharido1/photo-album-project --limit 5

# View specific run details
gh run view <run-id> --repo shaharido1/photo-album-project

# View failed job logs
gh run view <run-id> --repo shaharido1/photo-album-project --log-failed

# Watch a running workflow
gh run watch <run-id> --repo shaharido1/photo-album-project

# Re-run failed workflow
gh run rerun <run-id> --repo shaharido1/photo-album-project
```

### GHCR (GitHub Container Registry)

```bash
# Check image versions (requires read:packages scope)
gh api /users/shaharido1/packages/container/photo-album-project/versions --jq '.[0:5]'
```

Or visit: https://github.com/shaharido1/photo-album-project/pkgs/container/photo-album-project

### Render API

```bash
# Set API key
export RENDER_API_KEY="your-api-key"

# Check service status
curl -s "https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq

# List recent deployments
curl -s "https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys?limit=5" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq

# Trigger new deployment
curl -X POST "https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Check environment variables
curl -s "https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq
```

---

## Render Configuration Reference

| Setting    | Value                                           |
| ---------- | ----------------------------------------------- |
| Service ID | `srv-d56juo6uk2gs73ci8bgg`                      |
| Owner ID   | `tea-d56jpkeuk2gs73ci5rdg`                      |
| Image URL  | `ghcr.io/shaharido1/photo-album-project:latest` |
| Live URL   | https://photo-album-project.onrender.com        |
| Region     | Virginia                                        |
| Plan       | Free                                            |

### Environment Variables

Ensure these are set in Render:

| Variable   | Value        |
| ---------- | ------------ |
| `NODE_ENV` | `production` |
| `PORT`     | `10000`      |

---

## CI/CD Pipeline Flow

```
Push to main
    ↓
GitHub Actions triggered
    ↓
┌─────────────────────────────────────────┐
│ 1. Lint (ESLint + Prettier)             │
│    └─→ Fails? Fix lint errors locally   │
├─────────────────────────────────────────┤
│ 2. Test Server (Jest)                   │
│    └─→ Fails? Fix server tests          │
├─────────────────────────────────────────┤
│ 3. Test Client (Jest + RTL)             │
│    └─→ Fails? Fix client tests          │
├─────────────────────────────────────────┤
│ 4. E2E Tests (Playwright)               │
│    └─→ Fails? Fix E2E tests             │
├─────────────────────────────────────────┤
│ 5. Build & Push Docker Image to GHCR    │
│    └─→ Fails? Check Docker build        │
├─────────────────────────────────────────┤
│ 6. Trigger Render Deploy                │
│    └─→ Fails? Check RENDER_DEPLOY_HOOK  │
└─────────────────────────────────────────┘
    ↓
Render pulls new image
    ↓
Live at https://photo-album-project.onrender.com
```

---

## Troubleshooting Checklist

- [ ] Run `npm run debug:versions` to identify where the issue is
- [ ] If CI failed → Run `npm run debug:workflow` and fix errors
- [ ] If CI passed but Render outdated → `node scripts/debug-render.js --deploy`
- [ ] If Render suspended → Visit live URL or trigger deploy
- [ ] If local not pushed → `git push origin main`
- [ ] Verify fix with `npm run check:deployment`

---

## Useful Links

- [GitHub Actions Runs](https://github.com/shaharido1/photo-album-project/actions)
- [GHCR Package](https://github.com/shaharido1/photo-album-project/pkgs/container/photo-album-project)
- [Render Dashboard](https://dashboard.render.com)
- [Render API Docs](https://api-docs.render.com/reference/introduction)

---

## Current Issue (Last Updated: 2025-12-25)

**Issue Found:** CI Pipeline Failing at Lint Step

**Root Cause:** ESLint errors in React components:

- `react/prop-types` violations in multiple files
- `react-hooks/set-state-in-effect` warning in EditorCanvas.jsx

**Files with Issues:**

- `client/src/__mocks__/react-konva.js` - missing children prop-types
- `client/src/components/album/CreateAlbumDialog.jsx` - missing prop-types
- `client/src/components/layout/EditorCanvas.jsx` - setState in useEffect + missing prop-types
- `client/src/components/layout/PageTimeline.jsx` - missing prop-types

**Additional Finding:** Render service shows as suspended (expected for free tier after inactivity).

**Fix Required:** Add PropTypes to affected components or disable the `react/prop-types` rule in eslint config for specific files.
