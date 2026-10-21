import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from './fixtures';
// the PNG decoder that ships with Playwright (the shadow is read from the screenshot)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PNG } = require('playwright-core/lib/utilsBundle') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Buffer } } } };

// L14 (21.10): the pages that changed under the CRO and tester findings, and the one statement each frame (R64) holds.
//   item 5  the end of every article: the block «Try it free on your website» stands between the text and the list of changes (CRO 4)
//   item 8  /install: the code blocks that run past the right edge say so (tester C)
// Frames when L14_FRAMES names a folder: after-article-bottom-{390,1440}-{light,dark}, after-install-code-390-{light,dark}.
// The bytes a crawler reads (the block is on all ten pages, above the heading of the list) are held by e2e/seo-text-l12.spec.ts.

const FRAMES = process.env['L14_FRAMES'];
const SLUGS = readdirSync(join(process.cwd(), 'src', 'assets', 'content', 'blog')).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')).sort();

async function shot(page: Page, name: string): Promise<void> {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  await page.screenshot({ path: join(FRAMES, `${name}.png`), fullPage: false });
}
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
const noSideScroll = async (page: Page) => {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, 'no horizontal scroll').toBeLessThanOrEqual(client);
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`L14 ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1440]) {
      test(`[after-article-bottom-${width}-${scheme}] an article at ${width}px: «Try it free on your website» after the text and before the list of changes, whole in the window, the list last`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/blog/best-ai-booking-widgets-2026');
        const cta = page.locator('[data-article-cta]');
        await expect(cta).toHaveCount(1);
        await expect(cta.locator('h2')).toHaveText('Try it free on your website');
        const primary = cta.locator('a.vc-btn-primary');
        await expect(primary).toHaveText('Get it free');
        expect(await primary.getAttribute('href'), 'the same sign-up address as the other pages, with the blog as the medium').toMatch(/^https:\/\/webappski\.com\/en\/portal\/login\?.*start=typelessity.*utm_medium=blog/);
        await cta.scrollIntoViewIfNeeded();
        const order = await page.evaluate(() => {
          const top = (el: Element | null) => (el ? el.getBoundingClientRect().top + window.scrollY : NaN);
          const cta = document.querySelector('[data-article-cta]')!;
          const h2s = Array.from(document.querySelectorAll('.blog-post__body h2'));
          const journal = h2s.find((h) => h.textContent?.trim() === 'What changed in this article') ?? null;
          const faq = h2s.find((h) => h.textContent?.trim() === 'FAQ') ?? null;
          const footer = document.querySelector('.blog-post__footer');
          const r = cta.getBoundingClientRect();
          const btn = cta.querySelector('a.vc-btn-primary')!.getBoundingClientRect();
          return { cta: top(cta), journal: top(journal), faq: top(faq), footer: top(footer), inside: r.left >= 0 && r.right <= window.innerWidth && btn.bottom <= window.innerHeight && btn.top >= 0, btnH: btn.height };
        });
        expect(order.faq, 'the FAQ is before the block').toBeLessThan(order.cta);
        expect(order.cta, 'the block is before the list of changes').toBeLessThan(order.journal);
        expect(order.journal, 'the list of changes is before the share links').toBeLessThan(order.footer);
        expect(order.inside, 'the block and its button are whole inside the window').toBe(true);
        expect(order.btnH, 'the button is a tap target').toBeGreaterThanOrEqual(44);
        await expectSurface(page, scheme);
        await noSideScroll(page);
        await shot(page, `after-article-bottom-${width}-${scheme}`);
      });
    }

    test(`[after-install-code-390-${scheme}] /install at 390px: every code block scrolls sideways, can be focused, has a name, and shows the edge it runs past`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/install');
      const blocks = page.locator('main pre.install-code');
      expect(await blocks.count(), 'the page has four code blocks').toBe(4);
      const info = await blocks.evaluateAll((els) => els.map((el) => { const cs = getComputedStyle(el); return { tab: el.getAttribute('tabindex'), name: el.getAttribute('aria-label'), role: el.getAttribute('role'), overflowX: cs.overflowX, attachment: cs.backgroundAttachment, wide: el.scrollWidth > el.clientWidth }; }));
      for (const [i, b] of info.entries()) {
        expect(b.overflowX, `block ${i + 1} scrolls sideways`).toBe('auto');
        expect(b.tab, `block ${i + 1} can be reached with the keyboard`).toBe('0');
        expect(b.role, `block ${i + 1} is a region`).toBe('region');
        expect(b.name, `block ${i + 1} has a name`).toMatch(/scrolls sideways/);
        expect(b.attachment, `block ${i + 1} draws its edge shadows (local covers over scroll shadows)`).toContain('local');
      }
      expect(info.some((b) => b.wide), 'at 390 px at least one block runs past its right edge (the embed code)').toBe(true);
      const embed = blocks.first();
      await embed.scrollIntoViewIfNeeded();
      // The shadow is a picture, so it is read from the picture: the middle row of the block (between its two lines, no glyph in it), the first and the last
      // pixels. The block is the one colour in between, so «shaded» is: this edge differs from the other one (the two edges are alike when neither is shaded).
      const edges = async (): Promise<{ left: number; right: number }> => {
        const png = PNG.sync.read(await embed.screenshot());
        const y = Math.floor(png.height / 2);
        const at = (x: number) => { const i = (png.width * y + x) << 2; return 0.2126 * png.data[i]! + 0.7152 * png.data[i + 1]! + 0.0722 * png.data[i + 2]!; };
        return { left: at(3), right: at(png.width - 4) };
      };
      const start = await edges();
      expect(Math.abs(start.right - start.left), `at the start the right edge is shaded and the left is not (left ${start.left.toFixed(1)}, right ${start.right.toFixed(1)}): there is more to the right`).toBeGreaterThan(20);
      await embed.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
      const end = await edges();
      expect(Math.abs(end.right - end.left), `at the end the left edge is shaded and the right is not (left ${end.left.toFixed(1)}, right ${end.right.toFixed(1)}): there is more to the left`).toBeGreaterThan(20);
      expect(Math.sign(start.right - start.left), 'the shaded side changes sides').not.toBe(Math.sign(end.right - end.left));
      await embed.evaluate((el) => { el.scrollLeft = 0; });
      await expectSurface(page, scheme);
      await noSideScroll(page);
      if (FRAMES) { mkdirSync(FRAMES, { recursive: true }); await embed.screenshot({ path: join(FRAMES, `after-install-code-390-${scheme}.png`) }); }
    });
  });
}
