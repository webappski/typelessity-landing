import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, REDUCED_MOTION, type Locator, type Page } from './fixtures';
import { BUTTON, BUTTON_HREF, COPY, NAME_HREF, copyB, flat, type Assistant, type StripCopy } from '../free-pilot-copy';

// L17 D4: the Webappski strip of the home page — the look and the states of typelessform.com, placed after the demo and before «Behind the chat» (founder 22.10).
// The server and the prerender draw state a; in the browser the source is picked once after hydration (a, or b with the name of one of four assistants).
// NO height reserve (founder 22.10, replaces the brief's `--rows`): the card is as tall as its content in every state and at every width, the button stands
// right under the text, and the strip is below the first screen, so a change of the text after hydration is out of sight and counts as no layout shift.
// The cases of the definition of the source (every referrer, every utm_source, the prototype keys) are in src/app/core/pilot-offer/pilot-offer-source.spec.ts;
// here the real browser carries a real Referer through the real hydration.
// Frames (R64): the colour tests shoot the strip when L17_FRAMES names a folder; the frames of the page are shot by the script of the round.

const FRAMES = process.env['L17_FRAMES'];
async function shot(page: Page, name: string, locator?: Locator): Promise<void> {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  await (locator ?? page).screenshot({ path: join(FRAMES, `${name}.png`) });
}
test.use(REDUCED_MOTION);

type State = 'a' | 'b';
const STATES: { label: string; state: State; copy: StripCopy; referer?: string }[] = [
  { label: 'a', state: 'a', copy: COPY },
  { label: 'b·ChatGPT', state: 'b', copy: copyB('ChatGPT'), referer: 'https://chatgpt.com/' },
  { label: 'b·Claude', state: 'b', copy: copyB('Claude'), referer: 'https://claude.ai/' },
  { label: 'b·Gemini', state: 'b', copy: copyB('Gemini'), referer: 'https://gemini.google.com/' },
  { label: 'b·Perplexity', state: 'b', copy: copyB('Perplexity'), referer: 'https://www.perplexity.ai/' },
];
const offerOf = (page: Page) => page.getByTestId('free-pilot-offer');

/** The page took the strip over: the demo slot leaves the prerendered state in the same first browser render, and two frames later the substitution is painted. */
async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('[data-widget-host]')).not.toHaveAttribute('data-slot-state', 'prerender');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/** Opens `/` as a visitor arriving from `referer` (a real Referer header: the test checks it reached document.referrer, so a «stays a» case cannot pass because the referrer was dropped). */
async function open(page: Page, path = '/', opts: { referer?: string; fakeReferrer?: string; width?: number; height?: number } = {}): Promise<void> {
  await page.setViewportSize({ width: opts.width ?? 1280, height: opts.height ?? 900 });
  if (opts.fakeReferrer !== undefined) {
    await page.addInitScript((value) => { Object.defineProperty(Document.prototype, 'referrer', { configurable: true, get: () => value }); }, opts.fakeReferrer);
  }
  await page.goto(path, opts.referer ? { referer: opts.referer } : undefined);
  // the demo slot is the sign of hydration on the home page only; a click on any other page is held by event replay until the page has been taken over
  if (new URL(path, 'http://x').pathname === '/') await hydrated(page);
  else await page.waitForLoadState('load');
  expect(await page.evaluate(() => document.referrer), 'the referrer under test reached the page').toBe(opts.fakeReferrer ?? opts.referer ?? '');
}

async function visibleLines(offer: Locator): Promise<{ line1: string; line2: string }> {
  return { line1: flat(await offer.locator('.pilot-offer__title').innerText()), line2: flat(await offer.locator('.pilot-offer__line2').innerText()) };
}

/** The strip says the words of the state at this width, both addresses carry its utm_content, and the half of each pair hidden at this width carries the words too. */
async function expectState(page: Page, copy: StripCopy, state: State, width: number): Promise<void> {
  const offer = offerOf(page);
  await expect(offer).toHaveCount(1);
  const lines = await visibleLines(offer);
  expect(lines.line1).toBe(width <= 419 ? copy.LINE1_SHORT : copy.LINE1_LONG);
  expect(lines.line2).toBe(width <= 600 ? copy.LINE2_SHORT : copy.LINE2_LONG);
  expect(flat((await offer.locator('.pilot-offer__line2 .long').textContent()) ?? '')).toBe(copy.LINE2_LONG);
  expect(flat((await offer.locator('.pilot-offer__line2 .short').textContent()) ?? '')).toBe(copy.LINE2_SHORT);
  await expect(offer.getByRole('link', { name: BUTTON, exact: true })).toHaveAttribute('href', BUTTON_HREF(state));
  const names = offer.locator('a.pilot-offer__name');
  await expect(names).toHaveCount(1);
  expect(await names.getAttribute('href')).toBe(NAME_HREF(state));
}

/** Uncaught page errors plus Angular's hydration mismatch (NG05xx) and change-after-check (NG0100): the signs that the server and the browser disagreed about the strip. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if ((message.type() === 'error' || message.type() === 'warning') && /NG05\d\d|NG0100|hydrat/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

// ── the prerender and the place ───────────────────────────────────────────────────────────────────────────────────────────────

test('the server HTML ships state a: line 1 with its shared words once, the a-labelled addresses, nothing of state b, nothing of TypelessForm', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const fragment = html.match(/<aside\b[^>]*data-testid="free-pilot-offer"[^>]*>[\s\S]*?<\/aside>/)?.[0];
  expect(fragment, 'the strip is in the server HTML').toBeTruthy();
  const text = flat(fragment!);
  for (const line of [COPY.LINE1_LONG, COPY.LINE2_LONG, COPY.LINE2_SHORT, BUTTON]) expect(text).toContain(line);
  const hrefs = [...fragment!.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, '&'));
  expect(hrefs.sort()).toEqual([BUTTON_HREF('a'), NAME_HREF('a')].sort());
  for (const phrase of ["not because it's the best", 'set up its AI visibility', 'AI named Typelessity']) expect(text.split(phrase).length - 1, phrase).toBe(1);
  for (const banned of ['Came from', 'Found us on Google', 'Gemini, Google', 'TypelessForm', 'Webappski · Free AEO pilot', 'By application', 'No contract', '30 days of work', '→', "we're the best"]) {
    expect(fragment, banned).not.toContain(banned);
  }
  expect(html.match(/data-nosnippet/g)?.length, 'data-nosnippet is printed once on the page').toBe(1);
});

test('the strip stands in the hero, after the demo and before «Behind the chat»; no heading, no form; one h1; it is named by its first line', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, '/', { width: 1280 });
  const offer = offerOf(page);
  await expect(offer).toHaveAccessibleName(COPY.LINE1_LONG);
  await expect(offer).toHaveText(`${COPY.LINE1_LONG} ${COPY.LINE2_LONG} ${BUTTON}`, { useInnerText: true });
  await expect(offer.locator('h1, h2, h3, form, .pilot-offer__badge, .pilot-offer__note, .pilot-offer__labels')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(1);
  const place = await offer.evaluate((node) => {
    const hero = document.querySelector('.hero')!, grid = document.querySelector('.hero__grid')!, chain = document.querySelector('[data-ty-chain]')!;
    const after = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { inHero: hero.contains(node), afterGrid: after(grid, node), beforeChain: after(node, chain), notInDemo: !document.querySelector('[data-ty-demo]')!.contains(node), top: node.getBoundingClientRect().top + scrollY, firstScreen: innerHeight };
  });
  expect(place).toMatchObject({ inHero: true, afterGrid: true, beforeChain: true, notInDemo: true });
  expect(place.top, 'below the first screen').toBeGreaterThan(place.firstScreen);
  expect(errors).toEqual([]);
});

test('the strip is on the home page only', async ({ page }) => {
  for (const route of ['/pricing', '/how-it-works', '/faq', '/for-ai-agents', '/install', '/gdpr', '/blog']) {
    await page.goto(route);
    await expect(offerOf(page), route).toHaveCount(0);
  }
});

test('without JavaScript the strip is whole and its button is a real address', async ({ request, browser }) => {
  const response = await request.get('/');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: response.url() });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(offerOf(page)).toBeVisible();
    await expect(page.getByTestId('pilot-hook-button')).toHaveAttribute('href', BUTTON_HREF('a'));
    await expect(page.locator('a.pilot-offer__name')).toHaveAttribute('href', NAME_HREF('a'));
  } finally { await context.close(); }
});

// ── the states: a real Referer through the real hydration ─────────────────────────────────────────────────────────────────────────

for (const { label, state, copy, referer } of STATES) {
  for (const width of [1280, 390]) {
    test(`${label} at ${width} px: the words, both addresses, no hydration error; the long and the short forms switch at 419/420 and 600/601`, async ({ page }) => {
      const errors = collectErrors(page);
      await open(page, '/', { referer, width });
      await expectState(page, copy, state, width);
      // the form hidden at this width is the right one too: a resize never shows a wrong state
      for (const w of [420, 419, 601, 600]) {
        await page.setViewportSize({ width: w, height: 900 });
        await expectState(page, copy, state, w);
      }
      expect(errors).toEqual([]);
    });
  }
}

test('a Google search visitor sees a, not a Google-flavoured text (founder 22.10), in the real browser', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, '/', { referer: 'https://www.google.com/', width: 1280 });
  await expectState(page, COPY, 'a', 1280);
  await expect(offerOf(page)).not.toContainText('Google');
  expect(errors).toEqual([]);
});

test('utm_source=chatgpt.com with no referrer → b·ChatGPT; it beats a Google referrer; perplexity → b·Perplexity; a foreign or prototype name overrides nothing', async ({ page }) => {
  await open(page, '/?utm_source=chatgpt.com', { width: 1280 });
  await expectState(page, copyB('ChatGPT'), 'b', 1280);
  await open(page, '/?utm_source=chatgpt.com', { referer: 'https://www.google.com/', width: 1280 });
  await expectState(page, copyB('ChatGPT'), 'b', 1280);
  await open(page, '/?utm_source=perplexity', { width: 1280 });
  await expectState(page, copyB('Perplexity'), 'b', 1280);
  await open(page, '/?utm_source=newsletter', { referer: 'https://www.google.com/', width: 1280 });
  await expectState(page, COPY, 'a', 1280);
  for (const utm of ['constructor', '__proto__', '%20constructor%20']) {
    await open(page, `/?utm_source=${utm}`, { width: 1280 });
    await expectState(page, COPY, 'a', 1280);
    const hrefs = await offerOf(page).locator('a').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href') ?? ''));
    for (const href of hrefs) expect(href).not.toMatch(/utm_content=b(-name)?(&|$)/);
  }
});

test('an application referrer (android-app://) is a, not a state of its host', async ({ page }) => {
  await open(page, '/', { fakeReferrer: 'android-app://com.google.android.googlequicksearchbox/', width: 1280 });
  await expectState(page, COPY, 'a', 1280);
});

test('the entry utm_source survives a move inside the site: in on /blog?utm_source=chatgpt.com, out through the logo to the home page → b·ChatGPT', async ({ page }) => {
  await open(page, '/blog?utm_source=chatgpt.com', { width: 1280 });
  await expect(offerOf(page)).toHaveCount(0);
  await page.locator('header .vc-logo').click();
  await expect(page).toHaveURL((url) => url.pathname === '/');
  await hydrated(page);
  await expectState(page, copyB('ChatGPT'), 'b', 1280);
});

test('the entry is read by the application at its start, not by the strip: a visitor who goes /pricing → /blog → / keeps the label of /pricing?utm_source=perplexity', async ({ page }) => {
  await open(page, '/pricing?utm_source=perplexity', { width: 1280 });
  await page.locator('.vc-nav-links a[href="/blog"]').click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await page.locator('header .vc-logo').click();
  await expect(page).toHaveURL((url) => url.pathname === '/');
  await expectState(page, copyB('Perplexity'), 'b', 1280);
});

test('nothing about the source is stored or sent: not in storage, not in cookies, not in any request except the two addresses on click', async ({ page, context }) => {
  const outgoing: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) return; // the harness sends that Referer itself
    outgoing.push(`${request.url()} ${request.postData() ?? ''} ${request.headers()['referer'] ?? ''}`);
  });
  await open(page, '/', { referer: 'https://chatgpt.com/c/abc', width: 1280 });
  await expectState(page, copyB('ChatGPT'), 'b', 1280);
  const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
  for (const banned of ['chatgpt', 'referr', 'utm_content']) expect(stored.toLowerCase()).not.toContain(banned);
  const cookies = JSON.stringify(await context.cookies());
  expect(cookies.toLowerCase()).not.toContain('chatgpt');
  for (const line of outgoing) {
    expect(line.toLowerCase()).not.toContain('chatgpt');
    expect(line.toLowerCase()).not.toContain('utm_content');
  }
});

test('the strip carries no aria-live: the substitution is not announced', async ({ page }) => {
  await open(page, '/', { referer: 'https://claude.ai/', width: 1280 });
  await expect(page.locator('.pilot-offer-wrap[aria-live], .pilot-offer-wrap [aria-live]')).toHaveCount(0);
});

test('data-nosnippet: the wrapper has it once, the aside has none, and it is the same after hydration and after the switch to b', async ({ page }) => {
  await open(page, '/', { referer: 'https://chatgpt.com/', width: 1280 });
  await expect(page.locator('div.pilot-offer-wrap[data-nosnippet]')).toHaveCount(1);
  await expect(page.locator('[data-nosnippet]')).toHaveCount(1);
  await expect(offerOf(page)).not.toHaveAttribute('data-nosnippet', /.*/);
});

// ── the shape: the card is as tall as its content — no reserved line between the text and the button ───────────────────────────────────────────

const WIDTHS = [320, 360, 390, 419, 420, 430, 600, 601, 768, 850, 851, 1099, 1100, 1280, 1440];
test('at every width and in every state: inside the window, nothing wider than it, the button right under the text (the gap is the row-gap, 16 px), the card as tall as its content', async ({ page }) => {
  test.setTimeout(180_000);
  for (const { label, copy, state, referer } of STATES) {
    await open(page, '/', { referer, width: 1280 });
    await expectState(page, copy, state, 1280);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const m = await offerOf(page).evaluate((node) => {
        const card = node as HTMLElement;
        const r = card.getBoundingClientRect(), s = getComputedStyle(card);
        const title = card.querySelector('.pilot-offer__title')!.getBoundingClientRect();
        const line2 = card.querySelector('.pilot-offer__line2')!.getBoundingClientRect();
        const button = card.querySelector('.pilot-offer__button') as HTMLElement;
        const b = button.getBoundingClientRect();
        const baseline = (host: Element) => { const probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; host.appendChild(probe); const y = probe.getBoundingClientRect().bottom; probe.remove(); return y; };
        const visibleHalf = [...card.querySelector('.pilot-offer__line2')!.children].find((c) => getComputedStyle(c).display !== 'none')!;
        const lastHl = [...visibleHalf.querySelectorAll('.hl')].pop() ?? visibleHalf;
        return {
          left: r.left, right: r.right, height: r.height, top: r.top,
          padTop: parseFloat(s.paddingTop), padBottom: parseFloat(s.paddingBottom), borderLeft: parseFloat(s.borderLeftWidth), radius: parseFloat(s.borderRadius), border: parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth),
          textBottom: Math.max(title.bottom, line2.bottom), titleBottom: title.bottom, line2Top: line2.top, buttonTop: b.top, buttonBottom: b.bottom, buttonHeight: b.height, buttonLeft: b.left, buttonRight: b.right,
          buttonBaseline: baseline(button.firstElementChild!), line2Baseline: baseline(lastHl),
          scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth, overflow: card.scrollWidth > card.clientWidth + 1,
          cardInnerRight: r.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight),
        };
      });
      const where = `${label} at ${width}`;
      expect(m.left, where).toBeGreaterThanOrEqual(0);
      expect(m.right, where).toBeLessThanOrEqual(width);
      expect(m.scrollWidth, `${where}: page wider than the window`).toBeLessThanOrEqual(m.viewport + 1);
      expect(m.overflow, where).toBe(false);
      expect(m.borderLeft, where).toBe(4);
      expect(m.radius, where).toBe(12);
      expect(m.buttonHeight, where).toBeGreaterThanOrEqual(44);
      expect(m.padTop, where).toBe(width <= 850 ? 16 : 24);
      expect(m.padBottom, where).toBe(m.padTop);
      if (width < 1100) {
        // the button stands right under the text: the whole space between them is the row-gap, not a reserved line
        expect(m.buttonTop - m.textBottom, `${where}: the gap between the text and the button`).toBeGreaterThanOrEqual(15.5);
        expect(m.buttonTop - m.textBottom, `${where}: the gap between the text and the button`).toBeLessThanOrEqual(16.5);
        // the card is as tall as its content: padding + text + gap + button
        expect(Math.abs(m.height - (m.buttonBottom - m.top + m.padBottom + 1)), `${where}: height ${m.height} vs content`).toBeLessThanOrEqual(1);
        expect(Math.abs(m.buttonLeft - (m.left + m.borderLeft + m.padTop)), `${where}: the button starts at the text edge`).toBeLessThanOrEqual(2);
      } else {
        expect(Math.abs(m.buttonBaseline - m.line2Baseline), `${where}: the button stands on the last line of line 2`).toBeLessThanOrEqual(1);
        expect(m.buttonTop, `${where}: the button is below line 1`).toBeGreaterThanOrEqual(m.titleBottom - 1);
        expect(Math.abs(m.buttonRight - m.cardInnerRight), `${where}: the button is at the right edge`).toBeLessThanOrEqual(1);
      }
    }
  }
});

// ── the change of the text after hydration moves nothing in view (the replacement of the reserve) ───────────────────────────────────────────────

async function withCls(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number; __shifts: { value: number; nodes: string[] }[] };
    w.__cls = 0; w.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources?: { node: Node | null }[] }[]) {
        if (e.hadRecentInput) continue;
        w.__cls += e.value;
        w.__shifts.push({ value: e.value, nodes: (e.sources ?? []).map((s) => (s.node instanceof Element ? s.node.closest('.pilot-offer-wrap') ? 'STRIP' : s.node.tagName.toLowerCase() : '#text')) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}
for (const [width, height] of [[390, 844], [768, 1024], [1280, 800], [1440, 844], [1440, 900]] as const) {
  test(`${width}×${height}: a visitor from an assistant (b) gets the page with the same layout shift as a visitor with no referrer, none of it in the strip, and the strip is out of the window when its text changes`, async ({ page }) => {
    await withCls(page);
    const measured: Record<string, { cls: number; strip: number }> = {};
    for (const { label, referer } of [STATES[0]!, STATES[1]!, STATES[4]!]) {
      await open(page, '/', { referer, width, height });
      const top = await offerOf(page).evaluate((n) => n.getBoundingClientRect().top);
      expect(top, `${label}: the strip is below the window when its text changes (the window is ${height} high)`).toBeGreaterThan(height);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      measured[label] = await page.evaluate(() => {
        const w = window as unknown as { __cls: number; __shifts: { value: number; nodes: string[] }[] };
        return { cls: w.__cls, strip: w.__shifts.filter((s) => s.nodes.includes('STRIP')).reduce((a, s) => a + s.value, 0) };
      });
    }
    test.info().annotations.push({ type: 'cls', description: `${width}×${height}: ${JSON.stringify(measured)}` });
    for (const [label, m] of Object.entries(measured)) {
      expect(m.strip, `${label}: the strip is no source of a layout shift`).toBe(0);
      expect(Math.abs(m.cls - measured['a']!.cls), `${label}: CLS ${m.cls} vs a ${measured['a']!.cls}`).toBeLessThanOrEqual(0.0005);
      // The page's own layout shift is 0 at every size, in every state (it was 0.0123 at 1440×844 between 0906004 and the fix of FL-116: the status text of the demo slot,
      // centred, moved when the page took over, as the demo frame had come up into the first screen). Strict on purpose: the shift is exactly 0, no ceiling.
      expect(m.cls, `${label}: CLS of the page at ${width}×${height}`).toBeLessThanOrEqual(0);
    }
  });
}

// ── keyboard, colour, line breaks ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

test('keyboard: Shift+Tab from the button reaches «Webappski», Tab returns; Enter opens the application in a new tab and the site stays', async ({ page, context }) => {
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => { dialogs.push(dialog.message()); void dialog.dismiss(); });
  await open(page, '/', { width: 1280 });
  const offer = offerOf(page);
  const button = offer.getByRole('link', { name: BUTTON, exact: true });
  const name = offer.getByRole('link', { name: 'Webappski', exact: true });
  await button.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(name).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  expect(await button.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
  await context.route('https://webappski.com/en/free-aeo-pilot?**', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Application navigation boundary</title>' }));
  const opened = context.waitForEvent('page');
  await page.keyboard.press('Enter');
  const tab = await opened;
  await tab.waitForURL(BUTTON_HREF('a'));
  expect(tab.url()).toBe(BUTTON_HREF('a'));
  await expect(page).toHaveURL((url) => url.pathname === '/');
  expect(dialogs).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`strip colours ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    for (const { label, referer } of [STATES[0]!, STATES[4]!]) {
      for (const width of [1280, 390]) {
        test(`[d4-${width}-${scheme}-${label}] highlights are --ink at weight 700 (4.5:1 on the strip), the focus rings are --fg (3:1), the button outline is --fg2 (3:1)`, async ({ page }) => {
          await open(page, '/', { referer, width });
          const offer = offerOf(page);
          const m = await offer.evaluate((node) => {
            const probe = (token: string) => { const p = document.createElement('span'); p.style.color = `var(${token})`; node.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
            const visible = [...node.querySelectorAll('.hl, .pilot-offer__name')].filter((el) => (el as HTMLElement).checkVisibility());
            return {
              ink: probe('--ink'), fg: probe('--fg'), fg2: probe('--fg2'), accent: probe('--accent'), background: getComputedStyle(node).backgroundColor,
              styles: visible.map((el) => [getComputedStyle(el).color, getComputedStyle(el).fontWeight]),
              title: getComputedStyle(node.querySelector('.pilot-offer__title')!).color,
              buttonBorder: getComputedStyle(node.querySelector('.pilot-offer__button')!).borderTopColor,
              barColor: getComputedStyle(node).borderLeftColor,
            };
          });
          const rgb = (c: string) => c.match(/[\d.]+/g)!.slice(0, 3).map(Number);
          const lum = (c: number[]) => c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i]!, 0);
          const contrast = (a: string, b: string) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
          expect(m.background).toMatch(/^rgb\(/);
          expect(m.styles.length).toBeGreaterThan(0);
          for (const [color, weight] of m.styles) { expect(color).toBe(m.ink); expect(weight).toBe('700'); }
          expect(m.ink, 'orange text is --ink, never --accent').not.toBe(m.accent);
          expect(contrast(m.ink, m.background), `--ink on the strip, ${scheme}`).toBeGreaterThanOrEqual(4.5);
          expect(contrast(m.title, m.background), 'the text on the strip').toBeGreaterThanOrEqual(4.5);
          expect(contrast(m.fg, m.background), 'the focus ring (--fg) on the strip').toBeGreaterThanOrEqual(3);
          expect(contrast(m.buttonBorder, m.background), 'the button outline').toBeGreaterThanOrEqual(3);
          expect(m.barColor, 'the 4px bar is the accent, a fill').toBe(m.accent);
          // the rings the keyboard sees are --fg, not --accent
          await offer.getByRole('link', { name: BUTTON, exact: true }).focus();
          await page.keyboard.press('Shift+Tab');
          const ring = await offer.getByRole('link', { name: 'Webappski', exact: true }).evaluate((n) => getComputedStyle(n).outlineColor);
          expect(ring).toBe(m.fg);
          await page.keyboard.press('Tab');
          expect(await offer.getByTestId('pilot-hook-button').evaluate((n) => getComputedStyle(n).outlineColor)).toBe(m.fg);
          await shot(page, `d4-${width}-${scheme}-strip-${label}`, offer);
        });
      }
    }
  });
}

test('line 1 never ends on a lone word and never starts a line with the dash, in every state at 320–419 px', async ({ page }) => {
  test.setTimeout(120_000);
  for (const { label, referer } of STATES) {
    for (const width of [320, 360, 390, 419]) {
      await open(page, '/', { referer, width });
      const rows = await offerOf(page).evaluate((node) => {
        const title = node.querySelector('.pilot-offer__title')!;
        const words: { text: string; top: number }[] = [];
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        let glued = false;
        for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
          if (!n.parentElement!.checkVisibility()) continue;
          let i = 0;
          for (const part of n.data.split(' ')) {
            if (part) {
              const range = document.createRange();
              range.setStart(n, i); range.setEnd(n, i + part.length);
              const top = Math.round(range.getClientRects()[0]!.top);
              if (glued && i === 0 && words.length) words[words.length - 1]!.text += part; else words.push({ text: part, top });
            }
            i += part.length + 1;
          }
          glued = !n.data.endsWith(' ');
        }
        const out: string[][] = [];
        let lastTop = -Infinity;
        for (const w of words) { if (Math.abs(w.top - lastTop) > 2) { out.push([]); lastTop = w.top; } out[out.length - 1]!.push(w.text); }
        return out;
      });
      expect(rows.length, `${label} ${width}`).toBeGreaterThan(1);
      expect(rows[rows.length - 1]!.join(' ').split(/[  ]+/).length, `${label} ${width}: the last line is ${rows[rows.length - 1]!.join(' ')}`).toBeGreaterThan(1);
      for (const row of rows) expect(row[0]!.startsWith('—'), `${label} ${width}: ${row.join(' ')}`).toBe(false);
    }
  }
});

// ── the addresses survive the attribution of webappski.com ───────────────────────────────────────────────────────────────────────────────────────

// webappka keeps a query key only if it matches UTM_KEY_PATTERN (webappka src/app/shared/constants/utm-key.ts:8), a value trimmed and cut to 120 characters
// (inbound-attribution.service.ts:75-76). The pattern is written out, not imported: this repository is checked out alone. IT IS A COPY: source
// ~/Projects/webappka/src/app/shared/constants/utm-key.ts:8 (last commit 8b526902, 2026-10-19), compared with the file on 22.10 (test-design F-8). When webappka changes the pattern or the
// 120-character cut this literal goes stale and nothing here turns red; compare the two when the attribution of webappski.com is touched.
const WEBAPPKA_UTM_KEY_PATTERN = /^utm_[a-z0-9_]{1,30}$/i;
test('every address of the strip survives the attribution of webappski.com in a and in b', async ({ page }) => {
  for (const { label, referer } of [STATES[0]!, STATES[1]!]) {
    await open(page, '/', { referer, width: 1280 });
    const hrefs = await offerOf(page).locator('a').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href') ?? ''));
    expect(hrefs, label).toHaveLength(2);
    for (const href of hrefs) {
      const params = new URL(href).searchParams;
      expect([...params.keys()].sort(), href).toEqual(['utm_campaign', 'utm_content', 'utm_medium', 'utm_source']);
      for (const key of params.keys()) expect(key).toMatch(WEBAPPKA_UTM_KEY_PATTERN);
      for (const value of params.values()) expect(value, href).toMatch(/^[\w.-]{1,120}$/);
      expect(new URL(href).hostname).toBe('webappski.com');
    }
  }
});

// ── test-design F-4 and F-7 (22.10) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

test('the strip is as tall in every state (a = b) at 851 px and wider, up to 2560, so the change of the text after hydration never changes its height there', async ({ page }) => {
  test.setTimeout(120_000);
  const heights: Record<string, Record<number, number>> = {};
  for (const { label, copy, state, referer } of STATES) {
    await open(page, '/', { referer, width: 1280 });
    await expectState(page, copy, state, 1280);
    heights[label] = {};
    for (const width of [851, 1100, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      heights[label]![width] = (await offerOf(page).boundingBox())!.height;
    }
  }
  for (const width of [851, 1100, 1440, 1920, 2560]) {
    for (const { label } of STATES) {
      expect(Math.abs(heights[label]![width]! - heights['a']![width]!), `${label} at ${width}: ${heights[label]![width]} against a ${heights['a']![width]}`).toBeLessThanOrEqual(0.5);
    }
  }
});

test('both links of the strip that leave the site carry rel="noopener noreferrer" in a and in b (the privacy notice says the browser sends no referrer)', async ({ page }) => {
  for (const { label, referer } of [STATES[0]!, STATES[1]!, STATES[4]!]) {
    await open(page, '/', { referer, width: 1280 });
    const rels = await offerOf(page).locator('a').evaluateAll((nodes) => nodes.map((n) => ({ href: n.getAttribute('href') ?? '', rel: (n.getAttribute('rel') ?? '').split(/\s+/), target: n.getAttribute('target') })));
    expect(rels, label).toHaveLength(2);
    for (const l of rels) {
      expect(l.rel, `${label}: ${l.href}`).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
      expect(l.target, `${label}: ${l.href}`).toBe('_blank');
    }
  }
});
