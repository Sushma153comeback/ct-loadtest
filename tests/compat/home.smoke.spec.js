const { test, expect } = require('@playwright/test');

test('basic open: page loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  expect(resp, 'navigation response present').toBeTruthy();
  expect(resp.ok(), `status was ${resp && resp.status()}`).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();

  expect(errors, `console errors: ${errors.join(' | ')}`).toHaveLength(0);
});
