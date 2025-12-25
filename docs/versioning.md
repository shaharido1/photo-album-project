# Version Management

This document describes the version management system for the Photo Album project.

## Overview

The project uses semantic versioning (semver) with automated version bumping on deployments. Versions are synchronized across:

- Root `package.json`
- Client `package.json`
- Server `package.json`
- Docker image labels
- Git tags

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
│  • Bumps patch version (e.g., 1.0.0 → 1.0.1)                   │
│  • Updates all package.json files                               │
│  • Amends commit to include version bump                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Actions CI/CD                        │
├─────────────────────────────────────────────────────────────────┤
│  • Reads version from package.json                              │
│  • Tags Docker image with version (e.g., 1.0.1)                 │
│  • Creates Git tag (e.g., v1.0.1)                               │
│  • Deploys to Render                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Manual Version Bumping

You can manually bump versions using npm scripts:

```bash
# Bump patch version (1.0.0 → 1.0.1)
npm run version:bump

# Bump minor version (1.0.0 → 1.1.0)
npm run version:bump:minor

# Bump major version (1.0.0 → 2.0.0)
npm run version:bump:major
```

Or run the script directly:

```bash
node scripts/bump-version.js [major|minor|patch]
```

## Git Hooks

### Pre-push Hook

The pre-push hook automatically bumps the patch version when pushing to the `main` branch. This ensures every deployment has a unique version.

**Installation:**

```bash
# Automatic (runs on npm install via prepare script)
npm install

# Manual
node scripts/install-hooks.js
```

**Behavior:**

1. Detects push to `main` branch
2. Bumps patch version in all package.json files
3. Amends the last commit to include version changes
4. Continues with the push

**Bypass (not recommended):**

```bash
git push --no-verify
```

## Docker Image Tags

Each Docker image is tagged with multiple identifiers:

| Tag             | Description                      | Example                                            |
| --------------- | -------------------------------- | -------------------------------------------------- |
| `<version>`     | Semantic version from package.json | `ghcr.io/shaharido1/photo-album-project:1.0.1`   |
| `<sha>`         | Git commit SHA                   | `ghcr.io/shaharido1/photo-album-project:abc1234` |
| `latest`        | Always points to newest build    | `ghcr.io/shaharido1/photo-album-project:latest`  |

## Git Tags

The CI/CD pipeline creates Git tags for each version:

```bash
# List all version tags
git tag -l "v*"

# Checkout a specific version
git checkout v1.0.1
```

## Checking Current Version

```bash
# From package.json
node -p "require('./package.json').version"

# From Docker image
docker inspect ghcr.io/shaharido1/photo-album-project:latest \
  --format '{{index .Config.Labels "org.opencontainers.image.version"}}'

# From deployed app (if version endpoint exists)
curl https://photo-album-project.onrender.com/api/version
```

## Scripts Reference

| Script                        | Description                    |
| ----------------------------- | ------------------------------ |
| `npm run version:bump`        | Bump patch version             |
| `npm run version:bump:minor`  | Bump minor version             |
| `npm run version:bump:major`  | Bump major version             |
| `npm run prepare`             | Install git hooks              |

## Files

| File                           | Purpose                        |
| ------------------------------ | ------------------------------ |
| `scripts/bump-version.js`      | Version bumping logic          |
| `scripts/install-hooks.js`     | Git hooks installer            |
| `scripts/hooks/pre-push`       | Pre-push hook source           |
| `.git/hooks/pre-push`          | Installed pre-push hook        |
