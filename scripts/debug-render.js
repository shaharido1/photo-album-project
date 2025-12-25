#!/usr/bin/env node

/**
 * Render Deployment Debug Script
 * Inspects Render service status, deployments, and logs
 */

const SERVICE_ID = 'srv-d56juo6uk2gs73ci8bgg';
const RENDER_API_BASE = 'https://api.render.com/v1';
const LIVE_URL = 'https://photo-album-project.onrender.com';

// API key from environment or hardcoded for convenience (can be overridden)
const API_KEY =
  process.env.RENDER_API_KEY || 'rnd_3m8HxslxDzQVHrZcvju6FUfborqg';

async function renderApiRequest(endpoint, method = 'GET') {
  const url = `${RENDER_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${text}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkApiKey() {
  console.log('🔑 Checking Render API Key...\n');

  if (!API_KEY) {
    console.log('❌ RENDER_API_KEY environment variable not set.');
    console.log('   Set it with: export RENDER_API_KEY="your-api-key"');
    console.log('   Or add it to your .env file.\n');
    return false;
  }

  // Test the API key by fetching services
  const result = await renderApiRequest('/services?limit=1');
  if (!result.success) {
    console.log('❌ API key validation failed:', result.error);
    return false;
  }

  console.log('✅ Render API key is valid\n');
  return true;
}

async function getServiceStatus() {
  console.log('📊 Service Status\n');
  console.log('='.repeat(80));

  const result = await renderApiRequest(`/services/${SERVICE_ID}`);

  if (!result.success) {
    console.log('❌ Failed to fetch service status:', result.error);
    return null;
  }

  const service = result.data;

  console.log(`Name: ${service.name}`);
  console.log(`ID: ${service.id}`);
  console.log(`Type: ${service.type}`);
  console.log(`Suspended: ${service.suspended ? '⚠️ YES' : '✅ No'}`);
  console.log(`Created: ${new Date(service.createdAt).toLocaleString()}`);
  console.log(`Updated: ${new Date(service.updatedAt).toLocaleString()}`);

  if (service.serviceDetails) {
    const details = service.serviceDetails;
    console.log('\nService Details:');
    console.log(`  Region: ${details.region || 'N/A'}`);
    console.log(`  Plan: ${details.plan || 'N/A'}`);
    console.log(`  Env: ${details.env || 'N/A'}`);
    console.log(`  Num Instances: ${details.numInstances || 'N/A'}`);

    if (details.image) {
      console.log('\nDocker Image:');
      console.log(`  Image: ${details.image.imagePath || 'N/A'}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  return service;
}

async function getRecentDeployments() {
  console.log('\n📦 Recent Deployments\n');
  console.log('='.repeat(80));

  const result = await renderApiRequest(
    `/services/${SERVICE_ID}/deploys?limit=10`
  );

  if (!result.success) {
    console.log('❌ Failed to fetch deployments:', result.error);
    return [];
  }

  const deploys = result.data;

  if (deploys.length === 0) {
    console.log('No deployments found.');
    return [];
  }

  deploys.forEach((deploy, index) => {
    const statusIcon = getDeployStatusIcon(deploy.deploy?.status);
    const createdAt = deploy.deploy?.createdAt
      ? new Date(deploy.deploy.createdAt).toLocaleString()
      : 'N/A';
    const finishedAt = deploy.deploy?.finishedAt
      ? new Date(deploy.deploy.finishedAt).toLocaleString()
      : 'In progress';
    const status = deploy.deploy?.status || 'unknown';

    console.log(`\n${index + 1}. ${statusIcon} ${status.toUpperCase()}`);
    console.log(`   ID: ${deploy.deploy?.id || 'N/A'}`);
    console.log(`   Created: ${createdAt}`);
    console.log(`   Finished: ${finishedAt}`);

    if (deploy.deploy?.commit) {
      console.log(
        `   Commit: ${deploy.deploy.commit.id?.substring(0, 7) || 'N/A'}`
      );
      console.log(`   Message: ${deploy.deploy.commit.message || 'N/A'}`);
    }

    if (deploy.deploy?.trigger) {
      console.log(`   Trigger: ${deploy.deploy.trigger}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  return deploys;
}

function getDeployStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'live':
      return '✅';
    case 'build_in_progress':
    case 'update_in_progress':
      return '🔄';
    case 'build_failed':
    case 'update_failed':
    case 'deactivated':
      return '❌';
    case 'canceled':
      return '⏹️';
    default:
      return '❓';
  }
}

async function checkLiveEndpoints() {
  console.log('\n🌐 Live Endpoint Checks\n');
  console.log('='.repeat(80));

  const endpoints = [
    { path: '/', name: 'Frontend', expectJson: false },
    { path: '/api/health', name: 'Health Check', expectJson: true },
    { path: '/api/version', name: 'Version', expectJson: true },
    { path: '/api/hello', name: 'Hello', expectJson: true },
  ];

  for (const endpoint of endpoints) {
    const url = `${LIVE_URL}${endpoint.path}`;
    try {
      const start = Date.now();
      const response = await fetch(url);
      const duration = Date.now() - start;
      const contentType = response.headers.get('content-type') || '';

      const statusIcon = response.ok ? '✅' : '❌';
      console.log(`\n${statusIcon} ${endpoint.name} (${endpoint.path})`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response time: ${duration}ms`);
      console.log(`   Content-Type: ${contentType}`);

      if (endpoint.expectJson) {
        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   Response: ${JSON.stringify(data)}`);
        } else {
          console.log(`   ⚠️ Expected JSON but got: ${contentType}`);
          console.log(`   This may indicate the endpoint doesn't exist.`);
        }
      }
    } catch (error) {
      console.log(`\n❌ ${endpoint.name} (${endpoint.path})`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function getEnvironmentVariables() {
  console.log('\n⚙️ Environment Variables\n');
  console.log('='.repeat(80));

  const result = await renderApiRequest(`/services/${SERVICE_ID}/env-vars`);

  if (!result.success) {
    console.log('❌ Failed to fetch environment variables:', result.error);
    return;
  }

  const envVars = result.data;

  if (envVars.length === 0) {
    console.log('No environment variables configured.');
  } else {
    envVars.forEach((env) => {
      // Mask sensitive values
      const value = env.value
        ? env.value.length > 4
          ? `${env.value.substring(0, 2)}***${env.value.slice(-2)}`
          : '****'
        : '(not set)';
      console.log(`  ${env.key}: ${value}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

async function triggerDeploy() {
  console.log('\n🚀 Triggering New Deployment...\n');

  const result = await renderApiRequest(
    `/services/${SERVICE_ID}/deploys`,
    'POST'
  );

  if (!result.success) {
    console.log('❌ Failed to trigger deployment:', result.error);
    return null;
  }

  console.log('✅ Deployment triggered successfully!');
  console.log(`   Deploy ID: ${result.data.id}`);
  console.log(`   Status: ${result.data.status}`);

  return result.data;
}

async function main() {
  console.log('🔬 Render Deployment Debug Report');
  console.log('==================================\n');

  const apiKeyValid = await checkApiKey();
  if (!apiKeyValid) {
    console.log(
      '\n⚠️ Continuing with limited functionality (public endpoints only)...\n'
    );
    await checkLiveEndpoints();
    return;
  }

  await getServiceStatus();
  await getRecentDeployments();
  await checkLiveEndpoints();
  await getEnvironmentVariables();

  console.log('\n📚 Quick Commands:');
  console.log('------------------');
  console.log('# Check service status');
  console.log(
    `curl -s 'https://api.render.com/v1/services/${SERVICE_ID}' -H "Authorization: Bearer $RENDER_API_KEY" | jq`
  );
  console.log('\n# List recent deployments');
  console.log(
    `curl -s 'https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=5' -H "Authorization: Bearer $RENDER_API_KEY" | jq`
  );
  console.log('\n# Trigger new deployment');
  console.log(
    `curl -X POST 'https://api.render.com/v1/services/${SERVICE_ID}/deploys' -H "Authorization: Bearer $RENDER_API_KEY"`
  );
  console.log('');

  // Check for --deploy flag
  if (process.argv.includes('--deploy')) {
    await triggerDeploy();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
