import { test, expect, type Page, REDUCED_MOTION } from './fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLOG_POSTS } from '../../src/app/lib/blog-manifest.generated';
import { expectedSitemapCount } from '../retired-industries';
import { readManifest } from './widget-snapshot';

// Nothing on any page may be wider than the window. `scrollWidth <= clientWidth` is blind to the class
// that bit us twice: `body` and the hero carry `overflow-x: hidden`, so a heading cut off on the right
// (the hero at 320px, 2026-10-11) or a long inline `code` that scrolls the page sideways (two blog posts)
// either never reaches `scrollWidth` or does so on a page nobody measured. The rule below is the one in
// `width-overflow-guard.md` (ops workspace, pending-review/2026-10-11): every visible element that holds
// its own text, is a link/button/input/image, or scrolls by itself must sit inside the window — and a
// parent that merely clips it with `overflow: hidden` is no excuse. The old `scrollWidth` check stays,
// second, so a log shows which of the two went red.

const WIDTHS = [320, 390];
const HEIGHT = 844;
const SITEMAP = join(process.cwd(), 'dist/typelessity-landing/browser/sitemap.xml');

// Exceptions are added here only after the ops window agrees; each needs a line saying why.
const EXCEPTIONS: { selector: string; why: string }[] = [];

let paths: string[] = [];
let sitemapError: string | null = null;
try {
  const xml = readFileSync(SITEMAP, 'utf8');
  paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
} catch (error) {
  sitemapError = `cannot read ${SITEMAP} (${(error as Error).message}) — run npm run build first`;
}

// "Visible" = width and height above 0 and visibility not hidden. "Own text" = a direct child text
// node whose trim() is not empty. The ancestor walk for the scroll-container skip stops before `body`.
// Plain JS in a string: it runs in the page.
const COLLECT = String.raw`(opts) => {
  const iw = window.innerWidth;
  const r1 = (n) => Math.round(n * 10) / 10;
  const scrolls = (cs) => cs.overflowX === 'auto' || cs.overflowX === 'scroll';
  const TAGS = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'VIDEO'];
  const path = (el) => {
    const parts = [];
    let cur = el;
    for (let i = 0; i < 4 && cur && cur !== document.body; i++, cur = cur.parentElement) {
      const cls = (cur.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)[0];
      parts.unshift(cur.tagName.toLowerCase() + (cls ? '.' + cls : ''));
    }
    return parts.join(' > ');
  };
  const offenders = [];
  let candidates = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0) || cs.visibility === 'hidden') continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    if (opts.exceptions.some((x) => el.matches(x.selector))) continue;
    const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    const scroller = scrolls(cs);
    const isTag = TAGS.includes(el.tagName) || (el.tagName.toLowerCase() === 'svg' && el.getAttribute('role') === 'img');
    if (!(textNodes.length > 0 || isTag || scroller)) continue;
    let insideScroller = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (scrolls(getComputedStyle(p))) { insideScroller = true; break; }
    }
    if (insideScroller) continue;
    candidates++;
    const label = path(el) + ' «' + (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '»';
    if (rect.left < -0.5 || rect.right > iw + 0.5) offenders.push(label + ' ' + r1(rect.left) + '..' + r1(rect.right) + ' (innerWidth ' + iw + ')');
    // The box of a block is as wide as its column even when its nowrap text is not: measure the text itself,
    // unless the element scrolls or clips its own text.
    if (textNodes.length > 0 && cs.overflowX === 'visible') {
      let left = Infinity, right = -Infinity;
      for (const n of textNodes) {
        const range = document.createRange();
        range.selectNodeContents(n);
        const b = range.getBoundingClientRect();
        if (b.width > 0) { left = Math.min(left, b.left); right = Math.max(right, b.right); }
      }
      if (right > -Infinity && (left < -0.5 || right > iw + 0.5)) offenders.push('text: ' + label + ' ' + r1(left) + '..' + r1(right) + ' (innerWidth ' + iw + ')');
    }
  }
  return { offenders, candidates, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
}`;

// L3 (B6, F3), moved to the hero of L4: the hero holds the widget slot. The slot — the box the <typelessity-widget> sits in
// (`[data-widget-host]`, inside the frame `.demo__frame`) — and the widget element itself must stay inside the hero column. The general
// rule above cannot see this: a slot is a box without text of its own, and the widget draws inside a shadow root that
// `body.querySelectorAll` does not enter. The column edge is the right edge of `.hero__grid` (the wrap's padding is outside it).
const SLOT = String.raw`() => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const host = document.querySelector('[data-widget-host]');
  const widget = document.querySelector('typelessity-widget');
  const grid = document.querySelector('.hero__grid');
  if (!host || !grid) return { host: !!host, grid: !!grid, widget: !!widget, offenders: [] };
  const limit = Math.min(grid.getBoundingClientRect().right - parseFloat(getComputedStyle(grid).paddingRight), window.innerWidth);
  const offenders = [];
  const inside = (name, el) => { const b = el.getBoundingClientRect(); if (b.right > limit + 0.5 || b.left < -0.5) offenders.push(name + ' ' + r1(b.left) + '..' + r1(b.right) + ' outside the column edge ' + r1(limit)); };
  inside('the slot of the widget', host);
  const frame = host.closest('.demo__frame');
  if (frame) inside('the frame of the slot', frame);
  if (widget) inside('typelessity-widget', widget);
  return { host: true, grid: true, widget: !!widget, offenders };
}`;

const settle = async (page: Page) => {
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.locator('app-not-found')).toHaveCount(0);
};

test('sitemap.xml is built and complete', () => {
  expect(sitemapError, 'the page list is read from the built sitemap').toBeNull();
  expect(paths.length, 'urls in sitemap.xml: ten static paths + one per article file').toBe(expectedSitemapCount());
  for (const required of ['/', '/blog', '/pricing']) expect(paths).toContain(required);
  const missingPosts = BLOG_POSTS.map((post) => `/blog/${post.slug}`).filter((path) => !paths.includes(path));
  expect(missingPosts, 'blog posts that the sitemap does not list').toEqual([]);
  expect(paths.filter((path) => path.startsWith('/industries')), 'an /industries address in the sitemap').toEqual([]);
});

// The article body hyphenates (`hyphens: auto` on its paragraphs), and inline code wraps on a phone since
// the width fix. `hyphens` is inherited, so without its own `none` the code would come out as «de-pendsOn»
// (seen on a frame of this very article, 2026-10-11). The computed value is the proof, at the width where
// the code wraps.
test('/blog/cascade-corrections @320: inline code is not hyphenated inside a hyphenating paragraph', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: HEIGHT });
  await page.goto('/blog/cascade-corrections');
  await settle(page);
  const codes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.blog-post__body p code, .blog-post__body li code, .blog-post__body td code')).map((code) => {
      const paragraph = code.closest('p');
      return { text: code.textContent, hyphens: getComputedStyle(code).hyphens, paragraph: paragraph ? getComputedStyle(paragraph).hyphens : null };
    }));
  expect(codes.length, 'inline code elements in the article body').toBeGreaterThan(0);
  expect(codes.filter((c) => c.paragraph !== null && c.paragraph !== 'auto'), 'paragraphs holding inline code must hyphenate (otherwise the check below proves nothing)').toEqual([]);
  expect(codes.some((c) => c.paragraph === 'auto'), 'at least one inline code sits in a hyphenating paragraph').toBe(true);
  expect(codes.filter((c) => c.hyphens !== 'none'), 'inline code that may be hyphenated').toEqual([]);
});

// L10 (D7): every address of the sitemap AND the 404 shell (the same header and footer, a page nobody measured), in both themes, and the open
// menu. The 404 address is the one `sitemap-paths.ts` adds to its list (`SITEMAP_PATHS_WITH_404`); this file reads the sitemap itself so that a
// missing build is a named failure, not an import error.
const NOT_FOUND_PATH = '/404-not-a-page';

/** One measurement of a page at one width, in the theme of the test; the body of the rule in `COLLECT`. */
async function expectNothingWider(page: Page, path: string, width: number, label: string): Promise<void> {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(path);
  if (path === NOT_FOUND_PATH) {
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('app-not-found'), 'the 404 address shows the 404 screen (a measurement of another page proves nothing)').toHaveCount(1);
  } else {
    await settle(page);
  }
  if (path.startsWith('/blog/')) await expect(page.locator('.blog-post__body p')).not.toHaveCount(0);
  // The reader opens the answers, so their text is measured too; two frames let the layout settle.
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((d) => { d.open = true; });
    return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.evaluate(async () => { await document.fonts.ready; });
  const result = await page.evaluate(`(${COLLECT})(${JSON.stringify({ exceptions: EXCEPTIONS })})`) as {
    offenders: string[]; candidates: number; scrollWidth: number; clientWidth: number;
  };
  expect(result.candidates, `elements measured on the page (a page that measures nothing proves nothing)`).toBeGreaterThan(10);
  expect(result.offenders, `${label}: scrollWidth ${result.scrollWidth} / clientWidth ${result.clientWidth}`).toEqual([]);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
}

if (!sitemapError && paths.length > 0) {
  const measured = [...paths, NOT_FOUND_PATH];
  for (const width of WIDTHS) {
    for (const path of measured) {
      // L4 (F7): `/` runs the scripted demo (tips, a ring, a changing widget); it is measured still, with reduced motion.
      test.describe(path === '/' ? 'home, demo still' : 'page', () => {
        if (path === '/') test.use(REDUCED_MOTION);
        test(`${path} @${width}: nothing is wider than the window`, async ({ page }) => {
          await expectNothingWider(page, path, width, `${path} @${width}`);
        });
      });
    }
  }

  // L10: the dark theme at 390 — a different surface, other colours on the same boxes; every address and the 404 shell.
  test.describe('dark theme', () => {
    for (const path of measured) {
      test.describe(path === '/' ? 'home, demo still' : 'page', () => {
        test.use(path === '/' ? { colorScheme: 'dark', ...REDUCED_MOTION } : { colorScheme: 'dark' });
        test(`${path} @390 dark: nothing is wider than the window`, async ({ page }) => {
          await expectNothingWider(page, path, 390, `${path} @390 dark`);
        });
      });
    }
  });

  // L10: the open menu is its own layer on top of the page (a fixed surface); it is measured open, at both widths where the burger shows,
  // in both themes, on the address where the menu is first met.
  for (const scheme of ['light', 'dark'] as const) {
    for (const width of WIDTHS) {
      test.describe(`open menu, ${scheme}`, () => {
        test.use({ colorScheme: scheme, ...REDUCED_MOTION });
        test(`/ @${width} ${scheme}: the open menu, and the page under it, are not wider than the window`, async ({ page }) => {
          await page.setViewportSize({ width, height: HEIGHT });
          await page.goto('/');
          await settle(page);
          const burger = page.getByRole('button', { name: /menu/i });
          await expect(burger).toBeVisible();
          await burger.click();
          await expect(burger).toHaveAttribute('aria-expanded', 'true');
          await expect(page.locator('.vc-mobile-menu')).toBeVisible();
          await page.evaluate(async () => { await document.fonts.ready; });
          const result = await page.evaluate(`(${COLLECT})(${JSON.stringify({ exceptions: EXCEPTIONS })})`) as {
            offenders: string[]; candidates: number; scrollWidth: number; clientWidth: number;
          };
          const menu = await page.locator('.vc-mobile-menu').boundingBox();
          expect(menu, 'the open menu has a box').not.toBeNull();
          expect(menu!.x + menu!.width, `the open menu is inside the window (${width})`).toBeLessThanOrEqual(width + 0.5);
          // The menu is a fixed box with `overflow-y: auto`, which makes its overflow-x `auto` too: the rule above skips what sits inside a scroller
          // (it scrolls by itself), so a line too wide for the menu would only make the MENU scroll sideways. That is the defect, measured here
          // (found in the mutation run, M10: a 700 px line in the open menu survived the rule above).
          const menuScroll = await page.locator('.vc-mobile-menu').evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
          expect(menuScroll.scrollWidth, `the open menu scrolls sideways (scrollWidth ${menuScroll.scrollWidth}, clientWidth ${menuScroll.clientWidth})`).toBeLessThanOrEqual(menuScroll.clientWidth);
          expect(result.offenders, `/ @${width} ${scheme} with the menu open`).toEqual([]);
          expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
        });
      });
    }
  }

  for (const width of WIDTHS) {
    test.describe('home, demo still', () => {
      test.use(REDUCED_MOTION);
      test(`/ @${width}: the widget slot stays inside the hero column`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto('/');
        await settle(page);
        await expect(page.locator('[data-widget-host]'), 'the hero holds the slot of the widget').toBeAttached();
        await expect(page.locator('typelessity-widget'), 'the demo has put the widget into the slot').toBeAttached({ timeout: 15_000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        const result = await page.evaluate(`(${SLOT})()`) as { host: boolean; grid: boolean; widget: boolean; offenders: string[] };
        expect(result.grid, 'the hero grid the column edge is read from').toBe(true);
        expect(result.widget, 'the widget element is measured too').toBe(true);
        expect(result.offenders, `/ @${width}: the widget slot against the hero column`).toEqual([]);
      });
    });
  }

  // FL-19 / FL-96 → B6+ (22.10). Until 22.10 this test HELD a known deviation of the product's widget: the card the widget draws (`.widget-container`) stood 8–14 px to the
  // RIGHT of its slot on a phone (its `left: auto` on `.inline`, the product's F-138), and the test turned red when the card sat in its slot — «then replace it with the plain
  // `the card is inside the slot` (B6+)» (its own text, L13, test-design L13-14). The product fixed it: ~/Projects/typelessity 292ffc6 «an inline widget stands exactly in its host —
  // on a phone the floating card's rule moved it 10 px right, and its border made it 2 px wider everywhere» (T3y, F-138); the snapshot of the product's build this suite takes
  // (widget.js sha256 ec6015e7…, printed below) has the fix, and the old test went red by its own design, on the card being in its slot (shift 0). This is that replacement, and it is
  // stricter than the old one, not looser: the card stands in its slot to the pixel (±1), inside the window, and the page does not scroll sideways, at 320/360/390/430 in both themes.
  // LIMITS OF THIS GUARD (unchanged from L13 round 2): (1) it holds a LOCAL SNAPSHOT of the widget, not the live CDN build (typelessity-widget.vercel.app) — until the product's build
  // with 292ffc6 is published, the live page still shows the old shift; compare the printed sha256 with the live one before reading a green run as «the live page is as held».
  // (2) FL-19 as a customer-facing statement stays open until then: pricing-faq-facts.spec.ts holds that no answer claims the demo fits a phone.
  for (const scheme of ['light', 'dark'] as const) {
    for (const width of [320, 360, 390, 430]) {
      test.describe(`home, demo still, ${scheme}`, () => {
        test.use({ colorScheme: scheme, ...REDUCED_MOTION });
        test(`/ @${width} ${scheme}: the card of the widget stands in its slot (F-138 fixed in the product, T3y), inside the window, the page does not scroll sideways`, async ({ page }) => {
          const sha = readManifest().sha256;
          test.info().annotations.push({ type: 'widget.js sha256', description: sha });
          console.log(`FL-19 guard: widget.js sha256 ${sha}`);
          await page.setViewportSize({ width, height: HEIGHT });
          await page.goto('/');
          await settle(page);
          await expect(page.locator('typelessity-widget'), 'the demo has put the widget into the slot').toBeAttached({ timeout: 15_000 });
          await page.evaluate(async () => { await document.fonts.ready; });
          await expect.poll(() => page.evaluate(() => !!document.querySelector('typelessity-widget')?.shadowRoot?.querySelector('.widget-container')), { message: 'the widget drew its card', timeout: 20_000 }).toBe(true);
          const m = await page.evaluate(() => {
            const slot = document.querySelector('[data-widget-host]')!.getBoundingClientRect();
            const card = document.querySelector('typelessity-widget')!.shadowRoot!.querySelector('.widget-container')!.getBoundingClientRect();
            return { slotLeft: slot.left, slotRight: slot.right, cardLeft: card.left, cardRight: card.right, iw: window.innerWidth, sw: document.documentElement.scrollWidth };
          });
          expect(Math.abs(m.cardLeft - m.slotLeft), `the card's left edge ${m.cardLeft} against the slot's ${m.slotLeft} (F-138 is fixed in the product, 292ffc6): ${JSON.stringify(m)}`).toBeLessThanOrEqual(1);
          expect(Math.abs(m.cardRight - m.slotRight), `the card's right edge ${m.cardRight} against the slot's ${m.slotRight}: ${JSON.stringify(m)}`).toBeLessThanOrEqual(1);
          expect(m.cardRight, 'the card stays inside the window').toBeLessThanOrEqual(m.iw);
          expect(m.sw, 'the page does not scroll sideways').toBe(m.iw);
        });
      });
    }
  }
}
