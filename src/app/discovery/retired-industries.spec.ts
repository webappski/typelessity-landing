import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GONE_SLUGS, RETIRED_SLUGS, SEVEN_SLUGS } from '../../../e2e/retired-industries';

// L1б (2026-10-19): 29 thin industry pages and the clinics address answer 410. L11 (2026-10-20, founder: «we do not need industries»):
// the hub and the seven kept pages answer 410 too, and the site has no industry page at all. Nothing redirects to a page: the clinics
// address was a redirect to the hub once, and a redirect to a hub that lists none of its subjects is the soft 404 Google warns of.
// The rule is a written list, not a wildcard: an address that never existed (/industries/no-such-slug) stays a 404 — 410 says «was here».
//
// A unit-tier guard on purpose: only `npm test` runs in the pre-commit and pre-push hooks, and the local SSR server
// does not apply vercel.json. What this file proves is the content of the rule (which addresses it takes and which it
// leaves, which headers it carries); that the platform answers 410 with the body of 404.html is proved by `curl` on
// the preview of the commit (card L1b «На превью») — a property of the platform that no unit test can hold.

const ROOT = new URL('../../../', import.meta.url);

interface Header { key: string; value: string }
interface Route { src: string; status?: number; dest?: string; headers?: Header[] | Record<string, string>; handle?: string }
interface Rule { source: string; destination?: string }
interface VercelJson { routes?: Route[]; redirects?: Rule[]; rewrites?: Rule[]; headers?: Array<{ source: string; headers: Header[] }> }

// LANDING_VERCEL_JSON points the guard at another copy of vercel.json (the mutation run feeds it a spoiled one; it must go red).
const vercel = JSON.parse(readFileSync(process.env['LANDING_VERCEL_JSON'] ?? new URL('vercel.json', ROOT), 'utf8')) as VercelJson;
const gone = (vercel.routes ?? []).filter((r) => r.status === 410);
const rule = gone[0];
const taken = (path: string): boolean => new RegExp(rule.src).test(path);

test('the lists are what the card says: 30 retired and 7 taken down at L11, none twice, 37 addresses in all', () => {
  assert.equal(RETIRED_SLUGS.length, 30);
  assert.equal(SEVEN_SLUGS.length, 7);
  assert.deepEqual(RETIRED_SLUGS.filter((s) => SEVEN_SLUGS.includes(s)), []);
  assert.equal(new Set(GONE_SLUGS).size, 37, 'RETIRED + SEVEN is the 36 pages of d0cbafe plus the clinics address');
});

test('the site has no industry module any more: no data, no component, no route, no prerender', () => {
  for (const path of ['src/app/lib/industries', 'src/app/pages/industries']) assert.equal(existsSync(new URL(path, ROOT)), false, `${path} is back`);
  const routes = readFileSync(new URL('src/app/app.routes.ts', ROOT), 'utf8');
  const server = readFileSync(new URL('src/app/app.routes.server.ts', ROOT), 'utf8');
  assert.doesNotMatch(routes, /industr/i, 'app.routes.ts has an industries route');
  assert.doesNotMatch(server, /industr/i, 'app.routes.server.ts prerenders an industries page');
  const sitemap = readFileSync(new URL('tools/build-sitemap.ts', ROOT), 'utf8');
  assert.doesNotMatch(sitemap, /industr/i, 'the sitemap generator names industries');
});

test('vercel.json holds exactly one 410 route: anchored, no handle, no catch-all', () => {
  assert.equal(gone.length, 1, `expected one route with status 410, found ${gone.length}`);
  assert.equal(rule.handle, undefined, 'a handle phase would make the rule catch more than the list');
  assert.match(rule.src, /^\^/, 'the src must start with ^');
  assert.match(rule.src, /\$$/, 'the src must end with $');
  assert.doesNotMatch(rule.src, /\.\*|\(\.\+\)|\[\^\/\]\*/, 'the src must not hold a wildcard');
});

test('the 410 rule takes the hub and each of the 37 addresses that had a page, with and without a trailing slash', () => {
  const missed = GONE_SLUGS.flatMap((s) => [`/industries/${s}`, `/industries/${s}/`]).filter((p) => !taken(p));
  assert.deepEqual(missed, []);
  assert.deepEqual(['/industries', '/industries/'].filter((p) => !taken(p)), [], 'the hub is not taken');
});

test('the 410 rule leaves look-alikes, unknown slugs and the rest of the site alone', () => {
  const must = [
    '/industries/no-such-slug', '/industries/home-cleaning-x', '/industries/home-cleaningx', '/industries/x-home-cleaning',
    '/industries/home-cleaning/x', '/industries/fitness-gyms/x', '/Industries/home-cleaning', '/industries-x', '/industrie', '/', '/pricing', '/blog', '/install',
  ];
  assert.deepEqual(must.filter((p) => taken(p)), []);
});

test('the 410 route answers with the 404 page and carries the same security headers as every other page', () => {
  assert.equal(rule.dest, '/404.html');
  const all = vercel.headers?.find((h) => h.source === '/(.*)');
  assert.ok(all, 'vercel.json has no headers block for /(.*)');
  // routes[].headers is an object { name: value } (Vercel schema, guarded in vercel-schema.spec.ts); the /(.*) block is an array of {key, value}
  assert.deepEqual(rule.headers, Object.fromEntries(all.headers.map((h) => [h.key, h.value])), 'routes run before headers on Vercel, so the rule repeats the block (L1 Q-1); the copy drifted from it');
  const names = (all.headers).map((h) => h.key.toLowerCase());
  for (const k of ['strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'content-security-policy']) {
    assert.ok(names.includes(k), `the /(.*) block lost ${k}`);
  }
});

test('no redirect or rewrite takes a retired address or the hub: the clinics redirect is gone, nothing sends them to a page', () => {
  const sources = [...(vercel.redirects ?? []), ...(vercel.rewrites ?? [])].map((r) => r.source);
  const probes = ['/industries', '/industries/', ...GONE_SLUGS.flatMap((s) => [`/industries/${s}`, `/industries/${s}/`])];
  // a Vercel source is path-to-regexp: «:slug» is one segment, «(.*)» and «*» take the rest
  const pattern = (s: string) => new RegExp(`^${s.replace(/:[A-Za-z_]+\*/g, '.*').replace(/:[A-Za-z_]+/g, '[^/]+').replace(/\*/g, '.*')}$`);
  const hit = sources.filter((s) => probes.some((p) => {
    try { return pattern(s).test(p); } catch { return s === p; }
  }));
  assert.deepEqual(hit, []);
  assert.ok(!sources.some((s) => /beauty-aesthetic-clinics/.test(s)), 'the clinics redirect is back');
});
