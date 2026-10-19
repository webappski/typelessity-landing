import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expectedSitemapCount, RETIRED_SLUGS } from '../industries-seven';

// The Angular layer of the 404: the SSR server answers an unknown address with status 404 and the
// «This page doesn't exist» screen. Vercel does not run here: that the platform serves dist/404.html
// with a 404 is proved on the preview of the commit (card L1), not by this file.

const BROWSER = join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const H1 = /<h1[^>]*>\s*This page doesn't exist\s*<\/h1>/;

const sitemapPaths = (): string[] =>
  [...readFileSync(join(BROWSER, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/typelessity\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');

// /install and /gdpr become pages in L5 and L7; they are 404 checks only while no page answers there.
const GONE = ['/zz-404-check', '/zz/a/b/c', '/install', '/gdpr', '/compare'];

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

test('dist/404.html, served under a deep address with status 404, loads clean and keeps its canonical to /404', async ({ page }) => {
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
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://typelessity.com/404');
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('/404 on the SSR server is not a server error and is the 404 screen, not another page (the exact status is a property of the mirror)', async ({ request }) => {
  const res = await request.get('/404', { maxRedirects: 0 });
  expect(res.status(), 'the mirror may answer 200 for a prerendered route; Vercel answers 404 (preview row)').toBeLessThan(500);
  expect(await res.text()).toMatch(H1);
});

// Known defect, not repaired in L1 (card §1): after hydration the client router knows blog/:slug,
// industries/:slug and legal/:doc, so a bot gets 404 but a visitor sees an article, an industry or the
// Security page. test.fail() keeps it visible and turns red when someone fixes it (then drop .fail).
test.fail('after hydration an unknown blog or legal address shows the 404 screen', async ({ page }) => {
  for (const p of ['/blog/no-such-post', '/legal/foo']) {
    await page.goto(p);
    await expect(page.locator('app-not-found'), p).toHaveCount(1);
  }
});

// L1б (FL-04, industries part): a retired or unknown industry address showed «Industry not found» after hydration while
// the platform answers 410 or 404. The detail page now renders the same 404 screen. The status of the response is not
// asserted: the SSR mirror answers 200 for /industries/<x> (the platform serves a static file or the 410 rule).
test('after hydration an unknown or retired industry address shows the 404 screen, not «Industry not found»', async ({ page }) => {
  for (const p of ['/industries/no-such-slug', '/industries/home-cleaning', `/industries/${RETIRED_SLUGS[0]}`, '/industries/beauty-aesthetic-clinics']) {
    await page.goto(p);
    await expect(page.locator('app-not-found'), p).toHaveCount(1);
    await expect(page.locator('h1'), p).toHaveText("This page doesn't exist");
    await expect(page.getByText('Industry not found'), p).toHaveCount(0);
  }
});
