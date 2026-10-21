import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// L13 (legal L-2 / gate G-3): /privacy is a prerendered page of this domain — the bytes a crawler receives, read from dist/ (npm run build first).
// The wording is held by src/app/pages/privacy/privacy.content.spec.ts (unit tier); here: the page exists, is found (sitemap, footer of the home page
// and of an article), is indexable and canonical to itself, and /legal/privacy still goes to the DPA until the lawyer decides (the brief).
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

test('/legal/privacy keeps going to the DPA (the lawyer decides where it ends); /privacy is not a redirect', () => {
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as { redirects: Array<{ source: string; destination: string }> };
  assert.equal(vercel.redirects.find((r) => r.source === '/legal/privacy')?.destination, 'https://webappski.com/en/legal/dpa-typelessity');
  assert.equal(vercel.redirects.some((r) => r.source === '/privacy'), false);
});
