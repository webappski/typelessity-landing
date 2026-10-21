import { test, expect } from './fixtures';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expectedSitemapCount, GONE_SLUGS } from '../retired-industries';

// The Angular layer of the 404: the SSR server answers an unknown address with status 404 and the
// «This page doesn't exist» screen. Vercel does not run here: that the platform serves dist/404.html
// with a 404 is proved on the preview of the commit (card L1), not by this file.

const BROWSER = join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const H1 = /<h1[^>]*>\s*This page doesn't exist\s*<\/h1>/;

const sitemapPaths = (): string[] =>
  [...readFileSync(join(BROWSER, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/typelessity\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

// /install became a page in L5 and /gdpr in L7; what stays here answers nothing.
const GONE = ['/zz-404-check', '/zz/a/b/c', '/compare'];

test('an unknown address answers exactly 404 with the 404 screen', async ({ request }) => {
  const listed = new Set(sitemapPaths());
  for (const p of GONE.filter((x) => !listed.has(x))) {
    const res = await request.get(p, { maxRedirects: 0 });
    expect(res.status(), p).toBe(404);
    expect(await res.text(), p).toMatch(H1);
  }
});

test('a query string and a trailing slash do not turn an unknown address into a page', async ({ request }) => {
  for (const p of ['/zz/a/b/c?utm_source=x', '/zz-404-check/']) {
    const res = await request.get(p, { maxRedirects: 0 });
    expect(res.status(), p).toBe(404);
  }
});

test('every address of the sitemap, with and without a query string, answers 200 and is not the 404 screen', async ({ request }) => {
  const paths = sitemapPaths();
  expect(paths.length).toBe(expectedSitemapCount());
  for (const p of paths) {
    for (const url of [p, `${p}?utm_source=x`]) {
      const res = await request.get(url, { maxRedirects: 0 });
      expect(res.status(), url).toBe(200);
      expect(await res.text(), url).not.toMatch(H1);
    }
  }
});

test('dist/404.html, served under a deep address with status 404, loads clean and has no canonical and says noindex', async ({ page }) => {
  const shell = join(BROWSER, '404.html');
  expect(existsSync(shell), '404.html is missing: postbuild did not build it').toBe(true);
  const body = readFileSync(shell, 'utf8');
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // Chrome logs «Failed to load resource» for the 404 document itself; a failing asset is caught by `failed` below.
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.endsWith('/zz/deep/path/x')) errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && /\.(js|css|woff2?)(\?|$)/.test(r.url())) failed.push(`${r.status()} ${r.url()}`); });
  // Stands in for the platform rule «no file at this address -> 404.html»; the body is the real file.
  await page.route('**/zz/deep/path/x', (route) => route.fulfill({ status: 404, contentType: 'text/html; charset=utf-8', body }));
  await page.goto('/zz/deep/path/x');
  await expect(page.locator('h1')).toHaveText("This page doesn't exist");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

// L12 (C12): the noindex belongs to the 404 screen only. The document survives a client-side navigation, so the next page must take the tag away
// and name its own canonical again (SeoService.apply sets or removes both on every call).
test('leaving the 404 screen by «Go home» takes noindex away and gives the home page its own canonical', async ({ page }) => {
  await page.goto('/zz-404-check', { waitUntil: 'networkidle' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.locator('.nf__actions a', { hasText: 'Go home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://typelessity.com');
});

test('/404 on the SSR server is not a server error and is the 404 screen, not another page (the exact status is a property of the mirror)', async ({ request }) => {
  const res = await request.get('/404', { maxRedirects: 0 });
  expect(res.status(), 'the mirror may answer 200 for a prerendered route; Vercel answers 404 (preview row)').toBeLessThan(500);
  expect(await res.text()).toMatch(H1);
});

// Known defect FL-04, not repaired in L1 (card §1): after hydration the client router knows blog/:slug and legal/:doc, so a bot gets 404 but a visitor
// sees the article shell («Post not found») or the Security page instead of the 404 screen. L14: one test per address, and each holds the DEFECT as
// it is (a positive statement), not the wish: a `test.fail` turned red for any reason and told nothing about which address was fixed. When one of
// them goes red, FL-04 is repaired for that address: turn that test into the statement «the 404 screen is shown» and close the finding.
test('FL-04 /blog/<unknown>: after hydration the visitor sees the article shell with «Post not found», not the 404 screen', async ({ page }) => {
  test.info().annotations.push({ type: 'known-defect', description: 'FL-04 (FINDINGS): the client router answers /blog/:slug for any slug' });
  await page.goto('/blog/no-such-post');
  await expect(page.locator('app-blog-post'), 'the article page is mounted').toHaveCount(1);
  await expect(page.locator('app-blog-post')).toContainText('Post not found');
  await expect(page.locator('app-not-found'), 'the 404 screen is not shown (this is the defect)').toHaveCount(0);
});

test('FL-04 /legal/<unknown>: after hydration the visitor sees the Security page, not the 404 screen', async ({ page }) => {
  test.info().annotations.push({ type: 'known-defect', description: 'FL-04 (FINDINGS): the client router answers /legal/:doc for any doc and falls back to Security' });
  await page.goto('/legal/foo');
  await expect(page.locator('app-legal-page'), 'the legal page is mounted').toHaveCount(1);
  await expect(page.locator('app-legal-page h1').first()).toContainText(/security/i);
  await expect(page.locator('app-not-found'), 'the 404 screen is not shown (this is the defect)').toHaveCount(0);
});

// L11 (2026-10-20, founder: «we do not need industries»): the hub and the 37 industry pages are gone from the Angular layer too — no route, no
// prerender. The platform answers 410 (the rule is held by src/app/discovery/retired-industries.spec.ts; curl on the preview is the row that
// proves the platform). What THIS server proves: the mirror answers such an address 404 with the 404 screen (it used to answer 200 with an
// «Industry not found» page after hydration), and a visitor who arrives by a link inside the page sees the same screen.
test('an industry address is answered 404 with the 404 screen by the mirror, never a page, and shows the 404 screen after hydration', async ({ page, request }) => {
  const addresses = ['/industries', '/industries/', '/industries/no-such-slug', ...GONE_SLUGS.slice(0, 3).map((s) => `/industries/${s}`), `/industries/${GONE_SLUGS.at(-1)}`, '/industries/beauty-aesthetic-clinics'];
  for (const p of addresses) {
    const res = await request.get(p, { maxRedirects: 0 });
    expect(res.status(), p).toBe(404);
    expect(await res.text(), p).toMatch(H1);
    await page.goto(p);
    await expect(page.locator('app-not-found'), p).toHaveCount(1);
    await expect(page.locator('h1'), p).toHaveText("This page doesn't exist");
    await expect(page.getByText('Industry not found'), p).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Browse industries/i }), p).toHaveCount(0);
  }
});

// ── the 404 screen: four frames of L11 (390 and 1440, light and dark) ───────────────────────────────────────────────────────────────────────
// «Browse industries» left the screen: it offers «Go home» and «Blog» and no way into /industries. Taken when L11_FRAMES names a folder; the
// statement of each frame is the test around it (toHaveScreenshot is not used: fonts rasterise differently on macOS and Linux).
const FRAMES = process.env['L11_FRAMES'];
for (const scheme of ['light', 'dark'] as const) {
  for (const width of [390, 1440]) {
    test.describe(`404 screen ${width}px ${scheme}`, () => {
      test.use({ colorScheme: scheme });
      test(`[after-404-${width}-${scheme}] the heading, two buttons (Go home, Blog), no link to /industries, inside the window, the page is ${scheme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        await page.goto('/zz-404-check', { waitUntil: 'networkidle' });
        await expect(page.locator('app-not-found')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveText("This page doesn't exist");
        const actions = page.locator('.nf__actions a');
        await expect(actions).toHaveText(['Go home', 'Blog']);
        await expect(actions.nth(0)).toHaveAttribute('href', '/');
        await expect(actions.nth(1)).toHaveAttribute('href', '/blog');
        await expect(page.locator('app-not-found a[href^="/industries"]')).toHaveCount(0);
        const r = await page.evaluate(() => {
          const rgb = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g)!.map(Number);
          const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
          const bad = [...document.querySelectorAll('.nf__inner, .nf__actions a, h1')].filter((el) => { const b = el.getBoundingClientRect(); return b.right > window.innerWidth + 0.5 || b.left < -0.5; }).length;
          return { lum, bad, scroll: document.documentElement.scrollWidth, w: window.innerWidth, dark: matchMedia('(prefers-color-scheme: dark)').matches };
        });
        expect(r.dark, 'the browser is in the scheme asked for').toBe(scheme === 'dark');
        if (scheme === 'dark') expect(r.lum, 'the page background is dark').toBeLessThan(0.2); else expect(r.lum, 'the page background is light').toBeGreaterThan(0.8);
        expect(r.bad, 'an element of the 404 screen is wider than the window').toBe(0);
        expect(r.scroll, 'the page scrolls sideways').toBeLessThanOrEqual(r.w);
        if (FRAMES) {
          mkdirSync(FRAMES, { recursive: true });
          await page.screenshot({ path: join(FRAMES, `after-404-${width}-${scheme}.png`), fullPage: true });
        }
      });
    });
  }
}
