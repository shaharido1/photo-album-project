#!/usr/bin/env node

/**
 * GitHub Workflow Debug Script
 * Inspects GitHub Actions workflow status for deployment debugging
 */

const { execSync } = require('child_process');

const REPO = 'shaharido1/photo-album-project';

function runGhCommand(args, silent = false) {
  try {
    const result = execSync(`gh ${args}`, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout?.toString() || '',
    };
  }
}

function checkGhCli() {
  console.log('🔧 Checking GitHub CLI...\n');
  const result = runGhCommand('--version', true);
  if (!result.success) {
    console.log('❌ GitHub CLI (gh) is not installed.');
    console.log('   Install it from: https://cli.github.com/');
    process.exit(1);
  }
  console.log(`✅ GitHub CLI: ${result.output.split('\n')[0]}`);

  // Check authentication
  const authResult = runGhCommand('auth status', true);
  if (!authResult.success) {
    console.log('❌ GitHub CLI is not authenticated.');
    console.log('   Run: gh auth login');
    process.exit(1);
  }
  console.log('✅ GitHub CLI is authenticated\n');
}

async function getRecentWorkflowRuns() {
  console.log('📋 Recent Workflow Runs\n');
  console.log('='.repeat(80));

  const result = runGhCommand(
    `run list --repo ${REPO} --limit 10 --json databaseId,displayTitle,status,conclusion,headBranch,createdAt,updatedAt,headSha`
  );

  if (!result.success) {
    console.log('❌ Failed to fetch workflow runs:', result.error);
    return [];
  }

  const runs = JSON.parse(result.output);

  if (runs.length === 0) {
    console.log('No workflow runs found.');
    return [];
  }

  runs.forEach((run, index) => {
    const statusIcon = getStatusIcon(run.status, run.conclusion);
    const date = new Date(run.createdAt).toLocaleString();
    const sha = run.headSha.substring(0, 7);

    console.log(`\n${index + 1}. ${statusIcon} ${run.displayTitle}`);
    console.log(
      `   ID: ${run.databaseId} | Branch: ${run.headBranch} | SHA: ${sha}`
    );
    console.log(
      `   Status: ${run.status} | Conclusion: ${run.conclusion || 'N/A'}`
    );
    console.log(`   Created: ${date}`);
  });

  console.log('\n' + '='.repeat(80));
  return runs;
}

function getStatusIcon(status, conclusion) {
  if (status === 'completed') {
    if (conclusion === 'success') return '✅';
    if (conclusion === 'failure') return '❌';
    if (conclusion === 'cancelled') return '⏹️';
    return '⚠️';
  }
  if (status === 'in_progress') return '🔄';
  if (status === 'queued') return '⏳';
  return '❓';
}

async function getWorkflowRunDetails(runId) {
  console.log(`\n📊 Workflow Run Details (ID: ${runId})\n`);
  console.log('='.repeat(80));

  const result = runGhCommand(
    `run view ${runId} --repo ${REPO} --json jobs,status,conclusion,createdAt,updatedAt,headSha,url`
  );

  if (!result.success) {
    console.log('❌ Failed to fetch run details:', result.error);
    return null;
  }

  const details = JSON.parse(result.output);
  const sha = details.headSha.substring(0, 7);

  console.log(
    `Status: ${details.status} | Conclusion: ${details.conclusion || 'N/A'}`
  );
  console.log(`Commit SHA: ${sha}`);
  console.log(`URL: ${details.url}`);

  console.log('\nJobs:');
  details.jobs.forEach((job) => {
    const icon = getStatusIcon(job.status, job.conclusion);
    const duration = job.completedAt
      ? Math.round((new Date(job.completedAt) - new Date(job.startedAt)) / 1000)
      : 'N/A';
    console.log(`  ${icon} ${job.name}`);
    console.log(
      `     Status: ${job.status} | Conclusion: ${job.conclusion || 'N/A'} | Duration: ${duration}s`
    );
  });

  console.log('\n' + '='.repeat(80));
  return details;
}

async function getFailedJobLogs(runId) {
  console.log(`\n📜 Failed Job Logs (Run ID: ${runId})\n`);
  console.log('='.repeat(80));

  const result = runGhCommand(`run view ${runId} --repo ${REPO} --log-failed`);

  if (!result.success) {
    if (result.output.includes('no failed jobs')) {
      console.log('✅ No failed jobs in this run.');
    } else {
      console.log('❌ Failed to fetch logs:', result.error);
    }
    return;
  }

  // Truncate output if too long
  const maxLines = 100;
  const lines = result.output.split('\n');
  if (lines.length > maxLines) {
    console.log(lines.slice(0, maxLines).join('\n'));
    console.log(`\n... (${lines.length - maxLines} more lines truncated)`);
  } else {
    console.log(result.output);
  }

  console.log('\n' + '='.repeat(80));
}

async function getLatestCommit() {
  console.log('\n📝 Latest Local Commit\n');
  console.log('='.repeat(80));

  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const shortSha = sha.substring(0, 7);
    const message = execSync('git log -1 --format=%s', {
      encoding: 'utf-8',
    }).trim();
    const date = execSync('git log -1 --format=%ci', {
      encoding: 'utf-8',
    }).trim();

    console.log(`SHA: ${sha}`);
    console.log(`Short: ${shortSha}`);
    console.log(`Message: ${message}`);
    console.log(`Date: ${date}`);

    console.log('\n' + '='.repeat(80));
    return { sha, shortSha, message, date };
  } catch (error) {
    console.log('❌ Failed to get local commit:', error.message);
    return null;
  }
}

async function compareCommits(runs, localCommit) {
  console.log('\n🔍 Commit Comparison\n');
  console.log('='.repeat(80));

  if (!localCommit) {
    console.log('❌ Could not get local commit for comparison.');
    return;
  }

  const latestRun = runs[0];
  if (!latestRun) {
    console.log('❌ No workflow runs to compare.');
    return;
  }

  const localSha = localCommit.shortSha;
  const workflowSha = latestRun.headSha.substring(0, 7);

  console.log(`Local HEAD:     ${localSha}`);
  console.log(`Latest CI run:  ${workflowSha}`);

  if (localSha === workflowSha) {
    console.log('\n✅ Local commit matches latest CI run.');
  } else {
    console.log('\n⚠️  MISMATCH: Local commit differs from latest CI run.');
    console.log('   Possible causes:');
    console.log('   - Local changes not pushed to remote');
    console.log('   - CI triggered by a different branch');
    console.log('   - New commits added after CI run started');

    // Check if local is ahead
    try {
      const remoteCheck = execSync('git rev-list HEAD ^origin/main --count', {
        encoding: 'utf-8',
      }).trim();
      const aheadCount = parseInt(remoteCheck, 10);
      if (aheadCount > 0) {
        console.log(
          `\n📤 Local is ${aheadCount} commit(s) ahead of origin/main.`
        );
        console.log('   Run: git push origin main');
      }
    } catch {
      // Ignore if remote check fails
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  console.log('🔬 GitHub Workflow Debug Report');
  console.log('================================\n');

  checkGhCli();

  const localCommit = await getLatestCommit();
  const runs = await getRecentWorkflowRuns();

  if (runs.length > 0) {
    await compareCommits(runs, localCommit);

    const latestRun = runs[0];
    await getWorkflowRunDetails(latestRun.databaseId);

    // If latest run failed, show logs
    if (latestRun.conclusion === 'failure') {
      await getFailedJobLogs(latestRun.databaseId);
    }
  }

  console.log('\n📚 Quick Commands:');
  console.log('------------------');
  console.log(`gh run list --repo ${REPO} --limit 5`);
  console.log(`gh run view <run-id> --repo ${REPO}`);
  console.log(`gh run view <run-id> --repo ${REPO} --log-failed`);
  console.log(`gh run rerun <run-id> --repo ${REPO}`);
  console.log(`gh run watch <run-id> --repo ${REPO}`);
  console.log('');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
