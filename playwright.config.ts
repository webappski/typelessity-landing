// Browser E2E for typelessity-landing — одобрено founder 2026-09-25 (@playwright/test added).
//
// The four steps this scaffold used to list are done:
//   1. @playwright/test is a devDependency, pinned to the version webappka uses (1.58.2) so its
//      Chromium comes from the shared ~/Library/Caches/ms-playwright cache — nothing is downloaded.
//   2. Chromium is that cached build (`npx playwright install chromium` only if the cache is gone).
//   3. Browser specs live in e2e/browser/*.pw.ts. The node:test smokes in e2e/*.spec.ts stay as
//      they are — they check the prerendered bytes a crawler receives, which a browser does not.
//   4. `npm run e2e:browser` runs them.
//
// The web server is the real SSR build (`npm run build` first). With a server already on :4000
// it is reused.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/browser',
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'PORT=4000 npm run serve:ssr:typelessity-landing',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
