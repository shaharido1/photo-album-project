# Deployment Debugging Guide

This guide helps diagnose and fix deployment issues when the live site doesn't match the latest code.

## Quick Check

Run the deployment check script to compare local vs deployed versions:

```bash
npm run check:deployment
```

This will:
1. Compare local `package.json` version with deployed `/api/version`
2. Check if all API endpoints are available
3. Report any mismatches

## Common Issues

### 1. New Endpoints Not Available

**Symptom:** API endpoints return HTML instead of JSON (the frontend is served instead)

**Diagnosis:**
```bash
# Check endpoint locally
curl http://localhost:3001/api/foo

# Check endpoint on production
curl https://photo-album-project.onrender.com/api/foo
```

If local works but production returns HTML, the deployment is stale.

### 2. Version Mismatch

**Symptom:** `/api/version` returns a different version than `package.json`

**Cause:** The deployed Docker image is outdated.

---

## Debugging Steps

### Step 1: Check GitHub Actions Status

```bash
# List recent workflow runs
gh run list --repo shaharido1/photo-album-project --limit 5

# View details of a specific run
gh run view <run-id>

# Watch a running workflow
gh run watch <run-id>
```

Or visit: https://github.com/shaharido1/photo-album-project/actions

**Look for:**
- Did the latest push trigger a workflow?
- Did all jobs pass (lint, test, build, push)?
- Did the deploy step run?

### Step 2: Check GHCR Image

Verify the latest image was pushed to GitHub Container Registry:

```bash
# Check image tags via GitHub CLI
gh api /user/packages/container/photo-album-project/versions --jq '.[0]'
```

Or visit: https://github.com/shaharido1/photo-album-project/pkgs/container/photo-album-project

**Look for:**
- When was the `latest` tag updated?
- Does the commit SHA match your latest commit?

### Step 3: Check Render Deployment Status

#### Via Render Dashboard

1. Go to https://dashboard.render.com
2. Select the `photo-album-project` service
3. Check "Events" tab for recent deployments
4. Check "Logs" tab for runtime errors

#### Via Render API

```bash
# Set your API key
export RENDER_API_KEY="your-api-key"

# Check recent deployments
curl -s 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys?limit=5' \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq '.[] | {id, status, createdAt, finishedAt}'

# Check service status
curl -s 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg' \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq '{name, suspended, serviceDetails}'
```

### Step 4: Check Render Logs

#### Via Dashboard

1. Go to Render Dashboard → Service → Logs
2. Look for startup errors or image pull failures

#### Via API

```bash
# Get recent logs (requires Render Team/Pro plan for API access)
curl 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/logs' \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

---

## Fixing Deployment Issues

### Option 1: Trigger Manual Deploy

If the image is correct but Render didn't deploy:

```bash
# Via Render API
curl -X POST 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys' \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Or use the deploy hook URL in Render Dashboard → Settings → Deploy Hook.

### Option 2: Re-run GitHub Actions

If the image wasn't built or pushed:

```bash
# Re-run the latest workflow
gh run rerun <run-id>

# Or trigger a new run by pushing an empty commit
git commit --allow-empty -m "Trigger CI/CD"
git push
```

### Option 3: Force Image Pull on Render

Sometimes Render caches the old image. To force a fresh pull:

1. Go to Render Dashboard → Service → Settings
2. Click "Manual Deploy" → "Clear build cache & deploy"

Or update the image tag temporarily and then back to `latest`.

### Option 4: Check Render Service Configuration

Verify Render is pulling from GHCR correctly:

1. Dashboard → Service → Settings → Image
2. Confirm URL is: `ghcr.io/shaharido1/photo-album-project:latest`
3. Confirm credentials are set for GHCR access

---

## Render Configuration Reference

| Setting | Value |
|---------|-------|
| Service ID | `srv-d56juo6uk2gs73ci8bgg` |
| Owner ID | `tea-d56jpkeuk2gs73ci5rdg` |
| Image URL | `ghcr.io/shaharido1/photo-album-project:latest` |
| Live URL | https://photo-album-project.onrender.com |

---

## Environment Variables

Ensure these are set in Render:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

---

## Useful Links

- [GitHub Actions Runs](https://github.com/shaharido1/photo-album-project/actions)
- [GHCR Package](https://github.com/shaharido1/photo-album-project/pkgs/container/photo-album-project)
- [Render Dashboard](https://dashboard.render.com)
- [Render API Docs](https://api-docs.render.com/reference/introduction)

---

## Checklist for Debugging

- [ ] Run `npm run check:deployment` to confirm issue
- [ ] Check GitHub Actions - did CI pass?
- [ ] Check GHCR - was image pushed?
- [ ] Check Render - did deployment trigger?
- [ ] Check Render logs - any runtime errors?
- [ ] Trigger manual deploy if needed
- [ ] Re-run `npm run check:deployment` to verify fix
