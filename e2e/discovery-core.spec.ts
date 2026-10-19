import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The discovery core a crawler reads before any page: robots.txt, the IndexNow key, /legal/security.
// Reads the built bytes (run `npm run build` first). LANDING_DIST points at another copy of dist.

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const rd = (p: string) => readFileSync(p, 'utf8');

test('dist ships robots.txt byte-for-byte, and the sitemap its Sitemap line names', () => {
  assert.equal(rd(join(BROWSER, 'robots.txt')), rd(join(ROOT, 'public', 'robots.txt')));
  const line = rd(join(BROWSER, 'robots.txt')).match(/^Sitemap:\s*(\S+)/m)?.[1] ?? '';
  assert.match(line, /^https:\/\/typelessity\.com\/sitemap\.xml$/);
  assert.ok(existsSync(join(BROWSER, 'sitemap.xml')));
});

test('IndexNow: the key file name, its content and the default key of scripts/indexnow.sh are one value', () => {
  const key = rd(join(ROOT, 'scripts', 'indexnow.sh')).match(/INDEXNOW_KEY="\$\{INDEXNOW_KEY:-([0-9a-f]{32})\}"/)?.[1];
  assert.ok(key, 'no default key in scripts/indexnow.sh');
  for (const base of [join(ROOT, 'public'), BROWSER]) {
    assert.equal(rd(join(base, `${key}.txt`)).trim(), key, `${base}: content of ${key}.txt`);
  }
  const vj = JSON.parse(rd(join(ROOT, 'vercel.json'))) as { redirects: { source: string }[] };
  for (const r of vj.redirects) assert.ok(!new RegExp(`^${r.source}$`).test(`/${key}.txt`), `${r.source} catches the key file`);
});

test('/legal/security (FL-02): a built page with one h1 «Security», canonical to itself, in the sitemap, no redirect on it', () => {
  const html = rd(join(BROWSER, 'legal', 'security', 'index.html'));
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
  assert.match(html, /<h1[^>]*>\s*Security\s*<\/h1>/);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/typelessity\.com\/legal\/security"|href="https:\/\/typelessity\.com\/legal\/security"[^>]*rel="canonical"/);
  assert.match(rd(join(BROWSER, 'sitemap.xml')), /<loc>https:\/\/typelessity\.com\/legal\/security<\/loc>/);
  const vj = JSON.parse(rd(join(ROOT, 'vercel.json'))) as { redirects: { source: string }[] };
  for (const r of vj.redirects) assert.ok(!new RegExp(`^${r.source}$`).test('/legal/security'), `${r.source} catches /legal/security`);
});
