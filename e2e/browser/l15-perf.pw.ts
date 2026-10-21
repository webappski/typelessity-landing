import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page, type Response } from './fixtures';

// L15 «скорость лендинга» (2026-10-21, pending-review/2026-10-21/L15/brief.md): what the speed changes must not cost the visitor,
// read in Chromium from the real SSR build. The node guard e2e/font-coverage.spec.ts holds the bytes (every letter of every page is
// in a font file); this spec holds what the browser really draws and requests.

// ── 1. Montserrat latin-ext is a subset: the letters beyond Latin-1 are still drawn in Montserrat, by the subset file ──
// CDP CSS.getPlatformFontsForNode names every platform font the browser used for the text of a node; a letter missing from the
// subset would show up as a second, fallback family on the same node.
async function fontsOfMarked(page: Page): Promise<Array<{ text: string; fonts: string[] }>> {
  const texts = await page.evaluate(() => {
    const ext = /[Ā-ſȘ-ț]/;
    const out: string[] = [];
    let i = 0;
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      if (!/^Montserrat\b/.test(getComputedStyle(el).fontFamily.replace(/["']/g, ''))) continue;
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? '').join('');
      const r = el.getBoundingClientRect();
      if (!ext.test(own) || r.width < 1 || r.height < 1) continue;
      el.setAttribute('data-ty-ext', String(i++));
      out.push(own.trim().slice(0, 60));
    }
    return out;
  });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const out: Array<{ text: string; fonts: string[] }> = [];
    for (let i = 0; i < texts.length; i++) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-ty-ext="${i}"]` });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      out.push({ text: texts[i]!, fonts: fonts.map((f) => f.familyName) });
    }
    return out;
  } finally {
    await cdp.detach();
  }
}

for (const path of ['/', '/pricing']) {
  test(`L15-F1 ${path}: every visible text with a Latin Extended-A letter is drawn in Montserrat alone, and the latin-ext file the page fetched is the subset`, async ({ page }) => {
    const fonts: string[] = [];
    page.on('request', (r) => { if (r.resourceType() === 'font') fonts.push(new URL(r.url()).pathname); });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const nodes = await fontsOfMarked(page);
    expect(nodes.length, `${path} must show at least one Latin Extended-A letter (Gdańsk on /, the Polish price note on /pricing)`).toBeGreaterThan(0);
    const fallback = nodes.filter((n) => n.fonts.some((f) => !/^Montserrat\b/.test(f)));
    expect(fallback, 'a node whose letters were partly drawn by another font').toEqual([]);
    expect(fonts.filter((f) => /montserrat-latin-ext-subset-[0-9a-f]{8}\.woff2$/.test(f)), 'the latin-ext subset is fetched once').toHaveLength(1);
    expect(fonts.filter((f) => f.endsWith('/JTUSjIg1_i6t8kCHKm459WdhyyTh89ZNpQ.woff2')), 'the full latin-ext file of Google is not fetched').toEqual([]);
  });
}

// ── 2. The global styles are inline (src/app/global-styles.ts): both themes reach the first frame whole, without a stylesheet request ──
// Scripts are blocked, so only the HTML decides — what the first frame has. Every colour token of each theme set in
// src/styles/tokens.scss (the light :root and the dark-tokens mixin) is resolved by the browser twice: as `var(--name)` from the
// page and as the source literal; the two must be the same colour. Three states: a stored choice against the system each way, and
// the system dark with nothing stored (the media-query path).
const TOKENS = readFileSync(join(process.cwd(), 'src/styles/tokens.scss'), 'utf8');
function colourTokens(block: string): Array<[string, string]> {
  return [...block.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s*;/gim)].map((m) => [m[1]!, m[2]!]);
}
const DARK = colourTokens(TOKENS.match(/@mixin dark-tokens\s*\{([\s\S]*?)\n\}/)?.[1] ?? '');
const LIGHT = colourTokens(TOKENS.match(/\n:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '');

const CASES = [
  { name: 'stored dark, system light', scheme: 'light' as const, stored: 'dark', tokens: DARK },
  { name: 'stored light, system dark', scheme: 'dark' as const, stored: 'light', tokens: LIGHT },
  { name: 'nothing stored, system dark', scheme: 'dark' as const, stored: null, tokens: DARK },
];
for (const c of CASES) {
  test.describe(`L15-S1 ${c.name}`, () => {
    test.use({ colorScheme: c.scheme });
    for (const path of ['/', '/pricing', '/blog/best-ai-booking-widgets-2026']) {
      test(`L15-S1 ${path}, scripts blocked: every colour token of the theme comes from the inline styles, and no stylesheet is requested`, async ({ page }) => {
        expect(c.tokens.length, 'the token parser found the colour tokens of the theme').toBeGreaterThanOrEqual(15);
        const sheets: string[] = [];
        page.on('request', (r) => { if (r.resourceType() === 'stylesheet') sheets.push(r.url()); });
        await page.route('**/*.js', (route) => route.abort());
        if (c.stored) await page.addInitScript((v) => { try { localStorage.setItem('ty-theme', v); } catch { /* none */ } }, c.stored);
        await page.goto(path, { waitUntil: 'load' });
        const wrong = await page.evaluate((tokens) => {
          const probe = document.createElement('div');
          document.body.appendChild(probe);
          const resolve = (v: string) => { probe.style.backgroundColor = ''; probe.style.backgroundColor = v; return getComputedStyle(probe).backgroundColor; };
          const out: string[] = [];
          for (const [name, value] of tokens) {
            const page = resolve(`var(${name})`), source = resolve(value);
            if (page !== source) out.push(`${name}: page ${page}, tokens.scss ${source}`);
          }
          probe.remove();
          return out;
        }, c.tokens);
        expect(wrong).toEqual([]);
        expect(sheets.filter((u) => new URL(u).origin === new URL(page.url()).origin), 'a stylesheet request of our own origin').toEqual([]);
      });
    }
  });
}

// ── R64 frames of L15 (pending-review/2026-10-21/L15/frames/after-*): one statement per frame ──
// What changed under these frames is how the styles and the fonts arrive, not what they say: each frame is the page with the
// theme of its name on the surface, Montserrat drawing the h1 and the body text, and no stylesheet requested on the way.
const FRAME_PAGES = [
  { name: 'home', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'post', path: '/blog/best-ai-booking-widgets-2026' },
  { name: 'footer', path: '/' },
];
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`L15 frames, ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    for (const width of [390, 1440]) {
      for (const f of FRAME_PAGES) {
        test(`[after-l15-${f.name}-${width}-${scheme}] ${f.path}: ${scheme} surface, Montserrat text, no stylesheet request`, async ({ page }) => {
          const sheets: string[] = [];
          page.on('request', (r) => { if (r.resourceType() === 'stylesheet' && new URL(r.url()).hostname === 'localhost') sheets.push(r.url()); });
          await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
          await page.goto(f.path, { waitUntil: 'load' });
          await page.evaluate(() => document.fonts.ready);
          const state = await page.evaluate((sel) => {
            const lum = (s: string) => { const m = s.match(/rgba?\(([^)]+)\)/); const a = m ? m[1]!.split(/[\s,/]+/).map(parseFloat) : [0, 0, 0]; const l = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * l(a[0]!) + 0.7152 * l(a[1]!) + 0.0722 * l(a[2]!); };
            const el = document.querySelector(sel) as HTMLElement;
            const surface = [el, document.body, document.documentElement].map((e) => getComputedStyle(e).backgroundColor).find((c) => !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) ?? '';
            const loaded = [...document.fonts].filter((x) => x.family.replace(/["']/g, '') === 'Montserrat' && x.status === 'loaded').length;
            return { surface: lum(surface), font: getComputedStyle(el).fontFamily, bodyFont: getComputedStyle(document.body).fontFamily, loaded };
          }, f.name === 'footer' ? 'footer' : 'main h1');
          if (scheme === 'light') expect(state.surface, 'the surface is light').toBeGreaterThan(0.8);
          else expect(state.surface, 'the surface is dark').toBeLessThan(0.1);
          expect(state.font).toMatch(/^"?Montserrat"?,/);
          expect(state.bodyFont).toMatch(/^"?Montserrat"?,/);
          expect(state.loaded, 'a Montserrat face is loaded').toBeGreaterThan(0);
          expect(sheets).toEqual([]);
        });
      }
    }
  });
}

// ── 3. The ring of the tips pulses only while it is shown, and only by opacity (a composited animation) ──
// Before L15 `ringPulse` animated box-shadow on .ring from the first frame, also while the ring had opacity 0 and no size: the page
// repainted on every frame (trace 21.10: 237 Paint events in the 2 s after load against 5 without it, L15/trace-note.md) and
// Lighthouse flagged a non-composited animation on every run. The look stays: the two glows are the two ends of the old pulse.
const RING_ANIMATIONS = String.raw`() => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('[data-ring]')).map((a) => ({
  name: a.animationName || '', pseudo: a.effect.pseudoElement || '', state: a.playState,
  props: [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((p) => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)))] }))`;
const BOX_SHADOW_ANIMATIONS = String.raw`() => document.getAnimations().filter((a) => a.effect && a.effect.getKeyframes().some((k) => 'boxShadow' in k)).map((a) => (a.animationName || '?') + ' on ' + (a.effect.target && a.effect.target.className))`;

test('L15-R1 /: the hidden ring runs no animation, and no animation on the page animates box-shadow', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('[data-ring]')).toHaveCount(1);
  expect(await page.locator('[data-ring]').evaluate((el) => el.classList.contains('is-on')), 'the ring is hidden at load').toBe(false);
  expect(await page.evaluate(`(${RING_ANIMATIONS})()`), 'animations of the hidden ring').toEqual([]);
  expect(await page.evaluate(`(${BOX_SHADOW_ANIMATIONS})()`), 'box-shadow animations (not composited)').toEqual([]);
});

test('L15-R2 /: the shown ring pulses by opacity alone, its two glows are the two ends of the old pulse (4 px at 0.14, 9 px at 0.06)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('[data-ring].is-on'), 'a tip turns the ring on').toHaveCount(1, { timeout: 45_000 });
  const animations = await page.evaluate(`(${RING_ANIMATIONS})()`) as Array<{ name: string; pseudo: string; state: string; props: string[] }>;
  expect(animations.map((a) => a.pseudo).sort(), 'one animation on each glow layer').toEqual(['::after', '::before']);
  for (const a of animations) {
    expect(a.props, `${a.name} ${a.pseudo} animates only opacity`).toEqual(['opacity']);
    expect(a.state).toBe('running');
  }
  expect(await page.evaluate(`(${BOX_SHADOW_ANIMATIONS})()`)).toEqual([]);
  const glows = await page.locator('[data-ring]').evaluate((el) => [getComputedStyle(el, '::before').boxShadow, getComputedStyle(el, '::after').boxShadow, getComputedStyle(el).boxShadow]);
  expect(glows[0]).toBe('rgba(247, 115, 0, 0.14) 0px 0px 0px 4px');
  expect(glows[1]).toBe('rgba(247, 115, 0, 0.06) 0px 0px 0px 9px');
  expect(glows[2], 'the ring itself draws no glow of its own any more').toBe('none');
});

test.describe('L15-R3 reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('L15-R3 /: with reduced motion the shown ring keeps the old still glow (5 px of --ring-glow) and no far layer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    // with reduced motion the tips do not play on their own; the class the controller sets is set here, to read the CSS of that state
    const [near, far] = await page.locator('[data-ring]').evaluate((el) => { el.classList.add('is-on'); return [getComputedStyle(el, '::before').boxShadow, getComputedStyle(el, '::after').display]; });
    expect(near).toBe('rgba(247, 115, 0, 0.16) 0px 0px 0px 5px');
    expect(far).toBe('none');
  });
});

// ── 4. ngx-markdown and marked load with the markdown pages only (src/app/shared/site-markdown.ts) ──
// The texts only these libraries carry (the error of marked, the prefix of ngx-markdown) find their chunk among the scripts a page
// really fetched. `/` fetches none of it; a client navigation from `/` to an article (the router loads the lazy page and its
// providers in the browser, not the server render) and the direct loads of /privacy and /legal/security render their markdown.
const MARKDOWN_JS = [/marked\(\): input parameter is undefined or null/, /\[ngx-markdown\]/];
async function scriptsWithMarkdown(page: Page, run: () => Promise<void>): Promise<string[]> {
  const bodies: Array<Promise<string | null>> = [];
  const handler = (r: Response) => {
    if (r.request().resourceType() === 'script' && new URL(r.url()).hostname === 'localhost') bodies.push(r.text().then((t) => (MARKDOWN_JS.every((m) => m.test(t)) ? new URL(r.url()).pathname : null)).catch(() => null));
  };
  page.on('response', handler);
  await run();
  page.off('response', handler);
  return (await Promise.all(bodies)).filter((x): x is string => !!x);
}

test('L15-M1 /: no script the page fetches is the markdown chunk', async ({ page }) => {
  const found = await scriptsWithMarkdown(page, async () => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
  });
  expect(found).toEqual([]);
});

test('L15-M2 a client navigation from / to an article renders its markdown (the providers come with the lazy page), with no error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /NG0|No provider|MarkdownService/.test(m.text())) errors.push(m.text()); });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  const found = await scriptsWithMarkdown(page, async () => {
    // a router navigation inside the hydrated app, not a document load (the server render would hide a missing provider):
    // a click on the first link of the page to an article
    const link = page.locator('a[href^="/blog/"]:not([href="/blog"])').first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page.locator('.blog-post__body markdown p').first()).toBeVisible({ timeout: 15_000 });
  });
  expect(await page.evaluate(() => performance.getEntriesByType('navigation').length), 'one document load: the article came by the router').toBe(1);
  expect(found.length, 'the markdown chunk is fetched by the navigation').toBe(1);
  expect(await page.locator('.blog-post__body markdown p').count()).toBeGreaterThan(3);
  expect(errors).toEqual([]);
});

for (const path of ['/privacy', '/legal/security']) {
  test(`L15-M2 ${path}: the page loads the markdown chunk and its hydrated <markdown> keeps the rendered text`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const found = await scriptsWithMarkdown(page, async () => {
      await page.goto(path, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle');
    });
    expect(found.length).toBe(1);
    expect(await page.locator('.legal__body markdown :is(p, li)').count(), 'paragraphs and list items of the rendered markdown').toBeGreaterThan(4);
    expect(errors).toEqual([]);
  });
}
