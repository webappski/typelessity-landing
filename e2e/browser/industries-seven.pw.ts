import { test, expect, type Page, REDUCED_MOTION } from './fixtures';
import { SEVEN, SEVEN_CATEGORIES, SEVEN_SLUGS } from '../industries-seven';

// L1б: the hub and the home grid show the seven industries that have a page. Each frame the founder-facing check
// looks at («стало», 390 and 1440, the one dark theme the site has until L3) has its statement here, so the test holds
// what the eye would: the count, the grouping, the columns and that nothing is wider than the window.

const WIDTHS = [390, 1440] as const;

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(scrollWidth, 'the page is wider than the window').toBeLessThanOrEqual(clientWidth);
}

for (const width of WIDTHS) {
  test.describe(`@${width}`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('the hub lists seven cards in five categories, each category with its own cards, nothing wider than the window', async ({ page }) => {
      await page.goto('/industries');
      await expect(page.locator('.industry-card')).toHaveCount(SEVEN.length);
      const groups = await page.locator('.industries-cat').evaluateAll((sections) => sections.map((s) => ({
        category: (s.querySelector('h2')?.textContent ?? '').trim(),
        slugs: [...s.querySelectorAll('a.industry-card')].map((a) => (a.getAttribute('href') ?? '').replace('/industries/', '')).sort(),
      })));
      expect(groups.map((g) => g.category).sort()).toEqual(SEVEN_CATEGORIES);
      for (const g of groups) expect(g.slugs, g.category).toEqual(SEVEN.filter((i) => i.category === g.category).map((i) => i.slug).sort());
      const boxes = await page.locator('.industry-card').evaluateAll((cs) => cs.map((c) => { const r = c.getBoundingClientRect(); return { left: Math.round(r.left), width: Math.round(r.width) }; }));
      for (const b of boxes) expect(b.width, 'a card is wider than the window').toBeLessThanOrEqual(width);
      if (width === 390) expect(new Set(boxes.map((b) => b.left)).size, 'one column on a phone').toBe(1);
      else for (const b of boxes) expect(b.width, 'a card stretched across the desktop window').toBeLessThan(500);
      await noHorizontalScroll(page);
    });

    // L4: the home page draws one card per industry (a link to that industry's page), no chips and no «all» tile; nothing links to the hub.
    // Reduced motion: the demo above does not play, so the measure does not land in the middle of a tip.
    test.describe('home', () => {
      test.use(REDUCED_MOTION);

      test('the home grid has seven industry cards, each linking to its own page, and no link to the hub', async ({ page }) => {
        await page.goto('/');
        const cards = page.locator('#industries a.card--link');
        await expect(cards).toHaveCount(SEVEN.length);
        const found = await cards.evaluateAll((as) => as.map((a) => ({ href: a.getAttribute('href') ?? '', name: (a.querySelector('h3')?.textContent ?? '').trim() })));
        expect(found.map((c) => c.href).sort()).toEqual(SEVEN.map((i) => `/industries/${i.slug}`).sort());
        expect(found.map((c) => c.name).sort()).toEqual(SEVEN.map((i) => i.name).sort());
        await expect(page.locator('main a[href="/industries"]'), 'the home page does not link to the hub').toHaveCount(0);
        await cards.last().scrollIntoViewIfNeeded();
        await expect(cards.last()).toBeVisible();
        const tops = await cards.evaluateAll((cs) => cs.map((c) => { const r = c.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), left: Math.round(r.left) }; }));
        if (width === 390) expect(new Set(tops.map((t) => t.left)).size, 'one column on a phone').toBe(1);
        else expect(new Set(tops.map((t) => t.top)).size, '7 cards in 3 columns are 3 rows').toBe(3);
        await noHorizontalScroll(page);
      });
    });

    test('the seven kept pages are real pages, and a taken-down address shows the 404 screen', async ({ page }) => {
      for (const slug of SEVEN_SLUGS) {
        await page.goto(`/industries/${slug}`);
        await expect(page.locator('app-not-found'), slug).toHaveCount(0);
        await expect(page.locator('h1').first(), slug).not.toHaveText("This page doesn't exist");
      }
      await page.goto('/industries/home-cleaning');
      await expect(page.locator('app-not-found')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText("This page doesn't exist");
      await expect(page.getByRole('link', { name: /Browse industries/i })).toHaveAttribute('href', '/industries');
      await noHorizontalScroll(page);
    });
  });
}
