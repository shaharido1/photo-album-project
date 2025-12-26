import { defineConfig, devices } from '@playwright/test';

// Test server ports (different from dev server to avoid conflicts)
const TEST_CLIENT_PORT = 4000;
const TEST_SERVER_PORT = 4001;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${TEST_CLIENT_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `VITE_PORT=${TEST_CLIENT_PORT} VITE_API_PORT=${TEST_SERVER_PORT} PORT=${TEST_SERVER_PORT} npm run dev`,
    url: `http://localhost:${TEST_CLIENT_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
