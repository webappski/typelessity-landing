import { test, expect, type Page } from './fixtures';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { pilotSignupUrl } from '../../src/app/pages/home/home.content';
import { SITEMAP_PATHS } from './sitemap-paths';

// L3 «Каркас сайта и скорость» (2026-10-19): the shell every page shares — header, footer, the two themes, the fonts — read
// from the real SSR build in Chromium, after hydration. The design is pending-review/2026-10-19/L3/test-design.md, §1 B1.x.
// The shell comes from the mock (typelessity-redesign): header = logo · How it works · Pricing · Blog · FAQ · theme switch ·
// «Get it free» · burger; footer = Product · Guides · Company, no «Industries»; text is Montserrat, code is Space Mono.
//
// Contract this spec holds the build to (names a builder may not guess; each is the existing class or role where one exists):
//   header nav            nav[aria-label="Primary"] inside the site header, `header.vc-nav` (stage 2: a bare `header` also matches the
//                         section <header> of pages, e.g. the FAQ block of the home page, which carries a link to /faq)
//   theme switch          a <button> whose accessible name matches /theme/i
//   burger                a <button> whose accessible name matches /menu/i, with aria-expanded
//   mobile menu           .vc-mobile-menu (rendered only while open), links = the nav links + the call to action
//   theme storage         localStorage['ty-theme'] = 'light' | 'dark'; <html data-theme> is set only by a choice
//   post meta             .blog-post__meta with .blog-post__sep between the items
// The scheme is set per describe (Playwright's default is light, F7); geometry that does not depend on it runs in light.
// Chromium only: B1.10 uses CDP (CSS.getPlatformFontsForNode). Frames: every test whose title starts with [after-…] holds the
// one statement of that frame of L3/frames/ (R64); the frames themselves are taken in stage 3.

const BLOG_SRC = join(process.cwd(), 'src', 'assets', 'content', 'blog');
const POSTS = readdirSync(BLOG_SRC)
  .filter((f) => f.endsWith('.mdx'))
  .sort()
  .map((f) => {
    const data = matter(readFileSync(join(BLOG_SRC, f), 'utf8')).data as { category: string; author: string };
    return { slug: f.replace(/\.mdx$/, ''), category: String(data.category), author: String(data.author) };
  });
// The article with the longest meta line (category + author are the free-length parts) is the one whose header is framed.
const LONGEST_META = [...POSTS].sort((a, b) => b.category.length + b.author.length - (a.category.length + a.author.length))[0]!;

const PRIMARY = ['how it works', 'pricing', 'blog', 'faq'];
const CTA = /get it free/i;
const FORBIDDEN_HREF = /^\/(industries|install|gdpr)(\/|$|\?|#)/;

// Relative luminance of the surface behind `selector` (default: the page), layers composited down to the canvas.
const SURFACE_LUMINANCE = String.raw`(selector) => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const layers = [];
  for (let e = selector ? document.querySelector(selector) : document.body; e; e = e.parentElement) {
    const c = parse(getComputedStyle(e).backgroundColor);
    if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; }
  }
  let eff = layers.length && layers[layers.length - 1].a >= 0.99 ? layers.pop() : (/dark/.test(getComputedStyle(document.documentElement).colorScheme) ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 });
  for (let i = layers.length - 1; i >= 0; i--) eff = { r: layers[i].r * layers[i].a + eff.r * (1 - layers[i].a), g: layers[i].g * layers[i].a + eff.g * (1 - layers[i].a), b: layers[i].b * layers[i].a + eff.b * (1 - layers[i].a), a: 1 };
  return lum(eff);
}`;
const luminance = (page: Page, selector?: string) => page.evaluate(`(${SURFACE_LUMINANCE})(${JSON.stringify(selector ?? null)})`) as Promise<number>;

/** «light» -> brighter than 0.8, «dark» -> darker than 0.1: the rule of the class, not a colour literal. */
async function expectSurface(page: Page, scheme: 'light' | 'dark', selector?: string, what = 'the page background'): Promise<void> {
  const value = await luminance(page, selector);
  if (scheme === 'light') expect(value, `${what} is light`).toBeGreaterThan(0.8);
  else expect(value, `${what} is dark`).toBeLessThan(0.1);
}

const dataTheme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('ty-theme'));
const themeButton = (page: Page) => page.getByRole('button', { name: /theme/i });
const burger = (page: Page) => page.getByRole('button', { name: /menu/i });
const other = (scheme: 'light' | 'dark') => (scheme === 'light' ? 'dark' : 'light');

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme`, () => {
    test.use({ colorScheme: scheme });

    // ── B1.1 the theme follows the system until the visitor chooses (frames after-home-*) ──
    for (const width of [390, 1440]) {
      for (const path of ['/', '/pricing']) {
        const frame = path === '/' ? `[after-home-${width}-${scheme}] ` : '';
        test(`${frame}B1.1 ${path} at ${width}px, system ${scheme}, nothing stored: <html> has no data-theme and the background is ${scheme}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(path);
          expect(await dataTheme(page), 'a theme set by nobody is not written on <html>').toBeNull();
          await expectSurface(page, scheme);
        });
      }
    }

    test(`B1.1b the computed color-scheme follows the system: ${scheme}`, async ({ page }) => {
      await page.goto('/');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(scheme);
    });

    // Stage 2 (a defect found by hand: a component stylesheet prefixes `:root`, so the icon rule never matched and the moon stayed
    // in the dark theme): the switch shows the icon of the theme it OFFERS — the sun on a dark page, the moon on a light one —
    // and flips with the click. Names: .vc-theme-sun / .vc-theme-moon inside the switch.
    test(`B1.2c the switch shows ${scheme === 'dark' ? 'the sun' : 'the moon'} and the other one after a click`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      const shown = () => page.evaluate(() => ['sun', 'moon'].filter((n) => { const e = document.querySelector(`.vc-theme-${n}`); return !!e && getComputedStyle(e).display !== 'none'; }));
      expect(await shown()).toEqual([scheme === 'dark' ? 'sun' : 'moon']);
      await themeButton(page).click();
      expect(await shown()).toEqual([scheme === 'dark' ? 'moon' : 'sun']);
    });

    // ── B1.2 the switch, and the choice that outlives a reload and a navigation ──
    test(`B1.2 the switch: system ${scheme}, a click gives ${other(scheme)}, it is stored, it survives a reload and a client navigation, a second click gives ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      expect(await stored(page)).toBeNull();
      await expect(themeButton(page), 'the theme switch is in the header').toBeVisible();
      await themeButton(page).click();
      await expect.poll(() => dataTheme(page), { message: 'the click sets data-theme' }).toBe(other(scheme));
      expect(await stored(page)).toBe(other(scheme));
      await expectSurface(page, other(scheme));
      await page.reload();
      expect(await dataTheme(page), 'after a reload').toBe(other(scheme));
      await expectSurface(page, other(scheme), undefined, 'the background after a reload');
      await page.locator('header nav[aria-label="Primary"]').getByRole('link', { name: /blog/i }).click();
      await expect(page).toHaveURL(/\/blog$/);
      expect(await dataTheme(page), 'after a client-side navigation').toBe(other(scheme));
      await themeButton(page).click();
      await expect.poll(() => dataTheme(page)).toBe(scheme);
      expect(await stored(page)).toBe(scheme);
      await expectSurface(page, scheme);
    });

    // ── B1.3 a choice beats the system ──
    test(`B1.3 system ${scheme}, ${other(scheme)} stored: the page is ${other(scheme)}`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate((value) => localStorage.setItem('ty-theme', value), other(scheme));
      await page.reload();
      await expectSurface(page, other(scheme));
      expect(await dataTheme(page)).toBe(other(scheme));
    });

    // ── B1.4 the first painted frame already has the chosen theme (no flash, F10) ──
    // The scripts of the page are blocked, so only the HTML, the inline theme script and the stylesheet link decide. The
    // body colour is read in the first animation frame that has a body.
    test(`B1.4 system ${scheme}, ${other(scheme)} stored, scripts blocked: the first frame is already ${other(scheme)}`, async ({ page }) => {
      await page.route('**/*.js', (route) => route.abort());
      await page.addInitScript((value) => {
        try { localStorage.setItem('ty-theme', value); } catch { /* the page must live without storage */ }
        const record = () => {
          if (!document.body) { requestAnimationFrame(record); return; }
          const parse = (s: string) => { const m = s.match(/rgba?\(([^)]+)\)/); return m ? m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat) : [0, 0, 0, 0]; };
          const chain = [document.body, document.documentElement].map((e) => parse(getComputedStyle(e).backgroundColor));
          const c = chain.find((a) => (a[3] ?? 1) > 0.5) ?? [0, 0, 0, 0];
          const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
          (window as unknown as { __firstFrame: number }).__firstFrame = 0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!);
        };
        requestAnimationFrame(record);
      }, other(scheme));
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForFunction(() => (window as unknown as { __firstFrame?: number }).__firstFrame !== undefined);
      const first = await page.evaluate(() => (window as unknown as { __firstFrame: number }).__firstFrame);
      if (other(scheme) === 'light') expect(first, 'the first frame').toBeGreaterThan(0.8);
      else expect(first, 'the first frame').toBeLessThan(0.1);
    });

    // ── B1.6 the header, 1440 (frames after-home-1440-*) ──
    test.describe('header at 1440', () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');
      });

      test(`${scheme === 'light' ? '[after-home-1440-light] ' : '[after-home-1440-dark] '}B1.6 the primary nav is How it works · Pricing · Blog · FAQ`, async ({ page }) => {
        const names = await page.locator('header nav[aria-label="Primary"] a').allInnerTexts();
        expect(names.map((n) => n.trim().toLowerCase())).toEqual(PRIMARY);
      });

      test('B1.6 the header has no link to /industries', async ({ page }) => {
        const hrefs = await page.locator('header.vc-nav a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
        expect(hrefs.filter((h) => FORBIDDEN_HREF.test(h))).toEqual([]);
      });

      test('B1.6 the header links are the logo, the four nav links and the call to action — nothing else', async ({ page }) => {
        const hrefs = await page.locator('header.vc-nav a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
        expect([...hrefs].sort()).toEqual(['/', '/blog', '/faq', '/how-it-works', '/pricing', pilotSignupUrl('nav', 'free-pilot')].sort());
      });

      test('B1.6 the call to action says «Get it free» and leads to the portal with the nav utm', async ({ page }) => {
        const cta = page.locator('header a.vc-btn-primary');
        await expect(cta).toHaveAttribute('href', pilotSignupUrl('nav', 'free-pilot'));
        await expect(cta).toHaveText(CTA);
      });

      test('B1.6 the theme switch is a button in the header', async ({ page }) => {
        await expect(page.locator('header').getByRole('button', { name: /theme/i })).toBeVisible();
      });

      test('B1.6 the burger is hidden at 1440', async ({ page }) => {
        await expect(burger(page)).toBeHidden();
      });

      test('B1.6 the header is in the flow: main starts at or below its bottom edge', async ({ page }) => {
        const gap = await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom);
        expect(gap).toBeGreaterThanOrEqual(-0.5);
      });
    });

    // ── B1.7 the mobile menu, 390 (frames after-menu-390-*) ──
    test.describe('menu at 390', () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
      });

      test('B1.7 the burger shows and the nav hides', async ({ page }) => {
        await expect(burger(page)).toBeVisible();
        await expect(page.locator('header nav[aria-label="Primary"]')).toBeHidden();
      });

      test('B1.7 open: aria-expanded, a visible menu, the page behind it does not scroll', async ({ page }) => {
        await burger(page).click();
        await expect(burger(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.vc-mobile-menu')).toBeVisible();
        expect(await page.evaluate(() => getComputedStyle(document.body).overflowY), 'the vertical scroll of the page is locked').toBe('hidden');
      });

      test('B1.7 the open menu has no link to /industries', async ({ page }) => {
        await burger(page).click();
        const hrefs = await page.locator('.vc-mobile-menu a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
        expect(hrefs.length, 'the menu has links').toBeGreaterThan(0);
        expect(hrefs.filter((h) => FORBIDDEN_HREF.test(h))).toEqual([]);
      });

      test('B1.7 the open menu is the four nav links and the call to action', async ({ page }) => {
        await burger(page).click();
        const names = await page.locator('.vc-mobile-menu a').allInnerTexts();
        expect(names.map((n) => n.trim().toLowerCase())).toEqual([...PRIMARY, 'get it free']);
      });

      test(`[after-menu-390-${scheme}] B1.7 the open menu stands on a ${scheme} surface`, async ({ page }) => {
        await burger(page).click();
        await expect(burger(page)).toHaveAttribute('aria-expanded', 'true');
        await expectSurface(page, scheme, '.vc-mobile-menu', 'the menu surface');
      });

      test('B1.7 Escape closes the menu and the focus returns to the burger', async ({ page }) => {
        await burger(page).click();
        await expect(page.locator('.vc-mobile-menu')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.vc-mobile-menu')).toHaveCount(0);
        await expect(burger(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(burger(page)).toBeFocused();
      });

      test('B1.7 a client-side navigation from the menu closes it and gives the page its scroll back', async ({ page }) => {
        await burger(page).click();
        await page.locator('.vc-mobile-menu').getByRole('link', { name: /pricing/i }).click();
        await expect(page).toHaveURL(/\/pricing$/);
        await expect(page.locator('.vc-mobile-menu')).toHaveCount(0);
        await expect(burger(page)).toHaveAttribute('aria-expanded', 'false');
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
        expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
      });

      // Found in the mutation run (M23): the links of the menu close it by their own click, so the test above passes even when the
      // router's NavigationEnd no longer closes anything. A navigation that is NOT a click on the menu — the browser's Back button —
      // is the one only the router hears. The menu is opened on /pricing, Back leads to /, and the menu and the scroll lock must be gone.
      test('B1.7 a navigation that is not a click on the menu (browser Back) closes it too and gives the page its scroll back', async ({ page }) => {
        await burger(page).click();
        await page.locator('.vc-mobile-menu').getByRole('link', { name: /pricing/i }).click();
        await expect(page).toHaveURL(/\/pricing$/);
        await burger(page).click();
        await expect(burger(page)).toHaveAttribute('aria-expanded', 'true');
        await page.goBack();
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('.vc-mobile-menu')).toHaveCount(0);
        await expect(burger(page)).toHaveAttribute('aria-expanded', 'false');
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
      });
    });

    // ── B1.8 the footer ──
    for (const width of [390, 1440]) {
      test.describe(`footer at ${width}`, () => {
        test.beforeEach(async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto('/');
        });

        test(`${width === 1440 && scheme === 'dark' ? '[after-home-1440-dark] ' : ''}B1.8 the columns are Product · Guides · Company`, async ({ page }) => {
          // textContent, not innerText: the mock sets these headings in capitals (text-transform), innerText would return PRODUCT.
          const headings = await page.locator('footer.vc-footer h4').allTextContents();
          expect(headings.map((h) => h.trim())).toEqual(['Product', 'Guides', 'Company']);
        });

        test('B1.8 the footer has no link to /industries, /install or /gdpr', async ({ page }) => {
          const hrefs = await page.locator('footer.vc-footer a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
          expect(hrefs.length).toBeGreaterThan(5);
          expect(hrefs.filter((h) => FORBIDDEN_HREF.test(h))).toEqual([]);
        });

        test('B1.8 the footer keeps the parents, the security page, the contact address and the two Typelessity legal documents', async ({ page }) => {
          const hrefs = await page.locator('footer.vc-footer a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
          for (const required of [
            'https://webappski.com',
            'https://typelessform.com',
            '/legal/security',
            'mailto:info@webappski.com',
            'https://webappski.com/en/legal/terms-typelessity',
            'https://webappski.com/en/legal/dpa-typelessity',
          ]) expect(hrefs, `the footer lost ${required}`).toContain(required);
        });
      });
    }
  });
}

// ── B1.9 D8, FL-14: the separator of the article meta line never hangs at the end of a line (390) ──
// Read with the text nodes of the line, so it does not care what the markup is: for every .blog-post__sep the NEXT piece of
// text must start on the same line as the separator (centre lines within half a line height).
const META = String.raw`() => {
  const meta = document.querySelector('.blog-post__meta');
  const walker = document.createTreeWalker(meta, NodeFilter.SHOW_TEXT);
  const texts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim()) texts.push(n);
  const first = (n) => { const r = document.createRange(); r.selectNodeContents(n); const rects = r.getClientRects(); return rects.length ? rects[0] : null; };
  const cs = getComputedStyle(meta);
  const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
  const seps = Array.from(meta.querySelectorAll('.blog-post__sep'));
  const hanging = [];
  for (const sep of seps) {
    const at = texts.findIndex((t) => sep.contains(t));
    const next = texts[at + 1];
    if (at < 0 || !next) { hanging.push('«' + sep.textContent + '» has no text after it'); continue; }
    const a = first(texts[at]), b = first(next);
    if (!a || !b) continue;
    const gap = Math.abs((a.top + a.height / 2) - (b.top + b.height / 2));
    if (gap >= 0.5 * lineHeight) hanging.push('«' + sep.textContent.trim() + '» on y=' + Math.round(a.top) + ', «' + next.textContent.trim().slice(0, 20) + '» on y=' + Math.round(b.top));
  }
  const centers = texts.map((t) => { const r = first(t); return r ? r.top + r.height / 2 : 0; }).sort((a, b) => a - b);
  let lines = centers.length ? 1 : 0;
  for (let i = 1; i < centers.length; i++) if (centers[i] - centers[i - 1] > 0.5 * lineHeight) lines++;
  return { separators: seps.length, hanging, lines, texts: seps.map((s) => s.textContent.trim()) };
}`;
type Meta = { separators: number; hanging: string[]; lines: number; texts: string[] };
const readMeta = (page: Page) => page.evaluate(`(${META})()`) as Promise<Meta>;
async function openPost(page: Page, slug: string): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/blog/${slug}`);
  await expect(page.locator('.blog-post__meta')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test('B1.9 premise: at 390 the meta line of at least one article really wraps — otherwise «no hanging separator» cannot go red', async ({ page }) => {
  const wrapped: string[] = [];
  for (const { slug } of POSTS) {
    await openPost(page, slug);
    if ((await readMeta(page)).lines >= 2) wrapped.push(slug);
  }
  expect(wrapped.length, `articles whose meta line takes two lines at 390: ${wrapped.join(', ') || 'none'}`).toBeGreaterThan(0);
});

for (const { slug } of POSTS) {
  test(`B1.9 /blog/${slug} at 390: no separator hangs at the end of a line, and each is a «·»`, async ({ page }) => {
    await openPost(page, slug);
    const meta = await readMeta(page);
    expect(meta.separators, 'the meta line has its separators').toBeGreaterThanOrEqual(3);
    expect(meta.hanging, 'a separator not on the line of the item after it').toEqual([]);
  });

  test(`B1.9 /blog/${slug}: the separators read «·», not «/»`, async ({ page }) => {
    await openPost(page, slug);
    const meta = await readMeta(page);
    expect([...new Set(meta.texts)]).toEqual(['·']);
  });
}

// Found in the mutation run (M25): at 390 alone a break right after a separator may simply not occur in any of the 11 articles, so the
// markup that allows it passed. A break happens where the line is full, and that place moves with the width of the window: the same
// check is made at every width from 320 to 700 px in steps of 5, on every article, without reloading the page (the layout is
// recomputed by the resize). The premise at 390 stays; this statement is the one that can see a separator that hangs.
test('B1.9 sweep: on every article, at every window width from 320 to 700 px, no separator hangs at the end of a line', async ({ page }) => {
  const hanging: string[] = [];
  for (const { slug } of POSTS) {
    await openPost(page, slug);
    for (let width = 320; width <= 700; width += 5) {
      await page.setViewportSize({ width, height: 844 });
      const meta = await readMeta(page);
      for (const h of meta.hanging) hanging.push(`/blog/${slug} @${width}: ${h}`);
    }
  }
  expect(hanging.slice(0, 5), `${hanging.length} hanging separators`).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme, the article header`, () => {
    test.use({ colorScheme: scheme });

    test(`[after-post-header-390-${scheme}] B1.9 /blog/${LONGEST_META.slug}: the meta line wraps, no separator hangs, the page is ${scheme}`, async ({ page }) => {
      await openPost(page, LONGEST_META.slug);
      const meta = await readMeta(page);
      expect(meta.lines, 'the framed header has a meta line that takes more than one line').toBeGreaterThanOrEqual(2);
      expect(meta.hanging).toEqual([]);
      await expectSurface(page, scheme);
    });
  });
}

// ── B1.10 the typeface is the one the design says (F9), not the one the stylesheet merely names ──
// CDP asks the browser which platform fonts it really used for a node. Montserrat for h1 and body text on every address of the
// sitemap, Space Mono for every piece of code, and no DM Sans of ours: the widget brings its own, on the pages that hold it.
const PROBES = () => {
  const visible = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden'; };
  // Own text only, and only text the Latin subsets of our fonts cover: a Cyrillic line in a code sample (one article has it) has no
  // Space Mono glyphs in fonts.css and the browser draws it in a fallback — a fact about that sample, not about the typeface contract.
  const latin = /^[\u0000-\u02FF\u2000-\u206F\u20AC\u2122\u2190-\u2193\u2212\u2215\s]*$/;
  const ownText = (el: Element) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0 && latin.test(n.textContent ?? ''));
  const mark = (el: Element | null | undefined, kind: string) => { if (el) el.setAttribute('data-ty-font', kind); };
  mark(Array.from(document.querySelectorAll('main h1')).find((e) => visible(e) && ownText(e)), 'h1');
  mark(Array.from(document.querySelectorAll('main p')).find((e) => visible(e) && ownText(e)), 'p');
  const code = Array.from(document.querySelectorAll('code, pre, kbd, samp')).filter((e) => visible(e) && ownText(e));
  code.forEach((e) => mark(e, 'code'));
  return code.length;
};

async function dominantFonts(page: Page, kind: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `[data-ty-font="${kind}"]` });
    const out: string[] = [];
    for (const nodeId of nodeIds) {
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      const top = [...fonts].sort((a, b) => b.glyphCount - a.glyphCount)[0];
      out.push(top ? top.familyName : '(none)');
    }
    return out;
  } finally {
    await cdp.detach();
  }
}

for (const path of SITEMAP_PATHS) {
  test(`B1.10 ${path}: the h1 and the body text are drawn in Montserrat`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(PROBES);
    // A variable font's family name may carry its default instance («DM Sans 9pt»): a prefix, not the whole name.
    expect(await dominantFonts(page, 'h1')).toEqual([expect.stringMatching(/^Montserrat\b/)]);
    expect(await dominantFonts(page, 'p')).toEqual([expect.stringMatching(/^Montserrat\b/)]);
  });

  test(`B1.10 ${path}: every piece of code is drawn in Space Mono`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const count = await page.evaluate(PROBES);
    if (path === '/for-ai-agents') expect(count, 'this page holds code, so the check is not empty').toBeGreaterThan(0);
    const fonts = await dominantFonts(page, 'code');
    expect(fonts.filter((f) => !/^Space Mono\b/.test(f)), `${count} code nodes on ${path}`).toEqual([]);
  });
}

test('B1.10 /pricing: no DM Sans face is loaded — the site no longer ships it, and this page holds no widget', async ({ page }) => {
  await page.goto('/pricing');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'DM Sans' && f.status === 'loaded').length);
  expect(loaded).toBe(0);
});

// ── B1.11 the switch hydrates cleanly: no page error, no NG0 on a page of each kind, in both themes ──
// The widget on / is not counted: its own console.error for «no config» is its business (typelessity-widget.ts).
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme, hydration`, () => {
    test.use({ colorScheme: scheme });
    for (const path of ['/pricing', `/blog/${LONGEST_META.slug}`]) {
      test(`B1.11 ${path}: no page error and no NG0 console error`, async ({ page }) => {
        const problems: string[] = [];
        page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
        page.on('console', (m) => { if (m.type() === 'error' && /NG0/.test(m.text())) problems.push(`console: ${m.text()}`); });
        await page.goto(path, { waitUntil: 'networkidle' });
        expect(problems).toEqual([]);
      });
    }
  });
}

// ── B1.5 storage that fails, and garbage in it: the page lives on the system theme, the switch works for the session ──
test.describe('storage that throws', () => {
  test.use({ colorScheme: 'light' });

  test('B1.5 localStorage throws: the page is light, no error, the switch changes the theme for the session', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError'); } });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectSurface(page, 'light');
    await themeButton(page).click();
    await expect.poll(() => dataTheme(page)).toBe('dark');
    await expectSurface(page, 'dark');
    expect(errors).toEqual([]);
  });

  test('B1.5 garbage in ty-theme counts as «no choice»: the page follows the system', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => { try { localStorage.setItem('ty-theme', 'purple'); } catch { /* none */ } });
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(await dataTheme(page)).not.toBe('purple');
    await expectSurface(page, 'light');
    expect(errors).toEqual([]);
  });
});
