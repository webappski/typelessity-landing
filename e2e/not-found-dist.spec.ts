import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { countClaims } from './claims-dictionary';

// The shell Vercel serves for an address with no file (vercel.json: framework null, so there is no SPA
// fallback). Built by `postbuild` from the prerendered route /404: browser/404/index.html is moved to
// browser/404.html and browser/404/ is removed — otherwise /404 would answer 200 on the platform.
// Reads the built bytes (run `npm run build` first). LANDING_DIST points at another copy of dist.

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const file = join(BROWSER, '404.html');
const html = existsSync(file) ? readFileSync(file, 'utf8') : '';

test('dist has 404.html and no 404/ (a page at /404 would answer 200)', () => {
  assert.ok(existsSync(file), '404.html is missing: postbuild did not move the prerendered /404');
  assert.ok(!existsSync(join(BROWSER, '404')), 'dist/404/ is left behind: /404 would be a page that answers 200');
});

test('404.html says the page does not exist, with one h1 and a base href', () => {
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
  assert.match(html, /<h1[^>]*>\s*This page doesn't exist\s*<\/h1>/);
  assert.match(html, /<base href="\/">/);
});

// L12 (C12): this file is the body of every 404 and of the 410 of the retired pages (vercel.json routes → /404.html). It names no address as its
// own — a canonical to /404 would tell a crawler that the answer for every retired address is the page /404 — and it asks not to be indexed.
test('404.html has no rel=canonical and one robots meta with noindex (the same file is the body of the 410)', () => {
  assert.equal([...html.matchAll(/<link[^>]*rel="canonical"/g)].length, 0, '404.html names a canonical');
  const robots = [...html.matchAll(/<meta[^>]*name="robots"[^>]*>/g)].map((m) => m[0]);
  assert.equal(robots.length, 1, `${robots.length} robots meta tags`);
  assert.match(robots[0], /content="noindex"/);
});

test('every other prerendered page has no robots meta but the articles, which allow a large image preview or say nothing', () => {
  const bad: string[] = [];
  const walk = (dir: string) => { for (const n of readdirSync(dir)) { const f = join(dir, n); if (statSync(f).isDirectory()) walk(f); else if (n.endsWith('.html') && n !== '404.html') { const h = readFileSync(f, 'utf8'); if (/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(h)) bad.push(f.replace(BROWSER, '')); } } };
  walk(BROWSER);
  assert.deepEqual(bad, [], 'a page of the site says noindex');
});

test('404.html loads from any depth: every local script, style and font it names is a file in dist', () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1])
    .filter((r) => !/^(https?:)?\/\//.test(r) && !r.startsWith('mailto:') && r !== '/' && !/^\/[a-z-]+\/?$/.test(r) && !r.startsWith('/legal'));
  assert.ok(refs.length >= 2, 'no assets referenced — the shell would be unstyled');
  for (const r of refs) assert.ok(existsSync(join(BROWSER, r.replace(/^\//, ''))), `${r} is referenced by 404.html but is not in dist`);
});

test('404.html prints none of the words the site does not print, and its footer leads Terms and DPA to Typelessity documents', () => {
  assert.deepEqual(countClaims(html), {});
  const footer = html.match(/<footer[^>]*class="vc-footer"[\s\S]*?<\/footer>/)?.[0] ?? '';
  assert.ok(footer, '404.html has no footer');
  assert.match(footer, /href="https:\/\/webappski\.com\/en\/legal\/terms-typelessity"/);
  assert.match(footer, /href="https:\/\/webappski\.com\/en\/legal\/dpa-typelessity"/);
});

test('the 404 page is not in the sitemap', () => {
  const sitemap = readFileSync(join(BROWSER, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/404(\.html)?<\/loc>/);
  assert.doesNotMatch(sitemap, /index\.csr\.html/);
});
