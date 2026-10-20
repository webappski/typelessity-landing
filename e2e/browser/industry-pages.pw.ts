import { test, expect } from './fixtures';
import { SEVEN_PAGES } from '../industries-seven';

// L8 (2026-10-20): the frames `after-{beauty-hair-salons,hospitality-restaurants,fitness-gyms}-{390,1440}-{light,dark}` of the
// card each have their statement here (R59, R69 rev. 3), so the test holds what the eye would:
//   - the page reads in the order of the card (D3): kicker · H1 · bubble · capsule · what gets in the way · example · fields ·
//     why · FAQ · read next · other industries · call to action; a plain page has no «what gets in the way» and no FAQ;
//   - the bubble of the three pages is a visible block of its own colour in both themes (not the colour of the page: a bubble
//     that disappears into the page is the defect of a theme that was only checked in one of the two), and sits inside the column;
//   - nothing is wider than the window; the call to action is a link to /install and a link to /pricing.
// Contrast of the new texts is measured by gray-text-contrast.pw.ts, which reads every address of the sitemap.

const FRAMES = ['beauty-hair-salons', 'hospitality-restaurants', 'fitness-gyms'] as const;
const ORDER_DEEP = ['What gets in the way', 'Example conversations', 'Fields collected', 'Why Typelessity fits', 'FAQ', 'Read next', 'Other industries'];
const ORDER_PLAIN = ['Example conversations', 'Fields collected', 'Why Typelessity fits', 'Read next', 'Other industries'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const width of [390, 1440]) {
      for (const slug of FRAMES) {
        const spec = SEVEN_PAGES.find((p) => p.slug === slug)!;
        test(`[after-${slug}-${width}-${scheme}] the page reads in the order of the card, the bubble is its own block, nothing is wider than the window`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`/industries/${slug}`, { waitUntil: 'networkidle' });
          await expect(page.locator('h1')).toHaveText(`AI booking assistant for ${spec.audience}`);

          const headings = await page.locator('.industry__section > h2').allInnerTexts();
          expect(headings).toEqual(spec.deep ? ORDER_DEEP : ORDER_PLAIN);

          // the bubble sits between the H1 and the capsule, where it exists
          const order = await page.locator('.industry__hero').evaluate((hero) => [...hero.children].map((c) => c.className.toString().split(' ')[0] || c.tagName.toLowerCase()));
          expect(order.filter((c) => ['vc-kicker', 'industry__quote', 'industry__sub', 'h1'].includes(c)).filter((c) => c !== 'vc-kicker'))
            .toEqual(spec.quote ? ['h1', 'industry__quote', 'industry__sub'] : ['h1', 'industry__sub']);

          if (spec.quote) {
            const bubble = page.locator('.industry__quote');
            await expect(bubble).toHaveText(`“${spec.quote}”`);
            const colours = await bubble.evaluate((el) => ({ bubble: getComputedStyle(el).backgroundColor, page: getComputedStyle(document.body).backgroundColor, border: getComputedStyle(el).borderTopWidth }));
            expect(colours.bubble, 'the bubble has the colour of the page behind it').not.toBe(colours.page);
            expect(colours.border).not.toBe('0px');
            const box = await bubble.boundingBox();
            const hero = await page.locator('.industry__hero').boundingBox();
            expect(box!.x).toBeGreaterThanOrEqual(hero!.x - 1);
            expect(box!.x + box!.width).toBeLessThanOrEqual(hero!.x + hero!.width + 1);
          }

          const ctas = page.locator('.industry__final a');
          await expect(ctas.nth(0)).toHaveAttribute('href', '/install');
          await expect(ctas.nth(1)).toHaveAttribute('href', '/pricing');

          const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
          expect(scrollWidth, 'the page is wider than the window').toBeLessThanOrEqual(clientWidth);

          if (process.env['L8_FRAMES']) await page.screenshot({ path: `${process.env['L8_FRAMES']}/after-${slug}-${width}-${scheme}.png`, fullPage: true });
        });
      }
    }
  });
}

test('the FAQ of a deep page opens and shows its answer; the answers stay inside the column at 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/industries/beauty-hair-salons', { waitUntil: 'networkidle' });
  const first = page.locator('.faq details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  const box = await first.locator('p').boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});
