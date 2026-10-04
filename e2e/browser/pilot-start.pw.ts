import { test, expect, type Page } from '@playwright/test';

// A43 (founder 2026-09-25): every tier starts with the free pilot, which is set up in the Webappski
// portal. Each «start» button leads to the portal login with start=typelessity and the utm_* that tell
// webappski.com where the visitor came from; the Free Pilot is the first tier a visitor sees.

const TIERS = [
  { name: 'Free Pilot', cta: 'Start free pilot', content: 'free-pilot' },
  // Founder 25.09: on the paid tiers the button says what it starts — the free pilot, not Pro.
  { name: 'Starter', cta: 'Start with the free pilot', content: 'starter' },
  { name: 'Pro', cta: 'Start with the free pilot', content: 'pro' },
  { name: 'Enterprise', cta: 'Start with the free pilot', content: 'enterprise' },
];

function expectPortalLink(href: string | null, medium: string, content: string) {
  expect(href, 'start link').not.toBeNull();
  const url = new URL(href!);
  expect(url.origin).toBe('https://webappski.com');
  expect(url.pathname).toBe('/en/portal/login');
  expect(url.searchParams.get('start')).toBe('typelessity');
  expect(url.searchParams.get('utm_source')).toBe('typelessity.com');
  expect(url.searchParams.get('utm_medium')).toBe(medium);
  expect(url.searchParams.get('utm_content')).toBe(content);
}

async function tierCards(page: Page) {
  return page.locator('.home-tiers .tier');
}

for (const path of ['/', '/pricing']) {
  test(`${path}: each tier starts with the free pilot in the portal`, async ({ page }) => {
    await page.goto(path);
    const cards = await tierCards(page);
    await expect(cards).toHaveCount(TIERS.length);
    for (const [i, tier] of TIERS.entries()) {
      const card = cards.nth(i);
      await expect(card.locator('.tier__name')).toHaveText(tier.name);
      const link = card.getByRole('link', { name: tier.cta });
      expectPortalLink(await link.getAttribute('href'), 'pricing', tier.content);
    }
    await expect(page.locator('.home-tiers')).not.toContainText(/coming soon/i);
  });

  for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    test(`${path} at ${viewport.width}px: the Free Pilot is the first tier a visitor sees`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const boxes = await Promise.all(
        TIERS.map(async (t) => (await tierCards(page)).filter({ has: page.locator('.tier__name', { hasText: new RegExp(`^${t.name}$`) }) }).boundingBox()),
      );
      const [pilot, ...rest] = boxes.map((b) => b!);
      for (const other of rest) {
        // Side by side on desktop, stacked on a phone: the pilot is left of, or above, every other tier.
        expect(pilot.y < other.y - 1 || (Math.abs(pilot.y - other.y) <= 1 && pilot.x < other.x)).toBe(true);
      }
    });
  }
}

test('hero, closing call and header lead to the portal', async ({ page }) => {
  await page.goto('/');
  expectPortalLink(await page.locator('.home-hero__cta a').first().getAttribute('href'), 'hero', 'free-pilot');
  expectPortalLink(await page.locator('.home-cta__actions a').first().getAttribute('href'), 'home-cta', 'free-pilot');
  expectPortalLink(await page.locator('header a.vc-btn-primary').first().getAttribute('href'), 'nav', 'free-pilot');
  await page.goto('/how-it-works');
  expectPortalLink(await page.getByRole('link', { name: 'Start free pilot' }).getAttribute('href'), 'how-it-works', 'free-pilot');
});
