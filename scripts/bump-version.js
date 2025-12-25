#!/usr/bin/env node

/**
 * Version Bump Script
 *
 * Bumps the patch version in package.json files and syncs them across:
 * - Root package.json
 * - Client package.json
 * - Server package.json
 *
 * Usage:
 *   node scripts/bump-version.js [major|minor|patch]
 *   Default: patch
 */

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const rootDir = join(__dirname, '..');

const packageFiles = [
  join(rootDir, 'package.json'),
  join(rootDir, 'client', 'package.json'),
  join(rootDir, 'server', 'package.json'),
];

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(version, type = 'patch') {
  const parsed = parseVersion(version);

  switch (type) {
    case 'major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      break;
    case 'minor':
      parsed.minor += 1;
      parsed.patch = 0;
      break;
    case 'patch':
    default:
      parsed.patch += 1;
      break;
  }

  return formatVersion(parsed);
}

function main() {
  const bumpType = process.argv[2] || 'patch';

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error(`Invalid bump type: ${bumpType}`);
    console.error('Usage: node scripts/bump-version.js [major|minor|patch]');
    process.exit(1);
  }

  // Read current version from root package.json
  const rootPackagePath = packageFiles[0];
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
  const currentVersion = rootPackage.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(
    `Bumping version: ${currentVersion} -> ${newVersion} (${bumpType})`
  );

  // Update all package.json files
  for (const filePath of packageFiles) {
    const pkg = JSON.parse(readFileSync(filePath, 'utf8'));
    pkg.version = newVersion;
    writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  Updated: ${filePath}`);
  }

  console.log(`\nVersion bumped to ${newVersion}`);
  console.log('Remember to commit and push these changes!');

  // Output just the version for scripting purposes
  if (process.env.OUTPUT_VERSION_ONLY === 'true') {
    process.stdout.write(newVersion);
  }
}

main();
