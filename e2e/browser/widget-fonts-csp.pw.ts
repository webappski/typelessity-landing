import { test, expect, API_ORIGIN, WIDGET_ORIGIN, type Page, REDUCED_MOTION, underPolicy } from './fixtures';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WIDGET_SCRIPT_URL } from '../../src/app/core/integrations/embed-snippet';
import { SITEMAP_PATHS } from './sitemap-paths';

// L3 D6, D7, D5, F5, F8, F12–F16: the widget in the hero slot works UNDER THE CSP THE SITE SHIPS, loads after the first
// paint and moves nothing. The real SSR build in Chromium; the real policy of vercel.json put on the document by a route
// (the local server sets no header, so without this CSP would be proven nowhere — vercel.json is not applied locally).
// What is replaced is only the OUTSIDE (e2e/browser/fixtures.ts): the widget origin serves the files of the product's
// published widget build with the CORS headers of its own vercel.json, and the API origin answers 404 for a domain it does not
// know, in the product API's own shape. There is no config for localhost, so the widget draws its «could not load» state: no
// paid call, no network out. A request that reaches the API route proves connect-src let it through (Chromium applies CSP
// before routing). The widget build comes from TY_WIDGET_DIST (default ~/Projects/typelessity/packages/widget/dist); without
// it the whole run fails with a text (global-setup.ts), it is never skipped. Chromium only (CDP).
//
// L4 (D2, D3): the widget on `/` is the DEMO's. The hero holds a slot, the demo chunk is fetched after load and idle, it puts a mock
// on `fetch` for the origin https://demo.invalid and only then loads widget.js; the widget draws the greeting of the first scenario
// and the page asks the live API for nothing. These statements run with reduced motion (F7): the widget stands at its greeting and
// the measure does not land in the middle of the show. The show itself is home-demo.pw.ts.
//
// Every test starts with (pre): the widget is defined and its script was served exactly once. Until the site loads the
// widget, that is the ONE reason this file is red; the other statements are about what the widget does once it is there.
//   (a) no securitypolicyviolation, with a positive control   (b) the page reaches the API origin when it asks; the demo never does
//   (c) a widget-origin woff2 was served                        (d) DM Sans is loaded and is what the text is drawn in
//   (e) not in the HTML, and inserted after load (chunk first)  (f) the greeting of the first scenario stands in the widget
//   (g) CLS < 0.1 and the slot keeps its height                 (h) once per visit, never on other pages
//   (i) every address of the sitemap runs under the CSP without a violation

const DIST = join(process.cwd(), 'dist/typelessity-landing/browser');
/** The one file of the build that holds the scripted scenarios: the lazy chunk of the demo (D3). */
const DEMO_CHUNK = readdirSync(DIST).filter((f) => f.endsWith('.js')).find((f) => readFileSync(join(DIST, f), 'utf8').includes('Balayage und Spitzen'));

async function openHome(page: Page, width = 1440): Promise<void> {
  await underPolicy(page);
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
}

/** (pre) — the one cause of red for the whole file until the site loads its widget. */
async function expectWidgetLoaded(page: Page, scriptRequests: () => number): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => !!customElements.get('typelessity-widget')), { message: '(pre) <typelessity-widget> is not defined: widget.js was never loaded and run on /', timeout: 8000 })
    .toBe(true);
  expect(scriptRequests(), '(pre) widget.js is served exactly once').toBe(1);
}

const idle = (page: Page) => page.evaluate(() => new Promise<void>((resolve) => requestIdleCallback(() => setTimeout(resolve, 800))));
/** The greeting of the first scenario, drawn by the real widget in its shadow root (L4: replaces the «config could not load» title). */
const greeting = (page: Page) => page.locator('typelessity-widget .welcome-greeting');

test.describe('hero, demo still', () => {
  test.use(REDUCED_MOTION);

  test('(pre)+(a) no securitypolicyviolation of any directive, and the control proves the policy is on', async ({ page, stubs }) => {
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    await expect(greeting(page)).toBeVisible();
    expect(await page.evaluate(() => window.__csp), 'violations while the widget loaded and drew').toEqual([]);
    // Positive control: a font from a host the policy does not name is blocked, and the page hears exactly one font-src violation.
    await page.evaluate(async () => { try { await new FontFace('Sentinel', 'url(https://csp-sentinel.invalid/x.woff2)').load(); } catch { /* blocked, as it must be */ } });
    await expect.poll(() => page.evaluate(() => window.__csp.length), { message: 'the control font-src violation' }).toBe(1);
    expect((await page.evaluate(() => window.__csp))[0]).toMatch(/^font-src /);
  });

  test('(pre)+(b) the demo asks the API origin for nothing; a request the page makes itself reaches it from the page origin', async ({ page, stubs }) => {
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    await expect(greeting(page)).toBeVisible();
    // D2: the widget talks to https://demo.invalid and the mock answers before the network is asked. The counter is the route of the API origin.
    expect(stubs.apiRequests, 'requests that reached the live API origin from the demo').toEqual([]);
    // The control: a fetch the page makes to the API origin passes connect-src and reaches the route — so the zero above is not a blocked route.
    const status = await page.evaluate((origin) => fetch(`${origin}/api/config/by-domain`).then((r) => r.status), API_ORIGIN);
    expect(status, 'the product API answers 404 on a domain it does not know').toBe(404);
    const get = stubs.apiRequests.find((r) => r.method === 'GET' && r.path === '/api/config/by-domain');
    expect(get, `GET /api/config/by-domain at ${API_ORIGIN}`).toBeTruthy();
    expect(get!.origin, 'the request carries the Origin of the page').toBe('http://localhost:4000');
    stubs.apiRequests.length = 0;
  });

  test('(pre)+(c) a woff2 of the widget origin was served, counted where it is served', async ({ page, stubs }) => {
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    await expect.poll(() => stubs.widgetFonts.filter((f) => f.family === 'DM Sans' && f.status === 200).length, { message: `a DM Sans file from ${WIDGET_ORIGIN}/fonts/` }).toBeGreaterThan(0);
    // F17: the widget registers 'Space Mono' on the host document as well. Counted, not asserted: the bytes are the same, only the requests are extra.
    const spaceMono = stubs.widgetFonts.filter((f) => f.family === 'Space Mono').length;
    test.info().annotations.push({ type: 'space-mono-requests-to-widget-origin (F17)', description: String(spaceMono) });
    console.log(`space-mono requests to the widget origin: ${spaceMono}`);
  });

  test('(pre)+(d) DM Sans is loaded in the document and the widget text is drawn in it', async ({ page, stubs }) => {
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    await expect(greeting(page)).toBeVisible();
    await page.waitForFunction(() => [...document.fonts].some((f) => f.family.replace(/["']/g, '') === 'DM Sans' && f.status === 'loaded'), null, { timeout: 8000 });
    // The computed font-family names a font; it does not prove one was drawn. The browser is asked which platform font drew the node.
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      type CdpNode = { nodeId: number; attributes?: string[]; children?: CdpNode[]; shadowRoots?: CdpNode[]; contentDocument?: CdpNode };
      const { root } = (await cdp.send('DOM.getDocument', { depth: -1, pierce: true })) as unknown as { root: CdpNode };
      const find = (n: CdpNode): CdpNode | null => {
        const at = (n.attributes ?? []).indexOf('class');
        if (at >= 0 && /\bwelcome-greeting\b/.test(n.attributes![at + 1]!)) return n;
        for (const c of [...(n.children ?? []), ...(n.shadowRoots ?? []), ...(n.contentDocument ? [n.contentDocument] : [])]) { const f = find(c); if (f) return f; }
        return null;
      };
      const node = find(root);
      expect(node, 'the greeting inside the widget shadow root').not.toBeNull();
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: node!.nodeId });
      const top = [...fonts].sort((a, b) => b.glyphCount - a.glyphCount)[0];
      // A variable font's family name may carry its default instance («DM Sans 9pt»): a prefix, not the whole name.
      expect(top?.familyName, 'the font that drew the widget text').toMatch(/^DM Sans\b/);
    } finally {
      await cdp.detach();
    }
  });

  test('(pre)+(e) widget.js and the demo chunk are not in the HTML; the chunk comes after FCP and the load event, widget.js after the chunk', async ({ page, request, stubs }) => {
    expect(DEMO_CHUNK, 'the build has one file that holds the scripted scenarios').toBeTruthy();
    const html = await (await request.get('/')).text();
    expect(html.match(/<script[^>]*widget\.js/g) ?? [], 'a <script> for widget.js in the prerendered HTML').toEqual([]);
    expect(html.includes(DEMO_CHUNK!), 'the demo chunk is named in the prerendered HTML (script or modulepreload)').toBe(false);
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    const timing = await page.evaluate(({ url, chunk }) => {
      const resource = performance.getEntriesByType('resource').find((r) => r.name === url);
      const demo = performance.getEntriesByType('resource').find((r) => r.name.endsWith(`/${chunk}`));
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      return { start: resource?.startTime ?? null, chunk: demo?.startTime ?? null, loadEventEnd: nav.loadEventEnd, fcp: fcp?.startTime ?? null };
    }, { url: WIDGET_SCRIPT_URL, chunk: DEMO_CHUNK! });
    expect(timing.start, 'a resource entry for widget.js').not.toBeNull();
    expect(timing.chunk, 'a resource entry for the demo chunk').not.toBeNull();
    expect(timing.fcp, 'first-contentful-paint was reported').not.toBeNull();
    expect(timing.chunk!, 'the demo chunk starts after the first contentful paint').toBeGreaterThan(timing.fcp!);
    expect(timing.loadEventEnd, 'the load event has ended').toBeGreaterThan(0);
    expect(timing.chunk!, 'the demo chunk starts after the load event, not in the first tick after hydration').toBeGreaterThanOrEqual(timing.loadEventEnd);
    expect(timing.start!, 'widget.js is asked for after the demo chunk (D3: chunk, interceptor, then the script)').toBeGreaterThanOrEqual(timing.chunk!);
  });

  // Found in the mutation run (M8b): on localhost the load event ends BEFORE Angular has hydrated, so «inserted after load» held even for a
  // loader that inserts the script at once. A late load event is made here: the preloaded font is answered after 1.5 s, and the page's
  // load event waits for it. The loader that waits for `load` inserts the script after the event; the one that does not, long before.
  test('(pre)+(e2) the loader waits for the load event even when it comes late', async ({ page, stubs }) => {
    await underPolicy(page);
    await page.route('**/fonts/*.woff2', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fallback();
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    const timing = await page.evaluate((url) => {
      const resource = performance.getEntriesByType('resource').find((r) => r.name === url);
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { start: resource?.startTime ?? null, loadEventEnd: nav.loadEventEnd };
    }, WIDGET_SCRIPT_URL);
    expect(timing.loadEventEnd, 'the load event was held back by the slow font (about 1.5 s)').toBeGreaterThan(1000);
    expect(timing.start, 'a resource entry for widget.js').not.toBeNull();
    expect(timing.start!, 'widget.js starts only after the late load event').toBeGreaterThanOrEqual(timing.loadEventEnd);
    const chunk = await page.evaluate((c) => performance.getEntriesByType('resource').find((r) => r.name.endsWith(`/${c}`))?.startTime ?? null, DEMO_CHUNK!);
    expect(chunk, 'the demo chunk starts only after the late load event').toBeGreaterThanOrEqual(timing.loadEventEnd);
  });

  test('(pre)+(f) the greeting of the first scenario stands in the widget, with its input row', async ({ page, stubs }) => {
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    // loaded here, not at the top: a build without the demo has no such module, and then the failure is the one named in (pre), not a load error of the file
    const { scenario } = require('../../src/app/pages/home/demo/demo-script') as typeof import('../../src/app/pages/home/demo/demo-script');
    await expect(greeting(page), 'the welcome of the first scenario (demo-script.ts), in English').toHaveText(scenario('salon', 'en').welcome);
    await expect(page.locator('typelessity-widget .pill-input'), 'the demo business has a config, so the widget offers its input row').toHaveCount(1);
    await expect(page.locator('typelessity-widget'), 'the widget is given the mock origin, not the live API').toHaveAttribute('api-url', 'https://demo.invalid');
  });

  for (const width of [390, 1440]) {
    test(`(pre)+(g) at ${width}px: CLS under 0.1, and the slot has the height it ends with from the first byte`, async ({ page, stubs }) => {
      await openHome(page, width);
      await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
      await expect(greeting(page)).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const m = await page.evaluate(() => {
        const slot = document.querySelector('[data-widget-host]')!;
        return { cls: window.__cls, before: window.__slotAtDcl, after: slot.getBoundingClientRect().height, minHeight: parseFloat(getComputedStyle(slot).minHeight) };
      });
      expect(m.cls, 'cumulative layout shift').toBeLessThan(0.1);
      expect(m.before, 'the slot is in the HTML at DOMContentLoaded').not.toBeNull();
      expect(m.before!, 'the slot has its height at DOMContentLoaded').toBeGreaterThan(300);
      expect(Math.abs(m.after - m.before!), `the slot was ${m.before}px tall before the widget and ${m.after}px after it`).toBeLessThan(0.5);
      expect(m.minHeight, 'the slot carries a min-height of its own').toBeGreaterThan(0);
    });
  }

  test('(pre)+(h) a visit that comes back to / loads the widget once; a page that is not / never asks for it', async ({ page, stubs }) => {
    await openHome(page);
    await expectWidgetLoaded(page, () => stubs.widgetScriptRequests);
    await page.locator('header nav[aria-label="Primary"]').getByRole('link', { name: /pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await page.locator('header a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
    await idle(page);
    await expect(page.locator('typelessity-widget'), 'one widget stands in the slot on the way back').toHaveCount(1);
    expect(await page.evaluate(() => document.querySelectorAll('script[src*="widget.js"]').length), '<script> tags for widget.js').toBe(1);
    expect(stubs.widgetScriptRequests, 'requests for widget.js').toBe(1);
  });

  test('(h) a direct visit to /pricing never asks for the widget', async ({ page, stubs }) => {
    await underPolicy(page);
    await page.goto('/pricing', { waitUntil: 'networkidle' });
    await idle(page);
    expect(stubs.widgetScriptRequests, 'requests for widget.js').toBe(0);
    expect(await page.evaluate(() => document.querySelectorAll('script[src*="widget.js"]').length), '<script> tags for widget.js').toBe(0);
  });
});

for (const path of SITEMAP_PATHS) {
  test(`(i) ${path} runs under the CSP of vercel.json without a violation`, async ({ page }) => {
    await underPolicy(page);
    await page.goto(path, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await idle(page);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
}

// M32: the fixture's own refusal. A page that reaches a host outside localhost, the widget origin and the API origin gets
// nothing, and the fixture writes the origin down; a test that leaves it there fails after it ends (fixtures.ts). This test
// provokes it once, checks both, and clears the list so that its own teardown passes.
test('isolation: a host that is not ours is refused and counted', async ({ page, stubs }) => {
  await page.goto('/pricing');
  const outcome = await page.evaluate(() => fetch('https://not-our-host.invalid/x').then(() => 'reached', () => 'refused'));
  expect(outcome, 'the request to a foreign host').toBe('refused');
  expect(stubs.external, 'the foreign origin is written down').toEqual(['https://not-our-host.invalid']);
  stubs.external.length = 0;
});
