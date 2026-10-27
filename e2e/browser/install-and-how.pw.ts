import { test, expect, type Page } from './fixtures';
import { EN } from '../../src/app/i18n/translations.en';
import { INSTALL } from '../../src/app/pages/install/install.content';

// L5: /install (new) and /how-it-works. Frames: every test whose title starts with [after-…] holds the one statement of
// that frame of L5/frames/ (R64, R69 rev. 3): after-install-{390,1440}-{light,dark} and after-how-{390,1440}-{light,dark}.
// The other tests hold the words a visitor and a crawler read: the exact <title>, the one H2 the page is built around,
// no way out to /industries, a way in to /install.
// Chromium only; the words the site must not print are held by e2e/claims-class-guard.spec.ts over the built HTML.

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

const INSTALL_H1 = 'Add Typelessity to your website';
const HOW_H1 = 'How Typelessity works';
const HOW_H2 = 'How to let customers book by chat instead of a form';

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1440]) {
      test(`[after-install-${width}-${scheme}] /install at ${width}px: «${INSTALL_H1}», three numbered steps, the code block, the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/install');
        await expect(page.locator('h1')).toHaveText(INSTALL_H1);
        await expect(page.locator('main ol.install-steps > li')).toHaveCount(3);
        await expect(page.locator('main pre.install-code').first()).toContainText('<typelessity-widget');
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });

      // TY-INSTALL (founder 26.10): /install starts with the config of the site. One statement per frame (R69 rev. 3): the block #config-first
      // stands under the H1 and above the three steps, its two ways are cards of the colour of the theme, side by side on a desktop and one under
      // the other on a phone, the way in is a button, and the page does not scroll sideways.
      test(`[after-install-config-${width}-${scheme}] /install at ${width}px: the block «${INSTALL.configFirst.h2}» is under the H1 and above the steps, two cards, ${width >= 861 ? 'side by side' : 'one under the other'}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/install');
        const block = page.locator('#config-first');
        await expect(block.getByRole('heading', { level: 2 })).toHaveText(INSTALL.configFirst.h2);
        const [h1, blockBox, steps] = await Promise.all([page.locator('h1').boundingBox(), block.boundingBox(), page.locator('main ol.install-steps').boundingBox()]);
        expect(blockBox!.y, 'the block is under the H1').toBeGreaterThan(h1!.y + h1!.height);
        expect(blockBox!.y + blockBox!.height, 'the block is above the three steps').toBeLessThanOrEqual(steps!.y);
        const ways = page.locator('#config-first .install-config__way');
        await expect(ways).toHaveCount(2);
        const [a, b] = await Promise.all([ways.nth(0).boundingBox(), ways.nth(1).boundingBox()]);
        if (width >= 861) {
          expect(Math.abs(a!.y - b!.y), 'the two ways stand on one line').toBeLessThanOrEqual(1);
          expect(b!.x, 'the second way is to the right of the first').toBeGreaterThan(a!.x + a!.width - 1);
        } else {
          expect(b!.y, 'the second way is under the first').toBeGreaterThanOrEqual(a!.y + a!.height);
        }
        await expect(ways.first()).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(block.locator('a.vc-btn-primary')).toHaveText(INSTALL.configFirst.self.cta);
        await noSideScroll(page);
      });

      test(`[after-install-form-${width}-${scheme}] /install at ${width}px: «${INSTALL.form.h2}» holds the one form, above the closing «Get it free» strip`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/install');
        const section = page.locator('#setup-with-us');
        await expect(section.getByRole('heading', { level: 2 })).toHaveText(INSTALL.form.h2);
        await expect(section.locator('form.cf')).toHaveCount(1);
        await expect(page.locator('form.cf')).toHaveCount(1);
        const [formBox, cta] = await Promise.all([section.boundingBox(), page.locator('main .how-cta').boundingBox()]);
        expect(formBox!.y + formBox!.height, 'the form section is above the closing strip').toBeLessThanOrEqual(cta!.y);
        await noSideScroll(page);
      });

      test(`[after-how-${width}-${scheme}] /how-it-works at ${width}px: «${HOW_H1}», four phases ending in Send, the section «${HOW_H2}», the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/how-it-works');
        await expect(page.locator('h1')).toHaveText(HOW_H1);
        await expect(page.locator('.how-phase h2')).toHaveText(['Chat', 'Select', 'Review', 'Send']);
        await expect(page.getByRole('heading', { level: 2, name: HOW_H2 })).toBeVisible();
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });
    }
  });
}

test('the titles are exact: /install keeps the brand suffix, /how-it-works carries the brand in its own words and gets no second one', async ({ page }) => {
  await page.goto('/install');
  await expect(page).toHaveTitle('Add an AI booking widget to your website — Typelessity');
  await page.goto('/how-it-works');
  await expect(page).toHaveTitle('How Typelessity works: from chat to booking request');
});

test('the descriptions are the written ones, and neither page carries structured data', async ({ page }) => {
  await page.goto('/install');
  // TY-INSTALL: the description starts with the config; the words are the key's (EN), and the length stays inside what a search result shows.
  const description = EN['seo.install.description'];
  expect(description.length, 'the description of /install fits 155 characters').toBeLessThanOrEqual(155);
  expect(description, 'the description starts with the config').toMatch(/^First your site’s config/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
  expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
  await page.goto('/how-it-works');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Chat, select, review, send: the AI booking assistant turns one sentence into a booking request; if your booking system has an API, it asks it what is free.');
  expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
});

test('/how-it-works: the example is the fixed sentence and its JSON, the section links to /install, nothing leads to /industries', async ({ page }) => {
  await page.goto('/how-it-works');
  const body = await page.locator('main').innerText();
  expect(body).toContain('Brake pads for my RAV4 on Tuesday 20 October at 2pm, name Robert Smith');
  expect(body).toContain('"date": "2026-10-20"');
  expect(body).toContain('"time": "14:00"');
  expect(await page.locator('main a[href^="/industries"]').count(), 'no way out to /industries').toBe(0);
  expect(await page.locator('main a[href="/install"]').count(), 'a way in to /install').toBeGreaterThanOrEqual(1);
});

test('/install: the requirements, where the requests go, what the customer sees, the policy lines', async ({ page }) => {
  await page.goto('/install');
  const body = await page.locator('main').innerText();
  expect(body).toContain('HTTPS');
  expect(body).toContain('X-Idempotency-Key');
  expect(body).toContain('X-Request-ID');
  expect(body).toContain('Request Received');
  expect(body).toContain('Permissions-Policy: microphone=(self)');
  for (const line of ['script-src', 'connect-src', 'font-src', 'img-src data:', "style-src-attr 'unsafe-inline'"]) expect(body, `the policy line ${line}`).toContain(line);
  expect(await page.locator('main a[href^="/industries"]').count(), 'no way out to /industries').toBe(0);
});

test('/install: the first sentence is the config, the two ways lead to the portal and to the form, the code has its note, nothing says «two lines»', async ({ page }) => {
  await page.goto('/install');
  const first = page.locator('h1 + p');
  await expect(first).toContainText('Start with your site’s config');
  const portal = (href: string | null) => { const u = new URL(href!); return { host: u.host, path: u.pathname, ...Object.fromEntries(u.searchParams) }; };
  const self = await page.locator('#config-first a.vc-btn-primary').getAttribute('href');
  expect(portal(self)).toMatchObject({ host: 'webappski.com', path: '/en/portal/login', start: 'typelessity', utm_medium: 'install', utm_content: 'config-first' });
  const step = await page.locator('main ol.install-steps a').first().getAttribute('href');
  expect(portal(step), 'the link in step 1').toMatchObject({ start: 'typelessity', utm_medium: 'install', utm_content: 'step-1' });
  await expect(page.locator('main ol.install-steps > li').first()).toContainText(INSTALL.steps[0]!.h);
  await page.locator('#config-first').getByRole('link', { name: INSTALL.configFirst.withUs.cta }).click();
  await expect(page).toHaveURL(/#setup-with-us$/);
  await expect(page.locator('#setup-with-us')).toBeInViewport();
  const body = await page.locator('main').innerText();
  expect(body).toContain(INSTALL.code.note);
  expect(body.toLowerCase(), 'no «two lines» on /install').not.toMatch(/\b(two|2)[ -]lines?\b/);
});

test('the header stays on one line at 1021px with Install in it', async ({ page }) => {
  await page.setViewportSize({ width: 1021, height: 800 });
  await page.goto('/install');
  await expect(page.locator('header.vc-nav nav a[href="/install"]'), 'Install is in the nav').toHaveCount(1);
  const geometry = await page.evaluate(() => {
    const header = document.querySelector('header.vc-nav') as HTMLElement;
    const tops = new Set([...header.querySelectorAll('nav a')].map((a) => Math.round(a.getBoundingClientRect().top)));
    return { scroll: header.scrollWidth, client: header.clientWidth, lines: tops.size };
  });
  expect(geometry.scroll, 'the header does not overflow').toBeLessThanOrEqual(geometry.client);
  expect(geometry.lines, 'the nav links are on one line').toBe(1);
});
