import { test, expect, underPolicy } from './fixtures';

// KNOWN SHIFT, FL-107; the cure is a fallback font with Montserrat's metrics (size-adjust), a token → designer.
//
// With `font-display: swap` the first paint draws the text in the fallback font, and when the Montserrat file arrives later the
// text is drawn again in Montserrat: lines of a different width move what stands next to them (on `/`: the h1 line with `.gtext`,
// the icons of the buttons, the line under the pilot). Measured by the judges of L15 (test-design L15-perf, 2026-10-21) the same
// before L15 (production e4bdf7a) and after it, so it is not a regression of L15; it is held here so that it cannot grow unseen.
// Conditions: Chromium, every .woff2 answered 1 500 ms late (the page's own fonts; the widget's DM Sans is refused by the CSP of
// vercel.json, as in production), everything else untimed, the headers of vercel.json on the document (underPolicy).
// The ceilings are the measured value with a margin: `/` ≤ 0.0025 at 390 × 844 (measured 0.0020) and ≤ 0.0075 at 1440 × 844
// (measured 0.0070), `/pricing` 0 at 390. Both widths are 844 high: the judge's probe (cls.mjs) ran 1440 at × 844, not × 900; at
// × 900 the same swap measures 0.0076 on `/`, HEAD and production alike (L15/cls-perf2-probes.log).
// FL-114, found by this test (2026-10-21): `/pricing` at 1440 shifts too, 0.0481 (× 844) — the tiers, the sub-heading and the
// buttons, the same swap, the same on production e4bdf7a; the judges measured `/pricing` at 390 only. Held at ≤ 0.053.
// When the fallback font gets Montserrat's metrics, both pages measure 0: lower the ceilings to 0 and drop the word KNOWN.
const FONT_DELAY_MS = 1500;
const CASES = [
  { path: '/', width: 390, height: 844, ceiling: 0.0025, id: 'FL-107' },
  { path: '/', width: 1440, height: 844, ceiling: 0.0075, id: 'FL-107' },
  { path: '/pricing', width: 390, height: 844, ceiling: 0, id: 'FL-107' },
  { path: '/pricing', width: 1440, height: 844, ceiling: 0.053, id: 'FL-114' },
];

for (const c of CASES) {
  test.describe(`L15-C1 ${c.width}`, () => {
    test.use({ viewport: { width: c.width, height: c.height }, isMobile: c.width < 500, hasTouch: c.width < 500, deviceScaleFactor: 2 });
    test(`L15-C1 ${c.path} at ${c.width}×${c.height}, fonts ${FONT_DELAY_MS} ms late: the layout shift of the font swap stays ≤ ${c.ceiling} (known shift, ${c.id}; the cure is a fallback font with Montserrat's metrics (size-adjust), a token → designer)`, async ({ page }) => {
      await underPolicy(page);
      const delayed: string[] = [];
      const finished: string[] = [];
      // registered after underPolicy, so it runs first; fallback() hands the request on to underPolicy and the fixture
      await page.route('**/*.woff2', async (route) => {
        delayed.push(new URL(route.request().url()).pathname);
        await new Promise((r) => setTimeout(r, FONT_DELAY_MS));
        await route.fallback();
      });
      page.on('requestfinished', (r) => { if (r.resourceType() === 'font') finished.push(new URL(r.url()).pathname); });
      await page.goto(c.path, { waitUntil: 'load' });
      expect(await page.evaluate(() => PerformanceObserver.supportedEntryTypes.includes('layout-shift')), 'the engine reports layout shifts').toBe(true);
      // every font the page asked for has arrived and is applied, then two frames for the swap to be laid out and reported
      await expect.poll(() => delayed.length > 0 && finished.length >= delayed.length, { message: 'the delayed fonts arrive', timeout: 15_000 }).toBe(true);
      await page.evaluate(() => document.fonts.ready.then(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))));
      const state = await page.evaluate(() => ({
        cls: window.__cls,
        montserrat: [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'Montserrat' && f.status === 'loaded').length,
      }));
      expect(delayed.some((p) => p.startsWith('/fonts/')), `the page's own fonts went through the delay: ${delayed.join(', ')}`).toBe(true);
      expect(state.montserrat, 'a Montserrat face is loaded: the swap really happened').toBeGreaterThan(0);
      test.info().annotations.push({ type: 'cls', description: `${c.path} ${c.width}×${c.height}: ${state.cls.toFixed(4)}` });
      console.log(`L15-C1 ${c.path} ${c.width}x${c.height} CLS ${state.cls.toFixed(4)}`);
      expect(state.cls, `CLS of ${c.path} at ${c.width}: more than ${c.ceiling} — the font swap moves more than it did on 2026-10-21 (${c.id})`).toBeLessThanOrEqual(c.ceiling);
    });
  });
}
