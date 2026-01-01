# Version Management

This document describes the version management system.

## Overview

The project uses semantic versioning (semver) with **developer-driven versioning**.

**Key principle:** Version bumps happen on feature branches before merging to main. CI verifies the version was incremented but does not bump it automatically.

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
│              Developer creates feature branch                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Developer implements feature                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Developer bumps version                             │
├─────────────────────────────────────────────────────────────────┤
│  npm run version:bump                                           │
│  git add -A && git commit -m "Bump version"                     │
│  git push                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Create Pull Request                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CI: Version Check                                   │
├─────────────────────────────────────────────────────────────────┤
│  • Compares PR version vs main version                          │
│  • FAILS if PR version <= main version                          │
│  • Passes if PR version > main version                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CI: After merge to main                             │
├─────────────────────────────────────────────────────────────────┤
│  • Tags Docker image with version                               │
│  • Creates Git tag (v1.0.1)                                     │
│  • Deploys to Render                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Developer Workflow

### Before Creating a PR

**You MUST bump the version before your PR will pass CI:**

```bash
# 1. Bump the version
npm run version:bump

# 2. Commit the version change
git add -A
git commit -m "Bump version to $(node -p \"require('./package.json').version\")"

# 3. Push and create PR
git push
```

### Version Bump Commands

```bash
# Bump patch (1.0.0 → 1.0.1) - most common
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
| Documentation only | Patch (if PR to main) |

**Rule of thumb:** If it's going to main, bump the version.

## CI Version Check

The CI pipeline includes a `version-check` job that runs on pull requests:

1. Gets the version from your PR branch
2. Gets the version from main branch
3. Compares them
4. **Fails if your version is not greater than main**

If the check fails, you'll see:
```
❌ ERROR: Version must be incremented!

Current main version: 1.0.5
Your PR version:      1.0.5

Please run: npm run version:bump
Then commit and push the changes.
```

## Docker Image Tags

Each image gets multiple tags:

| Tag | Example |
|-----|---------|
| Version | `ghcr.io/shaharido1/photo-album-project:1.0.5` |
| SHA | `ghcr.io/shaharido1/photo-album-project:abc1234` |
| Latest | `ghcr.io/shaharido1/photo-album-project:latest` |

## Git Tags

CI creates git tags for each version after merge to main:

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

## Files

| File | Purpose |
|------|---------|
| `scripts/bump-version.js` | Version bumping logic |
| `.github/workflows/ci.yml` | CI with version check |
