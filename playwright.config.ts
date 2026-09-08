import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 360000,
  expect: { timeout: 30000 },
  use: {
    baseURL: 'http://localhost:3100',
    actionTimeout: 30000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { channel: 'msedge' },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/start-e2e.mjs',
    url: 'http://localhost:3100/api/session',
    reuseExistingServer: false,
    timeout: 120000,
    env: { ID_TEST_STATE: resolve('.wrangler', `e2e-${Date.now()}`) },
  },
});
