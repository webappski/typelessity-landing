import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';

// A45d (c8 2026-09-25/27, founder: «decide by best practice»).
//  - what-we-got-wrong (a history of «three GTM pivots» that predates the repo) and
//    forms-vs-conversation-study (a «study» with no study behind it) are taken down: no page,
//    no sitemap URL, no link to them; each old URL answers 301 → /blog (vercel.json — there is no
//    local Vercel, so the rule is read, not requested).
//  - Every post is dated the day it first appeared in this repo, 2026-05-21 (`git log
//    --diff-filter=A`); the older dates were earlier than the product. Google Search Central,
//    «publication dates»: the visible date and the date in structured data must match, and a
//    date must be a real one — so datePublished equals the <time> in the header, and
//    dateModified is never earlier than it.
//  - /about no longer tells the pre-repo history: no «three GTM pivots», no «early 2025».
// Run `npm run build` first.

const ROOT = new URL('../', import.meta.url);
// LANDING_DIST points at another copy of dist/typelessity-landing/browser (the mutation run, L2).
const DIST = process.env['LANDING_DIST']
  ? pathToFileURL(`${process.env['LANDING_DIST']}/`)
  : new URL('../dist/typelessity-landing/browser/', import.meta.url);
const RETIRED = ['what-we-got-wrong', 'forms-vs-conversation-study'];
const FIRST_PUBLISHED = '2026-05-21';

async function read(url: URL): Promise<string> {
  try {
    return await readFile(url, 'utf8');
  } catch {
    throw new Error(`${url.pathname} missing — run \`npm run build\` before this check.`);
  }
}

async function exists(url: URL): Promise<boolean> {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

test('retired posts: no page, no sitemap URL, no link, and a 301 to /blog', async () => {
  const sitemap = await read(new URL('sitemap.xml', DIST));
  const vercel = JSON.parse(await read(new URL('vercel.json', ROOT))) as {
    redirects: { source: string; destination: string; permanent: boolean }[];
  };
  const pages = ['index.html', 'blog/index.html', 'about/index.html', 'llms.txt', 'llms-full.txt'];
  const posts = (await readdir(new URL('blog/', DIST), { withFileTypes: true })).filter((e) => e.isDirectory());
  const bodies = await Promise.all([
    ...pages.map((p) => read(new URL(p, DIST))),
    ...posts.map((e) => read(new URL(`blog/${e.name}/index.html`, DIST))),
  ]);
  for (const slug of RETIRED) {
    assert.equal(await exists(new URL(`blog/${slug}/`, DIST)), false, `dist/blog/${slug} still built`);
    assert.doesNotMatch(sitemap, new RegExp(`/blog/${slug}<`), `sitemap still lists ${slug}`);
    for (const body of bodies) assert.doesNotMatch(body, new RegExp(`/blog/${slug}\\b`), `a page still links to ${slug}`);
    const rule = vercel.redirects.find((r) => r.source === `/blog/${slug}`);
    assert.ok(rule, `vercel.json has no redirect for /blog/${slug}`);
    assert.equal(rule.destination, '/blog');
    assert.equal(rule.permanent, true);
  }
});

test('every post: the date in the header is the date in the structured data, and it is real', async () => {
  const posts = (await readdir(new URL('blog/', DIST), { withFileTypes: true })).filter((e) => e.isDirectory());
  assert.ok(posts.length >= 11, `expected the 11 posts under dist/blog, found ${posts.length}`);
  for (const { name } of posts) {
    const body = await read(new URL(`blog/${name}/index.html`, DIST));
    const shown = body.match(/<time[^>]*datetime="([0-9-]+)"/)?.[1];
    const published = body.match(/"datePublished":\s*"([0-9-]+)"/)?.[1];
    const modified = body.match(/"dateModified":\s*"([0-9-]+)"/)?.[1];
    assert.equal(shown, FIRST_PUBLISHED, `${name}: header date ${shown}`);
    assert.equal(published, shown, `${name}: datePublished ${published} ≠ header ${shown}`);
    assert.ok(modified && modified >= published!, `${name}: dateModified ${modified} before datePublished ${published}`);
  }
});

test('/about and llms-full: no history from before the repo', async () => {
  for (const path of ['about/index.html', 'llms-full.txt']) {
    const body = await read(new URL(path, DIST));
    assert.doesNotMatch(body, /GTM pivots?/i, `${path} still tells the GTM pivots`);
    assert.doesNotMatch(body, /early 2025/i, `${path} still says early 2025`);
    assert.match(body, /Started the Typelessity engine in January 2026/, `${path} lost the engine start date`);
  }
});

// L2 (J10): the header of an article shows the date of the last change next to the date of publication, and it is the
// date the structured data states. Google Search Central, «publication dates» (read 2026-10-19): label the dates
// («Last updated») and keep «a match between the equivalent user-visible and structured values».
// Read from the SSR bytes of dist; the expected values come from the .mdx frontmatter and a written month table —
// not from DatePipe, Intl or the manifest the page itself is built from.
const BLOG_SRC = new URL('../src/assets/content/blog/', import.meta.url);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SLUGS = readdirSync(BLOG_SRC).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')).sort();
/** `2026-10-03` → `Oct 3, 2026` (DatePipe «mediumDate», en-US) */
const mediumDate = (iso: string): string => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  assert.ok(m, `${iso} is not a plain date`);
  return `${MONTHS[Number(m![2]) - 1]} ${Number(m![3])}, ${m![1]}`;
};
const fm = (slug: string) => {
  const data = matter(readFileSync(new URL(`${slug}.mdx`, BLOG_SRC), 'utf8')).data as { publishedAt: unknown; updatedAt: unknown };
  // A date written without quotes becomes a Date object in YAML and the manifest would carry a full ISO string.
  assert.equal(typeof data.updatedAt, 'string', `${slug}: updatedAt is not a quoted string`);
  assert.match(String(data.updatedAt), /^\d{4}-\d{2}-\d{2}$/, `${slug}: updatedAt`);
  assert.match(String(data.publishedAt), /^\d{4}-\d{2}-\d{2}$/, `${slug}: publishedAt`);
  return { publishedAt: String(data.publishedAt), updatedAt: String(data.updatedAt) };
};
const metaTimes = (html: string): Array<{ datetime: string; text: string }> => {
  const meta = html.match(/<div[^>]*class="blog-post__meta"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
  return [...meta.matchAll(/<time[^>]*datetime="([^"]*)"[^>]*>([\s\S]*?)<\/time>/g)].map((m) => ({
    datetime: m[1],
    text: m[2].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  }));
};

test('every article header: exactly two <time>, the first is publication', async (t) => {
  assert.equal(SLUGS.length, 11);
  await t.test('two <time> in .blog-post__meta', async () => {
    const bad: string[] = [];
    for (const slug of SLUGS) {
      const n = metaTimes(await read(new URL(`blog/${slug}/index.html`, DIST))).length;
      if (n !== 2) bad.push(`${slug}: ${n} <time> in the header meta`);
    }
    assert.deepEqual(bad, []);
  });
  await t.test('the first <time> stays the date of publication (datetime = publishedAt = datePublished)', async () => {
    const bad: string[] = [];
    for (const slug of SLUGS) {
      const html = await read(new URL(`blog/${slug}/index.html`, DIST));
      const first = metaTimes(html)[0];
      const published = html.match(/"datePublished":\s*"([0-9-]+)"/)?.[1];
      if (first?.datetime !== fm(slug).publishedAt || published !== first?.datetime) bad.push(`${slug}: first <time> ${first?.datetime}, datePublished ${published}, frontmatter ${fm(slug).publishedAt}`);
    }
    assert.deepEqual(bad, []);
  });
});

test('every article: dateModified and article:modified_time are updatedAt of the frontmatter', async () => {
  const bad: string[] = [];
  for (const slug of SLUGS) {
    const html = await read(new URL(`blog/${slug}/index.html`, DIST));
    const modified = html.match(/"dateModified":\s*"([0-9-]+)"/)?.[1];
    const metaTag = html.match(/<meta[^>]*property="article:modified_time"[^>]*content="([^"]*)"/)?.[1]
      ?? html.match(/<meta[^>]*content="([^"]*)"[^>]*property="article:modified_time"/)?.[1];
    const want = fm(slug).updatedAt;
    if (modified !== want) bad.push(`${slug}: dateModified ${modified} ≠ updatedAt ${want}`);
    if (metaTag !== want) bad.push(`${slug}: article:modified_time ${metaTag} ≠ updatedAt ${want}`);
  }
  assert.deepEqual(bad, []);
});

test('every article header shows «Updated <date>» as the second <time>, the date the structured data states', async (t) => {
  await t.test('the second <time> datetime = updatedAt = dateModified', async () => {
    const bad: string[] = [];
    for (const slug of SLUGS) {
      const html = await read(new URL(`blog/${slug}/index.html`, DIST));
      const second = metaTimes(html)[1];
      const modified = html.match(/"dateModified":\s*"([0-9-]+)"/)?.[1];
      const want = fm(slug).updatedAt;
      if (second?.datetime !== want || modified !== want) bad.push(`${slug}: second <time> ${second?.datetime ?? '(none)'}, dateModified ${modified}, updatedAt ${want}`);
    }
    assert.deepEqual(bad, []);
  });
  await t.test('its text is «Updated » + the medium date of updatedAt', async () => {
    const bad: string[] = [];
    for (const slug of SLUGS) {
      const second = metaTimes(await read(new URL(`blog/${slug}/index.html`, DIST)))[1];
      const want = `Updated ${mediumDate(fm(slug).updatedAt)}`;
      if (second?.text !== want) bad.push(`${slug}: «${second?.text ?? '(none)'}», want «${want}»`);
    }
    assert.deepEqual(bad, []);
  });
});
