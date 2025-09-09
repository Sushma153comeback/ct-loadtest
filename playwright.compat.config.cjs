const BASE_URL = process.env.TARGET_URL || 'https://churchtalksrm.com';
const HEADED = process.env.HEADED === '1';
const SLOWMO = Number(process.env.SLOWMO_MS ?? 0);

module.exports = {
  testDir: './tests/compat',
  timeout: 30000,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    headless: !HEADED,
    ignoreHTTPSErrors: true,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    launchOptions: {
      slowMo: SLOWMO || undefined,
    },
  },
  projects: [
    // Desktop
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1366, height: 768 } } },
    { name: 'desktop-firefox',  use: { browserName: 'firefox',  viewport: { width: 1366, height: 768 } } },
    { name: 'desktop-webkit',   use: { browserName: 'webkit',   viewport: { width: 1366, height: 768 } } },

    // Mobile (light emulation)
    { name: 'mobile-chrome-android', use: { browserName: 'chromium', viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
   { name: 'mobile-safari-iphone',  use: { browserName: 'webkit',   viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
   { name: 'mobile-chrome-iphone',  use: { browserName: 'webkit',   viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  ],
};
