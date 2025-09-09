const { test, expect } = require('@playwright/test');

/**
 * ENV:
 *   TARGET_URL — optional; defaults to https://churchtalksrm.com
 */

test.describe('@smoke basic availability', () => {
  test('home page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));

    const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    expect(resp, 'navigation response').toBeTruthy();
    expect(resp.ok(), `status was ${resp && resp.status()}`).toBeTruthy();

    await expect(page.locator('body')).toBeVisible();

    expect(errors, `console errors: ${errors.join(' | ')}`).toHaveLength(0);
  });
});
