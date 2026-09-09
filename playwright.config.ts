import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 360000,
  expect: { timeout: 30000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100',
    actionTimeout: 30000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { channel: 'msedge' },
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'node node_modules/vinext/dist/cli.js dev --port 3100',
        url: 'http://localhost:3100/',
        reuseExistingServer: false,
        timeout: 120000,
        gracefulShutdown: { signal: 'SIGINT', timeout: 1000 },
        env: {
          VITE_SUPABASE_URL: 'https://supabase.test',
          VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
          SUPABASE_URL: 'https://supabase.test',
          SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
          WRANGLER_LOG_PATH: '.wrangler/logs',
          WRANGLER_SEND_METRICS: 'false',
        },
      },
});
