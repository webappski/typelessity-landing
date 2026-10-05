import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALL_INDUSTRIES } from '../lib/industries';

// CRO r2 (2026-10-04, R2-W1): the aesthetic-clinic page was taken down (it invited health data, Art. 9) but the live
// site still answered /industries/beauty-aesthetic-clinics with 200 — the project deploys as static output, an unknown
// path falls through to the SPA fallback — carrying the home <title> and the client-side text «Industry not found»:
// a soft 404 in the live sitemap with no way forward. vercel.json is the layer this deployment applies (see
// legal-redirects.spec.ts), so the retired page is redirected there, to the industries index.
//
// A unit-tier guard on purpose: only `npm test` runs in the pre-commit and pre-push hooks. The local SSR server does
// not apply vercel.json, so the rule is proved here and by `curl -I` on the deployed site.

const ROOT = new URL('../../../', import.meta.url);

interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
  statusCode?: number;
}

const redirects = (JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as { redirects?: Redirect[] }).redirects ?? [];
const RETIRED = '/industries/beauty-aesthetic-clinics';
const slug = RETIRED.split('/').pop()!;

test('the retired aesthetic-clinic page redirects permanently to the industries index', () => {
  const rules = redirects.filter((r) => r.source === RETIRED);
  assert.equal(rules.length, 1, `vercel.json must hold exactly one redirect for ${RETIRED}, found ${rules.length}`);
  assert.equal(rules[0].destination, '/industries');
  assert.ok(rules[0].permanent === true || rules[0].statusCode === 308, 'a retired page redirects permanently');
});

test('the redirect cannot take a live page: no wildcard, no industry page and not the index is a source', () => {
  const live = new Set(['/industries', ...ALL_INDUSTRIES.map((i) => `/industries/${i.slug}`)]);
  assert.ok(!ALL_INDUSTRIES.some((i) => i.slug === slug), `${slug} is an industry page again — the redirect would hide it`);
  for (const r of redirects) {
    if (!r.source.startsWith('/industries')) continue;
    assert.ok(!live.has(r.source), `redirect source ${r.source} is a live page`);
    assert.ok(!/[(*:]/.test(r.source), `redirect source ${r.source} is a pattern under /industries — it could swallow live pages`);
  }
});

test('the destination is a prerendered page of the site, and the sitemap does not list the retired path', () => {
  const routes = readFileSync(new URL('src/app/app.routes.server.ts', ROOT), 'utf8');
  assert.match(routes, /STATIC_PAGES = \[[\s\S]*?'industries'[\s\S]*?\]/, '/industries is no longer a prerendered page');
  const sitemap = readFileSync(new URL('tools/build-sitemap.ts', ROOT), 'utf8');
  assert.ok(!sitemap.includes(slug), `the sitemap generator names ${slug}`);
});
