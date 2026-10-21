import { test as base, expect, API_ORIGIN, REDUCED_MOTION, SITE_HEADERS, underPolicy, WIDGET_ORIGIN, type Locator, type Page, type Response } from './fixtures';
import { CONTRAST_ENGINE } from './contrast-engine';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { WIDGET_SCRIPT_URL } from '../../src/app/core/integrations/embed-snippet';

// L4 B1–B8 — the hero demo of `/`, in a real Chromium, against the real SSR build and the REAL widget.js (the snapshot of the product's
// published build, e2e/browser/widget-snapshot.ts), under the CSP and the Permissions-Policy of vercel.json (fixtures.ts: underPolicy).
// Mocked is one thing — the product API — and by the same interceptor the page ships (demo-mock.ts); the outside world is the fixture's:
// the widget origin serves the snapshot, every other host is refused. Money 0, network out 0.
//
// Time: `page.clock.install({ time })` BEFORE goto (F8): Wednesday 21.10.2026 07:00 UTC = 09:00 Europe/Warsaw, so «next Tuesday» in the
// scripted data is the same on every machine; right after goto the clock is paused, and the tests move it with `run`/`until` in steps of
// 250 ms — a whole show is ≈40 s of clock, a few seconds of the test's. Only the voice describe runs on the real clock (MediaRecorder).
// Reduced motion: `test.use(REDUCED_MOTION)` of fixtures.ts — NOT `test.use({ reducedMotion })`, which Playwright 1.58 ignores (and
// `reduced-motion-is-on` asserts the media query).
//
// What every test also holds (afterEach, the `watch` fixture): no request reached the API origin, no securitypolicyviolation, no pageerror and no
// unhandled rejection. The positive controls for those zeros are in B1(c).
//   B1  the widget stands in the slot, given the demo origin; controls of the environment (CSP, Permissions-Policy)
//   B2  the show: four businesses in English, four languages, the bodies the widget sends, the voice
//   B3  take-over (three doors, Tab does not), the consent the script lays down and the visitor's own, the shield
//   B4  the second circle and a language changed in the middle      B5  leaving and coming back inside the SPA
//   B6  reduced motion, out of the window, the views (6 states × 2 widths × 2 themes) and the 8 frames of the card
//   B8  a widget.js that never comes, a visitor without JavaScript, a click before the chunk is there

// ── the demo modules and the product, loaded where they are used ──────────────────────────────────────────────────────────────────────
type Script = typeof import('../../src/app/pages/home/demo/demo-script');
type Labels = typeof import('../../src/app/pages/home/demo/demo-labels');
let loaded: { script: Script; labels: Labels } | undefined;
async function demo(): Promise<{ script: Script; labels: Labels }> {
  if (loaded) return loaded;
  try {
    // require, not import(): Playwright transpiles .ts for require() only; the page's own modules are CommonJS-loadable in Node (no window, no Angular)
    loaded = {
      script: require('../../src/app/pages/home/demo/demo-script') as Script,
      labels: require('../../src/app/pages/home/demo/demo-labels') as Labels,
    };
  } catch (e) {
    throw new Error(`демо нет: src/app/pages/home/demo/{demo-script,demo-labels}.ts не загружаются (${String((e as Error).message).split('\n')[0]})`);
  }
  return loaded;
}

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
/** `widget.success.requestTitle` of the product, in a language: what the success screen of that language says. */
function successTitle(lang: string): string {
  const file = join(PRODUCT_ROOT, 'packages/shared/src/i18n', `${lang}.ts`);
  if (!existsSync(file)) throw new Error(`нет исходника продукта: ${file}; задай TY_PRODUCT_ROOT или клонируй ~/Projects/typelessity`);
  const title = readFileSync(file, 'utf8').match(/'widget\.success\.requestTitle':\s*'([^']+)'/)?.[1];
  if (!title) throw new Error(`${file}: no widget.success.requestTitle`);
  return title;
}

const DIST = join(process.cwd(), 'dist/typelessity-landing/browser');
/** The one file of the build that holds the scripted scenarios: the lazy chunk of the demo (D3). */
const DEMO_CHUNK = readdirSync(DIST).filter((f) => f.endsWith('.js')).find((f) => readFileSync(join(DIST, f), 'utf8').includes('Balayage und Spitzen'));

const FRAMES = process.env['L4_FRAMES'];
const T0 = new Date('2026-10-21T07:00:00Z');
const STEP = 250;

// ── what the tests see of the page ───────────────────────────────────────────────────────────────────────────────────────────────────
interface Snap {
  slot: string | null; widget: number; greeting: string | null; input: number; inputValue: string; inputDisabled: boolean;
  userMsgs: number; assistantMsgs: number; extracted: boolean; options: number; confirm: boolean; success: boolean; successTitle: string | null;
  consent: boolean; consentFocused: boolean; focusInHost: boolean; note: string | null;
  chain: 'idle' | 'json' | 'api' | 'sent'; tipOn: boolean; tipN: number; tipTitle: string; tipBody: string; ring: boolean; afterOn: boolean;
  tipsToggle: string | null; tipsPressed: string | null; configId: string | null; apiUrl: string | null;
  /** the step line of the widget («1 / 3 Contact details»): the number it counts and the name of the group; 0 / '' while the widget shows none */
  step: number; stepLabel: string;
}
const SNAP = String.raw`() => {
  const w = document.querySelector('typelessity-widget');
  const r = w ? w.shadowRoot : null;
  const q = (s) => (r ? r.querySelector(s) : null);
  const qa = (s) => (r ? Array.from(r.querySelectorAll(s)) : []);
  const chain = document.querySelector('[data-ty-chain]');
  const on = (sel) => { const e = chain && chain.querySelector(sel); return !!e && e.classList.contains('is-active'); };
  const tip = document.querySelector('[data-tip]');
  const input = q('.pill-input');
  const host = document.querySelector('[data-widget-host]');
  const consent = q('.consent-modal-container');
  const active = document.activeElement;
  const insideConsent = !!(consent && r && r.activeElement && consent.contains(r.activeElement));
  const toggle = document.querySelector('[data-tips-toggle]');
  return {
    slot: host ? host.getAttribute('data-slot-state') : null,
    widget: document.querySelectorAll('typelessity-widget').length,
    greeting: q('.welcome-greeting') ? q('.welcome-greeting').textContent.trim() : null,
    input: input ? 1 : 0, inputValue: input ? input.value : '', inputDisabled: input ? input.disabled : false,
    userMsgs: qa('.message.user').length, assistantMsgs: qa('.message.assistant').length,
    extracted: !!q('.extracted-fields'), options: qa('.option-badge').length, confirm: !!q('.progress-confirm-btn'),
    success: !!q('.success-screen[data-outcome="request"]'), successTitle: q('.success-title') ? q('.success-title').textContent.trim() : null,
    consent: !!consent, consentFocused: insideConsent,
    focusInHost: !!(active && active.closest && active.closest('[data-widget-host]')),
    note: (document.querySelector('[data-demo-note]') || {}).textContent || null,
    chain: on('[data-chain-sent]') ? 'sent' : on('[data-chain-api]') ? 'api' : on('[data-chain-json]') ? 'json' : 'idle',
    tipOn: !!tip && tip.classList.contains('is-on'),
    tipN: tip ? parseInt((tip.querySelector('[data-tip-n]') || {}).textContent || '0', 10) : 0,
    tipTitle: tip ? ((tip.querySelector('[data-tip-title]') || {}).textContent || '') : '',
    tipBody: tip ? ((tip.querySelector('[data-tip-body]') || {}).textContent || '') : '',
    ring: !!document.querySelector('[data-ring].is-on'),
    afterOn: !!document.querySelector('[data-after].is-on'),
    tipsToggle: toggle ? toggle.textContent.trim() : null, tipsPressed: toggle ? toggle.getAttribute('aria-pressed') : null,
    configId: w ? w.getAttribute('config-id') : null, apiUrl: w ? w.getAttribute('api-url') : null,
    step: q('.scope-status-count') ? parseInt(q('.scope-status-count').textContent, 10) || 0 : 0,
    stepLabel: q('.scope-status-label') ? q('.scope-status-label').textContent.trim() : '',
  };
}`;
const snap = (page: Page): Promise<Snap> => page.evaluate(`(${SNAP})()`) as Promise<Snap>;

/** What the test remembers of one stretch of the show. */
interface Trace { tips: number[]; chain: string[]; steps: Array<{ n: number; label: string }>; focusInHost: boolean; spent: number; last: Snap }

/** Move the clock (never the wall) by `ms`, in steps, with a breath of real time for the routes (chunk, widget.js) to answer. */
async function run(page: Page, ms: number, step = STEP): Promise<void> {
  for (let spent = 0; spent < ms; spent += step) {
    await page.clock.runFor(Math.min(step, ms - spent));
    await page.waitForTimeout(8);
  }
}

/**
 * Move the clock until `done` holds on a snapshot; the trace (which tips came in which order, which states the ribbon passed through, whether the
 * focus of the page ever stood inside the widget) is what the show left behind. Fails with the last snapshot after `limit` ms of CLOCK.
 */
async function play(page: Page, label: string, done: (s: Snap, t: Trace) => boolean, limit = 90_000, step = STEP, trace?: Trace): Promise<Trace> {
  const t: Trace = trace ?? { tips: [], chain: [], steps: [], focusInHost: false, spent: 0, last: await snap(page) };
  const spentBefore = t.spent;
  for (;;) {
    const s = await snap(page);
    t.last = s;
    if (s.tipOn && t.tips[t.tips.length - 1] !== s.tipN) t.tips.push(s.tipN);
    if (t.chain[t.chain.length - 1] !== s.chain) t.chain.push(s.chain);
    if (s.step > 0 && t.steps[t.steps.length - 1]?.n !== s.step) t.steps.push({ n: s.step, label: s.stepLabel });
    if (s.focusInHost) t.focusInHost = true;
    if (done(s, t)) return t;
    if (t.spent - spentBefore >= limit) throw new Error(`${label}: not reached in ${limit} ms of clock; the last snapshot: ${JSON.stringify(s)}`);
    await page.clock.runFor(step);
    t.spent += step;
    await page.waitForTimeout(8);
  }
}

/**
 * The controller of the demo watches the stage with an IntersectionObserver (threshold 0.2: the show plays only while the stage is in the window), and the
 * observer answers in the step that draws a frame — not after a time (FL-90: four `waitForTimeout(400)` stood here). The page clock is installed, so the page's
 * own `requestAnimationFrame` is faked and cannot be waited on; an observer is not faked. A second observer on the same stage, made after the first, is
 * notified after it in the same step: when it reports the state wanted, the controller has already reacted to it.
 */
async function stageSettled(page: Page, inView: boolean): Promise<void> {
  await page.evaluate((want) => new Promise<void>((resolve) => {
    const stage = document.querySelector('[data-ty-demo]')!;
    const io = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1]!.isIntersecting === want) { io.disconnect(); resolve(); }
    }, { threshold: 0.2 });
    io.observe(stage);
  }), inView);
}

/**
 * L13 (test-design L13-11): a card that stopped under the sticky header is «stable» and still not clickable — `red-fl56-head.log` shows the pointer caught by
 * <a href="/faq"> of <app-header>. The point a click would go to (the centre of the box) must be free of the header; if it is not, the page is scrolled by the height
 * of the header and the box is waited for again (the clock is installed, so the page's own requestAnimationFrame is faked: the same read-twice poll as above).
 * Its own function so that a spec can ask for the result (a click that Playwright rescues by scrolling on its own would not tell a missing guard from a present one).
 */
async function clearOfHeader(locator: Locator): Promise<void> {
  for (let pass = 0; pass < 3; pass++) {
    const box = (await locator.boundingBox())!;
    const underHeader = await locator.page().evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('app-header'), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    if (!underHeader) break;
    const header = await locator.page().evaluate(() => document.querySelector('app-header')!.getBoundingClientRect().height);
    await locator.page().evaluate((h) => window.scrollBy({ top: -(h + 8), behavior: 'instant' }), header);
    let before = '';
    await expect.poll(async () => { const now = JSON.stringify(await locator.boundingBox()); const same = now !== 'null' && now === before; before = now; return same; }, { message: 'the card keeps moving after the page was scrolled off the header', intervals: [100, 150, 250], timeout: 15_000 }).toBe(true);
  }
}

/**
 * A card of the show is clicked when it has stood still: the widget slides cards in and scrolls its own list, and a click aimed at a card that is still
 * on its way is refused with «element is not stable» or «outside of the viewport» (FL-56: once on a full run, 3 of 3 alone). Polled by the real clock of
 * the test, not by the page's (that one is frozen): the box must be the same on consecutive reads, then the click has a bounded time of its own.
 */
async function clickWhenSettled(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded({ timeout: 30_000 });
  let last = '';
  await expect.poll(async () => {
    const now = JSON.stringify(await locator.boundingBox());
    const same = now !== 'null' && now === last;
    last = now;
    return same;
  }, { message: 'the card keeps moving', intervals: [100, 100, 150, 250], timeout: 30_000 }).toBe(true);
  await clearOfHeader(locator);
  await locator.click({ timeout: 30_000 });
}

/** Freeze the clock where it stands: from here only `run` and `play` move it. */
async function freeze(page: Page): Promise<void> {
  // FL-56 (L13): the clock is read in the page and paused 600 ms ahead of that reading. On a machine busy with other workers more than 600 ms can pass between
  // the two calls, and Playwright refuses to pause in the past («Cannot fast-forward to the past»): 4 runs of 20 at 8 workers failed there, in the test of
  // FL-56 among others. The reading is taken again and the pause asked for again; the margin stays 600 ms, so the show has run the same 0.6 s of its
  // clock when it stops. A refusal that is not «the past» is not retried.
  for (let attempt = 1; ; attempt++) {
    const now = await page.evaluate(() => Date.now());
    try {
      await page.clock.pauseAt(new Date(now + 600));
      return;
    } catch (error) {
      if (attempt >= 6 || !/fast-forward to the past/.test(String(error))) throw error;
    }
  }
}

interface OpenOptions {
  width?: number; height?: number; path?: string; freeze?: boolean;
  /** init scripts that wrap the TIMERS: they have to go in after the clock, which replaces setTimeout/setInterval/requestAnimationFrame when it is installed */
  afterClock?: (page: Page) => Promise<void>;
}
async function openHome(page: Page, options: OpenOptions = {}): Promise<Response | null> {
  await page.clock.install({ time: T0 });
  await underPolicy(page);
  await options.afterClock?.(page);
  await page.setViewportSize({ width: options.width ?? 1440, height: options.height ?? 900 });
  const response = await page.goto(options.path ?? '/');
  if (options.freeze !== false) await freeze(page);
  return response;
}

/** The recorder of what the REAL widget sends to the demo origin. The interceptor answers in the page, so nothing of it is on the wire. */
const RECORDER = String.raw`(() => {
  const calls = (window.__calls = []);
  const wrappers = new WeakMap();
  let current = window.fetch;
  const record = (input, init) => {
    try {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (url.origin !== 'https://demo.invalid') return;
      const body = init && init.body;
      let parsed = null;
      if (typeof body === 'string') { try { parsed = JSON.parse(body); } catch (e) { parsed = body; } }
      else if (body instanceof FormData) { parsed = { __formData: Array.from(body.keys()), fileSize: body.get('file') && body.get('file').size }; }
      calls.push({ method: ((init && init.method) || 'GET').toUpperCase(), path: url.pathname, body: parsed, sessionKeys: Object.keys(sessionStorage).filter((k) => k.indexOf('typelessity_session_') === 0).length, headers: init && init.headers });
    } catch (e) { /* never break the page for the recorder */ }
  };
  // The page's own code reads window.fetch and gets the function it stored (so that «the fetch that was there before is back» stays true); the
  // widget, recognised by its script in the stack, gets the same function with a recording step in front of it.
  Object.defineProperty(window, 'fetch', {
    configurable: true, enumerable: true,
    get() {
      if (typeof current !== 'function' || !/widget\.js/.test(new Error().stack || '')) return current;
      let w = wrappers.get(current);
      if (!w) { const fn = current; w = function (input, init) { record(input, init); return fn.call(this, input, init); }; wrappers.set(fn, w); }
      return w;
    },
    set(fn) { current = fn; },
  });
})()`;
interface Call { method: string; path: string; body: unknown; sessionKeys: number; headers?: unknown }
const calls = (page: Page): Promise<Call[]> => page.evaluate(() => (window as unknown as { __calls?: Call[] }).__calls ?? []);


/** Every body of a call the product API has a schema for, run through that schema (the product's own zod, in a child process). Returns the schemas used. */
async function validateBodies(sent: Call[]): Promise<string[]> {
  const schemaOf = (c: Call): string | null =>
    c.method === 'POST' && c.path === '/api/session' ? 'createSessionSchema'
      : c.method === 'POST' && /^\/api\/session\/[^/]+\/message$/.test(c.path) ? 'sendMessageSchema'
        : c.method === 'POST' && c.path === '/api/consent' ? 'saveConsentSchema' : null;
  const items = sent.flatMap((c) => { const schema = schemaOf(c); return schema ? [{ schema, body: c.body, call: `${c.method} ${c.path}` }] : []; });
  const raw = execFileSync('npx', ['tsx', 'e2e/browser/product-schema-check.ts'], { input: JSON.stringify(items), cwd: process.cwd(), encoding: 'utf8', maxBuffer: 10_000_000 });
  const results = JSON.parse(raw) as { ok: boolean; issues: unknown[] }[];
  expect(results.length).toBe(items.length);
  results.forEach((r, i) => expect(r.ok, `${items[i]!.call}: ${JSON.stringify(items[i]!.body).slice(0, 300)} → ${JSON.stringify(r.issues).slice(0, 400)}`).toBe(true));
  return [...new Set(items.map((i) => i.schema))];
}

// ── the fixtures of this file ────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Watch { pageErrors: string[]; skipCsp: boolean }
const test = base.extend<{ watch: Watch }>({
  watch: [
    async ({ page, stubs }, use, info) => {
      const watch: Watch = { pageErrors: [], skipCsp: false };
      page.on('pageerror', (e) => watch.pageErrors.push(String(e.message ?? e)));
      await use(watch);
      expect(watch.pageErrors, 'pageerror / unhandled rejection in the page').toEqual([]);
      expect(stubs.apiRequests, 'requests that reached the live API origin (the demo must ask the mock only)').toEqual([]);
      if (!watch.skipCsp && !info.annotations.some((a) => a.type === 'no-js')) {
        const csp = await page.evaluate(() => window.__csp).catch(() => null);
        if (csp) expect(csp, 'securitypolicyviolation').toEqual([]);
      }
    },
    { auto: true },
  ],
});

// launchOptions cannot be set inside a describe (it forces a new worker): the fake microphone is offered to every test of the file and granted to the voice test only
test.use({ timezoneId: 'Europe/Warsaw', locale: 'en-US', launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });
test.describe.configure({ timeout: 120_000 });

const slotHost = (page: Page) => page.locator('[data-widget-host]');
const tab = (page: Page, id: string) => page.locator(`[data-scenario-tab="${id}"]`);
const langButton = (page: Page, code: string) => page.locator(`[data-lang="${code}"]`);
const takeOverButton = (page: Page) => page.locator('[data-take-over]');
const tipsToggle = (page: Page) => page.locator('[data-tips-toggle]');
const ready = (s: Snap) => s.slot === 'ready' && s.widget === 1;

/** The show of one business to the end: the customer's own «request received» screen and the ribbon at «sent». */
const reachedSuccess = (s: Snap) => s.success && s.chain === 'sent';

async function expectRequestScreen(page: Page, scenarioId: string, lang: string, trace: Trace): Promise<void> {
  const { script } = await demo();
  const s = trace.last;
  expect(s.successTitle, `the success screen of ${lang} says the product's own title`).toBe(successTitle(lang));
  expect(trace.chain, 'the ribbon passes idle → json → api → sent in this order').toEqual(expect.arrayContaining(['json', 'api', 'sent']));
  expect(trace.chain.indexOf('json')).toBeLessThan(trace.chain.indexOf('api'));
  expect(trace.chain.indexOf('api')).toBeLessThan(trace.chain.indexOf('sent'));
  const brand = script.scenario(scenarioId, lang).brand;
  await expect(page.locator('[data-chain-source]'), 'the ribbon names the business of the scenario').toHaveText(brand);
}

// ═════════════════════════════════════════════════ B1 ═════════════════════════════════════════════════════════════════════════════════
test.describe('B1 the widget stands in the slot', () => {
  test('(pre) after load and idle the real widget stands in the slot, given the demo origin and the config of the first scenario; widget.js was served once', async ({ page, stubs }) => {
    const { script, labels } = await demo();
    const response = await openHome(page);
    expect(await response!.text(), 'the prerendered document holds no widget element').not.toMatch(/<typelessity-widget/i);
    const t = await play(page, '(pre)', (s) => ready(s) && !!s.greeting, 30_000);
    expect(t.last.configId).toBe(`${script.CONFIG_ID_PREFIX}salon`);
    expect(t.last.apiUrl, 'the widget is given the origin that cannot resolve, not the live API').toBe(labels.DEMO_API_ORIGIN);
    expect(t.last.apiUrl).not.toBe(API_ORIGIN);
    expect(await page.evaluate(() => !!customElements.get('typelessity-widget'))).toBe(true);
    expect(stubs.widgetScriptRequests, 'widget.js is asked for exactly once').toBe(1);
    expect(await page.locator('script[src*="widget.js"]').count()).toBe(1);
    expect(t.last.greeting, 'the greeting of the first scenario, in English').toBe(script.scenario('salon', 'en').welcome);
  });

  test('(c) the controls of the environment: a font from a host the policy does not name is one font-src violation; the microphone is allowed to the page and the camera is not', async ({ page }) => {
    const response = await openHome(page);
    await play(page, 'control', ready, 30_000);
    await page.evaluate(async () => { try { await new FontFace('Sentinel', 'url(https://csp-sentinel.invalid/x.woff2)').load(); } catch { /* blocked, as it must be */ } });
    await run(page, 500);
    const csp = await page.evaluate(() => window.__csp);
    expect(csp.length, 'the control font-src violation').toBe(1);
    expect(csp[0]).toMatch(/^font-src /);
    await page.evaluate(() => { window.__csp.length = 0; });
    const policy = await page.evaluate(() => {
      const fp = (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy;
      return fp ? { camera: fp.allowsFeature('camera'), microphone: fp.allowsFeature('microphone') } : null;
    });
    expect(policy, 'document.featurePolicy exists in this Chromium').not.toBeNull();
    expect(policy, 'Permissions-Policy of vercel.json: camera=(), microphone=(self)').toEqual({ camera: false, microphone: true });
    // the same headers are what the document carries
    expect(await response!.headerValue('permissions-policy')).toBe(SITE_HEADERS['permissions-policy']);
    expect(await response!.headerValue('content-security-policy')).toBe(SITE_HEADERS['content-security-policy']);
    expect(SITE_HEADERS['content-security-policy'], 'the demo origin is NOT in the policy: a request that escapes the interceptor is a violation (D2)').not.toMatch(/demo\.invalid/);
    expect(SITE_HEADERS['permissions-policy']).toMatch(/microphone=\(self\)/);
  });

  test('the interceptor is on the page while the demo stands: a request to the live API origin is not answered by it', async ({ page, stubs }) => {
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    const status = await page.evaluate((origin) => fetch(`${origin}/api/config/by-domain`).then((r) => r.status), API_ORIGIN);
    expect(status, 'the product API answers 404 on a domain it does not know; the interceptor answers the demo origin only').toBe(404);
    expect(stubs.apiRequests.map((r) => `${r.method} ${r.path}`)).toEqual(['GET /api/config/by-domain']);
    stubs.apiRequests.length = 0;
    const pending = page.evaluate(() => fetch('https://demo.invalid/api/nothing-here').then((r) => r.status));
    await run(page, 2000); // the interceptor answers after the pause of the mock: a timer of the page, on the paused clock
    const own = await pending;
    expect(own, 'an unknown path on the demo origin is a 404 of the interceptor, not the network').toBe(404);
  });
});

// ═════════════════════════════════════════════════ B2 ═════════════════════════════════════════════════════════════════════════════════
test.describe('B2 the show', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(RECORDER); });

  for (const id of ['salon', 'garage', 'table', 'freight']) {
    test(`(a) ${id}, English: tips 1–7 in order, the ribbon json → api → sent, the widget's own «request received»; the show never takes the focus of the page`, async ({ page }) => {
      const { script } = await demo();
      await openHome(page);
      await play(page, 'ready', ready, 30_000);
      if (id !== 'salon') await tab(page, id).click();
      const sc = script.scenario(id, 'en');
      const first = await play(page, `${id}: the greeting`, (s) => s.greeting === sc.welcome, 30_000);
      expect(first.last.greeting, 'the greeting is the welcome of the scenario').toBe(sc.welcome);
      expect(first.last.configId).toBe(`${script.CONFIG_ID_PREFIX}${id}`);
      const t = await play(page, `${id}: success and all seven tips`, (s, tr) => reachedSuccess(s) && tr.tips.includes(7), 110_000, STEP, first);
      await expectRequestScreen(page, id, 'en', t);
      expect(t.tips, 'tips come in their order, 1 to 7').toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(t.focusInHost, 'a programmatic focus() of the widget moved the focus of the page into it').toBe(false);
      const bodies = (await calls(page)).filter((c) => c.method === 'POST' && /\/message$/.test(c.path)).map((c) => c.body as { text: string; selection?: { value: string } });
      expect(bodies.length, 'the customer said a sentence, tapped a card and gave a contact').toBe(3);
      expect(bodies[0]!.text, 'the typed sentence is the scripted one').toBe(sc.phrase);
      expect(bodies[1]!.selection?.value, 'the card tapped is one of the three the mock offered').toBeTruthy();
      expect(bodies[2]!.text, 'the contact is the scripted one').toBe(sc.c.contact);
      expect(script.TIPS.length, 'the seven tips of the show').toBe(7);
    });
  }

  for (const lang of ['pl', 'de', 'ru', 'es']) {
    test(`(b) ${lang}: a click on the language starts the same business again in that language, as far as «request received»`, async ({ page }) => {
      const { script } = await demo();
      await openHome(page);
      await play(page, 'ready', ready, 30_000);
      await langButton(page, lang).click();
      const sc = script.scenario('salon', lang);
      const first = await play(page, `${lang}: the greeting`, (s) => s.greeting === sc.welcome, 30_000);
      expect(first.last.greeting).toBe(sc.welcome);
      expect(await page.evaluate(() => document.querySelector('typelessity-widget')?.getAttribute('locale'))).toBe(lang);
      const t = await play(page, `${lang}: success`, reachedSuccess, 100_000, STEP, first);
      await expectRequestScreen(page, 'salon', lang, t);
      const typed = ((await calls(page)).find((c) => c.method === 'POST' && /\/message$/.test(c.path))!.body as { text: string }).text;
      expect(typed, 'the typed sentence is the one of the language').toBe(sc.phrase);
    });
  }

  test('(c) the bodies the widget sends to the demo origin are bodies the product API accepts (its own zod schemas), nothing else is asked, and a session is never read back', async ({ page }) => {
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    await play(page, 'success', reachedSuccess, 100_000);
    const sent = await calls(page);
    expect(sent.length, 'the recorder saw the widget talk to the demo origin').toBeGreaterThanOrEqual(5);
    const checked = await validateBodies(sent);
    expect(checked, 'a session and a message were each checked').toEqual(expect.arrayContaining(['createSessionSchema', 'sendMessageSchema']));
    expect(sent.filter((c) => c.method === 'GET' && /^\/api\/session\/[^/]+$/.test(c.path)), 'a session was read back (GET /api/session/:id): the widget would restore the last one (F3)').toEqual([]);
    const unknown = sent.filter((c) => !/^POST \/api\/(session|consent|transcribe)$/.test(`${c.method} ${c.path}`) && !/^POST \/api\/session\/[^/]+\/(message|confirm|abort|retry|retry-enrichment)$/.test(`${c.method} ${c.path}`) && !/^GET \/api\/config\/[^/]+$/.test(`${c.method} ${c.path}`));
    expect(unknown.map((c) => `${c.method} ${c.path}`), 'a call that is neither answered nor refused on purpose').toEqual([]);
  });
});

test.describe('B2(d) the voice, on the real clock, with a fake microphone', () => {
  test.use({ permissions: ['microphone'] });

  test('take-over, consent, the microphone, stop: /api/transcribe is answered with the sample sentence of the scenario in its language and it lands in the chat; a session exists before it', async ({ page }) => {
    test.setTimeout(90_000);
    const { script } = await demo();
    await page.addInitScript(RECORDER);
    await underPolicy(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect.poll(() => snap(page).then((s) => s.slot), { timeout: 30_000, message: 'the demo mounted the widget' }).toBe('ready');
    await takeOverButton(page).click();
    await expect(page.locator('typelessity-widget .consent-modal-container')).toBeVisible({ timeout: 10_000 });
    for (const box of await page.locator('typelessity-widget .consent-checkbox-input').all()) await box.check();
    await page.locator('typelessity-widget .button-success-apply').click();
    const mic = page.locator('typelessity-widget .pill-voice');
    await expect(mic, 'the microphone button of the widget').toBeEnabled({ timeout: 10_000 });
    await mic.click();
    await expect(page.locator('typelessity-widget .recording-bar'), 'the widget records (a fake device, a granted permission)').toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4000); // MIN_BLOB_SIZE of the product is 10 000 bytes: a fake tone of ~4 s is above it
    await page.locator('typelessity-widget .recording-send').click();
    const phrase = script.scenario('salon', 'en').phrase;
    await expect
      .poll(async () => page.evaluate((p) => {
        const r = document.querySelector('typelessity-widget')?.shadowRoot;
        const input = r?.querySelector('.pill-input') as HTMLInputElement | null;
        return !!(input && input.value.includes(p)) || Array.from(r?.querySelectorAll('.message.user') ?? []).some((m) => (m.textContent ?? '').includes(p));
      }, phrase), { timeout: 30_000, message: 'the sample sentence of the scenario reached the chat' })
      .toBe(true);
    const sent = await calls(page);
    const iSession = sent.findIndex((c) => c.method === 'POST' && c.path === '/api/session');
    const iVoice = sent.findIndex((c) => c.method === 'POST' && c.path === '/api/transcribe');
    expect(iVoice, 'POST /api/transcribe was made').toBeGreaterThanOrEqual(0);
    expect(iSession, 'a session exists before the voice goes (ensureSession)').toBeGreaterThanOrEqual(0);
    expect(iSession).toBeLessThan(iVoice);
    const form = sent[iVoice]!.body as { __formData: string[]; fileSize: number };
    expect(form.__formData, 'the body is a FormData with the recording').toContain('file');
    expect(form.fileSize, 'the recording is above the product threshold').toBeGreaterThanOrEqual(10_000);
  });
});

// ═════════════════════════════════════════════════ L14 ═════════════════════════════════════════════════════════════════════════════════
// L14, item 7 (testers A and B, 21.10): the step line of the widget counted 1/3 → 3/3 → 1/3 inside one booking. Its groups come from the config the mock
// serves (demo-mock.ts: `group` on every field); the widget draws them in the order of first appearance. The sequence it passed through must never go back.
test.describe('L14 the step line of the widget never goes back', () => {
  for (const id of ['salon', 'garage', 'table', 'freight']) {
    test(`${id}, English: from the first question to «request received» the step number only grows, and the first step is not «Contact details»`, async ({ page }) => {
      await openHome(page);
      await play(page, 'ready', ready, 30_000);
      if (id !== 'salon') await tab(page, id).click();
      const t = await play(page, `${id}: success`, reachedSuccess, 110_000);
      const numbers = t.steps.map((x) => x.n);
      expect(numbers.length, `${id}: the step line was seen (the widget draws it): ${JSON.stringify(t.steps)}`).toBeGreaterThanOrEqual(2);
      expect([...numbers].sort((a, b) => a - b), `${id}: the step number went back: ${JSON.stringify(t.steps)}`).toEqual(numbers);
      expect(t.steps[0]!.label, `${id}: the first question is not about contact details`).not.toBe('Contact details');
      expect(t.steps[t.steps.length - 1]!.label, `${id}: the last step before the end is the contact`).toBe('Contact details');
    });
  }
});

// L14, item 6 (FL-68): on a phone the tip stood in the room above the tabs and was out of the window when the widget filled it. Now the card stands in the
// window with the block it lights. 390×844, the widget scrolled so that its top is 90–120 px from the top of the window, tips 1 and 2, two themes.

/** The animations that end (the frame grows with a transition, the card fades) are waited for, not a time. */
async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
}

/**
 * L13 (FL-71, test-design L13-13): the part of an element of the widget (`sel`, searched in its shadow root) that the card of the tip lies over, as a point of the window.
 * Measured from the two boxes — `elementFromPoint` would look through the card (it lets taps pass: `pointer-events: none`) and say «not covered» exactly when the fix works.
 * `reachable`: the point is inside the window, under the sticky header's lower edge, and is not the × of the card.
 */
async function underCard(page: Page, sel: string) {
  return page.evaluate((s) => {
    const el = (document.querySelector('typelessity-widget') as HTMLElement).shadowRoot!.querySelector(s)!.getBoundingClientRect();
    const tip = document.querySelector('[data-tip].is-on')!.getBoundingClientRect();
    const top = Math.max(el.top, tip.top), bottom = Math.min(el.bottom, tip.bottom), left = Math.max(el.left, tip.left), right = Math.min(el.right, tip.right);
    const covered = bottom > top && right > left;
    const x = (left + right) / 2, y = (top + bottom) / 2;
    const header = document.querySelector('app-header')?.getBoundingClientRect().bottom ?? 0;
    const onClose = !!document.elementFromPoint(x, y)?.closest('[data-tip-close]');
    return { covered, reachable: covered && x > 0 && x < window.innerWidth && y > header && y < window.innerHeight && !onClose, x, y, rowY: (el.top + el.bottom) / 2, tipY: (tip.top + tip.bottom) / 2 };
  }, sel);
}

/** Scrolls the page until `sel` of the widget lies under the card (at most 4 passes: measure, move by the distance between the two centres, let the layout settle). */
async function bringUnderCard(page: Page, sel: string) {
  let spot = await underCard(page, sel);
  for (let pass = 0; pass < 4 && !spot.reachable; pass++) {
    await page.evaluate((d) => window.scrollBy({ top: -d, behavior: 'instant' }), spot.tipY - spot.rowY);
    await stageSettled(page, true);
    await settleAnimations(page);
    spot = await underCard(page, sel);
  }
  return spot;
}

const L14_FRAMES = process.env['L14_FRAMES'];
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`L14 tips on a phone, 390px, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test(`tips 1 and 2: the card is inside the window, whole, together with the ring of the block it lights, and does not cover that block`, async ({ page }) => {
      test.setTimeout(150_000);
      await openHome(page, { width: 390, height: 844 });
      await play(page, 'ready', ready, 40_000);
      // scrolled by hand, not by `scrollIntoView` (that would put the widget at 0): the visitor has the widget under the header. Two passes: the first
      // one moves the page, the layout below it settles (the frame grows with a transition), the second one corrects.
      let top = 0;
      for (let pass = 0; pass < 3; pass++) {
        await page.evaluate(() => window.scrollBy({ top: document.querySelector('.demo__frame')!.getBoundingClientRect().top - 105, behavior: 'instant' }));
        await stageSettled(page, true); // the observer of the page has answered
        // the frame grows with a transition (0.4 s): wait for the transition to end, not for a time
        await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
        top = await page.evaluate(() => document.querySelector('.demo__frame')!.getBoundingClientRect().top);
        if (top >= 90 && top <= 120) break;
      }
      expect(top, 'the widget stands 90–120 px from the top of the window').toBeGreaterThanOrEqual(90);
      expect(top).toBeLessThanOrEqual(120);
      // both tips light a block of the widget (TIPS[0].sel «.welcome-badges», TIPS[1].sel «.extracted-fields»): the ring is waited for and held
      let trace = await play(page, 'tip 1', (s) => s.tipOn && s.tipN === 1 && s.ring, 40_000);
      for (const n of [1, 2]) {
        if (n === 2) trace = await play(page, 'tip 2', (s) => s.tipOn && s.tipN === 2 && s.ring, 60_000, STEP, trace);
        await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
        const box = await page.evaluate(() => {
          const r = (sel: string) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
          return { tip: r('[data-tip].is-on'), ring: r('[data-ring].is-on'), h: window.innerHeight, w: window.innerWidth, pos: getComputedStyle(document.querySelector('#hero-tips')!).position };
        });
        expect(box.tip, `tip ${n} is on`).not.toBeNull();
        expect(box.pos, 'the tip card sticks (it is the sticky card of the mock)').toBe('sticky');
        const inside = (b: { top: number; bottom: number; left: number; right: number }) => b.top >= 0 && b.bottom <= box.h && b.left >= 0 && b.right <= box.w;
        expect(inside(box.tip!), `tip ${n}: the card (${JSON.stringify(box.tip)}) is whole inside the window ${box.w}×${box.h}`).toBe(true);
        expect(box.ring, `tip ${n} lights a block: the ring is on`).not.toBeNull();
        expect(inside(box.ring!), `tip ${n}: the ring of the lit block (${JSON.stringify(box.ring)}) is inside the window`).toBe(true);
        const overlap = Math.min(box.tip!.bottom, box.ring!.bottom) - Math.max(box.tip!.top, box.ring!.top);
        expect(overlap, `tip ${n}: the card covers the block it lights by ${Math.round(overlap)} px`).toBeLessThanOrEqual(0);
        // L13 (FL-71): the card stands over the foot of the widget, where the input row is. A tap on that row must reach the widget (the card used to take
        // it: `.tip.is-on { pointer-events: auto }`), and the card's own × must still be a button. The overlap is real at this scroll position, so the
        // tap point is the middle of the part of the input row the card covers. For tip 1 the overlap is part of what is asserted: if the card is moved off the
        // row (FL-97, the designer's call), the check below must say so instead of vanishing — it used to be skipped silently (test-design L13-9).
        const hit = await page.evaluate(() => {
          const host = document.querySelector('typelessity-widget') as HTMLElement;
          const row = host.shadowRoot!.querySelector('.pill-input')!.getBoundingClientRect();
          const tip = document.querySelector('[data-tip].is-on')!.getBoundingClientRect();
          const top = Math.max(row.top, tip.top), bottom = Math.min(row.bottom, tip.bottom), left = Math.max(row.left, tip.left), right = Math.min(row.right, tip.right);
          const covered = bottom > top && right > left;
          const at = (x: number, y: number) => document.elementFromPoint(x, y);
          const x = document.querySelector('[data-tip-close]')!.getBoundingClientRect();
          const underRow = covered ? at((left + right) / 2, (top + bottom) / 2) : null;
          const onClose = at(x.left + x.width / 2, x.top + x.height / 2);
          return { covered, rowIsWidget: underRow ? !!underRow.closest('typelessity-widget') : null, rowTarget: underRow ? underRow.tagName + '.' + underRow.className : null, closeIsButton: !!onClose?.closest('[data-tip-close]') };
        });
        expect(hit.closeIsButton, `tip ${n}: the × of the card is a button that can be tapped`).toBe(true);
        if (n === 1) expect(hit.covered, `tip 1: the card lies over the input row at this scroll position (390×844, widget 90–120 px from the top) — the card was moved: revisit this check together with FL-97, do not delete it`).toBe(true);
        // tip 2 stands where its own block is lit and may leave the row free; where it does cover the row the tap must go through
        if (hit.covered) expect(hit.rowIsWidget, `tip ${n}: a tap on the part of the input row under the card reaches the widget, not the card (it hit ${hit.rowTarget})`).toBe(true);
        if (L14_FRAMES) { mkdirSync(L14_FRAMES, { recursive: true }); await page.screenshot({ path: join(L14_FRAMES, `after-home-tip${n}-390-${scheme}.png`) }); }
      }
    });

    // L13 (FL-71): the case the finding is about — the visitor has taken the demo over and wants to type, and the card of a tip stands over the foot of the widget.
    // While the show plays the controller does not let the focus into the widget, so this is only reachable after the take-over.
    // Round of judges (test-design L13-13): the first form of this test clicked the centre of the input row where the page happened to stand. There the card lay
    // 70 px BELOW the row, so the click reached the input under any `pointer-events`, and the test was green with the old CSS (`tip-card-takes-the-tap`). Now the row is
    // first brought UNDER the card by scrolling, the overlap is asserted from the two boxes (not with `elementFromPoint`, which looks through a card that lets taps
    // pass), and the click is a real mouse click at a point of the covered part: a card that takes the tap leaves the focus outside the widget and the test is red.
    // The cursor in the widget sends the card out of the way; the cursor leaving brings it back. Frame after-home-tip-typing-390.
    test(`after a take-over: a click on the part of the input row the card lies over reaches the widget, and the card steps aside while the cursor is in the widget`, async ({ page }) => {
      test.setTimeout(150_000);
      await openHome(page, { width: 390, height: 844 });
      await play(page, 'ready', ready, 40_000);
      await takeOverButton(page).click();
      await acceptConsent(page);
      await play(page, 'a tip of the visitor\'s own conversation is on', (s) => s.tipOn, 40_000);
      await page.evaluate(() => window.scrollBy({ top: document.querySelector('.demo__frame')!.getBoundingClientRect().top - 105, behavior: 'instant' }));
      await stageSettled(page, true);
      await settleAnimations(page);
      const tipState = () => page.evaluate(() => { const tip = document.querySelector('[data-tip]') as HTMLElement; return { on: tip.classList.contains('is-on'), visibility: getComputedStyle(tip).visibility }; });
      expect(await tipState(), 'a tip is on and visible before the cursor goes to the widget').toEqual({ on: true, visibility: 'visible' });
      await expect(page.locator('typelessity-widget .pill-input')).toBeEnabled();
      const spot = await bringUnderCard(page, '.pill-input');
      expect(spot.covered, `the card lies over the input row (row centre ${Math.round(spot.rowY)}, card centre ${Math.round(spot.tipY)})`).toBe(true);
      await page.mouse.click(spot.x, spot.y);
      await expect.poll(() => page.evaluate(() => !!(document.querySelector('typelessity-widget') as HTMLElement).shadowRoot!.activeElement), { message: 'a click on the part of the row the card lies over put the cursor in the widget (a card that takes the tap leaves it outside)' }).toBe(true);
      expect((await tipState()).visibility, 'while the cursor is in the widget the card is out of the way').toBe('hidden');
      if (L14_FRAMES) { mkdirSync(L14_FRAMES, { recursive: true }); await page.screenshot({ path: join(L14_FRAMES, `after-home-tip-typing-390-${scheme}.png`) }); }
      await page.evaluate(() => ((document.querySelector('typelessity-widget') as HTMLElement).shadowRoot!.activeElement as HTMLElement).blur());
      expect((await tipState()).visibility, 'when the cursor leaves, the card is back').toBe('visible');
    });

    // Test-design Н-5: the other ways in under the card — the microphone button (and the send button) is also a part of the row. The press on the microphone moves the
    // focus into the widget in Chromium, so the card must be out of the way while the button is down; the release starts the recording (a fake device, a granted permission).
    // On iOS Safari a touch does not focus a <button>: not checked here (a real phone), see the card of the round.
    test.describe('the microphone under the card', () => {
      test.use({ permissions: ['microphone'] });
      test(`after a take-over: a press on the microphone button under the card reaches the widget, the card steps aside, the release starts the recording`, async ({ page }) => {
        test.setTimeout(150_000);
        await openHome(page, { width: 390, height: 844 });
        await play(page, 'ready', ready, 40_000);
        await takeOverButton(page).click();
        await acceptConsent(page);
        await play(page, 'a tip of the visitor\'s own conversation is on', (s) => s.tipOn, 40_000);
        await page.evaluate(() => window.scrollBy({ top: document.querySelector('.demo__frame')!.getBoundingClientRect().top - 105, behavior: 'instant' }));
        await stageSettled(page, true);
        await settleAnimations(page);
        await expect(page.locator('typelessity-widget .pill-voice')).toBeEnabled({ timeout: 10_000 });
        const spot = await bringUnderCard(page, '.pill-voice');
        expect(spot.covered, `the card lies over the microphone button (button centre ${Math.round(spot.rowY)}, card centre ${Math.round(spot.tipY)})`).toBe(true);
        await page.mouse.move(spot.x, spot.y);
        await page.mouse.down();
        await expect.poll(() => page.evaluate(() => {
          const tip = document.querySelector('[data-tip]') as HTMLElement;
          return { focusInWidget: !!(document.querySelector('typelessity-widget') as HTMLElement).shadowRoot!.activeElement, card: getComputedStyle(tip).visibility };
        }), { message: 'the press on the microphone put the cursor in the widget and the card stepped aside (a card that takes the tap does neither)' }).toEqual({ focusInWidget: true, card: 'hidden' });
        await page.mouse.up();
        await expect(page.locator('typelessity-widget .recording-bar'), 'the release started the recording: the tap went through the card').toBeVisible({ timeout: 10_000 });
      });
    });
  });
}

// ═════════════════════════════════════════════════ B3 ═════════════════════════════════════════════════════════════════════════════════
const STORED = (page: Page) => page.evaluate(() => ({
  consent: localStorage.getItem('typelessity_consent'),
  session: sessionStorage.getItem('typelessity_consent_session'),
  sessions: Object.keys(sessionStorage).filter((k) => k.startsWith('typelessity_session_')),
}));


/** The consent screen of the widget, accepted by the visitor: both boxes, the button; then the greeting stands and the input is open. */
async function acceptConsent(page: Page): Promise<void> {
  await play(page, 'the consent screen', (s) => s.consent, 10_000);
  for (const box of await page.locator('typelessity-widget .consent-checkbox-input').all()) await box.check();
  await page.locator('typelessity-widget .button-success-apply').click();
  await play(page, 'the greeting after the consent', (s) => !!s.greeting && s.input === 1 && !s.inputDisabled, 20_000);
}

async function expectTakenOver(page: Page, how: string): Promise<void> {
  const { script } = await demo();
  // the widget loads its config from the mock first (the pause of the mock is a timer of the page), then draws the consent screen
  await play(page, `${how}: the consent screen`, (x) => x.consent, 10_000);
  const s = await snap(page);
  expect(s.consent, `${how}: the widget shows its own consent screen`).toBe(true);
  expect(s.consentFocused, `${how}: the focus is inside the consent screen`).toBe(true);
  expect(s.note, `${how}: the show is stopped`).toBe(script.DEMO_TEXT.noteStopped);
  const stored = await STORED(page);
  const record = stored.consent ? (JSON.parse(stored.consent) as { userId?: string }) : null;
  expect(record?.userId === script.SCRIPT_USER_ID, `${how}: the record the script laid down is gone`).toBe(false);
  expect(stored.sessions, `${how}: no kept session`).toEqual([]);
}

test.describe('B3 take-over and the consent', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(RECORDER); });

  /** To the moment the show is typing: the greeting is there, the script's record stands and the widget accepted it. */
  async function toTyping(page: Page): Promise<void> {
    await openHome(page);
    await play(page, 'typing', (s) => ready(s) && s.inputValue.length > 5, 40_000);
  }

  test('(a) «Try the chat now»: the show stops, the script\'s record is gone, the consent screen is the widget\'s own and holds the focus; the visitor accepts and ends the booking with typed text, then with the card', async ({ page }) => {
    const { script } = await demo();
    await toTyping(page);
    await takeOverButton(page).click();
    await expectTakenOver(page, 'the button');
    await acceptConsent(page);
    expect(await validateBodies(await calls(page)), 'the visitor\'s consent went to the mock, in the shape the product API accepts').toContain('saveConsentSchema');
    const stored = JSON.parse((await STORED(page)).consent!) as { userId: string; consentGiven: boolean };
    expect(stored.consentGiven).toBe(true);
    expect(stored.userId, 'the record is the visitor\'s: another id than the script\'s').not.toBe(script.SCRIPT_USER_ID);
    const sc = script.scenario('salon', 'en');
    await page.locator('typelessity-widget .pill-input').pressSequentially(sc.phrase, { delay: 0 });
    await page.locator('typelessity-widget .pill-send').click();
    const t = await play(page, 'cards after typing', (s) => s.extracted && s.options === 3, 30_000);
    expect(t.last.userMsgs).toBe(1);
    await page.locator('typelessity-widget .option-badge').first().click(); // the card, not text
    await play(page, 'second question', (s) => s.assistantMsgs >= 2 && s.input === 1 && !s.inputDisabled, 30_000);
    await page.locator('typelessity-widget .pill-input').pressSequentially(sc.c.contact, { delay: 0 });
    await page.locator('typelessity-widget .pill-send').click();
    await play(page, 'review', (s) => s.confirm, 30_000);
    await page.locator('typelessity-widget .progress-confirm-btn').click();
    const done = await play(page, 'request received', reachedSuccess, 30_000);
    expect(done.last.successTitle).toBe(successTitle('en'));
    expect(done.chain).toEqual(expect.arrayContaining(['json', 'api', 'sent']));
  });

  test('(a) a pasted sentence (insertText) after take-over ends the same way: the cards come', async ({ page }) => {
    const { script } = await demo();
    await toTyping(page);
    await takeOverButton(page).click();
    await acceptConsent(page);
    await page.locator('typelessity-widget .pill-input').focus();
    await page.keyboard.insertText(script.scenario('salon', 'en').phrase);
    await page.locator('typelessity-widget .pill-send').click();
    const t = await play(page, 'cards after the paste', (s) => s.extracted && s.options === 3, 30_000);
    expect(t.last.userMsgs).toBe(1);
  });

  for (const door of ['the button', 'a click in the widget']) {
    test(`(b) the door «${door}»: the show stops, no record of the script stands, the consent screen of the widget holds the focus`, async ({ page }) => {
      const { script } = await demo();
      await toTyping(page);
      const before = await snap(page);
      expect(before.note, 'the show is on').toBe(script.DEMO_TEXT.noteAuto);
      expect(before.focusInHost, 'the show has not moved the focus of the page into the widget').toBe(false);
      if (door === 'the button') {
        await takeOverButton(page).click();
      } else {
        const box = (await slotHost(page).boundingBox())!;
        await page.mouse.click(box.x + box.width / 2, box.y + 36);
      }
      await expectTakenOver(page, door);
    });
  }

  test('(b) the door «a key of input» in the widget takes it over; Tab and Shift+Tab walk through the widget and the show goes on in the same widget element (SC 3.2.1)', async ({ page }) => {
    const { script } = await demo();
    await toTyping(page);
    await page.evaluate(() => { (document.querySelector('typelessity-widget') as HTMLElement & { __id?: number }).__id = 42; });
    for (let i = 0; i < 40 && !(await snap(page)).focusInHost; i++) await page.keyboard.press('Tab');
    expect((await snap(page)).focusInHost, 'Tab reaches the widget').toBe(true);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await run(page, 600);
    const mid = await snap(page);
    expect(mid.note, 'Tab and Shift+Tab through the widget leave the show running').toBe(script.DEMO_TEXT.noteAuto);
    expect(await page.evaluate(() => (document.querySelector('typelessity-widget') as HTMLElement & { __id?: number }).__id), 'the same widget element stands').toBe(42);
    await page.keyboard.press('x');
    await expectTakenOver(page, 'a key of input');
  });

  test('(b) a programmatic focus() of the input of the widget during the show moves nothing (the widget calls it after every answer); after take-over the same call moves the focus', async ({ page }) => {
    await toTyping(page);
    const y = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => (document.querySelector('typelessity-widget')!.shadowRoot!.querySelector('.pill-input') as HTMLElement).focus());
    const during = await snap(page);
    expect(during.focusInHost, 'focus() during the show took the focus of the page into the widget (SC 3.2.1)').toBe(false);
    expect(await page.evaluate(() => window.scrollY), 'focus() during the show scrolled the page').toBe(y);
    await takeOverButton(page).click();
    await acceptConsent(page);
    await page.evaluate(() => (document.querySelector('typelessity-widget')!.shadowRoot!.querySelector('.pill-input') as HTMLElement).focus());
    expect((await snap(page)).focusInHost, 'after take-over the widget may take the focus (the visitor is using it)').toBe(true);
  });

  test('(b) a click on a card of the show takes it over and sends nothing: no message reaches the mock, the ribbon is idle', async ({ page }) => {
    await openHome(page);
    await play(page, 'cards', (s) => s.options === 3, 60_000);
    const before = (await calls(page)).filter((c) => /\/message$/.test(c.path)).length;
    await clickWhenSettled(page.locator('typelessity-widget .option-badge').first());
    await expectTakenOver(page, 'a click on a card');
    await run(page, 5000);
    const after = (await calls(page)).filter((c) => /\/message$/.test(c.path)).length;
    expect(after, 'the click reached the widget that was about to be replaced and it sent the card as a message').toBe(before);
    const s = await snap(page);
    expect(s.chain, 'the ribbon was reset by the take-over: the lights of the old conversation did not fire after it').toBe('idle');
  });

  // L13 (test-design L13-11): the helper that clicks a card of the show must not aim under the sticky header. The page is scrolled so that the card stands behind the
  // header (the setup is asserted: the top element at the card's centre is the header); `clearOfHeader` has to bring it out (asserted), and the click takes the demo over.
  test('(b) a card of the show that stands behind the sticky header is brought out from under it before the click, and the click takes the demo over', async ({ page }) => {
    await openHome(page);
    await play(page, 'cards', (s) => s.options === 3, 60_000);
    const badge = page.locator('typelessity-widget .option-badge').first();
    await badge.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const r = (document.querySelector('typelessity-widget') as HTMLElement).shadowRoot!.querySelector('.option-badge')!.getBoundingClientRect();
      window.scrollBy({ top: r.top - 20, behavior: 'instant' });
    });
    const behindHeader = await badge.boundingBox().then((b) => page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('app-header'), { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 }));
    expect(behindHeader, 'setup: the card stands behind the header').toBe(true);
    await clearOfHeader(badge);
    const centre = async () => badge.boundingBox().then((b) => page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('app-header'), { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2 }));
    expect(await centre(), 'after the helper the centre of the card is no longer behind the header').toBe(false);
    await clickWhenSettled(badge);
    await expectTakenOver(page, 'a click on a card that stood behind the header');
  });

  test('(c) a widget that does not take the script\'s record: the show stops and the widget\'s own consent screen stays (D4)', async ({ page }) => {
    const { script } = await demo();
    await page.addInitScript((key) => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === key) { try { const o = JSON.parse(v); o.policyVersion = '1999-01-01'; return set.call(this, k, JSON.stringify(o)); } catch { /* fall through */ } }
        return set.call(this, k, v);
      };
    }, script.CONSENT_STORAGE_KEY);
    await openHome(page);
    const t = await play(page, 'the consent screen', (s) => s.consent, 40_000);
    expect(t.last.consent).toBe(true);
    await run(page, 1000);
    const s = await snap(page);
    expect(s.note, 'the show stopped').toBe(script.DEMO_TEXT.noteStopped);
    expect(s.userMsgs, 'nothing was typed over the consent screen').toBe(0);
    expect((await STORED(page)).consent, 'the script\'s record is gone').toBeNull();
  });

  test('(d) the visitor refuses: a click on a tab or a language does not write the consent over the refusal; the widget asks again and the show does not start', async ({ page }) => {
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    await takeOverButton(page).click();
    await play(page, 'the consent screen', (s) => s.consent, 10_000);
    await page.locator('typelessity-widget .button-secondary-modern').click();
    await run(page, 800);
    const refused = JSON.parse((await STORED(page)).consent!) as { consentGiven: boolean; userId: string };
    expect(refused.consentGiven, 'the refusal is stored').toBe(false);
    for (const action of [() => tab(page, 'garage').click(), () => langButton(page, 'de').click()]) {
      await action();
      await play(page, 'the consent screen again', (s) => s.consent, 10_000);
      await run(page, 15_000);
      const s = await snap(page);
      expect(s.consent, 'the widget shows its consent screen again').toBe(true);
      expect(s.userMsgs, 'no show started over the refusal').toBe(0);
      expect(s.inputValue, 'nothing was typed over the consent screen').toBe('');
      const now = JSON.parse((await STORED(page)).consent!) as { consentGiven: boolean; userId: string };
      expect(now.consentGiven, 'consentGiven did not become true').toBe(false);
      expect(now.userId, 'the visitor\'s record is the one that stands').toBe(refused.userId);
      await page.locator('typelessity-widget .button-secondary-modern').click(); // the modal covers the page: the visitor refuses again to reach the next control
      await run(page, 800);
    }
  });

  test('(d) the visitor accepts, then picks another business: the show goes on the visitor\'s record, which the script neither rewrites nor removes', async ({ page }) => {
    const { script } = await demo();
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    await takeOverButton(page).click();
    await acceptConsent(page);
    const mine = JSON.parse((await STORED(page)).consent!) as { userId: string; consentGiven: boolean };
    expect(mine.consentGiven).toBe(true);
    await tab(page, 'garage').click();
    const t = await play(page, 'the show on the visitor\'s record', (s) => s.greeting === script.scenario('garage', 'en').welcome && s.inputValue.length > 5, 40_000);
    expect(t.last.consent).toBe(false);
    const now = JSON.parse((await STORED(page)).consent!) as { userId: string; consentGiven: boolean };
    expect(now.userId, 'the script did not replace the visitor\'s record').toBe(mine.userId);
  });

  test('(e) the shield: withdrawing consent sends consentGiven:false and ends the session, both answered by the mock, no violation', async ({ page }) => {
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    await takeOverButton(page).click();
    await acceptConsent(page);
    const { script } = await demo();
    await page.locator('typelessity-widget .pill-input').pressSequentially(script.scenario('salon', 'en').phrase, { delay: 0 });
    await page.locator('typelessity-widget .pill-send').click();
    await play(page, 'a session exists: the cards came', (s) => s.extracted, 20_000);
    await page.locator('typelessity-widget .privacy-button').click();
    await play(page, 'the consent screen again', (s) => s.consent, 10_000);
    await page.locator('typelessity-widget .button-secondary-modern').click();
    await run(page, 3000);
    const sent = await calls(page);
    const consents = sent.filter((c) => c.method === 'POST' && c.path === '/api/consent').map((c) => (c.body as { consentGiven: boolean }).consentGiven);
    expect(consents, 'the acceptance and then the withdrawal').toEqual([true, false]);
    expect(sent.some((c) => c.method === 'POST' && /^\/api\/session\/[^/]+\/abort$/.test(c.path)), 'the session was ended').toBe(true);
  });
});

// ═════════════════════════════════════════════════ B4 ═════════════════════════════════════════════════════════════════════════════════
test.describe('B4 the second circle and a language changed in the middle', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(RECORDER); });

  test('after the fourth business the fifth is the salon again and it reaches «request received»; a session is never read back and no kept session stands before a mount', async ({ page }) => {
    test.setTimeout(240_000);
    const { script } = await demo();
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    const ids = [...script.SCENARIO_IDS, 'salon'];
    for (let i = 0; i < ids.length; i++) {
      const welcome = script.scenario(ids[i]!, 'en').welcome;
      await play(page, `show ${i + 1} (${ids[i]}): the greeting`, (s) => s.greeting === welcome, 60_000);
      const t = await play(page, `show ${i + 1} (${ids[i]}): request received`, (s) => reachedSuccess(s), 100_000);
      expect(t.last.successTitle).toBe(successTitle('en'));
    }
    const sent = await calls(page);
    expect(sent.filter((c) => c.method === 'GET' && /^\/api\/session\/[^/]+$/.test(c.path)), 'GET /api/session/:id was made: a session was asked for').toEqual([]);
    const creates = sent.filter((c) => c.method === 'POST' && c.path === '/api/session');
    expect(creates.length, 'one session per show').toBeGreaterThanOrEqual(5);
    expect(creates.map((c) => c.sessionKeys), 'before each session was created no kept session stood in the storage').toEqual(creates.map(() => 0));
  });

  test('a language changed in the middle of a show starts the business again in that language and it reaches «request received»', async ({ page }) => {
    const { script } = await demo();
    await openHome(page);
    await play(page, 'cards', (s) => s.options === 3, 60_000);
    await langButton(page, 'pl').click();
    const welcome = script.scenario('salon', 'pl').welcome;
    await play(page, 'the greeting in Polish', (s) => s.greeting === welcome, 40_000);
    const t = await play(page, 'request received in Polish', reachedSuccess, 100_000);
    expect(t.last.successTitle).toBe(successTitle('pl'));
    const sent = await calls(page);
    expect(sent.filter((c) => c.method === 'GET' && /^\/api\/session\/[^/]+$/.test(c.path))).toEqual([]);
  });
});

// ═════════════════════════════════════════════════ B5 ═════════════════════════════════════════════════════════════════════════════════
const ORIGINALS = String.raw`(() => {
  window.__orig = { fetch: window.fetch, scrollIntoView: Element.prototype.scrollIntoView, focus: HTMLElement.prototype.focus };
  const intervals = new Set(); const si = window.setInterval.bind(window), ci = window.clearInterval.bind(window);
  window.setInterval = (...a) => { const id = si(...a); intervals.add(id); return id; };
  window.clearInterval = (id) => { intervals.delete(id); return ci(id); };
  let raf = 0; const rf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => { raf++; return rf(cb); };
  window.__live = () => ({ intervals: intervals.size, raf });
})()`;

test.describe('B5 leaving and coming back inside the SPA', () => {
  const identity = (page: Page) => page.evaluate(() => {
    const o = (window as unknown as { __orig: { fetch: unknown; scrollIntoView: unknown; focus: unknown } }).__orig;
    return { fetch: window.fetch === o.fetch, scrollIntoView: Element.prototype.scrollIntoView === o.scrollIntoView, focus: HTMLElement.prototype.focus === o.focus };
  });
  const goPricing = async (page: Page) => { await page.locator('header nav[aria-label="Primary"]').getByRole('link', { name: /pricing/i }).click(); await expect(page).toHaveURL(/\/pricing$/); await run(page, 400); };
  const goHome = async (page: Page) => { await page.locator('header a[href="/"]').first().click(); await expect(page).toHaveURL(/\/$/); await run(page, 400); };

  test('(a) / → /pricing: fetch, scrollIntoView and focus are the ones the page had; no timers or frames of the demo live; no key of the demo stands in the storage; 120 s of clock bring nothing', async ({ page, context }) => {
    await openHome(page, { afterClock: (p) => p.addInitScript(ORIGINALS) });
    await play(page, 'ready', (s) => ready(s) && s.inputValue.length > 3, 40_000);
    await goPricing(page);
    expect(await identity(page), 'the three global patches were taken down').toEqual({ fetch: true, scrollIntoView: true, focus: true });
    const stored = await STORED(page);
    expect(stored, 'no key of the demo stands in the storage after leaving').toEqual({ consent: null, session: null, sessions: [] });
    await run(page, 1000);
    const live = await page.evaluate(() => (window as unknown as { __live(): { intervals: number; raf: number } }).__live());
    await run(page, 3000);
    const later = await page.evaluate(() => (window as unknown as { __live(): { intervals: number; raf: number } }).__live());
    // the base: a direct visit to /pricing in the same file, measured the same way (live intervals, and the frames asked for in the same stretch of clock)
    const direct = await context.newPage();
    await direct.addInitScript(ORIGINALS); // the clock of the context is already installed: this script goes in after it
    await direct.goto('/pricing');
    await direct.waitForTimeout(300);
    const base0 = await direct.evaluate(() => (window as unknown as { __live(): { intervals: number; raf: number } }).__live());
    await run(direct, 3000);
    const base = await direct.evaluate(() => (window as unknown as { __live(): { intervals: number; raf: number } }).__live());
    await direct.close();
    expect(later.intervals, 'live intervals after leaving = a direct visit of /pricing').toBe(base.intervals);
    // a stray frame is the page's own (hydration, a router tick); a frame loop of the demo would ask for ~180 in these 3 s of clock
    expect(Math.abs((later.raf - live.raf) - (base.raf - base0.raf)), `frames asked for after leaving (${later.raf - live.raf}) against a direct visit of /pricing (${base.raf - base0.raf})`).toBeLessThanOrEqual(3);
    await run(page, 120_000, 2000); // afterEach: no violation, no page error, no request to the API origin in these two minutes
    expect(await STORED(page), 'nothing came back into the storage').toEqual({ consent: null, session: null, sessions: [] });
  });

  test('(b) / → /pricing → / twice: one widget, one script tag, widget.js asked for once; the show on the third visit reaches «request received»', async ({ page, stubs }) => {
    test.setTimeout(180_000);
    const { script } = await demo();
    await page.addInitScript(RECORDER);
    await openHome(page);
    await play(page, 'first visit', ready, 40_000);
    for (let i = 0; i < 2; i++) {
      await goPricing(page);
      await goHome(page);
      await play(page, `visit ${i + 2}: the widget`, ready, 40_000);
    }
    expect(await page.locator('typelessity-widget').count(), 'one widget').toBe(1);
    expect(await page.locator('script[src*="widget.js"]').count(), 'one script tag').toBe(1);
    expect(stubs.widgetScriptRequests, 'widget.js asked for once').toBe(1);
    const t = await play(page, 'third visit: request received', reachedSuccess, 100_000);
    expect(t.last.successTitle).toBe(successTitle('en'));
    expect((await demo()).labels.DEMO_API_ORIGIN).toBe('https://demo.invalid');
    void script;
  });

  test('(c) after two returns one message and one confirm each schedule the lights of the ribbon once: the page does not hold a chain of hooks from the visits before', async ({ page }) => {
    test.setTimeout(180_000);
    expect(DEMO_CHUNK, 'the build has one file that holds the scripted scenarios').toBeTruthy();
    // The lights are `setTimeout`s of the controller (1400 and 3600 ms after the first message, 600 ms after the confirm). A hook left over from
    // an earlier visit would schedule its own on the same event: its DOM is gone, so nothing shows, but the timers are there to be counted.
    await openHome(page, {
      afterClock: (p) => p.addInitScript((chunk) => {
        const w = window as unknown as { __lights: Record<string, number> };
        w.__lights = {};
        const st = window.setTimeout.bind(window);
        window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
          if ((ms === 1400 || ms === 3600 || ms === 600) && (new Error().stack ?? '').includes(chunk)) w.__lights[String(ms)] = (w.__lights[String(ms)] ?? 0) + 1;
          return st(fn, ms, ...args);
        }) as typeof window.setTimeout;
      }, DEMO_CHUNK!),
    });
    await play(page, 'first visit', ready, 40_000);
    for (let i = 0; i < 2; i++) { await goPricing(page); await goHome(page); await play(page, `visit ${i + 2}`, ready, 40_000); }
    await page.evaluate(() => { (window as unknown as { __lights: Record<string, number> }).__lights = {}; });
    await play(page, 'request received', reachedSuccess, 100_000);
    expect(await page.evaluate(() => (window as unknown as { __lights: Record<string, number> }).__lights), 'timers for the lights of the ribbon: one per event').toEqual({ '1400': 1, '3600': 1, '600': 1 });
  });

  test('(d) pagehide: no record of the demo stays, the visitor\'s own included', async ({ page }) => {
    await openHome(page);
    await play(page, 'ready', ready, 30_000);
    await takeOverButton(page).click();
    await acceptConsent(page);
    expect((await STORED(page)).consent, 'the visitor\'s record is there before pagehide').not.toBeNull();
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(await STORED(page)).toEqual({ consent: null, session: null, sessions: [] });
  });
});

// ═════════════════════════════════════════════════ B6 ═════════════════════════════════════════════════════════════════════════════════
test.describe('B6 reduced motion', () => {
  test.use(REDUCED_MOTION);

  test('(a) reduced-motion-is-on: the widget stands with its greeting, nothing starts by itself — no user message, no tip, no ring in 30 s; the tips button reads «Show tips» and its click brings tip 1', async ({ page }) => {
    const { script } = await demo();
    await openHome(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'the media query is on: the context option reached the page').toBe(true);
    const t = await play(page, 'ready', (s) => ready(s) && !!s.greeting, 40_000);
    expect(t.last.greeting).toBe(script.scenario('salon', 'en').welcome);
    expect(t.last.chain, 'the ribbon shows its static example').toBe('api');
    await run(page, 30_000, 1000);
    const s = await snap(page);
    expect(s.userMsgs, 'the show did not type').toBe(0);
    expect(s.tipOn, 'a tip came by itself').toBe(false);
    expect(s.ring, 'the ring came by itself').toBe(false);
    expect(s.tipsToggle).toBe(script.DEMO_TEXT.tipsShow);
    expect(s.tipsPressed, 'the tips are off').toBe('true');
    await tipsToggle(page).click();
    const shown = await play(page, 'tip 1', (x) => x.tipOn, 10_000);
    expect(shown.last.tipN).toBe(1);
    expect(shown.last.tipTitle).toBe(script.TIPS[0]!.title);
    expect((await snap(page)).tipsToggle).toBe(script.DEMO_TEXT.tipsHide);
  });
});

test.describe('B6 out of the window', () => {
  test('(b) scrolled out of the window the show stops; back in the window it goes on', async ({ page }) => {
    await openHome(page);
    await play(page, 'typing', (s) => ready(s) && s.inputValue.length > 5, 40_000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await stageSettled(page, false); // the observer of the page has answered
    await run(page, 1000);
    const away = await snap(page);
    await run(page, 20_000, 1000);
    const later = await snap(page);
    expect(later.userMsgs, 'the show went on typing and sending while nobody saw it').toBe(away.userMsgs);
    expect(later.inputValue, 'the sentence kept growing out of the window').toBe(away.inputValue);
    await page.evaluate(() => window.scrollTo(0, 0));
    await stageSettled(page, true);
    const back = await play(page, 'the show goes on', (s) => s.userMsgs >= 1 || s.inputValue.length > 5, 40_000);
    expect(back.last.widget).toBe(1);
  });
});

// ── B6(c) the views: tips 1, 3, 4, 5; the ribbon at «sent»; the consent screen — at two widths in two themes ──────────────────────────
const WIDTHS = [390, 1440] as const;
/** The show plays only while the stage is on screen (an observer, 20 %): on a phone the stage is below the first screen, so the test brings it up. */
async function inView(page: Page): Promise<void> {
  await page.evaluate(() => document.querySelector('[data-ty-demo]')!.scrollIntoView({ block: 'start' }));
  await stageSettled(page, true);
}
const MEASURE = async (page: Page, scope: string) => {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
  return page.evaluate(`(${CONTRAST_ENGINE})(${JSON.stringify({ scope })})`) as Promise<{ seen: number; bad: string[]; min: number | null }>;
};
const SURFACE = String.raw`() => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const c = parse(getComputedStyle(document.body).backgroundColor) || parse(getComputedStyle(document.documentElement).backgroundColor);
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}`;
const surface = (page: Page) => page.evaluate(`(${SURFACE})()`) as Promise<number>;
async function expectScheme(page: Page, scheme: 'light' | 'dark'): Promise<void> {
  const value = await surface(page);
  if (scheme === 'light') expect(value, 'the page background is light').toBeGreaterThan(0.8);
  else expect(value, 'the page background is dark').toBeLessThan(0.1);
}
/** Nothing of the hero is wider than the window, the tip card, the ring and the link included. */
async function expectInsideWindow(page: Page, what: string): Promise<void> {
  const r = await page.evaluate(() => {
    const w = window.innerWidth;
    const bad: string[] = [];
    for (const sel of ['[data-tip].is-on', '[data-ring].is-on', '[data-tip-link].is-on', '[data-widget-host]', '.demo__frame', '[data-ty-chain]', '.demo__langnote', '[data-after].is-on']) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      if (b.right > w + 0.5 || b.left < -0.5) bad.push(`${sel} ${Math.round(b.left)}..${Math.round(b.right)} of ${w}`);
    }
    return { bad, scroll: document.documentElement.scrollWidth, w };
  });
  expect(r.bad, `${what}: wider than the window`).toEqual([]);
  expect(r.scroll, `${what}: the page scrolls sideways`).toBeLessThanOrEqual(r.w);
}
async function expectSlotHeight(page: Page, width: number): Promise<void> {
  const { labels } = await demo();
  const expected = width <= labels.SLOT_MOBILE_MAX_WIDTH_PX ? labels.SLOT_HEIGHT_MOBILE_PX : labels.SLOT_HEIGHT_PX;
  // the frame grows with a CSS transition (min-height .4s): measured when it has finished
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
  // While the panel «Behind the chat» replaces the widget (after Send) the frame is as tall as that panel needs: the slot is not clipped
  const after = await page.evaluate(() => { const a = document.querySelector('[data-after].is-on'); const f = document.querySelector('.demo__frame'); return a && f ? { need: a.scrollHeight, frame: f.getBoundingClientRect().height } : null; });
  if (after) {
    expect(after.frame, `the frame (${after.frame}px) holds the panel «Behind the chat» (${after.need}px) and is not shorter than the slot`).toBeGreaterThanOrEqual(Math.max(after.need, expected) - 1);
    return;
  }
  const h = await page.evaluate(() => ({
    host: document.querySelector('[data-widget-host]')!.getBoundingClientRect().height,
    panel: document.querySelector('typelessity-widget')?.shadowRoot?.querySelector('.widget-container.inline')?.getBoundingClientRect().height ?? null,
  }));
  expect(Math.abs(h.host - expected), `the slot is ${h.host}px, the constant is ${expected}px`).toBeLessThan(1);
  if (h.panel !== null) expect(Math.abs(h.panel - expected), `the panel of the widget is ${h.panel}px, the constant is ${expected}px`).toBeLessThan(1);
}

for (const scheme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test.describe(`B6(c) views, ${width}px, ${scheme}`, () => {
      test.use({ colorScheme: scheme });

      test(`the tips 1, 3, 4, 5 and the ribbon at «sent» on the running show: text ≥4.5:1, nothing wider than the window, the slot has its one height, CLS under 0.1, the langnote and the ribbon read`, async ({ page }) => {
        test.setTimeout(150_000);
        const { script } = await demo();
        await openHome(page, { width });
        await play(page, 'ready', ready, 40_000);
        await expectScheme(page, scheme);
        await inView(page);
        const SCOPE = '[data-tip], [data-ty-chain], .demo__langnote';
        const shots: Record<string, number> = {};
        const view = async (name: string): Promise<void> => {
          await expectInsideWindow(page, `${name} @${width} ${scheme}`);
          await expectSlotHeight(page, width);
          const c = await MEASURE(page, SCOPE);
          expect(c.seen, `${name}: the measure saw text`).toBeGreaterThan(5);
          expect(c.bad, `${name} @${width} ${scheme}: contrast`).toEqual([]);
          shots[name] = c.seen;
        };
        let trace = await play(page, 'tip 1', (s) => s.tipOn && s.tipN === 1, 30_000);
        expect(trace.last.tipTitle).toBe(script.TIPS[0]!.title);
        await view('tip 1');
        // CLS «from DOMContentLoaded to the first message» (test-design B6(c)): the slot, the tabs and the widget stood still while the demo loaded.
        // Later the panel «Behind the chat» may make the frame taller (a finding of the builder, not held here).
        expect(await page.evaluate(() => window.__cls), 'cumulative layout shift until the first message').toBeLessThan(0.1);
        trace = await play(page, 'tip 3', (s) => s.tipOn && s.tipN === 3, 60_000, STEP, trace);
        expect(trace.last.tipBody, 'tip 3 carries the live counts of the review').toContain(script.TIP3.tail);
        await view('tip 3');
        trace = await play(page, 'tip 4', (s) => s.tipOn && s.tipN === 4, 60_000, STEP, trace);
        await view('tip 4');
        trace = await play(page, 'tip 5', (s) => s.tipOn && s.tipN === 5 && s.afterOn, 60_000, STEP, trace);
        await view('tip 5');
        await view('the ribbon at sent');
        expect(trace.last.chain).toBe('sent');
        expect(Object.keys(shots).length).toBe(5);
      });

      test('the consent screen after take-over: the widget\'s own screen, the page around it reads, nothing wider than the window', async ({ page }) => {
        await openHome(page, { width });
        await inView(page);
        await play(page, 'ready', (s) => ready(s) && s.inputValue.length > 3, 40_000);
        await takeOverButton(page).click();
        await play(page, 'the consent screen', (x) => x.consent, 10_000);
        await expectInsideWindow(page, `consent @${width} ${scheme}`);
        await expectSlotHeight(page, width);
        const c = await MEASURE(page, '.demo__langnote, [data-ty-chain], .hero__text');
        expect(c.bad, `consent @${width} ${scheme}: contrast of the page around the widget`).toEqual([]);
      });
    });
  }
}

// ── the 8 frames of the card: after-home-{hero,page}-{390,1440}-{light,dark} ──────────────────────────────────────────────────────────
// Taken still (reduced motion: the widget stands at its greeting, the ribbon at its example), when L4_FRAMES names the folder. The
// statement of each frame is below it; toHaveScreenshot is not used (fonts rasterise differently on macOS and Linux).
for (const scheme of ['light', 'dark'] as const) {
  for (const width of WIDTHS) {
    test.describe(`frames ${width}px ${scheme}`, () => {
      test.use({ ...REDUCED_MOTION, colorScheme: scheme });
      const shoot = async (page: Page, name: string, target?: ReturnType<Page['locator']>) => {
        if (!FRAMES) return;
        mkdirSync(FRAMES, { recursive: true });
        // the sticky header would lie over the top of an element frame; it is hidden for the picture only (the statements are made before)
        await page.addStyleTag({ content: 'header.vc-nav { visibility: hidden !important; }' });
        if (target) await target.screenshot({ path: join(FRAMES, `${name}.png`) });
        else await page.screenshot({ path: join(FRAMES, `${name}.png`), fullPage: true });
      };
      const settle = async (page: Page) => {
        await play(page, 'ready', (s) => ready(s) && !!s.greeting, 40_000);
        await page.evaluate(() => document.fonts.ready);
        await run(page, 600);
      };

      test(`[after-home-hero-${width}-${scheme}] the hero: H1 and the caption under the languages are visible, the slot has its one height, the page is ${scheme}`, async ({ page }) => {
        await openHome(page, { width });
        await settle(page);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('h1')).toHaveText('Customers just say it. You get the booking request.');
        await expect(page.locator('.demo__langnote')).toBeVisible();
        await expect(page.locator('.hero__grid [data-widget-host]'), 'the slot is inside the hero grid').toHaveCount(1);
        await expectScheme(page, scheme);
        await expectSlotHeight(page, width);
        await expectInsideWindow(page, 'hero');
        await shoot(page, `after-home-hero-${width}-${scheme}`, page.locator('.hero__grid'));
      });

      // L11 (founder 20.10): one block instead of the six industry cards — «any business that takes bookings», the examples as plain chips.
      test(`[after-home-business-${width}-${scheme}] the block «Any business»: the heading, seven chips of plain text, no link among them, all inside the window, the page is ${scheme}`, async ({ page }) => {
        await openHome(page, { width });
        await settle(page);
        const block = page.locator('#any-business');
        await expect(block).toBeVisible();
        await expect(block.locator('h2')).toHaveText('One engine, set up for your business');
        await expect(block.locator('.lead')).toHaveText('Typelessity adapts to any business that takes bookings. You choose the details the chat collects, and the same engine does the rest.');
        const chips = block.locator('ul.bizlist li');
        await expect(chips).toHaveText(['Hair and beauty salons', 'Auto repair shops', 'Gyms and yoga studios', 'Driving schools', 'Tutors', 'Restaurants', 'and any other business that takes bookings']);
        await expect(block.locator('ul.bizlist a'), 'a chip is a link').toHaveCount(0);
        const outside = await chips.evaluateAll((els) => els.filter((el) => { const b = el.getBoundingClientRect(); return b.right > window.innerWidth + 0.5 || b.left < -0.5; }).map((el) => el.textContent));
        expect(outside, 'chips wider than the window').toEqual([]);
        await expect(block.locator('a'), 'the block leads only to /install').toHaveAttribute('href', '/install');
        await expectScheme(page, scheme);
        await expectInsideWindow(page, 'any business');
        await shoot(page, `after-home-business-${width}-${scheme}`, block);
      });

      test(`[after-home-page-${width}-${scheme}] the page: the code of the call to action is not wider than itself, the page has no industry link, the page is ${scheme}`, async ({ page }) => {
        await openHome(page, { width });
        await settle(page);
        expect(await page.locator('a[href^="/industries"]').count(), 'a link to an industry address on the home page').toBe(0);
        await expect(page.locator('#industries'), 'the old section is gone').toHaveCount(0);
        const pre = await page.locator('pre.code').evaluate((el) => {
          const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
          return { scroll: el.scrollWidth, client: el.clientWidth, wrap: cs.whiteSpace, overflowX: cs.overflowX, right: b.right, left: b.left, win: window.innerWidth };
        });
        expect(pre.right, 'the box of the code is inside the window').toBeLessThanOrEqual(pre.win + 0.5);
        expect(pre.left).toBeGreaterThanOrEqual(-0.5);
        if (width <= 520) {
          expect(pre.wrap, 'on a phone the lines of the code wrap').toMatch(/pre-wrap|break-spaces|pre-line/);
          expect(pre.scroll, 'on a phone the code is not wider than its box').toBeLessThanOrEqual(pre.client + 1);
        } else if (pre.scroll > pre.client + 1) {
          expect(pre.overflowX, 'code wider than its box scrolls inside it').toMatch(/auto|scroll/);
        }
        await expectScheme(page, scheme);
        await expectInsideWindow(page, 'page');
        await shoot(page, `after-home-page-${width}-${scheme}`);
      });
    });
  }
}

// ═════════════════════════════════════════════════ B8 ═════════════════════════════════════════════════════════════════════════════════
const WIDGET_JS = (url: URL) => url.origin === WIDGET_ORIGIN && url.pathname === '/widget.js';
/** The status of the slot: its sentence and its link, as two blocks. */
async function expectSlotText(page: Page, sentence: string): Promise<void> {
  const { labels } = await demo();
  const status = page.locator('[data-slot-status]');
  await expect(status.locator('p')).toHaveText(sentence);
  await expect(status.locator('a')).toHaveText(labels.SLOT_TEXT.linkText);
  await expect(status.locator('a')).toHaveAttribute('href', labels.SLOT_TEXT.linkHref);
}
const FAILED_BUTTONS = async (page: Page, disabled: boolean) => {
  for (const loc of [tab(page, 'salon'), tab(page, 'garage'), tab(page, 'table'), tab(page, 'freight'), langButton(page, 'en'), langButton(page, 'pl'), takeOverButton(page), tipsToggle(page)]) {
    if (disabled) await expect(loc).toBeDisabled();
    else await expect(loc).toBeEnabled();
  }
};

test.describe('B8 the slot without the widget', () => {
  test('(a) widget.js fails (an error): the slot says it could not load, with the link; the buttons are off; no error in the page; coming back to / tries again and, with the script back, the widget loads', async ({ page, stubs }) => {
    const { labels } = await demo();
    let aborting = true;
    await page.route(WIDGET_JS, (route) => (aborting ? route.abort('failed') : route.fallback()));
    await openHome(page);
    const t = await play(page, 'the slot failed', (s) => s.slot === 'failed', 30_000);
    expect(t.last.widget).toBe(0);
    expect(t.spent, 'an error of the tag is a refusal at once, not after the 10 s wait for a definition').toBeLessThan(labels.WIDGET_DEFINE_TIMEOUT_MS);
    const status = page.locator('[data-slot-status]');
    await expectSlotText(page, labels.SLOT_TEXT.failed);
    await expect(status).toHaveAttribute('role', 'status');
    await FAILED_BUTTONS(page, true);
    // away and back: still the text of the refusal, never «Loading…»
    await page.locator('header nav[aria-label="Primary"]').getByRole('link', { name: /pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await run(page, 500);
    await page.locator('header a[href="/"]').first().click();
    const again = await play(page, 'failed again', (s) => s.slot === 'failed', 30_000);
    expect(again.last.slot).toBe('failed');
    await expectSlotText(page, labels.SLOT_TEXT.failed);
    // the script is back: the next visit loads it
    aborting = false;
    await page.locator('header nav[aria-label="Primary"]').getByRole('link', { name: /pricing/i }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await run(page, 500);
    await page.locator('header a[href="/"]').first().click();
    await play(page, 'the widget loads', ready, 40_000);
    await FAILED_BUTTONS(page, false);
    expect(stubs.widgetScriptRequests).toBe(1);
  });

  test('(a) widget.js never answers: after 10 s the slot says it could not load; when the script comes later the demo stands over the text and the buttons work again', async ({ page }) => {
    const { labels } = await demo();
    let held: { fallback(): Promise<void> } | null = null;
    await page.route(WIDGET_JS, (route) => { held = route; });
    await openHome(page);
    const t = await play(page, 'loading', (s) => s.slot === 'loading', 30_000);
    expect(t.last.slot).toBe('loading');
    await expect(page.locator('[data-slot-status] p')).toHaveText(labels.SLOT_TEXT.loading);
    const failed = await play(page, 'failed after the timeout', (s) => s.slot === 'failed', 15_000);
    expect(failed.spent, 'the text of the refusal is there by 10 s after the script was asked for').toBeLessThanOrEqual(labels.WIDGET_DEFINE_TIMEOUT_MS + 2_500);
    await expectSlotText(page, labels.SLOT_TEXT.failed);
    await FAILED_BUTTONS(page, true);
    await run(page, 12_000, 1000);
    expect(held, 'the request for widget.js is still waiting').not.toBeNull();
    await held!.fallback();
    await play(page, 'the demo stands over the text', ready, 40_000);
    await FAILED_BUTTONS(page, false);
  });

  test('(b) without JavaScript the slot says what it is and offers the page that tells the story; no widget, no script of the demo', async ({ browser }) => {
    test.info().annotations.push({ type: 'no-js' });
    const { labels } = await demo();
    // a context of its own: the fixture's context has JavaScript on; this one has none, so nothing can be fetched but the document
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL: 'http://localhost:4000' });
    const external: string[] = [];
    await context.route((url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1', (route) => { external.push(route.request().url()); return route.abort('blockedbyclient'); });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expectSlotText(page, labels.SLOT_TEXT.prerender);
      await expect(page.locator('[data-widget-host]')).toHaveAttribute('data-slot-state', 'prerender');
      expect(await page.locator('typelessity-widget').count()).toBe(0);
      expect(await page.locator('script[src*="widget.js"]').count()).toBe(0);
      expect(await page.locator('[data-widget-host]').evaluate((el) => (el.textContent ?? '').includes('Loading'))).toBe(false);
    } finally {
      await context.close();
    }
    expect(external, 'a visitor without JavaScript fetched nothing from outside').toEqual([]);
  });

  test('(c) a click on «Try the chat now» after hydration and before the chunk is there is not lost: the result is a take-over, not the show of the first business', async ({ page }) => {
    expect(DEMO_CHUNK, 'the build has one file that holds the scripted scenarios').toBeTruthy();
    const { script } = await demo();
    let gate: (() => void) | null = null;
    const opened = new Promise<void>((resolve) => { gate = resolve; });
    let asked = false;
    await page.route(new RegExp(`/${DEMO_CHUNK}$`), async (route) => { asked = true; await opened; await route.fallback(); });
    await openHome(page);
    await play(page, 'hydrated, waiting for the chunk', (s) => s.slot === 'loading', 30_000);
    await takeOverButton(page).click();
    await expect.poll(() => asked, { message: 'the early click asked for the chunk at once, without waiting for idle' }).toBe(true);
    gate!();
    const t = await play(page, 'consent screen', (s) => s.consent, 30_000);
    expect(t.last.userMsgs).toBe(0);
    await run(page, 3000);
    const s = await snap(page);
    expect(s.note, 'stopped, not playing').toBe(script.DEMO_TEXT.noteStopped);
    expect(s.inputValue, 'nothing is typed over the consent screen').toBe('');
  });

  test('(c) a click on a business before the chunk is there: that business plays, not the first one', async ({ page }) => {
    const { script } = await demo();
    let gate: (() => void) | null = null;
    const opened = new Promise<void>((resolve) => { gate = resolve; });
    await page.route(new RegExp(`/${DEMO_CHUNK}$`), async (route) => { await opened; await route.fallback(); });
    await openHome(page);
    await play(page, 'hydrated, waiting for the chunk', (s) => s.slot === 'loading', 30_000);
    await tab(page, 'garage').click();
    await run(page, 400);
    gate!();
    const t = await play(page, 'the garage greeting', (s) => !!s.greeting, 40_000);
    expect(t.last.greeting).toBe(script.scenario('garage', 'en').welcome);
    expect(t.last.configId).toBe(`${script.CONFIG_ID_PREFIX}garage`);
  });
});
