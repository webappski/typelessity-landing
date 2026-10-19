import { test, expect, type Page } from './fixtures';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

// L2 (D6): the header of an article shows «Updated <date>» as a second <time> next to the date of publication, and it
// is the date the structured data states (`dateModified`). Real SSR (`npm run build` first), then hydration.
// Google Search Central, «publication dates» (read 2026-10-19): label the dates «Last updated» and keep a match between
// the visible and the structured value.
//
// B1  the header after hydration: two <time>, the second visible, datetime = updatedAt of the .mdx, the text, the order of the children.
// B2  the claims the frames make (the box of .blog-post__meta is always as wide as its column, so «meta ≤ window» can never
//     go red; what can): «Updated» on one line, its right edge inside the window, the same look as the first <time>,
//     and on 1440 the whole header line in one row. Overflow of any element at 320/390 on all pages: width-overflow.pw.ts.
// B3  Pacific/Honolulu (UTC−10): DatePipe reads a date without time as a local date; the hydrated text must be the SSR text.
// B4  the Organization logo of the same change is served: 200, image/png (the real express server).
//
// Expected values are read from the .mdx files and a written month table — not from the manifest or DatePipe that the
// page itself is built from.

const BLOG_SRC = join(process.cwd(), 'src', 'assets', 'content', 'blog');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WIDTHS = [390, 1440];

const POSTS = readdirSync(BLOG_SRC)
  .filter((f) => f.endsWith('.mdx'))
  .sort()
  .map((f) => {
    const data = matter(readFileSync(join(BLOG_SRC, f), 'utf8')).data as { updatedAt: unknown };
    return { slug: f.replace(/\.mdx$/, ''), updatedAt: String(data.updatedAt) };
  });

/** `2026-10-03` → `Oct 3, 2026` */
function mediumDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`updatedAt ${iso} is not a plain date`);
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/** Angular removes the `ngh` annotations once it has hydrated the server markup. */
async function open(page: Page, slug: string): Promise<void> {
  await page.goto(`/blog/${slug}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('[ngh]').length === 0);
}

test('the fixture reads the 11 articles', () => {
  expect(POSTS).toHaveLength(10);
  for (const p of POSTS) expect(p.updatedAt, p.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

for (const { slug, updatedAt } of POSTS) {
  for (const width of WIDTHS) {
    test(`B1 ${slug} @${width}: two <time>, the second is «Updated» = updatedAt, in the written order`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, slug);
      const times = page.locator('.blog-post__meta time');
      const n = await times.count();
      expect.soft(n, 'B1: <time> in the header meta').toBe(2);
      if (n !== 2) return;
      await expect.soft(times.nth(1), 'B1: the second <time> is visible').toBeVisible();
      await expect.soft(times.nth(1), 'B1: its datetime is updatedAt').toHaveAttribute('datetime', updatedAt);
      await expect.soft(times.nth(1), 'B1: its text').toHaveText(`Updated ${mediumDate(updatedAt)}`);
      // L3 (D8): the separator is glued to the item after it, so the items may sit in a wrapper of their own. The order is read
      // from the meaningful descendants in document order — a wrapper is walked through, not counted.
      const order = await page.locator('.blog-post__meta').evaluate((meta) => {
        const kind = (c: Element) => {
          if (c.tagName === 'TIME') return 'time';
          if (c.classList.contains('blog-post__cat')) return 'cat';
          if (c.classList.contains('blog-post__sep')) return 'sep';
          if (c.classList.contains('blog-post__readtime')) return 'readtime';
          return null;
        };
        const out: string[] = [];
        const walk = (el: Element) => {
          for (const c of el.children) {
            const k = kind(c);
            if (k) out.push(k);
            else if (c.children.length) walk(c);
            else out.push('text');
          }
        };
        walk(meta);
        return out;
      });
      expect.soft(order, 'B1: the items of the meta line, in document order').toEqual(['cat', 'sep', 'time', 'sep', 'time', 'sep', 'readtime', 'sep', 'text']);
    });

    test(`B2 ${slug} @${width}: «Updated» on one line, inside the window, looks like the date of publication${width >= 1000 ? ', the line in one row' : ''}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, slug);
      const times = page.locator('.blog-post__meta time');
      const n = await times.count();
      expect.soft(n, 'B2: <time> in the header meta').toBe(2);
      if (n !== 2) return;
      const m = await page.locator('.blog-post__meta').evaluate((meta) => {
        const box = (el: Element) => el.getBoundingClientRect();
        const look = (el: Element) => {
          const cs = getComputedStyle(el);
          return { color: cs.color, fontSize: cs.fontSize, textTransform: cs.textTransform, letterSpacing: cs.letterSpacing };
        };
        const ts = [...meta.querySelectorAll('time')];
        const second = ts[1];
        const lineHeight = parseFloat(getComputedStyle(second).lineHeight) || parseFloat(getComputedStyle(second).fontSize) * 1.2;
        const centers = [...meta.children].map((c) => box(c).top + box(c).height / 2);
        return {
          height: box(second).height,
          lineHeight,
          right: box(second).right,
          innerWidth: window.innerWidth,
          first: look(ts[0]),
          second: look(second),
          spread: Math.max(...centers) - Math.min(...centers),
        };
      });
      expect.soft(m.height, `B2: «Updated» is one line (height ${m.height}, line-height ${m.lineHeight})`).toBeLessThan(1.5 * m.lineHeight);
      expect.soft(m.right, 'B2: the right edge of «Updated» is inside the window').toBeLessThanOrEqual(m.innerWidth + 0.5);
      expect.soft(m.second, 'B2: «Updated» looks like the first <time> (color, size, case, spacing)').toEqual(m.first);
      if (width >= 1000) {
        // align-items: center puts the pill and the text at different tops but on one centre line; another row is a line-height further
        expect.soft(m.spread, 'B2: every child of the meta line is in one row at 1440').toBeLessThan(4);
      }
    });
  }
}

test.describe('B3 a visitor in UTC−10 sees the same «Updated» date as the crawler', () => {
  test.use({ timezoneId: 'Pacific/Honolulu' });
  // an explicit slug: a fallback to POSTS[0] would let the test pass on any article when this one is renamed or retired (L7)
  const { slug, updatedAt } = POSTS.find((p) => p.slug === 'pricing-ai-products')!;

  test(`B3 ${slug}: the hydrated text equals the server text`, async ({ page, request }) => {
    const ssr = await (await request.get(`/blog/${slug}`)).text();
    const meta = ssr.match(/<div[^>]*class="blog-post__meta"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
    const ssrTimes = [...meta.matchAll(/<time[^>]*>([\s\S]*?)<\/time>/g)].map((x) => x[1].replace(/<[^>]+>/g, '').trim());
    expect.soft(ssrTimes, 'B3: the server renders two <time>').toHaveLength(2);
    await open(page, slug);
    const times = page.locator('.blog-post__meta time');
    const n = await times.count();
    expect.soft(n, 'B3: <time> after hydration').toBe(2);
    if (n !== 2) return;
    await expect.soft(times.nth(1), 'B3: the date does not move by a day').toHaveText(`Updated ${mediumDate(updatedAt)}`);
    await expect.soft(times.nth(1), 'B3: it is the server text').toHaveText(ssrTimes[1] ?? '');
  });
});

test('B4 the Organization logo is served: 200 and image/png', async ({ request }) => {
  const res = await request.get('/');
  const html = await res.text();
  const org = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => JSON.parse(m[1]))
    .find((j) => j['@type'] === 'Organization');
  expect(org, 'B4: no Organization block on /').toBeTruthy();
  const logo = new URL(org.logo as string);
  const img = await request.get(logo.pathname);
  expect(img.status(), `B4: GET ${logo.pathname}`).toBe(200);
  expect(img.headers()['content-type'], 'B4: content-type').toMatch(/^image\/png/);
});
