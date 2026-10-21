import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from './fixtures';

// L14, CRO item 1 (21.10): on a phone «Get it free» stood at y=815–863 of 844 (cut by the bottom edge) and on 360×740 wholly below the screen: the headline, then
// an eight-line paragraph, then the buttons. Up to 480 px the two buttons now stand right under the headline and the paragraph under them; the text, the order
// of the words and the promo card above the headline are untouched, and from 481 px the picture is the old one (paragraph, then buttons).
// Frames (R64) when L14_FRAMES names a folder: after-home-hero-390-{light,dark}, after-home-hero-360-light, after-home-hero-1440-light (unchanged).

const FRAMES = process.env['L14_FRAMES'];
async function shot(page: Page, name: string): Promise<void> {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  await page.screenshot({ path: join(FRAMES, `${name}.png`), fullPage: false });
}

/** Luminance of the page background: «light» > 0.8, «dark» < 0.1. */
async function expectSurface(page: Page, scheme: 'light' | 'dark'): Promise<void> {
  const value = await page.evaluate(() => {
    const parse = (s: string) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1]!.split(/[\s,/]+/).filter(Boolean).map(parseFloat); return { r: a[0]!, g: a[1]!, b: a[2]!, a: a.length > 3 ? a[3]! : 1 }; };
    const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    for (const e of [document.body, document.documentElement]) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a >= 0.99) return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    }
    return 1;
  });
  if (scheme === 'light') expect(value, 'the page background is light').toBeGreaterThan(0.8);
  else expect(value, 'the page background is dark').toBeLessThan(0.1);
}

async function hero(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page.evaluate(() => {
    const b = (sel: string) => { const r = document.querySelector(sel)!.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
    const cta = document.querySelector('.hero__cta a.btn--primary')!.getBoundingClientRect();
    return { h1: b('.hero .h1'), lead: b('.hero__text > .lead'), group: b('.hero__cta'), primary: { top: cta.top, bottom: cta.bottom }, h: window.innerHeight,
      ghost: document.querySelector('.hero__cta [data-take-over]')!.getBoundingClientRect().bottom,
      order: { cta: getComputedStyle(document.querySelector('.hero__cta')!).order, lead: getComputedStyle(document.querySelector('.hero__text > .lead')!).order } };
  });
}

for (const [width, height, scheme] of [[390, 844, 'light'], [390, 844, 'dark'], [360, 740, 'light'], [360, 740, 'dark']] as const) {
  test.describe(`L14 hero on a phone ${width}×${height}, ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    test(`[after-home-hero-${width}-${scheme}] «Get it free» is whole inside the window, right under the headline, the paragraph is under the buttons`, async ({ page }) => {
      const g = await hero(page, width, height);
      expect(g.primary.bottom, `«Get it free» bottom ${Math.round(g.primary.bottom)} of ${g.h}: whole in the window with 8 px to spare`).toBeLessThanOrEqual(g.h - 8);
      expect(g.primary.top).toBeGreaterThan(g.h1.bottom - 1);
      expect(g.group.top - g.h1.bottom, 'the buttons stand right under the headline').toBeLessThan(60);
      expect(g.lead.top, 'the paragraph is under the buttons').toBeGreaterThanOrEqual(g.group.bottom);
      expect(g.ghost, '«Try the chat now» is on the first screen too').toBeLessThanOrEqual(g.h);
      expect(Number(g.order.cta), 'the order of the buttons comes before the order of the paragraph (CSS `order`; the HTML keeps its order)').toBeLessThan(Number(g.order.lead));
      await expectSurface(page, scheme);
      await shot(page, `after-home-hero-${width}-${scheme}`);
    });
  });
}

test.describe('L14 hero from 481 px: the picture is the old one', () => {
  for (const width of [481, 768, 1440]) {
    test(`${width}px: headline, paragraph, then the buttons`, async ({ page }) => {
      const g = await hero(page, width, 900);
      expect(g.lead.top, 'the paragraph is above the buttons').toBeLessThan(g.group.top);
      expect(Number(g.order.lead), 'no `order` reshuffles the hero from 481 px').toBe(Number(g.order.cta));
      if (width === 1440) await shot(page, 'after-home-hero-1440-light');
    });
  }
});
