const { defineConfig, devices } = require('@playwright/test');

const USERS = Number(process.env.USERS ?? 10);
const BASE_URL = process.env.TARGET_URL ?? 'https://main.d2ga6jbbpemzib.amplifyapp.com';
const DURATION_SEC = Number(process.env.DURATION ?? 60);

module.exports = defineConfig({
  timeout: 30000,
  retries: 0,
  fullyParallel: true,
  workers: USERS,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    viewport: null,
    ignoreHTTPSErrors: true,
  },
  metadata: {
    scenario: 'nav-loop',
    users: USERS,
    duration_sec: DURATION_SEC,
    target_url: BASE_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
