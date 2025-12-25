#!/usr/bin/env node

/**
 * Deployment Version Check Script
 * Compares local package.json version with deployed version
 */

const fs = require('fs');
const path = require('path');

const DEPLOYED_URL = 'https://photo-album-project.onrender.com';

async function checkDeployment() {
  console.log('🔍 Checking deployment status...\n');

  // Read local version
  const localPackageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
  );
  const localVersion = localPackageJson.version;
  console.log(`📦 Local version: ${localVersion}`);

  // Check deployed version
  try {
    const response = await fetch(`${DEPLOYED_URL}/api/version`);
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      console.log(`❌ Deployed version: ENDPOINT NOT FOUND`);
      console.log(
        `   (Got HTML instead of JSON - endpoint may not be deployed)\n`
      );
      console.log('⚠️  DEPLOYMENT MISMATCH DETECTED');
      console.log(
        '   The /api/version endpoint is not available on production.'
      );
      console.log('   This indicates the latest code has not been deployed.\n');
      await checkEndpoints();
      return { mismatch: true, reason: 'endpoint_missing' };
    }

    const data = await response.json();
    const deployedVersion = data.version;
    console.log(`🌐 Deployed version: ${deployedVersion}\n`);

    if (localVersion !== deployedVersion) {
      console.log('⚠️  VERSION MISMATCH DETECTED');
      console.log(`   Local: ${localVersion}`);
      console.log(`   Deployed: ${deployedVersion}\n`);
      return {
        mismatch: true,
        reason: 'version_mismatch',
        local: localVersion,
        deployed: deployedVersion,
      };
    }

    console.log('✅ Versions match!');
    await checkEndpoints();
    return { mismatch: false };
  } catch (error) {
    console.log(`❌ Error checking deployed version: ${error.message}\n`);
    return { mismatch: true, reason: 'error', error: error.message };
  }
}

async function checkEndpoints() {
  console.log('\n📡 Checking API endpoints...\n');

  const endpoints = [
    { path: '/api/hello', expected: { message: 'Hello World' } },
    { path: '/api/health', expected: 'status: ok' },
    { path: '/api/foo', expected: { value: 'foo' } },
    { path: '/api/version', expected: 'version' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${DEPLOYED_URL}${endpoint.path}`);
      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        console.log(`❌ ${endpoint.path} - NOT FOUND (returns HTML)`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ ${endpoint.path} - OK (${JSON.stringify(data)})`);
    } catch (error) {
      console.log(`❌ ${endpoint.path} - ERROR: ${error.message}`);
    }
  }
}

// Run the check
checkDeployment().then((result) => {
  console.log('\n' + '='.repeat(50));
  if (result.mismatch) {
    console.log('\n🚨 DEPLOYMENT ISSUE DETECTED');
    console.log(
      '   See docs/deployment-debugging.md for troubleshooting steps.\n'
    );
    process.exit(1);
  } else {
    console.log('\n✅ Deployment looks healthy!\n');
    process.exit(0);
  }
});
