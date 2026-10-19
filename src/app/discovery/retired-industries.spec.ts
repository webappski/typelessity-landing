import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALL_INDUSTRIES } from '../lib/industries';
import { RETIRED_SLUGS, SEVEN, SEVEN_SLUGS } from '../../../e2e/industries-seven';

// L1б (2026-10-19): 29 thin industry pages and the clinics address answer 410, the seven kept pages and the hub stay.
// The clinics page was taken down earlier (it invited health data, Art. 9) and was redirected to the hub; that
// redirect is gone now — a redirect to a hub that lists none of its subjects is the soft 404 Google warns of.
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

test('the retired list is what the card says it is: 30 addresses, none of them a kept page', () => {
  assert.equal(RETIRED_SLUGS.length, 30);
  assert.equal(new Set(RETIRED_SLUGS).size, 30, 'a slug twice in RETIRED');
  assert.equal(SEVEN_SLUGS.length, 7);
  assert.deepEqual(RETIRED_SLUGS.filter((s) => SEVEN_SLUGS.includes(s)), []);
  assert.equal(new Set([...RETIRED_SLUGS, ...SEVEN_SLUGS]).size, 37, 'RETIRED + SEVEN is the 36 pages of d0cbafe plus the clinics address');
});

test('the data holds exactly the seven kept industries (slug, name and category), and no retired one', () => {
  assert.deepEqual(
    ALL_INDUSTRIES.map((i) => ({ slug: i.slug, name: i.name, category: i.category })).sort((a, b) => a.slug.localeCompare(b.slug)),
    [...SEVEN].sort((a, b) => a.slug.localeCompare(b.slug)),
  );
  assert.deepEqual(ALL_INDUSTRIES.filter((i) => RETIRED_SLUGS.includes(i.slug)).map((i) => i.slug), []);
});

test('vercel.json holds exactly one 410 route: anchored, no handle, no catch-all', () => {
  assert.equal(gone.length, 1, `expected one route with status 410, found ${gone.length}`);
  assert.equal(rule.handle, undefined, 'a handle phase would make the rule catch more than the list');
  assert.match(rule.src, /^\^/, 'the src must start with ^');
  assert.match(rule.src, /\$$/, 'the src must end with $');
  assert.doesNotMatch(rule.src, /\.\*|\(\.\+\)|\[\^\/\]\*/, 'the src must not hold a wildcard');
});

test('the 410 rule takes each of the 30 retired addresses, with and without a trailing slash', () => {
  const missed = RETIRED_SLUGS.flatMap((s) => [`/industries/${s}`, `/industries/${s}/`]).filter((p) => !taken(p));
  assert.deepEqual(missed, []);
});

test('the 410 rule leaves the hub, the seven kept pages and look-alikes alone', () => {
  const must = [
    '/industries', '/industries/', ...SEVEN_SLUGS.flatMap((s) => [`/industries/${s}`, `/industries/${s}/`]),
    '/industries/no-such-slug', '/industries/home-cleaning-x', '/industries/home-cleaningx', '/industries/x-home-cleaning',
    '/industries/home-cleaning/x', '/Industries/home-cleaning', '/', '/pricing', '/blog',
  ];
  assert.deepEqual(must.filter((p) => taken(p)), []);
});

test('the 410 route answers with the 404 page and carries the same security headers as every other page', () => {
  assert.equal(rule.dest, '/404.html');
  const all = vercel.headers?.find((h) => h.source === '/(.*)');
  assert.ok(all, 'vercel.json has no headers block for /(.*)');
  assert.deepEqual(rule.headers, all.headers, 'routes run before headers on Vercel, so the rule repeats the block (L1 Q-1); the copy drifted from it');
  const names = (all.headers).map((h) => h.key.toLowerCase());
  for (const k of ['strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'content-security-policy']) {
    assert.ok(names.includes(k), `the /(.*) block lost ${k}`);
  }
});

test('no redirect or rewrite takes a retired address or the hub: the clinics redirect is gone, nothing sends them to a page', () => {
  const sources = [...(vercel.redirects ?? []), ...(vercel.rewrites ?? [])].map((r) => r.source);
  const probes = ['/industries', '/industries/', ...RETIRED_SLUGS.flatMap((s) => [`/industries/${s}`, `/industries/${s}/`])];
  // a Vercel source is path-to-regexp: «:slug» is one segment, «(.*)» and «*» take the rest
  const pattern = (s: string) => new RegExp(`^${s.replace(/:[A-Za-z_]+\*/g, '.*').replace(/:[A-Za-z_]+/g, '[^/]+').replace(/\*/g, '.*')}$`);
  const hit = sources.filter((s) => probes.some((p) => {
    try { return pattern(s).test(p); } catch { return s === p; }
  }));
  assert.deepEqual(hit, []);
  assert.ok(!sources.some((s) => /beauty-aesthetic-clinics/.test(s)), 'the clinics redirect is back');
});

test('the generator does not name a retired slug, and the hub is still prerendered', () => {
  const routes = readFileSync(new URL('src/app/app.routes.server.ts', ROOT), 'utf8');
  assert.match(routes, /STATIC_PAGES = \[[\s\S]*?'industries'[\s\S]*?\]/, '/industries is no longer a prerendered page');
  const sitemap = readFileSync(new URL('tools/build-sitemap.ts', ROOT), 'utf8');
  for (const s of RETIRED_SLUGS) assert.ok(!sitemap.includes(s), `the sitemap generator names ${s}`);
});
