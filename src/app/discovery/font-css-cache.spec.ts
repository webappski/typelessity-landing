import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// code-review C6 (2026-10-05): /fonts/fonts.css has no hash in its name, yet the rule for every .css file gave it
// `immutable` for a year — a changed font stylesheet would not reach a returning visitor. The stylesheet gets a short
// max-age; the long immutable rule is for the hashed build files and must not match it. The Vercel sources are plain
// path patterns, so each is tried here as an anchored regular expression against the real path.

const ROOT = new URL('../../../', import.meta.url);
interface HeaderRule { source: string; headers: { key: string; value: string }[] }
const rules = (JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as { headers: HeaderRule[] }).headers;
const PATH = '/fonts/fonts.css';
const cache = (r: HeaderRule) => r.headers.find((h) => h.key.toLowerCase() === 'cache-control')?.value;

test('fonts.css is cached for a short time, and no immutable rule matches it', () => {
  const matching = rules.filter((r) => new RegExp(`^${r.source}$`).test(PATH));
  const withCache = matching.filter(cache);
  assert.equal(withCache.length, 1, `exactly one Cache-Control rule must match ${PATH}, found ${withCache.map((r) => r.source).join(' | ') || 'none'}`);
  const value = cache(withCache[0])!;
  assert.doesNotMatch(value, /immutable/, `${PATH} is not hashed — it cannot be immutable`);
  const maxAge = Number(value.match(/max-age=(\d+)/)?.[1]);
  assert.ok(maxAge > 0 && maxAge <= 86400, `${PATH} max-age must be short, got ${value}`);
});

test('the hashed build files and the font files keep the long immutable cache', () => {
  for (const path of ['/main-ABC123.js', '/styles-XYZ789.css', '/assets/fonts/dm-sans.woff2']) {
    const value = rules.filter((r) => new RegExp(`^${r.source}$`).test(path)).map(cache).find(Boolean);
    assert.match(value ?? '', /max-age=31536000, immutable/, `${path} lost its long cache`);
  }
});
