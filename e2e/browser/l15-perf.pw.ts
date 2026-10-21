import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from './fixtures';

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
