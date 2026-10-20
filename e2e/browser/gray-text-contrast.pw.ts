import { test, expect, type Page, REDUCED_MOTION } from './fixtures';
import { CONTRAST_ENGINE } from './contrast-engine';
import { SITEMAP_PATHS_WITH_404 } from './sitemap-paths';

// A107 (c8 2026-10-03) started this spec on two grey text tokens; L3 (2026-10-19, B2, F1, F2) makes it the contrast gate of
// the whole site, because L3 adds a light theme and an orange-on-white text that no grey-token filter would ever see.
//   - EVERY visible text node of EVERY address of the sitemap (+ the 404 shell), at 390 and 1280, in BOTH themes, is measured
//     against the surface it sits on: 4.5:1, 3:1 for large text (WCAG 1.4.3). The address list is read from dist/…/sitemap.xml.
//   - the colour of the text keeps its alpha (F2): the dark --fg2/--fg3 tokens are rgba(…, .74/.60), and a formula that
//     takes the text as opaque is green exactly on the tokens that need the check;
//   - a gradient surface (buttons, the featured tier card) is read at the point under the letters;
//   - three states are measured besides the resting page: the question form with an error under the email (F11: the error
//     colour was 1.9:1 on white), the open mobile menu, and each phase card while hovered (the one place a surface changes).
// The measure itself — and the short list of what it leaves out and why — is in contrast-engine.ts. The old exception for
// role="img" (the animated demo) is gone: the demo is gone (F3).
// The site follows the system theme (colorScheme), so both schemes are set explicitly: Playwright's default is light (F7).

// A fade-in or a transition in progress is a half-transparent text: the measure waits until every finite animation has ended.
const MEASURE = async (page: Page, scope = 'body') => {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
  return page.evaluate(`(${CONTRAST_ENGINE})(${JSON.stringify({ scope })})`) as Promise<{ seen: number; bad: string[]; min: number | null }>;
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1280]) {
      for (const path of SITEMAP_PATHS_WITH_404) {
        // L4 (F7): `/` runs the scripted demo, which draws tips and a ring on a clock of its own; the contrast of the page is measured
        // with the demo still (reduced motion), the other addresses as they were.
        test.describe(path === '/' ? 'home, demo still' : 'page', () => {
          if (path === '/') test.use(REDUCED_MOTION);
          test(`${path} at ${width}px — all text is 4.5:1 or better on the surface it sits on`, async ({ page }) => {
            await page.setViewportSize({ width, height: 844 });
            await page.goto(path, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            const { seen, bad } = await MEASURE(page);
            expect(seen, 'the page carries text, so the probe measures something').toBeGreaterThan(5);
            expect(bad).toEqual([]);
          });
        });
      }
    }

    test('/pricing at 1280px — the question form in its error state is 4.5:1 or better', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/pricing', { waitUntil: 'networkidle' });
      await page.fill('#cf-email', 'abc');
      await page.press('#cf-email', 'Enter');
      await expect(page.locator('#cf-email-error')).toBeVisible();
      const { seen, bad } = await MEASURE(page, '.cf');
      expect(seen, 'the form carries text').toBeGreaterThan(5);
      expect(bad).toEqual([]);
    });

    test.describe('home, demo still', () => {
      test.use(REDUCED_MOTION);

      test('/ at 390px — the open mobile menu is 4.5:1 or better', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/', { waitUntil: 'networkidle' });
        const burger = page.getByRole('button', { name: /menu/i });
        await burger.click();
        await expect(burger).toHaveAttribute('aria-expanded', 'true');
        const { seen, bad } = await MEASURE(page);
        expect(seen).toBeGreaterThan(5);
        expect(bad).toEqual([]);
      });

      // L4: the four phase cards left `/` (they live on /how-it-works); the cards that stay under the pointer are the seven industries
      // and the three articles. Each is hovered in turn and the whole page is measured again.
      test('hovering an industry card or an article card on / keeps its text at 4.5:1', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });
        const cards = page.locator('main a.card--link');
        const count = await cards.count();
        expect(count, 'seven industries and three articles').toBe(10);
        for (let i = 0; i < count; i++) {
          await cards.nth(i).hover();
          await page.waitForTimeout(350);
          const { bad } = await MEASURE(page);
          expect(bad, `card ${i + 1} hovered`).toEqual([]);
        }
      });
    });
  });
}
