# Version Management

This document describes the version management system.

## Overview

The project uses semantic versioning (semver) with automated bumping.

Versions are synchronized across:
- Root `package.json`
- Client `package.json`
- Server `package.json`
- Docker image labels
- Git tags

## Version Format

```
MAJOR.MINOR.PATCH
  │      │     │
  │      │     └── Bug fixes, small changes
  │      └──────── New features (backward compatible)
  └─────────────── Breaking changes
```

## Version Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer pushes to main                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Pre-push Git Hook                           │
├─────────────────────────────────────────────────────────────────┤
│  • Bumps patch version (1.0.0 → 1.0.1)                         │
│  • Updates all package.json files                               │
│  • Amends commit to include version bump                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                              │
├─────────────────────────────────────────────────────────────────┤
│  • Tags Docker image with version                               │
│  • Creates Git tag (v1.0.1)                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Manual Version Bumping

```bash
# Bump patch (1.0.0 → 1.0.1)
npm run version:bump

# Bump minor (1.0.0 → 1.1.0)
npm run version:bump:minor

# Bump major (1.0.0 → 2.0.0)
npm run version:bump:major
```

Or run the script directly:

```bash
node scripts/bump-version.js [major|minor|patch]
```

## When to Bump What

| Change Type | Version Bump |
|-------------|--------------|
| Bug fix | Patch |
| New feature (backward compatible) | Minor |
| Breaking change | Major |
| Documentation only | No bump needed |

## Git Hooks

### Pre-push Hook

Automatically bumps patch version when pushing to `main`.

**Installation:**

```bash
# Automatic (runs on npm install)
npm install

# Manual
node scripts/install-hooks.js
```

**Bypass (not recommended):**

```bash
git push --no-verify
```

## Docker Image Tags

Each image gets multiple tags:

| Tag | Example |
|-----|---------|
| Version | `ghcr.io/shaharido1/photo-album-project:1.0.5` |
| SHA | `ghcr.io/shaharido1/photo-album-project:abc1234` |
| Latest | `ghcr.io/shaharido1/photo-album-project:latest` |

## Git Tags

CI creates git tags for each version:

```bash
# List version tags
git tag -l "v*"

# Checkout specific version
git checkout v1.0.5
```

## Checking Current Version

```bash
# From package.json
node -p "require('./package.json').version"

# From deployed app
curl https://photo-album-project.onrender.com/api/version

# From Docker image
docker inspect ghcr.io/shaharido1/photo-album-project:latest \
  --format '{{index .Config.Labels "org.opencontainers.image.version"}}'
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run version:bump` | Bump patch version |
| `npm run version:bump:minor` | Bump minor version |
| `npm run version:bump:major` | Bump major version |
| `npm run prepare` | Install git hooks |

## Files

| File | Purpose |
|------|---------|
| `scripts/bump-version.js` | Version bumping logic |
| `scripts/install-hooks.js` | Git hooks installer |
| `scripts/hooks/pre-push` | Pre-push hook source |
