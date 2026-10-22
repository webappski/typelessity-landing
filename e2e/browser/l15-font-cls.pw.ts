import { test, expect, underPolicy } from './fixtures';

// The layout shift of the font swap (FL-107, FL-114) — held with a ceiling so that the cure cannot quietly leave.
//
// With `font-display: swap` the first paint draws the text in the fallback font, and when the Montserrat file arrives later the text is drawn again in
// Montserrat. Before L17 the fallback was the system font at its own width and line box (`system-ui`), and lines of a different width moved what stood next
// to them: on `/` 0.0020 (390 × 844) and 0.0070 (1440 × 844), on `/pricing` at 1440 0.0481 (the tiers, the sub-heading and the buttons), measured by the judges of
// L15 (test-design L15-perf, 2026-10-21) the same before L15 (production e4bdf7a) and after it.
// L17 D2 (2026-10-22): `Montserrat Fallback` (public/fonts/fonts.css) is the system Arial scaled to Montserrat's width and line box (size-adjust, ascent-,
// descent-, line-gap-override) and stands right after Montserrat in `--font-display` and `--font-body`. The shift is not 0 — the sizes are an average over the
// letters of two pages, so a line of other letters is a few pixels off — but it is small; the ceilings below are the values measured on the build plus the same margin
// as before. The KNOWN word and the «designer» note are gone: the token exists.
// Conditions: Chromium, every .woff2 answered 1 500 ms late (the page's own fonts; the widget's DM Sans is refused by the CSP of vercel.json, as in production),
// everything else untimed, the headers of vercel.json on the document (underPolicy). Both widths are 844 high: the judge's probe (cls.mjs) ran 1440 at × 844, not × 900.
// Not covered: a machine without Arial (Android, some Linux): `local('Arial')` finds nothing there, and the swap is what it was before L17 (no harm, no gain);
// Safari does not apply `ascent-override` (caniuse, 22.10), so the position inside a line may differ by a fraction of a pixel there; Windows and Firefox were not measured.
const FONT_DELAY_MS = 1500;
const CASES = [
  { path: '/', width: 390, height: 844, ceiling: 0.0010, id: 'FL-107' },
  { path: '/', width: 1440, height: 844, ceiling: 0.0010, id: 'FL-107' },
  { path: '/pricing', width: 390, height: 844, ceiling: 0, id: 'FL-107' },
  { path: '/pricing', width: 1440, height: 844, ceiling: 0.0090, id: 'FL-114' },
];

for (const c of CASES) {
  test.describe(`L15-C1 ${c.width}`, () => {
    test.use({ viewport: { width: c.width, height: c.height }, isMobile: c.width < 500, hasTouch: c.width < 500, deviceScaleFactor: 2 });
    test(`L15-C1 ${c.path} at ${c.width}×${c.height}, fonts ${FONT_DELAY_MS} ms late: the layout shift of the font swap stays ≤ ${c.ceiling} (${c.id}; the fallback font has Montserrat's metrics)`, async ({ page }) => {
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
      expect(state.cls, `CLS of ${c.path} at ${c.width}: more than ${c.ceiling} — the font swap moves more than it did on 2026-10-22 with Montserrat Fallback (${c.id})`).toBeLessThanOrEqual(c.ceiling);
    });
  });
}
