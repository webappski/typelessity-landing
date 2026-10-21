import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { effectiveRoutes, follow, matching, respond } from '../../../e2e/vercel-effective';
import { GONE_SLUGS } from '../../../e2e/retired-industries';

// L13 (2026-10-21), cards C1, C10, C11 of the SEO page audit: one spelling of every address (`trailingSlash: false`), a year-long `immutable` only
// for files whose name carries a build hash, and two retired blog addresses that answer 410 instead of a redirect to the list. The rules of
// vercel.json are read here as Vercel reads them (e2e/vercel-effective.ts: the platform's own library turns the file into the ordered list
// of routes; this spec walks it). Whether the platform answers these codes is proved by `curl` on production after the push.
//
// LANDING_VERCEL_JSON points the guard at another copy of vercel.json (the mutation run feeds it the old rules; each must go red).

const ROOT = new URL('../../../', import.meta.url);
const config = JSON.parse(readFileSync(process.env['LANDING_VERCEL_JSON'] ?? new URL('vercel.json', ROOT), 'utf8')) as Record<string, unknown>;
const routes = effectiveRoutes(config);

test('vercel.json passes the platform\'s own transformation and has no catch-all that hides a file behind a rule', () => {
  assert.ok(routes.length > 10, 'the transformation returned no routes');
  assert.equal(routes.some((r) => r.handle), false, 'a handle phase puts the redirects and headers behind it (FL-92: the variant that was not shipped)');
});

// C1: Vercel docs «trailingSlash: false … a path that ends with a forward slash will respond with a 308 status code and redirect to the path
// without the trailing slash» (vercel.com/docs/project-configuration/vercel-json#trailingslash, read 2026-10-21). Before it, /x and /x/ both gave 200.
test('C1: an address with a trailing slash answers 308 to the same address without one, the home page and the files are left alone', () => {
  assert.equal(config['trailingSlash'], false);
  for (const slashed of ['/how-it-works/', '/pricing/', '/blog/best-ai-booking-widgets-2026/', '/install/', '/legal/security/']) {
    const a = respond(routes, slashed);
    assert.equal(a.status, 308, `${slashed}: ${a.status}`);
    assert.equal(a.location, slashed.slice(0, -1), `${slashed} goes to ${a.location}`);
  }
  for (const same of ['/', '/how-it-works', '/pricing', '/robots.txt', '/sitemap.xml', '/llms.txt', '/og-image.jpg']) {
    assert.equal(respond(routes, same).status, undefined, `${same} is redirected or ended by a rule`);
  }
});

test('C1: an address of the 410 list with a trailing slash goes to the address without it and answers 410 there (one hop)', () => {
  for (const p of ['/industries/', ...GONE_SLUGS.map((s) => `/industries/${s}/`), '/blog/what-we-got-wrong/', '/blog/forms-vs-conversation-study/']) {
    const { answer, hops } = follow(routes, p);
    assert.equal(answer.status, 410, `${p}: ${answer.status} after ${hops} hops`);
    assert.equal(hops, 1, `${p}: ${hops} hops`);
  }
});

test('the hub and each of the 37 industry addresses answer 410 with the page 404.html', () => {
  for (const p of ['/industries', ...GONE_SLUGS.map((s) => `/industries/${s}`)]) {
    const a = respond(routes, p);
    assert.equal(a.status, 410, p);
    assert.equal(a.dest, '/404.html', p);
  }
});

// C11: the two articles taken down before the repo's history had a successor that answers their question; a redirect of many old
// addresses to one unrelated list is the pattern Google reads as a soft 404 (seo-lead page audit F-17, E20). 410 says «was here, is gone».
// `/blog/gdpr-compliance` is NOT among them: it has a successor (/gdpr) and the permanent redirect stays until 2027-10-19 (card L7).
test('C11: the two retired articles answer 410, not a redirect to the list; the merged article still goes to /gdpr', () => {
  for (const p of ['/blog/what-we-got-wrong', '/blog/forms-vs-conversation-study']) {
    const a = respond(routes, p);
    assert.equal(a.status, 410, p);
    assert.equal(a.dest, '/404.html', p);
    assert.equal(a.location, undefined, `${p} still redirects`);
  }
  const merged = respond(routes, '/blog/gdpr-compliance');
  assert.equal(merged.status, 308);
  assert.equal(merged.location, '/gdpr');
});

test('C11: the 410 rules leave look-alikes and the live articles alone', () => {
  for (const p of ['/blog', '/blog/best-ai-booking-widgets-2026', '/blog/what-we-got-wrong-2', '/blog/what-we-got-wrong/x', '/blog/forms-vs-conversation', '/blog/x-what-we-got-wrong']) {
    assert.notEqual(respond(routes, p).status, 410, `${p} answers 410`);
  }
});

test('every 410 rule carries exactly the headers of the block for every page (routes run before headers, so the rule repeats them)', () => {
  const block = (config['headers'] as Array<{ source: string; headers: Array<{ key: string; value: string }> }>).find((h) => h.source === '/(.*)')!;
  const expected = Object.fromEntries(block.headers.map((h) => [h.key.toLowerCase(), h.value]));
  const gone = routes.filter((r) => r.status === 410);
  assert.equal(gone.length, 2, `expected the industries rule and the blog rule, found ${gone.length} routes with status 410`);
  for (const r of gone) assert.deepEqual(Object.fromEntries(Object.entries(r.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])), expected, `a 410 rule drifted from the block for every page: ${r.src?.slice(0, 40)}`);
});

// C10: `immutable` is a promise that the file at this URL never changes. Only a file whose name carries a hash of its content can keep it.
const IMMUTABLE = /max-age=31536000, immutable/;
const cache = (p: string): string | undefined => respond(routes, p).headers['cache-control'];

test('C10: build files with a hash in the name and the font files are immutable for a year', () => {
  for (const p of ['/main-IBOLA52H.js', '/chunk-4RL4HBB5.js', '/polyfills-ABCD1234.js', '/styles-GZM6TPNI.css', '/fonts/JTUSjIg1_i6t8kCHKm459WdhyyTh89ZNpQ.woff2', '/fonts/i7dMIFZifjKcF5UAWdDRYE58RXi4EwSsbg.woff2']) {
    assert.match(cache(p) ?? '', IMMUTABLE, `${p}: ${cache(p)}`);
  }
});

test('C10: a file whose name does not change when its content does is never immutable', () => {
  for (const p of ['/og-image.jpg', '/logo-512.png', '/favicon.svg', '/favicon.ico', '/og-blog-best-ai-booking-widgets-2026.png', '/foo.js', '/script.js', '/main.js', '/chunk-short.js', '/styles.css', '/fonts/fonts.css', '/robots.txt', '/llms.txt', '/sitemap.xml', '/']) {
    assert.doesNotMatch(cache(p) ?? '', /immutable/, `${p}: ${cache(p)}`);
  }
  for (const p of ['/og-image.jpg', '/logo-512.png', '/favicon.svg', '/og-blog-best-ai-booking-widgets-2026.png']) {
    const maxAge = Number(cache(p)?.match(/max-age=(\d+)/)?.[1]);
    assert.ok(maxAge > 0 && maxAge <= 86400, `${p} needs a day at most, got ${cache(p)}`);
  }
});

test('C10: no address meets two rules that set Cache-Control (the later would silently win)', () => {
  const probes = ['/main-IBOLA52H.js', '/styles-GZM6TPNI.css', '/fonts/a.woff2', '/fonts/fonts.css', '/og-image.jpg', '/favicon.ico', '/sitemap.xml', '/sitemap-2.xml', '/llms.txt', '/robots.txt', '/foo.js', '/'];
  for (const p of probes) {
    const setting = matching(routes, p).filter((r) => Object.keys(r.headers ?? {}).some((k) => k.toLowerCase() === 'cache-control'));
    assert.ok(setting.length <= 1, `${p}: ${setting.length} rules set Cache-Control (${setting.map((r) => r.src).join(' | ')})`);
  }
});

test('the security headers reach every address that is not ended by a rule', () => {
  for (const p of ['/', '/pricing', '/main-IBOLA52H.js', '/og-image.jpg', '/sitemap.xml']) {
    const h = respond(routes, p).headers;
    for (const name of ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options']) assert.ok(h[name], `${p} lost ${name}`);
  }
});
