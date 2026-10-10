import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BLOG_POSTS } from '../src/app/lib/blog-manifest.generated';

// The home page carries a fixed lastmod: the date of its last significant change (the Free Pilot
// card, 2026-10-10), not the build time. Google, «Build and submit a sitemap» (read 2026-10-10):
// «The <lastmod> value should reflect the date and time of the last significant update to the page»,
// and Google uses it only if it is «consistently and verifiably … accurate». Every other entry
// keeps what it had: posts their own updatedAt ?? publishedAt, the rest no lastmod; 56 URLs.
// Reads the built bytes a crawler receives. Run `npm run build` first.

const SITEMAP = new URL('../dist/typelessity-landing/browser/sitemap.xml', import.meta.url);
const ROOT_LOC = 'https://typelessity.com';
const ROOT_LASTMOD = '2026-10-10';
const URL_COUNT = 56;

async function entries(): Promise<{ loc: string; lastmod?: string }[]> {
  let xml: string;
  try {
    xml = await readFile(SITEMAP, 'utf8');
  } catch {
    throw new Error(`${SITEMAP.pathname} missing — run \`npm run build\` before this check.`);
  }
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>([^<]*)<\/loc>/)![1],
    lastmod: block.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1],
  }));
}

test('sitemap: the home page has its fixed lastmod', async () => {
  const roots = (await entries()).filter((e) => e.loc === ROOT_LOC);
  assert.equal(roots.length, 1, 'exactly one home entry');
  assert.equal(roots[0].lastmod, ROOT_LASTMOD);
});

test('sitemap: 56 unique URLs, posts keep their own date, no other entry has a lastmod', async () => {
  const all = await entries();
  assert.equal(all.length, URL_COUNT);
  assert.equal(new Set(all.map((e) => e.loc)).size, URL_COUNT, 'no duplicate URLs');
  const posts = new Map(BLOG_POSTS.map((p) => [`${ROOT_LOC}/blog/${p.slug}`, p.updatedAt ?? p.publishedAt]));
  for (const e of all) {
    if (e.loc === ROOT_LOC) continue;
    assert.equal(e.lastmod, posts.get(e.loc), `${e.loc}: lastmod changed`);
  }
});
