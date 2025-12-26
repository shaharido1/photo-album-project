# Monitoring & Logs

This document covers monitoring the deployed application and debugging production issues.

## Health Checks

### Quick Health Check

```bash
curl https://photo-album-project.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Version Check

```bash
curl https://photo-album-project.onrender.com/api/version
```

Expected response:
```json
{
  "version": "1.0.6"
}
```

## Render Dashboard

Access logs and metrics at:
https://dashboard.render.com

### Viewing Logs

1. Go to your service
2. Click "Logs" tab
3. View real-time or historical logs

### Log Filtering

In Render dashboard:
- Filter by time range
- Search for specific text
- Filter by log level

## Common Issues

### Application Not Responding

**Symptoms:**
- Health check fails
- Requests timeout

**Diagnosis:**
```bash
# Check if app is up
curl -I https://photo-album-project.onrender.com

# Check health
curl https://photo-album-project.onrender.com/api/health
```

**Solutions:**
1. Check Render logs for errors
2. Verify environment variables are set
3. Check if service is sleeping (free tier)
4. Trigger manual deploy

### Wrong Version Deployed

**Symptoms:**
- `/api/version` shows old version
- New features not working

**Diagnosis:**
```bash
# Check deployed version
curl https://photo-album-project.onrender.com/api/version

# Check latest image
# Go to GHCR and verify tags
```

**Solutions:**
1. Verify CI/CD completed successfully
2. Check Docker image was pushed
3. Trigger manual deploy to Render

### Firebase Errors

**Symptoms:**
- Auth not working
- Database operations failing

**Diagnosis:**
1. Check Render logs for Firebase errors
2. Verify environment variables
3. Check Firebase Console for issues

**Solutions:**
1. Verify all `FIREBASE_*` env vars are set
2. Check Firebase project quotas
3. Verify service account permissions

### Memory/Performance Issues

**Symptoms:**
- Slow responses
- Occasional crashes

**Diagnosis:**
1. Check Render metrics (Memory, CPU)
2. Look for memory leak patterns in logs

**Solutions:**
1. Optimize memory-heavy operations
2. Consider upgrading Render plan
3. Add pagination for large queries

## Debugging Production Issues

### Step 1: Check Logs

```bash
# View recent logs via Render Dashboard
# Or use Render CLI if available
```

Look for:
- Error messages
- Stack traces
- Unusual patterns

### Step 2: Verify Deployment

```bash
# Check version matches expected
curl https://photo-album-project.onrender.com/api/version

# Check health
curl https://photo-album-project.onrender.com/api/health
```

### Step 3: Test Locally

```bash
# Run with production-like settings
NODE_ENV=production npm run dev
```

### Step 4: Check Environment

Verify in Render Dashboard:
- All environment variables are set
- No typos in variable names
- Secrets are not expired

## Alerts (Future)

Currently manual monitoring. Future improvements:
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Add performance monitoring
- [ ] Set up Slack/email alerts

## Useful Commands

```bash
# Quick health check
curl -s https://photo-album-project.onrender.com/api/health | jq

# Check version
curl -s https://photo-album-project.onrender.com/api/version | jq

# Test auth endpoint
curl -s https://photo-album-project.onrender.com/api/auth/verify \
  -H "Authorization: Bearer TOKEN" | jq

# Check GitHub Actions status
gh run list --repo shaharido1/photo-album-project

# Check recent deploys
curl 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys?limit=5' \
  -H 'Authorization: Bearer $RENDER_API_KEY' | jq
```

## Incident Response

When something breaks:

1. **Assess** - What's broken? Who's affected?
2. **Communicate** - Note the issue
3. **Investigate** - Check logs, metrics
4. **Fix** - Deploy fix or rollback
5. **Verify** - Confirm resolution
6. **Document** - Note what happened and why
