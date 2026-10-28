import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { distFilesystem, follow, loadRoutes, respond } from './vercel-effective';
import { expectedSitemapCount } from './retired-industries';

// SEO24-TYL-1: an address with no file answers 404 with the page 404.html, and an address with a file is never taken from it by a rule. Until this card the platform answered
// an unknown address with the home page and a 200 (audit of 24.10; FL-92), so a typo, a retired link or a crawler's probe looked like a page of the site. vercel.json ends with the
// filesystem phase and one route behind it that answers 404 (e2e/vercel-effective.ts says where that comes from and what it rests on); this file asks it of the real dist/:
//   - the five probes of the card, and three more that are easy to get wrong (a directory with no index, an industry slug that never existed, a path under a real page) answer 404,
//     with 404.html and with the same security headers as a page;
//   - every file of dist/ and every address of the sitemap is answered by the file: no rule in front of the phase swallows one (the failure of a 404 route placed before the phase);
//   - the redirects and the 410 pages still answer in front of the phase.
// LANDING_DIST points at another copy of dist, LANDING_VERCEL_JSON at another copy of vercel.json (mutation runs). Run `npm run build` first.
// The model is not the platform: that the platform does the same is shown by `curl` on production after the push (the five probes, the 21 addresses, the headers).

const ROOT = new URL('../', import.meta.url).pathname;
const DIST = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const routes = loadRoutes();
// The Vercel Functions of the project answer in the same phase as the files: api/contact.ts is /api/contact (the contact form posts to it).
const FUNCTIONS = readdirSync(join(ROOT, 'api')).filter((f) => /\.(ts|js|mjs)$/.test(f)).map((f) => `/api/${f.replace(/\.[^.]+$/, '')}`);
const fs = distFilesystem(DIST, FUNCTIONS);
const SECURITY = ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy'];
const pageHeaders = respond(routes, '/', fs).headers;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
}

test('dist/ has what the checks below stand on: the page 404.html, the home page, and the headers of a page', () => {
  assert.ok(existsSync(join(DIST, '404.html')), 'dist/404.html is missing — run `npm run build`');
  assert.ok(existsSync(join(DIST, 'index.html')), 'dist/index.html is missing — run `npm run build`');
  for (const name of SECURITY) assert.ok(pageHeaders[name], `a page of the site has no ${name}`);
});

test('an address with no file answers 404 with the page 404.html and the security headers of a page', () => {
  const probes = [
    '/zz-404-check', '/HOW-IT-WORKS', '/blog/nope-xyz', '/a/b/c', '/foo.js', // the five of the card
    '/legal', '/industries/no-such-slug', '/pricing/extra', // a directory with no index, an address that never existed under a retired one, a path under a real page
  ];
  for (const p of probes) {
    const a = respond(routes, p, fs);
    assert.equal(a.status, 404, `${p}: ${a.status ?? 'no rule ended the walk'} (served by a file: ${a.served})`);
    assert.equal(a.dest, '/404.html', `${p}: ${a.dest}`);
    assert.equal(a.location, undefined, `${p} redirects to ${a.location}`);
    assert.deepEqual(a.headers, pageHeaders, `${p}: the 404 does not carry the headers of a page`);
  }
});

test('the function of api/ is answered by the function, not by the 404: /api/contact (the contact form posts to it)', () => {
  assert.ok(FUNCTIONS.includes('/api/contact'), `api/ holds ${FUNCTIONS.join(', ') || 'nothing'}`);
  for (const p of FUNCTIONS) {
    const a = respond(routes, p, fs);
    assert.equal(a.status, undefined, `${p}: a rule answers ${a.status}`);
    assert.equal(a.served, true, `${p} is not reached by the filesystem phase`);
  }
});

test('every file of dist/ is answered by the file itself: no rule in front of the filesystem phase takes one', () => {
  const all = files(DIST).map((f) => `/${relative(DIST, f)}`);
  assert.ok(all.length >= 40, `${all.length} files in dist — the walk did not read the build`);
  const wrong = all.filter((p) => {
    const a = respond(routes, p, fs);
    return a.served !== true || a.status !== undefined;
  });
  assert.deepEqual(wrong, [], 'a file of dist/ is not what answers its own address');
});

test('every address of the sitemap is a file of dist/ and carries the headers of a page', () => {
  const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const paths = [...xml.matchAll(/<loc>https:\/\/typelessity\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  assert.equal(paths.length, expectedSitemapCount(), `${paths.length} addresses in the sitemap`);
  for (const p of paths) {
    const a = respond(routes, p, fs);
    assert.equal(a.status, undefined, `${p}: a rule answers ${a.status}`);
    assert.equal(a.served, true, `${p} has no file in dist/`);
    for (const name of SECURITY) assert.ok(a.headers[name], `${p} lost ${name}`);
  }
});

test('the discovery files answer from dist/ with their own types: robots.txt, sitemap.xml, llms.txt, llms-full.txt', () => {
  for (const p of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']) {
    const a = respond(routes, p, fs);
    assert.equal(a.served, true, `${p} has no file in dist/ or a rule answers ${a.status}`);
  }
  assert.equal(respond(routes, '/llms.txt', fs).headers['content-type'], 'text/plain; charset=utf-8');
  assert.equal(respond(routes, '/sitemap.xml', fs).headers['content-type'], 'application/xml; charset=utf-8');
});

test('in front of the phase nothing changed: the redirects and the 410 pages still answer, the slash forms are one hop', () => {
  for (const [p, status] of [['/industries', 410], ['/industries/home-cleaning', 410], ['/blog/what-we-got-wrong', 410], ['/blog/forms-vs-conversation-study', 410]] as const) {
    assert.equal(respond(routes, p, fs).status, status, p);
    assert.equal(respond(routes, p, fs).dest, '/404.html', p);
  }
  assert.equal(respond(routes, '/legal/privacy', fs).location, '/privacy');
  assert.equal(respond(routes, '/blog/gdpr-compliance', fs).location, '/gdpr');
  for (const p of ['/pricing/', '/blog/best-ai-booking-widgets-2026/', '/industries/']) {
    const hop = follow(routes, p, fs);
    assert.equal(hop.hops, 1, `${p}: ${hop.hops} hops`);
    assert.equal(hop.path, p.slice(0, -1), p);
  }
  assert.equal(follow(routes, '/industries/', fs).answer.status, 410);
  assert.equal(follow(routes, '/pricing/', fs).answer.served, true);
});
