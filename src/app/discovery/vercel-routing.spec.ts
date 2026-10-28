import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveRoutes, follow, loadRoutes, loadVercelConfig, matching, respond } from '../../../e2e/vercel-effective';
import { GONE_SLUGS } from '../../../e2e/retired-industries';

// L13 (2026-10-21), cards C1, C10, C11 of the SEO page audit: one spelling of every address (`trailingSlash: false`), a year-long `immutable` only
// for files whose name carries a build hash, and two retired blog addresses that answer 410 instead of a redirect to the list. The rules of
// vercel.json are read here as Vercel reads them (e2e/vercel-effective.ts: the platform's own library turns the file into the ordered list
// of routes; this spec walks it). Whether the platform answers these codes is proved by `curl` on production after the push.
//
// LANDING_VERCEL_JSON points the guard at another copy of vercel.json (the mutation run feeds it the old rules; each must go red).

const config = loadVercelConfig();
const routes = loadRoutes();

test('vercel.json passes the platform\'s own transformation, and the library gives the list back as it was written (the order is the file\'s, not the library\'s)', () => {
  assert.ok(routes.length > 10, 'the transformation returned no routes');
  assert.deepEqual(routes, config['routes'], 'the library moved, added or dropped a route: a key of the old form stands beside `routes`');
  assert.equal(routes.filter((r) => r.handle).length, 1, 'one filesystem phase');
});

// C1: Vercel docs «trailingSlash: false … a path that ends with a forward slash will respond with a 308 status code and redirect to the path
// without the trailing slash» (vercel.com/docs/project-configuration/vercel-json#trailingslash, read 2026-10-21). Before it, /x and /x/ both gave 200.
test('C1: an address with a trailing slash answers 308 to the same address without one, the home page and the files are left alone', () => {
  assert.equal(config['trailingSlash'], undefined, 'trailingSlash is a key of the old form: the slash rule is the first route of the list');
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

test('every 410 rule carries exactly the headers of every page (a 410 rule ends the walk before the rule for every page is reached, so it repeats them)', () => {
  const expected = respond(routes, '/').headers;
  const gone = routes.filter((r) => r.status === 410);
  assert.equal(gone.length, 2, `expected the industries rule and the blog rule, found ${gone.length} routes with status 410`);
  for (const r of gone) assert.deepEqual(Object.fromEntries(Object.entries(r.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])), expected, `a 410 rule drifted from the headers of every page: ${r.src?.slice(0, 40)}`);
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

// SEO24-TYL-1: the ORDER of the list, asked of a made-up set of files (the real dist/ is asked in e2e/vercel-404-dist.spec.ts, which needs a build; this one runs in the hook).
// A route that answers 404 placed in front of the filesystem phase would answer it for the pages as well; a rule placed behind the phase would not be reached by a page.
const FILES = new Set(['/', '/pricing', '/privacy', '/robots.txt', '/404.html', '/main-IBOLA52H.js', '/api/contact']);
const fileOf = (path: string): boolean => FILES.has(path);

test('an address with no file answers 404 with 404.html and the headers of a page; an address with a file is answered by the file', () => {
  const pageHeaders = respond(routes, '/', fileOf).headers;
  for (const p of ['/zz-404-check', '/HOW-IT-WORKS', '/blog/nope-xyz', '/a/b/c', '/foo.js']) {
    const a = respond(routes, p, fileOf);
    assert.equal(a.status, 404, `${p}: ${a.status}`);
    assert.equal(a.dest, '/404.html', p);
    assert.deepEqual(a.headers, pageHeaders, `${p}: the 404 lost the headers of a page`);
  }
  for (const p of FILES) {
    const a = respond(routes, p, fileOf);
    assert.equal(a.served, true, `${p}: a file is there but ${a.status} answers`);
    assert.equal(a.status, undefined, p);
  }
});

test('the rules in front of the phase still answer before it: a redirect, the 410 pages, and the slash form one hop from a page', () => {
  assert.equal(respond(routes, '/legal/privacy', fileOf).status, 308);
  assert.equal(respond(routes, '/industries', fileOf).status, 410);
  assert.equal(respond(routes, '/blog/what-we-got-wrong', fileOf).status, 410);
  const hop = follow(routes, '/pricing/', fileOf);
  assert.equal(hop.hops, 1);
  assert.equal(hop.answer.served, true);
});
