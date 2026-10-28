import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadVercelConfig } from '../../../e2e/vercel-effective';

// An unknown address must answer 404, not 200 with the home page under a foreign URL (soft 404).
// History. Card L1 (19.10): the Angular preset of Vercel prepends {handle:filesystem} and `/(.*) -> /index.html`. Variant B of d0cbafe (director, Q-1 п.1) dropped the preset
// with `framework: null` and kept `redirects`, `headers` and `trailingSlash` beside a short `routes`; the director refused variant A (`routes` with handle:filesystem) because in
// vercel/vercel routing-utils `routes` come before `redirects` and `headers`, so the redirects and the CSP would land behind the terminal catch-all. Production went on answering 200 for
// an unknown address (FL-92, audit of 24.10), so the preset was not the only cause. SEO24-TYL-1 reverses Q-1 on the one point it refused: EVERY rule is a route, in ONE list, in the
// order the platform runs them — the rules in front, then {handle: filesystem}, then one route that answers 404 with 404.html. In front of the phase nothing is hidden behind the
// catch-all, because nothing else is left to run before it. What the list does for an address is held by e2e/vercel-404-dist.spec.ts (the real dist/) and
// src/app/discovery/vercel-routing.spec.ts (the order); this file holds the SHAPE of the file.
//
// This is a model over vercel.json as data. Vercel does not run locally; whether a 404 is served is proved by `curl` on production after the push (card SEO24-TYL-1 §5).
// LANDING_VERCEL_JSON points the guard at a mutated copy (mutation run).

const ROOT = new URL('../../../', import.meta.url).pathname;
const config = loadVercelConfig() as {
  framework?: string | null;
  buildCommand?: string;
  outputDirectory?: string;
  routes?: Array<Record<string, unknown>>;
};
const projectName = (JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { name: string }).name;

test('vercel.json drops the Angular preset: "framework": null, and the build is this project\'s own', () => {
  assert.equal(config.framework, null, '"framework": null — the preset is what rewrites every unknown address to index.html');
  assert.equal(config.buildCommand, 'npm run build');
});

test('vercel.json serves the browser bundle of this project as the output directory', () => {
  assert.equal(config.outputDirectory, join('dist', projectName, 'browser'));
});

test('vercel.json is one list of routes: none of the keys of the old form stands beside it', () => {
  // `redirects`, `headers`, `rewrites`, `cleanUrls` and `trailingSlash` are turned into routes by routing-utils and put in front of or behind `routes` by ITS order, not the file's;
  // with all of them gone the list below is the order the platform runs (vercel-routing.spec.ts: the library gives the same list back unchanged).
  const present = ['redirects', 'headers', 'rewrites', 'cleanUrls', 'trailingSlash'].filter((key) => key in config);
  assert.deepEqual(present, [], 'a key of the old form is back: write the rule as a route, in its place in the list');
  assert.ok(Array.isArray(config.routes) && config.routes.length > 10, 'vercel.json has no list of routes');
});

test('the list ends with the filesystem phase and ONE route behind it that answers 404 with 404.html; every rule is in front of the phase', () => {
  const routes = config.routes ?? [];
  const phases = routes.map((r, i) => (r['handle'] === undefined ? -1 : i)).filter((i) => i >= 0);
  assert.deepEqual(phases, [routes.length - 2], 'exactly one handle, and it is the second to last entry');
  assert.equal(routes[routes.length - 2]!['handle'], 'filesystem');
  assert.deepEqual(routes[routes.length - 1], { src: '^/(.*)$', status: 404, dest: '/404.html' }, 'the last route is the 404: no continue, no headers (a rule behind the phase is never reached by a file)');
  for (const [i, r] of routes.slice(0, -2).entries()) {
    assert.equal(typeof r['src'], 'string', `routes[${i}] in front of the phase has no src`);
  }
});
