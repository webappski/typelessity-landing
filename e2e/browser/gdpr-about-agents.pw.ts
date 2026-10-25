import { test, expect, type Page } from './fixtures';

// L7: /gdpr, /about and /for-ai-agents. Frames: every test whose title starts with [after-…] holds the one statement of that
// frame of L7/frames/ (R64, R69 rev. 3): after-{gdpr,about,agents}-{390,1440}-{light,dark}.
// The facts under the words (hours, years, region, processors, models, languages) are held by e2e/gdpr-facts.spec.ts over the
// built HTML and the code of the other side; the words nobody may print by e2e/claims-class-guard.spec.ts. Here: what is on the screen.
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

const DPA = 'https://webappski.com/en/legal/dpa-typelessity';
const NOTICE = 'https://webappski.com/en/legal/privacy-typelessity';
const TITLES = {
  gdpr: 'Typelessity and GDPR: consent, where data is processed',
  about: 'About Typelessity, the AI booking widget by Webappski',
  agents: 'Typelessity for developers and AI agents: JSON shapes',
} as const;

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1440]) {
      test(`[after-gdpr-${width}-${scheme}] /gdpr at ${width}px: the title, the four-row table with a label on every cell, the exact links to the DPA and the notice, not for health data, not legal advice, the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/gdpr');
        await expect(page).toHaveTitle(TITLES.gdpr);
        await expect(page.locator('h1')).toHaveText('Your customers’ data in Typelessity');
        await expect(page.locator('main table.gdpr-table tbody tr')).toHaveCount(4);
        await expect(page.locator('main table.gdpr-table td[data-label]')).toHaveCount(16);
        await expect(page.locator('main a[href="' + DPA + '"]').first(), 'the link to the DPA, by its exact address').toBeVisible();
        await expect(page.locator('main a[href="' + NOTICE + '"]').first(), 'the link to the notice for visitors, by its exact address').toBeVisible();
        await expect(page.locator('main')).toContainText('is not for health data');
        await expect(page.locator('main')).toContainText('Five checks for any AI booking widget');
        await expect(page.locator('main')).toContainText('It is not legal advice');
        // the table stays inside the screen: a wide table at 390 would push the page sideways or be cut
        const t = await page.locator('main table.gdpr-table').evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
        expect(t.scroll, 'the table is not wider than its box').toBeLessThanOrEqual(t.client + 1);
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });

      test(`[after-about-${width}-${scheme}] /about at ${width}px: the title, the capsule, a way to /how-it-works, the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/about');
        await expect(page).toHaveTitle(TITLES.about);
        await expect(page.locator('h1')).toHaveText('Forms are an artifact of constrained UI');
        await expect(page.locator('main')).toContainText('Typelessity is an AI booking widget built by Webappski.');
        await expect(page.locator('main a[href="/how-it-works"]').first()).toBeVisible();
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });

      test(`[after-agents-${width}-${scheme}] /for-ai-agents at ${width}px: the title, the JSON shapes, the two new ways in (/install, /gdpr), the endpoint stays «not built», the page is ${scheme} and does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/for-ai-agents');
        await expect(page).toHaveTitle(TITLES.agents);
        await expect(page.locator('h1')).toHaveText('Session and booking JSON shapes');
        await expect(page.locator('main pre.aiagents-code').first()).toBeVisible();
        await expect(page.locator('main .aiagents-links a[href="/install"]')).toHaveCount(1);
        await expect(page.locator('main .aiagents-links a[href="/gdpr"]')).toHaveCount(1);
        await expect(page.locator('main')).toContainText('not built');
        await expect(page.locator('main')).toContainText('no release date');
        await expectSurface(page, scheme);
        await noSideScroll(page);
      });
    }
  });
}

test.describe('the header with the new item', () => {
  // The burger takes over below 1020 px (header.component.scss). At 1021 px the seven links (Demo first since TY-DEMO, 25.10) and the button share the row with
  // the logo: the longest label that was added must not wrap or push anything out of the header.
  test('Data & privacy sits after Pricing, is the current page on /gdpr, and at 1021 px the links stay in one row inside the header', async ({ page }) => {
    await page.setViewportSize({ width: 1021, height: 800 });
    await page.goto('/gdpr');
    const links = page.locator('header nav[aria-label="Primary"] a');
    await expect(links).toHaveText(['Demo', 'How It Works', 'Install', 'Pricing', 'Data & privacy', 'Blog', 'FAQ']);
    await expect(page.locator('header nav[aria-label="Primary"] a[aria-current="page"]')).toHaveText('Data & privacy');
    const boxes = await links.evaluateAll((as) => as.map((a) => { const r = a.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: r.left, right: r.right }; }));
    expect(new Set(boxes.map((b) => b.top)).size, 'all seven links are in one row').toBe(1);
    const header = await page.locator('header.vc-nav').evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, right: el.getBoundingClientRect().right }));
    expect(header.scroll, 'the header is not wider than itself').toBeLessThanOrEqual(header.client);
    expect(Math.max(...boxes.map((b) => b.right)), 'the last link ends inside the header').toBeLessThanOrEqual(header.right);
    const cta = await page.locator('header a.vc-nav-cta').evaluate((el) => el.getBoundingClientRect());
    expect(Math.max(...boxes.map((b) => b.right)), 'the links do not run under the button').toBeLessThanOrEqual(cta.left);
  });
});
