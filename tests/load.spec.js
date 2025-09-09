const { test, expect } = require('@playwright/test');
const fs = require('fs');

const DURATION_SEC = Number(process.env.DURATION ?? 60);

test('nav loop: open page repeatedly for duration', async ({ browser }, testInfo) => {
  // ensure this test can run for the requested duration
  test.setTimeout(DURATION_SEC * 1000 + 60000);

  const endAt = Date.now() + DURATION_SEC * 1000;
  const samples = [];

  while (Date.now() < endAt) {
    const context = await browser.newContext(); // fresh user
    const page = await context.newPage();

    try {
      const start = Date.now();
      const resp = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

      expect(resp, 'got a response').toBeTruthy();
      expect(resp.ok(), `status was ${resp?.status()}`).toBeTruthy();

      const nav = await page.evaluate(() => {
        const e = performance.getEntriesByType('navigation')[0];
        if (!e) return null;
        return {
          startTime: e.startTime,
          domContentLoaded: e.domContentLoadedEventEnd,
          loadEventEnd: e.loadEventEnd,
          responseStart: e.responseStart,
          responseEnd: e.responseEnd,
          requestStart: e.requestStart,
          transferSize: e.transferSize ?? null,
          encodedBodySize: e.encodedBodySize ?? null,
          decodedBodySize: e.decodedBodySize ?? null,
          type: e.type,
        };
      });

      const elapsed = Date.now() - start;
      samples.push({
        status: resp?.status(),
        elapsed_ms: elapsed,
        metrics: nav,
        when: new Date().toISOString(),
        worker: testInfo.parallelIndex,
      });
    } finally {
      await context.close();
    }
  }

  const outFile = testInfo.outputPath(`metrics_worker_${testInfo.parallelIndex}.json`);
  fs.writeFileSync(outFile, JSON.stringify(samples, null, 2), 'utf-8');

  await testInfo.attach(`metrics_worker_${testInfo.parallelIndex}.json`, {
    path: outFile,
    contentType: 'application/json',
  });
});
