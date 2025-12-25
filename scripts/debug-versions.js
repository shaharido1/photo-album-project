#!/usr/bin/env node

/**
 * Version Comparison Debug Script
 * Compares versions across local, GHCR, and Render deployed instances
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'shaharido1/photo-album-project';
const LIVE_URL = 'https://photo-album-project.onrender.com';

async function getLocalVersion() {
  console.log('📦 Local Version Info\n');
  console.log('='.repeat(80));

  try {
    // Package.json version
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`package.json version: ${packageJson.version}`);

    // Git commit info
    const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const gitShortSha = gitSha.substring(0, 7);
    const gitMessage = execSync('git log -1 --format=%s', {
      encoding: 'utf-8',
    }).trim();
    const gitDate = execSync('git log -1 --format=%ci', {
      encoding: 'utf-8',
    }).trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim();

    console.log(`\nGit Info:`);
    console.log(`  Branch: ${gitBranch}`);
    console.log(`  Commit SHA: ${gitSha}`);
    console.log(`  Short SHA: ${gitShortSha}`);
    console.log(`  Message: ${gitMessage}`);
    console.log(`  Date: ${gitDate}`);

    // Check if local is ahead of remote
    try {
      execSync('git fetch origin main --quiet', { encoding: 'utf-8' });
      const aheadBehind = execSync(
        'git rev-list --left-right --count origin/main...HEAD',
        { encoding: 'utf-8' }
      ).trim();
      const [behind, ahead] = aheadBehind.split('\t').map(Number);

      if (ahead > 0) {
        console.log(`\n⚠️ Local is ${ahead} commit(s) AHEAD of origin/main`);
        console.log('   Run: git push origin main');
      }
      if (behind > 0) {
        console.log(`\n⚠️ Local is ${behind} commit(s) BEHIND origin/main`);
        console.log('   Run: git pull origin main');
      }
      if (ahead === 0 && behind === 0) {
        console.log('\n✅ Local is in sync with origin/main');
      }
    } catch {
      console.log('\n⚠️ Could not compare with remote (fetch failed)');
    }

    console.log('\n' + '='.repeat(80));

    return {
      version: packageJson.version,
      sha: gitSha,
      shortSha: gitShortSha,
      message: gitMessage,
      date: gitDate,
      branch: gitBranch,
    };
  } catch (error) {
    console.log('❌ Failed to get local version:', error.message);
    return null;
  }
}

async function getGhcrVersion() {
  console.log('\n🐳 GHCR (GitHub Container Registry) Version Info\n');
  console.log('='.repeat(80));

  try {
    // Get package versions using GitHub CLI
    const result = execSync(
      `gh api /users/shaharido1/packages/container/photo-album-project/versions --jq '.[0:5]'`,
      { encoding: 'utf-8' }
    );

    const versions = JSON.parse(result);

    if (versions.length === 0) {
      console.log('No container versions found.');
      return null;
    }

    console.log('Recent container versions:\n');

    versions.forEach((version, index) => {
      const createdAt = new Date(version.created_at).toLocaleString();
      const updatedAt = new Date(version.updated_at).toLocaleString();
      const tags = version.metadata?.container?.tags || [];

      console.log(`${index + 1}. ID: ${version.id}`);
      console.log(`   Tags: ${tags.length > 0 ? tags.join(', ') : 'none'}`);
      console.log(`   Created: ${createdAt}`);
      console.log(`   Updated: ${updatedAt}`);

      // Extract SHA from tags if present
      const shaTag = tags.find(
        (tag) => tag.length === 7 && /^[a-f0-9]+$/.test(tag)
      );
      if (shaTag) {
        console.log(`   Commit SHA: ${shaTag}`);
      }

      // Extract semver version from tags if present
      const semverTag = tags.find((tag) => /^\d+\.\d+\.\d+$/.test(tag));
      if (semverTag) {
        console.log(`   Version: ${semverTag}`);
      }
      console.log('');
    });

    // Get the latest version details
    const latest = versions[0];
    const latestTags = latest.metadata?.container?.tags || [];
    const latestSha = latestTags.find(
      (tag) => tag.length === 7 && /^[a-f0-9]+$/.test(tag)
    );
    const latestSemver = latestTags.find((tag) => /^\d+\.\d+\.\d+$/.test(tag));

    console.log('='.repeat(80));

    return {
      id: latest.id,
      tags: latestTags,
      sha: latestSha,
      semver: latestSemver,
      createdAt: latest.created_at,
      hasLatestTag: latestTags.includes('latest'),
    };
  } catch (error) {
    console.log('❌ Failed to get GHCR version:', error.message);
    console.log(
      '   Make sure you have GitHub CLI installed and authenticated.'
    );
    console.log('   Run: gh auth login');
    return null;
  }
}

async function getDeployedVersion() {
  console.log('\n🌐 Deployed (Render) Version Info\n');
  console.log('='.repeat(80));

  try {
    // Check /api/version endpoint
    const versionResponse = await fetch(`${LIVE_URL}/api/version`);
    const contentType = versionResponse.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      console.log('❌ /api/version endpoint not available (returns HTML)');
      console.log('   The deployment may be outdated or the endpoint missing.');

      // Try to get some info from health endpoint
      const healthResponse = await fetch(`${LIVE_URL}/api/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(
          '\n/api/health response:',
          JSON.stringify(healthData, null, 2)
        );
      }

      return { available: false };
    }

    const versionData = await versionResponse.json();
    console.log(`Version: ${versionData.version || 'N/A'}`);
    console.log(`Git SHA: ${versionData.gitSha || 'N/A'}`);
    console.log(`Build Time: ${versionData.buildTime || 'N/A'}`);
    console.log(`Node Env: ${versionData.nodeEnv || 'N/A'}`);

    console.log('\n' + '='.repeat(80));

    return {
      available: true,
      ...versionData,
    };
  } catch (error) {
    console.log('❌ Failed to get deployed version:', error.message);
    return { available: false, error: error.message };
  }
}

async function getLatestWorkflowSha() {
  console.log('\n🔄 Latest CI/CD Workflow Info\n');
  console.log('='.repeat(80));

  try {
    const result = execSync(
      `gh run list --repo ${REPO} --branch main --limit 1 --json headSha,status,conclusion,createdAt,displayTitle`,
      { encoding: 'utf-8' }
    );

    const runs = JSON.parse(result);

    if (runs.length === 0) {
      console.log('No workflow runs found.');
      return null;
    }

    const latest = runs[0];
    const createdAt = new Date(latest.createdAt).toLocaleString();

    console.log(`Title: ${latest.displayTitle}`);
    console.log(`Status: ${latest.status}`);
    console.log(`Conclusion: ${latest.conclusion || 'N/A'}`);
    console.log(`Commit SHA: ${latest.headSha}`);
    console.log(`Short SHA: ${latest.headSha.substring(0, 7)}`);
    console.log(`Created: ${createdAt}`);

    console.log('\n' + '='.repeat(80));

    return {
      sha: latest.headSha,
      shortSha: latest.headSha.substring(0, 7),
      status: latest.status,
      conclusion: latest.conclusion,
      createdAt: latest.createdAt,
    };
  } catch (error) {
    console.log('❌ Failed to get workflow info:', error.message);
    return null;
  }
}

function compareVersions(local, ghcr, deployed, workflow) {
  console.log('\n🔍 Version Comparison Summary\n');
  console.log('='.repeat(80));

  const localVersion = local?.version || 'N/A';
  const localSha = local?.shortSha || 'N/A';
  const ghcrVersion = ghcr?.semver || 'N/A';
  const ghcrSha = ghcr?.sha || 'N/A';
  const deployedVersion = deployed?.version || 'N/A';
  const deployedSha = deployed?.gitSha?.substring(0, 7) || 'N/A';
  const workflowSha = workflow?.shortSha || 'N/A';

  console.log('Component        | Version   | SHA     | Status');
  console.log('-'.repeat(65));
  console.log(
    `Local HEAD       | ${localVersion.padEnd(9)} | ${localSha.padEnd(7)} |`
  );
  console.log(
    `Latest CI Run    | ${''.padEnd(9)} | ${workflowSha.padEnd(7)} | ${workflow?.conclusion || 'N/A'}`
  );
  console.log(
    `GHCR :latest     | ${ghcrVersion.padEnd(9)} | ${ghcrSha.padEnd(7)} | ${ghcr?.hasLatestTag ? 'Has :latest tag' : 'No :latest tag'}`
  );
  console.log(
    `Render Deployed  | ${deployedVersion.padEnd(9)} | ${deployedSha.padEnd(7)} | ${deployed?.available ? 'Available' : 'Unavailable'}`
  );

  console.log('\n' + '-'.repeat(80));
  console.log('Analysis:\n');

  const issues = [];

  // Check if local matches workflow
  if (localSha !== workflowSha && localSha !== 'N/A' && workflowSha !== 'N/A') {
    issues.push({
      level: 'warn',
      message: 'Local commit differs from latest CI run',
      fix: 'Push your changes: git push origin main',
    });
  }

  // Check if workflow matches GHCR
  if (workflowSha !== ghcrSha && workflowSha !== 'N/A' && ghcrSha !== 'N/A') {
    issues.push({
      level: 'error',
      message: 'CI run SHA differs from GHCR image',
      fix: 'Check if CI build-and-push job succeeded',
    });
  }

  // Check if GHCR matches deployed
  if (ghcrSha !== deployedSha && ghcrSha !== 'N/A' && deployedSha !== 'N/A') {
    issues.push({
      level: 'error',
      message: 'GHCR image differs from deployed version',
      fix: 'Trigger Render deployment: node scripts/debug-render.js --deploy',
    });
  }

  // Check if versions match across environments
  if (
    localVersion !== 'N/A' &&
    ghcrVersion !== 'N/A' &&
    localVersion !== ghcrVersion
  ) {
    issues.push({
      level: 'warn',
      message: `Local version (${localVersion}) differs from GHCR (${ghcrVersion})`,
      fix: 'Push to main - version will auto-bump on deploy',
    });
  }

  if (
    ghcrVersion !== 'N/A' &&
    deployedVersion !== 'N/A' &&
    ghcrVersion !== deployedVersion
  ) {
    issues.push({
      level: 'error',
      message: `GHCR version (${ghcrVersion}) differs from deployed (${deployedVersion})`,
      fix: 'Trigger Render deployment: node scripts/debug-render.js --deploy',
    });
  }

  // Check if deployed endpoint is available
  if (!deployed?.available) {
    issues.push({
      level: 'error',
      message: '/api/version endpoint not available on deployed instance',
      fix: 'Check if server code includes the version endpoint',
    });
  }

  // Check workflow status
  if (workflow?.conclusion === 'failure') {
    issues.push({
      level: 'error',
      message: 'Latest CI workflow failed',
      fix: `Check workflow logs: gh run view --repo ${REPO}`,
    });
  }

  if (issues.length === 0) {
    console.log('✅ All versions are in sync! No issues detected.');
  } else {
    issues.forEach((issue, index) => {
      const icon = issue.level === 'error' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${icon} ${issue.message}`);
      console.log(`   Fix: ${issue.fix}\n`);
    });
  }

  // Overall status
  console.log('='.repeat(80));
  const hasErrors = issues.some((i) => i.level === 'error');
  if (hasErrors) {
    console.log('\n🚨 DEPLOYMENT ISSUES DETECTED - See fixes above\n');
    return false;
  } else if (issues.length > 0) {
    console.log('\n⚠️ WARNINGS - Review the suggestions above\n');
    return true;
  } else {
    console.log('\n✅ DEPLOYMENT HEALTHY\n');
    return true;
  }
}

async function main() {
  console.log('🔬 Version Comparison Debug Report');
  console.log('===================================\n');

  const local = await getLocalVersion();
  const ghcr = await getGhcrVersion();
  const deployed = await getDeployedVersion();
  const workflow = await getLatestWorkflowSha();

  const healthy = compareVersions(local, ghcr, deployed, workflow);

  console.log('📚 Debug Commands:');
  console.log('------------------');
  console.log('# Full GitHub workflow debug');
  console.log('node scripts/debug-github-workflow.js');
  console.log('\n# Full Render debug');
  console.log('node scripts/debug-render.js');
  console.log('\n# Trigger new Render deployment');
  console.log('node scripts/debug-render.js --deploy');
  console.log('');

  process.exit(healthy ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
