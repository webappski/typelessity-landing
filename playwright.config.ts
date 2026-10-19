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
// The web server is the real SSR build (`npm run build` first). Each run starts a fresh
// server with loopback hosts allowed; an occupied :4000 fails instead of reusing stale settings.
//
// L3 (2026-10-19):
//   - Every spec imports `test` from ./e2e/browser/fixtures, never from '@playwright/test'. The fixture answers the widget
//     origin from a snapshot of the product's published widget build and the API origin with the product's own 404, and
//     refuses every other host (F6). global-setup.ts makes the snapshot, prints `widget.js sha256 <hex>` and fails with a
//     text when the product repo has no build (F16; env TY_WIDGET_DIST, TY_PRODUCT_ROOT). It never skips.
//   - serviceWorkers: 'block' — a service worker would answer requests before context.route sees them.
//   - colorScheme is Playwright's default, `light` (F7). The site follows the system theme, so a spec that measures
//     colour sets `test.use({ colorScheme })` inside its own `test.describe` for BOTH schemes; geometry runs in light.
//   - The only project is Chromium: specs may use CDP (CSS.getPlatformFontsForNode, DOM.getDocument with pierce).

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/browser',
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  globalSetup: './e2e/browser/global-setup.ts',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Angular SSR must accept this local QA host instead of returning a CSR shell.
    env: { NG_ALLOWED_HOSTS: 'localhost,127.0.0.1' },
    command: 'PORT=4000 npm run serve:ssr:typelessity-landing',
    url: 'http://localhost:4000',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
