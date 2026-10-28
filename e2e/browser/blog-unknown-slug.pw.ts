import { test, expect, type Page } from './fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// SEO24-TYL-2 (N-02): /blog/<unknown slug> says the same as the 404 screen: noindex, no canonical, the title of the 404 screen.
// The path that matters is the browser's. Today the platform answers an address with no file with the home page and a 200 (the audit of 24.10:
// canonical of the home page, no robots); the router then mounts the article shell over that document and prints «Post not found», and it used to
// leave the head of the home page as it was. The local SSR server does not show this (it answers the same address with the 404 screen and its noindex
// already in the bytes), so these tests put the bytes the platform sends in place of the document: dist's index.html with a 200 (today) and
// dist's 404.html with a 404 (after SEO24-TYL-1). The head of the 404 screen is READ from a page that shows it, not typed here.

const BROWSER = join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const ARTICLE = 'latency-budgets';
const UNKNOWN = '/blog/nope-xyz';

interface Head { title: string; description: string | null; robots: string | null; canonicals: number; ogUrl: string | null }

const head = (page: Page): Promise<Head> =>
  page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
    canonicals: document.querySelectorAll('link[rel="canonical"]').length,
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null,
  }));

/** The platform's answer for an address with no file: the bytes of `file` under `status`, in place of the document of `path`. */
async function serveAs(page: Page, path: string, file: 'index.html' | '404.html', status: number): Promise<void> {
  const body = readFileSync(join(BROWSER, file), 'utf8');
  await page.route(`**${path}`, (route) => route.fulfill({ status, contentType: 'text/html; charset=utf-8', body }));
}

/** The head of the 404 screen as the visitor gets it (the SSR server draws it at an unknown address). */
async function headOf404Screen(page: Page): Promise<Head> {
  await page.goto('/zz-404-check', { waitUntil: 'networkidle' });
  await expect(page.locator('app-not-found')).toHaveCount(1);
  return head(page);
}

async function expectIsTheHeadOf404Screen(page: Page, screen: Head): Promise<void> {
  await expect(page.locator('app-blog-post'), 'the article shell is mounted by the client router').toHaveCount(1);
  await expect(page.locator('app-blog-post')).toContainText('Post not found');
  // The statements of the card, as literals: the audit asks for exactly these three.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page).toHaveTitle(/^404 — Page not found/);
  // And the head is the head of the 404 screen, whole: the two pages must not drift apart.
  expect(await head(page)).toEqual(screen);
}

test('today: the platform answers /blog/<unknown> with the home page and a 200 — after boot the head is the head of the 404 screen', async ({ page }) => {
  const screen = await headOf404Screen(page);
  await serveAs(page, UNKNOWN, 'index.html', 200);
  await page.goto(UNKNOWN, { waitUntil: 'networkidle' });
  await expectIsTheHeadOf404Screen(page, screen);
});

test('after SEO24-TYL-1: the platform answers /blog/<unknown> with 404.html and a 404 — the article shell leaves the head as it is', async ({ page }) => {
  const screen = await headOf404Screen(page);
  await serveAs(page, UNKNOWN, '404.html', 404);
  await page.goto(UNKNOWN, { waitUntil: 'networkidle' });
  await expectIsTheHeadOf404Screen(page, screen);
});

// The same component instance serves every slug: the head follows the slug in both directions, so neither noindex nor the article's own tags stay behind.
test('client navigation between an unknown slug and an article moves the head with it, both ways', async ({ page }) => {
  await serveAs(page, UNKNOWN, 'index.html', 200);
  await page.goto(UNKNOWN, { waitUntil: 'networkidle' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const go = (path: string) => page.evaluate((p) => { history.pushState(null, '', p); window.dispatchEvent(new PopStateEvent('popstate', { state: null })); }, path);

  await go(`/blog/${ARTICLE}`);
  await expect(page.locator('app-blog-post h1').first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'max-image-preview:large');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://typelessity.com/blog/${ARTICLE}`);
  await expect(page).not.toHaveTitle(/404/);

  await go(UNKNOWN);
  await expect(page.locator('app-blog-post')).toContainText('Post not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page).toHaveTitle(/^404 — Page not found/);
});
