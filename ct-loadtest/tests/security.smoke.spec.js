// tests/security.smoke.spec.js
const { test, expect } = require('@playwright/test');

/**
 * ENV VARS
 * TARGET_URL        — base URL to test (required, e.g., https://main.d2ga6...amplifyapp.com)
 * PROTECTED_PATH    — optional path expected to require auth (e.g., /dashboard). If unknown, test will skip.
 */

const BASE = process.env.TARGET_URL;
if (!BASE) throw new Error('TARGET_URL env var is required (e.g., export TARGET_URL="https://your.site")');

const ORIGIN = new URL(BASE).origin;
const HTTP_ORIGIN = ORIGIN.replace(/^https:/, 'http:');
const PROTECTED_PATH = process.env.PROTECTED_PATH || ''; // optional

function getHeader(headers, name) {
  // Response.headers() returns an object with lowercased keys in Playwright
  return headers[name.toLowerCase()];
}

test.describe('@sec Security Smoke', () => {
  test('HTTPS enforced (HTTP → HTTPS redirect)', async ({ request }) => {
    test.skip(ORIGIN.startsWith('http:'), 'TARGET_URL must be https');
    // Some hosts may block plain HTTP; handle gracefully.
    const res = await request.get(HTTP_ORIGIN, { maxRedirects: 0 }).catch(() => null);
    test.skip(!res, 'HTTP endpoint not reachable; skipping redirect check');
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = getHeader(res.headers(), 'location') || '';
    expect(loc.startsWith('https://')).toBeTruthy();
  });

  test('Security headers (HSTS, no-sniff, CSP, frame-ancestors / XFO, referrer-policy, cache-control)', async ({ request }) => {
    const res = await request.get(ORIGIN, { maxRedirects: 5 });
    expect(res.ok()).toBeTruthy();
    const headers = res.headers();

    // HSTS
    const hsts = getHeader(headers, 'strict-transport-security') || '';
    expect(hsts).toBeTruthy();
    // at least ~180 days
    const maxAge = /max-age=(\d+)/i.exec(hsts)?.[1];
    expect(Number(maxAge || 0)).toBeGreaterThanOrEqual(15552000);

    // X-Content-Type-Options
    const xcto = getHeader(headers, 'x-content-type-options') || '';
    expect(xcto.toLowerCase()).toBe('nosniff');

    // Referrer-Policy
    const refpol = (getHeader(headers, 'referrer-policy') || '').toLowerCase();
    expect(refpol).toBeTruthy();
    const acceptableRef = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'same-origin',
      'origin',
      'strict-origin',
      'origin-when-cross-origin',
      'strict-origin-when-cross-origin'
    ];
    expect(acceptableRef).toContain(refpol);

    // CSP
    const csp = getHeader(headers, 'content-security-policy') || '';
    expect(csp).toBeTruthy();
    // basic sanity: no wildcard for scripts & has a default/script directive
    expect(/(?:^|;)\s*(default-src|script-src)\s+/i.test(csp)).toBeTruthy();
    expect(/script-src[^;]*\*/i.test(csp)).toBeFalsy();

    // Clickjacking protection: either CSP frame-ancestors or X-Frame-Options
    const xfo = (getHeader(headers, 'x-frame-options') || '').toUpperCase();
    const hasFrameAncestors = /frame-ancestors/i.test(csp);
    expect(hasFrameAncestors || ['DENY', 'SAMEORIGIN'].includes(xfo)).toBeTruthy();

    // Cache-Control for HTML (should not be long-lived public)
    const cc = (getHeader(headers, 'cache-control') || '').toLowerCase();
    expect(cc).toBeTruthy();
    // Allow common safe directives: no-store or no-cache or private; avoid public+long max-age
    const isLikelyUnsafe =
      cc.includes('public') && /max-age=\s*(\d{4,})/.test(cc); // very long max-age
    expect(isLikelyUnsafe).toBeFalsy();
  });

  test('Unauthenticated access to protected path is blocked (401/403) — optional', async ({ request }) => {
    test.skip(!PROTECTED_PATH, 'No PROTECTED_PATH set; skipping.');
    const url = ORIGIN.replace(/\/$/, '') + PROTECTED_PATH;
    const res = await request.get(url, { maxRedirects: 0 }).catch(() => null);
    test.skip(!res, 'Protected path not reachable; skipping.');
    // Accept 401/403, or a redirect to login page (3xx + Location containing /login or /auth)
    const status = res.status();
    const loc = getHeader(res.headers(), 'location') || '';
    const redirectedToLogin = String(status).startsWith('3') && /login|auth|signin/i.test(loc);
    expect([401, 403].includes(status) || redirectedToLogin).toBeTruthy();
  });

  test('Basic XSS hardening on common inputs — smoke (best-effort)', async ({ page }) => {
    // Generic probe for pages that render query strings directly.
    const payload = encodeURIComponent('<script>alert(1)</script>');
    const url = `${ORIGIN}/?q=${payload}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // If an alert shows, Playwright would error unless handled. We assert no alert via console message check.
    let sawUnsafeConsole = false;
    page.on('dialog', () => { throw new Error('Dialog popped — potential XSS'); });
    page.on('console', msg => {
      if (/alert\(1\)/i.test(msg.text())) sawUnsafeConsole = true;
    });
    // Give it a moment to execute any inline script (if it were reflected unsafely)
    await page.waitForTimeout(1000);
    expect(sawUnsafeConsole).toBeFalsy();
  });
});
    