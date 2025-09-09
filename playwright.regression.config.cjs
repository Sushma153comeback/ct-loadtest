const BASE_URL = process.env.TARGET_URL || 'https://churchtalksrm.com';

module.exports = {
  testDir: './tests/regression',
  timeout: 30000,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1366, height: 768 } } },
    { name: 'firefox',  use: { browserName: 'firefox',  viewport: { width: 1366, height: 768 } } },
    { name: 'webkit',   use: { browserName: 'webkit',   viewport: { width: 1366, height: 768 } } },
  ],
};
