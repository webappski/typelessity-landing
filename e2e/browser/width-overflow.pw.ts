import { test, expect, type Page } from './fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLOG_POSTS } from '../../src/app/lib/blog-manifest.generated';
import { expectedSitemapCount, SEVEN } from '../industries-seven';

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

// L3 (B6, F3): the hero holds the widget slot (the animated demo with its .ld card is gone). The slot — the box the
// <typelessity-widget> sits in — and the widget element itself must stay inside the hero column. The general rule above
// cannot see this: a slot is a box without text of its own, and the widget draws inside a shadow root that
// `body.querySelectorAll` does not enter. The hero layout is L4's; the column edge is the one the old demo test used.
const SLOT = String.raw`() => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const host = document.querySelector('typelessity-widget');
  const grid = document.querySelector('.home-hero__grid');
  if (!host || !grid) return { host: !!host, grid: !!grid, offenders: [] };
  const limit = Math.min(grid.getBoundingClientRect().right - parseFloat(getComputedStyle(grid).paddingRight), window.innerWidth);
  const offenders = [];
  const inside = (name, el) => { const b = el.getBoundingClientRect(); if (b.right > limit + 0.5 || b.left < -0.5) offenders.push(name + ' ' + r1(b.left) + '..' + r1(b.right) + ' outside the column edge ' + r1(limit)); };
  inside('typelessity-widget', host);
  if (host.parentElement) inside('the slot of the widget', host.parentElement);
  return { host: true, grid: true, offenders };
}`;

const settle = async (page: Page) => {
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.locator('app-not-found')).toHaveCount(0);
};

test('sitemap.xml is built and complete', () => {
  expect(sitemapError, 'the page list is read from the built sitemap').toBeNull();
  expect(paths.length, 'urls in sitemap.xml: nine static paths + the seven kept industries + one per article file').toBe(expectedSitemapCount());
  for (const required of ['/', '/blog', '/pricing']) expect(paths).toContain(required);
  const missingPosts = BLOG_POSTS.map((post) => `/blog/${post.slug}`).filter((path) => !paths.includes(path));
  expect(missingPosts, 'blog posts that the sitemap does not list').toEqual([]);
  const missingIndustries = SEVEN.map((i) => `/industries/${i.slug}`).filter((path) => !paths.includes(path));
  expect(missingIndustries, 'industry pages that the sitemap does not list').toEqual([]);
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

if (!sitemapError && paths.length > 0) {
  for (const width of WIDTHS) {
    for (const path of paths) {
      test(`${path} @${width}: nothing is wider than the window`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(path);
        await settle(page);
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
        expect(result.candidates, 'elements measured on the page (a page that measures nothing proves nothing)').toBeGreaterThan(10);
        expect(result.offenders, `${path} @${width}: scrollWidth ${result.scrollWidth} / clientWidth ${result.clientWidth}`).toEqual([]);
        expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
      });
    }

    test(`/ @${width}: the widget slot stays inside the hero column`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto('/');
      await settle(page);
      await expect(page.locator('typelessity-widget'), 'the hero holds the widget element').toBeAttached();
      await page.evaluate(async () => { await document.fonts.ready; });
      const result = await page.evaluate(`(${SLOT})()`) as { host: boolean; grid: boolean; offenders: string[] };
      expect(result.grid, 'the hero grid the column edge is read from').toBe(true);
      expect(result.offenders, `/ @${width}: the widget slot against the hero column`).toEqual([]);
    });
  }
}
