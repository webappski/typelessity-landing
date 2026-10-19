import { test, expect, type Page } from './fixtures';

// L6: /pricing and /faq. Frames: every test whose title starts with [after-…] holds the one statement of that frame of
// L6/frames/ (R64, R69 rev. 3): after-pricing-{390,1440}-{light,dark} and after-faq-{390,1440}-{light,dark}.
// The words a visitor and a crawler read (the exact <title>, the counts and the limits) are held by
// e2e/pricing-faq-facts.spec.ts and e2e/claims-class-guard.spec.ts over the built HTML; here: what is on the screen.
// Chromium only.

/** Relative luminance of the page background (<body>, its own colour or <html>'s). «light» > 0.8, «dark» < 0.1: the rule, not a literal. */
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

const WHAT_COUNTS = 'What counts: one booking request your customer sends. An abandoned conversation and a practice run in the portal do not count. The count starts again on the 1st of each month.';
const AFTER_LIMIT = 'After the limit: requests are not refused. Each new one reaches you by email, is not counted and does not go to your booking system; whether a conversation is over the limit is decided when it starts. On Free Pilot, Starter and Pro, move to the next plan in the Webappski portal (invoiced) to keep requests going to your system.';
const GROUPS = ['product', 'ai-behavior', 'integration', 'privacy', 'pricing', 'security', 'competitor-migration'] as const;

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1440]) {
      test(`[after-pricing-${width}-${scheme}] /pricing at ${width}px: four equal tiers, «/ month» on the three paid ones only, what counts and what happens after the limit, a way in to /install, the form stays, the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/pricing');
        await expect(page.locator('main article.tier')).toHaveCount(4);
        await expect(page.locator('main .tier--featured, main .tier__badge'), 'no tier is picked out').toHaveCount(0);
        await expect(page.locator('main .tier__period')).toHaveCount(3);
        await expect(page.locator('main .tier__period')).toHaveText(['/ month', '/ month', '/ month']);
        await expect(page.locator('main article.tier').first().locator('.tier__period')).toHaveCount(0);
        await expect(page.locator('main')).toContainText(WHAT_COUNTS);
        await expect(page.locator('main')).toContainText(AFTER_LIMIT);
        await expect(page.locator('main a[href="/install"]').first()).toBeVisible();
        await expect(page.locator('#start-pilot')).toHaveCount(1);
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });

      test(`[after-faq-${width}-${scheme}] /faq at ${width}px: «Typelessity FAQ», the seven groups, a link in each (Integration → /install), the phone answer, the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/faq');
        await expect(page.locator('h1')).toHaveText('Typelessity FAQ');
        for (const g of GROUPS) {
          await expect(page.locator(`main section#${g}`), `group #${g}`).toHaveCount(1);
          await expect(page.locator(`main section#${g} .faq-cat__more a`), `group #${g} has its link`).toHaveCount(1);
        }
        await expect(page.locator('main section#integration .faq-cat__more a')).toHaveAttribute('href', '/install');
        const phones = page.locator('main details', { hasText: 'Does it work on phones?' });
        await expect(phones).toHaveCount(1);
        await phones.locator('summary').click();
        await expect(phones).toContainText('520 px and 380 px');
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });
    }
  });
}

test('/pricing links to /install from inside <main>, and /faq#integration answers with the same link', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('main a[href="/install"]').first()).toHaveText(/install/i);
  await page.goto('/faq#integration');
  await expect(page.locator('#integration')).toBeVisible();
  await expect(page.locator('#integration a[href="/install"]').first()).toBeVisible();
});
