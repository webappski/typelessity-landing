import { test, expect } from './fixtures';

// L9 (2026-10-20): the twelve frames of the card each have their statement here (R59, R69 rev. 3), so the test holds what the eye would:
//   /blog                  390/1440 × light/dark — the h1 of the card, the ten articles linked inside <main>, nothing wider than the window;
//   comparison             390/1440 × light/dark — the line «checked 2026-10-15» stands right under the table, the table fits the column
//                          (it scrolls inside its own box at 390 rather than widening the page);
//   salon, transfer        390 × light/dark      — the table has three columns, the transfer article ends with the line about the demo.
// Contrast of the texts is measured by gray-text-contrast.pw.ts, overflow at 320/390 on every page by width-overflow.pw.ts.

const SLUGS = [
  'best-ai-booking-widgets-2026', 'best-ai-booking-beauty-salons-2026', 'best-ai-booking-transfer-services-2026', 'pricing-ai-products',
  'latency-budgets', 'designing-for-ai-agents', 'whisper-vs-webspeech', '25-languages-one-prompt', 'single-gpt-call', 'cascade-corrections',
];
const noWiderThanWindow = async (page: import('./fixtures').Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(scrollWidth, 'the page is wider than the window').toBeLessThanOrEqual(clientWidth);
};
const shot = async (page: import('./fixtures').Page, name: string) => {
  if (process.env['L9_FRAMES']) await page.screenshot({ path: `${process.env['L9_FRAMES']}/${name}.png`, fullPage: true });
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const width of [390, 1440]) {
      test(`[after-blog-list-${width}-${scheme}] /blog has the h1 of the card and links the ten articles`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/blog', { waitUntil: 'networkidle' });
        await expect(page.locator('h1')).toHaveText('AI booking guides and comparisons');
        await expect(page.locator('.blog-hero__sub')).toHaveText('Articles on booking by chat: how the engine works, how the pilot is priced, and how booking tools differ.');
        const hrefs = await page.locator('main a[href^="/blog/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
        expect([...new Set(hrefs)].sort()).toEqual(SLUGS.map((s) => `/blog/${s}`).sort());
        await noWiderThanWindow(page);
        await shot(page, `after-blog-list-${width}-${scheme}`);
      });

      test(`[after-best-ai-booking-widgets-2026-${width}-${scheme}] the line «checked 2026-10-15» stands right under the table, and the table stays in the column`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/blog/best-ai-booking-widgets-2026', { waitUntil: 'networkidle' });
        const table = page.locator('.blog-post__body table');
        await expect(table).toHaveCount(1);
        await expect(table.locator('th')).toHaveCount(6);
        await expect(page.locator('.blog-post__body table + p')).toContainText("Vendor columns: each vendor's official pricing page, checked 2026-10-15");
        const box = await table.boundingBox();
        expect(box!.x + box!.width, 'the table is wider than the window').toBeLessThanOrEqual(width + 1);
        await noWiderThanWindow(page);
        await shot(page, `after-best-ai-booking-widgets-2026-${width}-${scheme}`);
      });
    }

    test(`[after-best-ai-booking-beauty-salons-2026-390-${scheme}] the salon article has a table of three columns`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto('/blog/best-ai-booking-beauty-salons-2026', { waitUntil: 'networkidle' });
      await expect(page.locator('.blog-post__body table th')).toHaveCount(3);
      await noWiderThanWindow(page);
      await shot(page, `after-best-ai-booking-beauty-salons-2026-390-${scheme}`);
    });

    test(`[after-best-ai-booking-transfer-services-2026-390-${scheme}] the transfer article ends with the line about the demo`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto('/blog/best-ai-booking-transfer-services-2026', { waitUntil: 'networkidle' });
      await expect(page.locator('.blog-post__body table th')).toHaveCount(3);
      const paragraphs = await page.locator('.blog-post__body p').allInnerTexts();
      const sign = paragraphs.findIndex((p) => p.startsWith('— Alex Isa'));
      expect(sign).toBeGreaterThan(0);
      expect(paragraphs[sign - 1]).toBe('There is no public demo of a transfer setup yet; the TransEdge demo shows freight pickups.');
      await noWiderThanWindow(page);
      await shot(page, `after-best-ai-booking-transfer-services-2026-390-${scheme}`);
    });
  });
}
