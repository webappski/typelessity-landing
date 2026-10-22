import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from './fixtures';
import { BUTTON } from '../free-pilot-copy';
import { PRIVACY_LAST_UPDATED } from '../../src/app/pages/privacy/privacy.content';
import { CONTRAST_ENGINE } from './contrast-engine';

// L13 (21.10): the two visible changes that are not the tip card of the phone (that one is held by home-demo.pw.ts, «L14 tips on a phone»), and the one statement
// each frame (R64) holds.
//   CRO 2 / FL-62  the button of the Webappski card says «Apply for the AEO pilot»: the word «free pilot» meant two things on one screen (the card's 30 days of
//                  work on AI visibility, and the tariff «Free pilot: 50 booking requests a month»). The badge and the tariff are not touched.
//   G-6 / L-11     under the Message field of the question form: «Please do not include health or other sensitive information, or personal details of your own customers.» (F-8 of the legal round: a business describing its booking flow may paste an example with the data of its customer)
//   G-3 / L-2     /privacy, the notice for a visitor of the site (a draft for the lawyer), and the footer link «Privacy notice» that leads to it
// Frames when L13_FRAMES names a folder: after-home-pilot-{390,1440}-{light,dark}, after-pricing-hint-{390,1440}-{light,dark}, after-privacy-{390,1440}-{light,dark}, after-legal-security-{390,1440}-{light,dark} (its markdown headings changed with it),
// after-footer-privacy-{390,1440}-{light,dark}.

const FRAMES = process.env['L13_FRAMES'];
const HINT = 'Please do not include health or other sensitive information, or personal details of your own customers.';
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

      // L17 D4 (founder 22.10): the card of FL-62 became the strip of typelessform.com; it has no badge and its button says «Apply for a free AI-visibility pilot». The word
      // «pilot» now stands beside the tariff «Free pilot» again (brief D4.6, the founder decides); what stays held: the button leads to the application page of Webappski.
      test(`[after-home-pilot-${width}-${scheme}] the strip's button says «Apply for a free AI-visibility pilot», there is no badge, and the address is the application page of Webappski`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        const offer = page.getByTestId('free-pilot-offer');
        await expect(offer.locator('.pilot-offer__badge')).toHaveCount(0);
        const button = offer.getByTestId('pilot-hook-button');
        await expect(button).toHaveText(BUTTON);
        expect(await button.getAttribute('href'), 'the address of the button is the application page of Webappski').toMatch(/^https:\/\/webappski\.com\/en\/free-aeo-pilot\?utm_source=typelessity\.com/);
        await expectSurface(page, scheme);
        await shot(page, `after-home-pilot-${width}-${scheme}`);
      });

      for (const [path, name, h1, sections] of [['/privacy', 'after-privacy', 'Privacy on typelessity.com', 6], ['/legal/security', 'after-legal-security', 'Security', 6]] as const) {
        test(`[${name}-${width}-${scheme}] ${path}: one h1, the headings of the markdown body have their spacing (they stood against the paragraph above before L13), no horizontal scroll${path === '/privacy' ? ', the controller and the host named, canonical to itself, the date printed' : ''}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await page.goto(path);
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
          await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://typelessity.com${path}`);
          const body = page.locator('.legal__body');
          if (path === '/privacy') {
            await expect(body).toContainText('typelessity.com is run by Lizaveta Isayeuskaya');
            await expect(body).toContainText('Vercel Inc. (United States)');
            await expect(page.locator('.legal__updated')).toHaveText(`Page last updated ${PRIVACY_LAST_UPDATED}`);
          }
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, 'no horizontal scroll').toBeLessThanOrEqual(0);
          // the body is drawn by <markdown>: its headings carry the spacing of the page's styles
          const gaps = await body.locator('h2').evaluateAll((hs) => hs.map((h) => ({ above: parseFloat(getComputedStyle(h).marginTop), below: parseFloat(getComputedStyle(h).marginBottom), size: parseFloat(getComputedStyle(h).fontSize) })));
          expect(gaps.length, `the sections of ${path}: exactly ${sections} ("Your right to object." on /privacy is a bold paragraph, not a section; /legal/security counted in dist on 21.10)`).toBe(sections);
          for (const g of gaps) { expect(g.above).toBeGreaterThanOrEqual(24); expect(g.below).toBeGreaterThanOrEqual(8); expect(g.size).toBeGreaterThanOrEqual(20); }
          await expectSurface(page, scheme);
          await shot(page, `${name}-${width}-${scheme}`);
          if (path === '/privacy') {
            // legal F-3 (round of judges): the right to object stands in its own bold paragraph after the paragraph of the other rights — not a seventh section (the count above is exact)
            const rights = body.locator('p', { hasText: 'You can ask us for access, correction' });
            const object = body.locator('p', { hasText: 'Your right to object.' });
            await expect(object.locator('strong')).toHaveText('Your right to object.');
            await expect(body.locator('p', { hasText: 'Our host processes your request data on the basis of our legitimate interests' })).toHaveCount(1);
            const geometry = await page.evaluate(() => {
              const ps = Array.from(document.querySelectorAll('.legal__body p'));
              const a = ps.find((p) => (p.textContent ?? '').startsWith('You can ask us for access'))!.getBoundingClientRect();
              const b = ps.find((p) => (p.textContent ?? '').startsWith('Your right to object.'))!;
              const r = b.getBoundingClientRect();
              return { gap: r.top - a.bottom, weight: parseInt(getComputedStyle(b.querySelector('strong')!).fontWeight, 10) };
            });
            expect(geometry.gap, 'the paragraph of the right to object is a paragraph of its own under the one of the other rights').toBeGreaterThanOrEqual(8);
            expect(geometry.weight, 'its lead-in is bold').toBeGreaterThanOrEqual(600);
            await expect(rights).toHaveCount(1);
            await object.scrollIntoViewIfNeeded();
            await shot(page, `after-privacy-rights-${width}-${scheme}`);
          }
        });
      }

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
        await expect(hint).toHaveText(HINT);
        await expect(message).toHaveAttribute('aria-describedby', 'cf-message-hint');
        const box = await page.evaluate(() => {
          const m = document.querySelector('#cf-message')!.getBoundingClientRect();
          const h = document.querySelector('#cf-message-hint')!.getBoundingClientRect();
          return { gap: h.top - m.bottom, hintInsideForm: h.left >= m.left - 1 && h.right <= m.right + 1 };
        });
        expect(box.gap, 'the hint stands right under the field').toBeGreaterThanOrEqual(0);
        expect(box.gap).toBeLessThan(16);
        expect(box.hintInsideForm, 'the hint does not run past the field').toBe(true);
        // CRO 5 (L13): the line is 12.5 px in `--text-secondary` on the surface of the form — measured by the contrast engine of the site against that surface (4.5:1, WCAG 1.4.3)
        const contrast = await page.evaluate(`(${CONTRAST_ENGINE})(${JSON.stringify({ scope: '#cf-message-hint' })})`) as { seen: number; bad: string[]; min: number | null };
        expect(contrast.seen, 'the contrast engine saw the line').toBeGreaterThan(0);
        expect(contrast.bad, `the hint is 4.5:1 or better on the form (min ${contrast.min})`).toEqual([]);
        expect(contrast.min, 'the engine reports the ratio').not.toBeNull();
        expect(contrast.min!).toBeGreaterThanOrEqual(4.5);
        test.info().annotations.push({ type: 'hint contrast', description: `${scheme} ${width}px: ${contrast.min!.toFixed(2)}:1` });
        console.log(`CRO 5: hint contrast ${scheme} ${width}px = ${contrast.min!.toFixed(2)}:1`);
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
