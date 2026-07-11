// Playwright scaffold for typelessity-landing (R42 E2E-infra bootstrap).
//
// STATUS: scaffold only. Browser binaries are NOT yet installed — installing
// @playwright/test + downloading Chromium is a large dependency/lockfile change, and the
// landing is dormant, so the running R36/R42 smoke currently lives in `e2e/home-smoke.spec.ts`
// (node:test over a real HTTP server serving the prerendered dist/ — no browser needed).
//
// To activate full browser E2E in a future cycle (founder reviews the dep add):
//   1. npm i -D @playwright/test
//   2. npx playwright install chromium
//   3. port e2e/home-smoke.spec.ts assertions into a Playwright spec using `page.goto` +
//      `expect(page.locator(...))`, then point `testDir` here at it.
//   4. add an `e2e:browser` script: `playwright test`.
//
// This file is intentionally inert (no @playwright/test import) so `npm run build` and the
// fast test tier never fail on a missing dependency. It documents the contract the next
// cycle implements.

export const playwrightPlan = {
  testDir: './e2e',
  baseURL: 'http://127.0.0.1:4000', // `npm run serve:ssr:typelessity-landing`
  webServer: {
    command: 'npm run build && PORT=4000 npm run serve:ssr:typelessity-landing',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  // Smokes to port from the node:test version:
  smokes: [
    'home renders + brand visible',
    'SoftwareApplication schema with featureList in <head>',
    'comparison section shows Cal.ai + Cal.com columns',
  ],
} as const;
