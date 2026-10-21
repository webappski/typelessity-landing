import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from './fixtures';
import { HOME, PILOT_REQUESTS } from '../../src/app/pages/home/home.content';
import { PRICING_LAST_UPDATED } from '../../src/app/pages/pricing/pricing.content';

// L12 (SEO fixes from the page audit of 2026-10-20): the frames of R64 — 390 and 1440, light and dark — and the one statement each of them holds
// (R69 rev. 3: the frame is approved by the test that is green, not by an eye). Taken when L12_FRAMES names a folder; toHaveScreenshot is not used
// (fonts rasterise differently on macOS and Linux). Frames: after-pricing-date-*, after-for-ai-agents-prices-* (commit 1); after-footer-h2-*,
// after-article-top-* (commit 3). The bytes a crawler reads are held by e2e/*.spec.ts; here: what is on the screen.

const FRAMES = process.env['L12_FRAMES'];

async function shot(page: Page, name: string, fullPage = true): Promise<void> {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  await page.screenshot({ path: join(FRAMES, `${name}.png`), fullPage });
}

/** Luminance of the page background: «light» > 0.8, «dark» < 0.1 — the rule, not a literal. */
async function expectSurface(page: Page, scheme: 'light' | 'dark'): Promise<void> {
  const value = await page.evaluate(() => {
    const parse = (s: string) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1]!.split(/[\s,/]+/).filter(Boolean).map(parseFloat); return { r: a[0]!, g: a[1]!, b: a[2]!, a: a.length > 3 ? a[3]! : 1 }; };
    const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    for (const e of [document.body, document.documentElement]) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a >= 0.99) return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    }
    return /dark/.test(getComputedStyle(document.documentElement).colorScheme) ? 0 : 1;
  });
  if (scheme === 'light') expect(value, 'the page background is light').toBeGreaterThan(0.8);
  else expect(value, 'the page background is dark').toBeLessThan(0.1);
}

const noSideScroll = async (page: Page) => {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, 'no horizontal scroll').toBeLessThanOrEqual(client);
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`L12 ${scheme} system theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1440]) {
      test(`[after-pricing-date-${width}-${scheme}] /pricing at ${width}px: «Page last updated ${PRICING_LAST_UPDATED}» sits under the four tiers, once, readable, inside the window`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/pricing');
        const line = page.locator('main p.pricing-updated');
        await expect(line).toHaveCount(1);
        await expect(line).toHaveText(`Page last updated ${PRICING_LAST_UPDATED}`);
        const geometry = await page.evaluate(() => {
          const cards = [...document.querySelectorAll('main article.tier')];
          const last = cards[cards.length - 1]!.getBoundingClientRect();
          const el = document.querySelector('main p.pricing-updated')!.getBoundingClientRect();
          return { below: el.top >= last.bottom, inside: el.right <= document.documentElement.clientWidth };
        });
        expect(geometry.below, 'the line sits under the last tier card').toBe(true);
        expect(geometry.inside, 'the line is inside the window').toBe(true);
        await expectSurface(page, scheme);
        await noSideScroll(page);
        await shot(page, `after-pricing-date-${width}-${scheme}`);
      });

      test(`[after-for-ai-agents-prices-${width}-${scheme}] /for-ai-agents at ${width}px: the list of resources prints the four prices of the tiers, the month on the paid ones`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/for-ai-agents');
        const item = page.locator('main .aiagents-links li', { has: page.locator('a[href="/pricing"]') });
        await expect(item).toHaveCount(1);
        const expected = HOME.pricing.tiers.map((t) => `${t.name} ${t.price}${'period' in t ? ' a month' : ` (${PILOT_REQUESTS} booking requests a month)`}`).join(', ');
        await expect(item).toContainText(expected);
        await expect(item).toContainText('Free Pilot €0 (50 booking requests a month), Starter €39 a month, Pro €149 a month, Enterprise €399 a month');
        await expectSurface(page, scheme);
        await noSideScroll(page);
        await shot(page, `after-for-ai-agents-prices-${width}-${scheme}`);
      });

      test(`[after-footer-h2-${width}-${scheme}] the footer at ${width}px: three h2 column headings that look as the h4 did, the two parent links are at least 24 px high, nothing wider than the window`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/install');
        const footer = page.locator('footer.vc-footer');
        await expect(footer.locator('h2.vc-footer-h')).toHaveText(['Product', 'Guides', 'Company']);
        await expect(footer.locator('h4')).toHaveCount(0);
        const look = await footer.locator('h2.vc-footer-h').first().evaluate((el) => {
          const c = getComputedStyle(el);
          return { size: c.fontSize, upper: c.textTransform, spacing: c.letterSpacing, weight: c.fontWeight, line: parseFloat(c.lineHeight) / parseFloat(c.fontSize) };
        });
        expect(look.size, 'the heading keeps the size of the old h4').toBe('12px');
        expect(look.upper).toBe('uppercase');
        expect(look.weight).toBe('600');
        expect(look.line, 'the line height is pinned, not the global h2 one').toBeCloseTo(1.18, 2);
        for (const name of ['webappski.com', 'typelessform.com']) {
          const box = await footer.locator('.vc-footer-parent a', { hasText: name }).boundingBox();
          expect(box!.height, `${name} is a target of at least 24 px`).toBeGreaterThanOrEqual(24);
        }
        const inside = await footer.evaluate((el) => [...el.querySelectorAll(':not(.vc-footer-giant):not(.vc-footer-giant *)')].every((n) => n.getBoundingClientRect().right <= document.documentElement.clientWidth + 0.5));
        expect(inside, 'an element of the footer is wider than the window').toBe(true);
        await expectSurface(page, scheme);
        await noSideScroll(page);
        if (FRAMES) { mkdirSync(FRAMES, { recursive: true }); await footer.screenshot({ path: join(FRAMES, `after-footer-h2-${width}-${scheme}.png`) }); }
      });

      test(`[after-article-top-${width}-${scheme}] an article at ${width}px: the first block under the header is the answer, the author is a link to /about, no note before the text`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/blog/best-ai-booking-widgets-2026');
        const body = page.locator('.blog-post__body markdown');
        await expect(body.locator('> *').first()).toHaveJSProperty('tagName', 'P');
        await expect(body.locator('> *').first().locator('strong').first()).toContainText('The best AI booking widget in 2026 depends on the category fit');
        await expect(body.locator('> blockquote').first(), 'the notes follow the heading at the end').toHaveCount(1);
        const author = page.locator('.blog-post__meta a.blog-post__author');
        await expect(author).toHaveText('Alex Isa');
        await expect(author).toHaveAttribute('href', '/about');
        const top = await body.locator('> *').first().evaluate((el) => el.getBoundingClientRect().top);
        expect(top, 'the answer starts inside the first screen').toBeLessThan(900);
        await expectSurface(page, scheme);
        await noSideScroll(page);
        await shot(page, `after-article-top-${width}-${scheme}`, false);
      });
    }
  });
}

test('«Hide tips» on the home page is a target of at least 24 px (it was 23)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const box = await page.locator('button.demo__tips').boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(24);
});
