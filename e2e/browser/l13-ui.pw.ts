import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from './fixtures';
import { BADGE, COPY } from '../free-pilot-copy';

// L13 (21.10): the two visible changes that are not the tip card of the phone (that one is held by home-demo.pw.ts, «L14 tips on a phone»), and the one statement
// each frame (R64) holds.
//   CRO 2 / FL-62  the button of the Webappski card says «Apply for the AEO pilot»: the word «free pilot» meant two things on one screen (the card's 30 days of
//                  work on AI visibility, and the tariff «Free pilot: 50 booking requests a month»). The badge and the tariff are not touched.
//   G-6 / L-11     under the Message field of the question form: «Please do not include health or other sensitive information.»
//   G-3 / L-2     /privacy, the notice for a visitor of the site (a draft for the lawyer), and the footer link «Privacy notice» that leads to it
// Frames when L13_FRAMES names a folder: after-home-pilot-{390,1440}-{light,dark}, after-pricing-hint-{390,1440}-{light,dark}, after-privacy-{390,1440}-{light,dark},
// after-footer-privacy-{390,1440}-{light,dark}.

const FRAMES = process.env['L13_FRAMES'];
async function shot(page: Page, name: string): Promise<void> {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  await page.screenshot({ path: join(FRAMES, `${name}.png`), fullPage: false });
}
async function expectSurface(page: Page, scheme: 'light' | 'dark'): Promise<void> {
  const value = await page.evaluate(() => {
    const parse = (s: string) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1]!.split(/[\s,/]+/).filter(Boolean).map(parseFloat); return { r: a[0]!, g: a[1]!, b: a[2]!, a: a.length > 3 ? a[3]! : 1 }; };
    const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    for (const e of [document.body, document.documentElement]) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a >= 0.99) return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    }
    return 1;
  });
  if (scheme === 'light') expect(value, 'the page background is light').toBeGreaterThan(0.8);
  else expect(value, 'the page background is dark').toBeLessThan(0.1);
}

for (const scheme of ['light', 'dark'] as const) {
  for (const [width, height] of [[390, 844], [1440, 900]] as const) {
    test.describe(`L13 ${width}px ${scheme}`, () => {
      test.use({ colorScheme: scheme });

      test(`[after-home-pilot-${width}-${scheme}] the card's button says «Apply for the AEO pilot», the badge still names Webappski, and the card no longer calls its button a «free pilot»`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        const offer = page.getByTestId('free-pilot-offer');
        await expect(offer.locator('.pilot-offer__badge')).toHaveText(BADGE);
        const button = offer.getByTestId('pilot-hook-button');
        await expect(button).toHaveText('Apply for the AEO pilot');
        await expect(button).toHaveText(COPY[3]!);
        expect(await button.getAttribute('href'), 'the address of the button is the application page of Webappski').toMatch(/^https:\/\/webappski\.com\/en\/free-aeo-pilot\?utm_source=typelessity\.com/);
        const card = (await offer.innerText()).toLowerCase();
        expect(card, 'the card does not say «free pilot» in its button any more; its badge says «Free AEO pilot»').not.toContain('apply for the free pilot');
        await expectSurface(page, scheme);
        await shot(page, `after-home-pilot-${width}-${scheme}`);
      });

      test(`[after-privacy-${width}-${scheme}] /privacy: one h1, the controller and the host named, canonical to itself, no horizontal scroll`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/privacy');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy on typelessity.com');
        await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://typelessity.com/privacy');
        const body = page.locator('.legal__body');
        await expect(body).toContainText('typelessity.com is run by Lizaveta Isayeuskaya');
        await expect(body).toContainText('Vercel Inc. (United States)');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
        // the body is drawn by <markdown>: its headings carry the spacing of the page's styles (they stood against the paragraph above them before L13)
        const gaps = await body.locator('h2').evaluateAll((hs) => hs.map((h) => ({ above: parseFloat(getComputedStyle(h).marginTop), below: parseFloat(getComputedStyle(h).marginBottom), size: parseFloat(getComputedStyle(h).fontSize) })));
        expect(gaps.length, 'the six sections').toBe(6);
        for (const g of gaps) { expect(g.above).toBeGreaterThanOrEqual(24); expect(g.below).toBeGreaterThanOrEqual(8); expect(g.size).toBeGreaterThanOrEqual(20); }
        await expectSurface(page, scheme);
        await shot(page, `after-privacy-${width}-${scheme}`);
      });

      test(`[after-footer-privacy-${width}-${scheme}] the footer has «Privacy notice» next to «Data processing (DPA)» and it leads to /privacy`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/pricing');
        const link = page.locator('footer').getByRole('link', { name: 'Privacy notice', exact: true });
        await expect(link).toHaveAttribute('href', '/privacy');
        await expect(page.locator('footer').getByRole('link', { name: 'Data processing (DPA)', exact: true })).toHaveAttribute('href', 'https://webappski.com/en/legal/dpa-typelessity');
        await link.scrollIntoViewIfNeeded();
        await expect(link).toBeInViewport();
        await expectSurface(page, scheme);
        await shot(page, `after-footer-privacy-${width}-${scheme}`);
        await link.click();
        await expect(page).toHaveURL(/\/privacy$/);
      });

      test(`[after-pricing-hint-${width}-${scheme}] under the Message field of the question form: the one sentence about health data, tied to the field`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/pricing');
        const message = page.locator('#cf-message');
        const hint = page.locator('#cf-message-hint');
        await expect(hint).toHaveText('Please do not include health or other sensitive information.');
        await expect(message).toHaveAttribute('aria-describedby', 'cf-message-hint');
        const box = await page.evaluate(() => {
          const m = document.querySelector('#cf-message')!.getBoundingClientRect();
          const h = document.querySelector('#cf-message-hint')!.getBoundingClientRect();
          return { gap: h.top - m.bottom, hintInsideForm: h.left >= m.left - 1 && h.right <= m.right + 1 };
        });
        expect(box.gap, 'the hint stands right under the field').toBeGreaterThanOrEqual(0);
        expect(box.gap).toBeLessThan(16);
        expect(box.hintInsideForm, 'the hint does not run past the field').toBe(true);
        await message.scrollIntoViewIfNeeded();
        await expectSurface(page, scheme);
        await shot(page, `after-pricing-hint-${width}-${scheme}`);
      });
    });
  }
}

test('the hint changes nothing the form sends: the legal basis of its notice is the one the lawyer wrote on 5 October (consent), the hint is no new field', async ({ page }) => {
  await page.goto('/pricing');
  const notice = await page.locator('#cf-notice').innerText();
  expect(notice).toContain('Basis: your consent (Art. 6(1)(a) GDPR)');
  expect(await page.locator('.cf textarea').count(), 'one free-text field').toBe(1);
  expect(await page.locator('.cf input:not([type=checkbox]), .cf select, .cf textarea').count(), 'email, website, plan, industry, message').toBe(5);
});
