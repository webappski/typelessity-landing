import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { effectiveRoutes, follow, respond } from './vercel-effective';

// L13 (legal L-2 / gate G-3): /privacy is a prerendered page of this domain — the bytes a crawler receives, read from dist/ (npm run build first).
// The wording is held by src/app/pages/privacy/privacy.content.spec.ts (unit tier); here: the page exists, is found (sitemap, footer of the home page
// and of an article), is indexable and canonical to itself, and /legal/privacy ends on it (legal F-4: the address «privacy» no longer leads to the contract between a business and its processor).
const DIST = join(new URL('../', import.meta.url).pathname, 'dist/typelessity-landing/browser');
const read = (p: string) => {
  if (!existsSync(join(DIST, p))) throw new Error(`${p} missing in dist — run \`npm run build\` first`);
  return readFileSync(join(DIST, p), 'utf8');
};

test('/privacy: one h1, canonical to itself, indexable, a title and a description of its own', () => {
  const html = read('privacy/index.html');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h1[^>]*>Privacy on typelessity\.com<\/h1>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/typelessity\.com\/privacy"/);
  assert.doesNotMatch(html, /name="robots"[^>]*noindex/);
  assert.match(html, /<title>Privacy notice for typelessity\.com — Typelessity<\/title>/);
  assert.match(html, /<meta name="description" content="What typelessity\.com collects about a visitor/);
});

test('/privacy is in the sitemap once, and the footer of the home page and of an article links to it', () => {
  const xml = read('sitemap.xml');
  assert.equal((xml.match(/<loc>https:\/\/typelessity\.com\/privacy<\/loc>/g) ?? []).length, 1);
  for (const page of ['index.html', 'blog/best-ai-booking-widgets-2026/index.html', 'privacy/index.html']) {
    assert.match(read(page), /<a[^>]*href="\/privacy"[^>]*>Privacy notice<\/a>/, `${page}: no footer link «Privacy notice» to /privacy`);
  }
});

// L13 round of judges (test-design L13-4, legal F-4): asked of the routes Vercel builds from vercel.json (@vercel/routing-utils, e2e/vercel-effective.ts), not of the raw
// `redirects` list — a rule of `routes` or a pattern that happened to cover /privacy would not be seen by a search of `source` strings.
test('/legal/privacy ends on /privacy (a 308), not on the DPA; /privacy and /privacy/ behave: the page is a file of dist/, the slash form is one 308 away', () => {
  const routes = effectiveRoutes(JSON.parse(readFileSync(process.env['LANDING_VERCEL_JSON'] ?? new URL('../vercel.json', import.meta.url), 'utf8')));
  const legal = respond(routes, '/legal/privacy');
  assert.equal(legal.status, 308, '/legal/privacy is a permanent redirect');
  assert.equal(legal.location, '/privacy', '/legal/privacy ends on the notice of this site, no longer on the contract (legal F-4)');
  assert.doesNotMatch(String(legal.location), /dpa-typelessity/);
  assert.equal(respond(routes, '/privacy').status, undefined, '/privacy is not redirected: a file of dist/ answers');
  const slash = respond(routes, '/privacy/');
  assert.equal(slash.status, 308, '/privacy/ is not a second address of the page');
  assert.equal(slash.location, '/privacy');
  const chained = follow(routes, '/legal/privacy/');
  assert.equal(chained.path, '/privacy', 'the slash form of the old address also ends on /privacy');
  assert.equal(chained.answer.status, undefined);
});
