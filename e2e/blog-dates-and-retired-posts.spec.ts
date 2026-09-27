import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';

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
const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);
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
