#!/usr/bin/env node

/**
 * Git Hooks Installer
 *
 * Installs custom git hooks from scripts/hooks/ to .git/hooks/
 * Run this after cloning the repo or when hooks are updated.
 *
 * Usage: node scripts/install-hooks.js
 */

const {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  chmodSync,
  readdirSync,
} = require('fs');
const { join } = require('path');

const rootDir = join(__dirname, '..');
const hooksSourceDir = join(__dirname, 'hooks');
const gitHooksDir = join(rootDir, '.git', 'hooks');

function main() {
  console.log('Installing git hooks...\n');

  // Check if we're in a git repo
  if (!existsSync(join(rootDir, '.git'))) {
    console.error('Error: Not a git repository');
    process.exit(1);
  }

  // Ensure .git/hooks directory exists
  if (!existsSync(gitHooksDir)) {
    mkdirSync(gitHooksDir, { recursive: true });
  }

  // Check if hooks source directory exists
  if (!existsSync(hooksSourceDir)) {
    console.log('No hooks directory found at scripts/hooks/ - skipping hook installation.');
    return;
  }

  // Get all hooks from the source directory
  const hooks = readdirSync(hooksSourceDir);

  if (hooks.length === 0) {
    console.log('No hooks found to install.');
    return;
  }

  // Install each hook
  for (const hook of hooks) {
    const sourcePath = join(hooksSourceDir, hook);
    const destPath = join(gitHooksDir, hook);

    // Read and write the hook
    const content = readFileSync(sourcePath, 'utf8');
    writeFileSync(destPath, content);

    // Make executable
    chmodSync(destPath, '755');

    console.log(`  Installed: ${hook}`);
  }

  console.log(`\n${hooks.length} hook(s) installed successfully!`);
  console.log('\nHooks will now run automatically on git operations.');
}

main();
