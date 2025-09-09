const USERS = Number(process.env.USERS ?? 10);
const BASE_URL = process.env.TARGET_URL ?? 'https://main.d2ga6jbbpemzib.amplifyapp.com';
const DURATION_SEC = Number(process.env.DURATION ?? 60);

module.exports = {
  testDir: './tests',
  // Allow the test to run for the full duration + buffer
  timeout: Math.max(30000, DURATION_SEC * 1000 + 60000),
  retries: 0,
  fullyParallel: true,
  // Run up to USERS workers in parallel
  workers: USERS,
  // Create USERS copies of the test so workers can run concurrently
  repeatEach: USERS,

  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    viewport: null,
    ignoreHTTPSErrors: true,
    browserName: 'chromium',
  },
  metadata: {
    scenario: 'nav-loop',
    users: USERS,
    duration_sec: DURATION_SEC,
    target_url: BASE_URL,
  },
  projects: [{ name: 'chromium' }],
};
