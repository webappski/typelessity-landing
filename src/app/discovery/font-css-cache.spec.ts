import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRoutes, matching, respond } from '../../../e2e/vercel-effective';

// code-review C6 (2026-10-05): /fonts/fonts.css has no hash in its name, yet the rule for every .css file gave it
// `immutable` for a year — a changed font stylesheet would not reach a returning visitor. The stylesheet gets a short
// max-age; the long immutable rule is for the hashed build files and must not match it. Asked of the routes the platform
// runs (e2e/vercel-effective.ts): which rules take the path and what Cache-Control the answer carries.

const routes = loadRoutes();
const PATH = '/fonts/fonts.css';
const cacheOf = (r: { headers?: Record<string, string> }) => Object.entries(r.headers ?? {}).find(([name]) => name.toLowerCase() === 'cache-control')?.[1];

test('fonts.css is cached for a short time, and no immutable rule matches it', () => {
  const withCache = matching(routes, PATH).filter(cacheOf);
  assert.equal(withCache.length, 1, `exactly one Cache-Control rule must match ${PATH}, found ${withCache.map((r) => r.src).join(' | ') || 'none'}`);
  const value = respond(routes, PATH).headers['cache-control']!;
  assert.doesNotMatch(value, /immutable/, `${PATH} is not hashed — it cannot be immutable`);
  const maxAge = Number(value.match(/max-age=(\d+)/)?.[1]);
  assert.ok(maxAge > 0 && maxAge <= 86400, `${PATH} max-age must be short, got ${value}`);
});

test('the hashed build files and the font files keep the long immutable cache', () => {
  for (const path of ['/main-ABCD1234.js', '/styles-WXYZ7890.css', '/fonts/i7dMIFZifjKcF5UAWdDRYE58RXi4EwSsbg.woff2']) {
    const value = respond(routes, path).headers['cache-control'];
    assert.match(value ?? '', /max-age=31536000, immutable/, `${path} lost its long cache`);
  }
});
