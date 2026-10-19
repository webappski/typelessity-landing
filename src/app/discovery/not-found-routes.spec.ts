import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// An unknown address must answer 404, not 200 with the home page under a foreign URL (soft 404).
// Cause (card L1, 19.10): the Angular preset of Vercel prepends {handle:filesystem} and
// `/(.*) -> /index.html`. Variant B (director, Q-1 п.1): `framework: null`, so the preset and its
// SPA catch-all are gone and Vercel serves /404.html for an address with no file. Variant A
// (our own `routes` with handle:filesystem) is refused on purpose: in vercel/vercel
// routing-utils `routes` come before `redirects` and `headers`, so the seven 308s and the CSP
// would land behind the terminal catch-all.
//
// This is a model over vercel.json as data. Vercel does not run locally; whether a 404 is served is
// proved on the preview of the commit (card L1 «Как проверить»). LANDING_VERCEL_JSON points the
// guard at a mutated copy (mutation run).

const ROOT = new URL('../../../', import.meta.url).pathname;
const config = JSON.parse(
  readFileSync(process.env['LANDING_VERCEL_JSON'] ?? join(ROOT, 'vercel.json'), 'utf8'),
) as {
  framework?: string | null;
  buildCommand?: string;
  outputDirectory?: string;
  routes?: Array<Record<string, unknown>>;
  rewrites?: Array<{ source?: string }>;
  redirects?: unknown[];
  headers?: unknown[];
};
const projectName = (JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { name: string }).name;

/** A pattern that swallows every path — the shape of an SPA fallback. */
const CATCH_ALL = /^\/?\(?\.[*+]\)?$/;

test('vercel.json drops the Angular preset, so there is no SPA catch-all to /index.html', () => {
  assert.equal(config.framework, null, '"framework": null — the preset is what rewrites every unknown address to index.html');
  assert.equal(config.buildCommand, 'npm run build');
});

test('vercel.json serves the browser bundle of this project as the output directory', () => {
  assert.equal(config.outputDirectory, join('dist', projectName, 'browser'));
});

test('vercel.json has no routes entry that restores a filesystem phase or a catch-all', () => {
  for (const r of config.routes ?? []) {
    assert.equal(r['handle'], undefined, `routes entry ${JSON.stringify(r)}: handle puts redirects and headers behind the catch-all`);
    assert.doesNotMatch(String(r['src'] ?? ''), CATCH_ALL, `routes entry ${JSON.stringify(r)} is a catch-all`);
  }
  for (const r of config.rewrites ?? []) {
    assert.doesNotMatch(String(r.source ?? ''), CATCH_ALL, `rewrite ${JSON.stringify(r)} is a catch-all`);
  }
});

test('vercel.json keeps its redirects and headers (their content is held by the readers of those keys)', () => {
  assert.ok(Array.isArray(config.redirects) && config.redirects.length >= 6, 'redirects block is gone');
  assert.ok(Array.isArray(config.headers) && config.headers.length >= 1, 'headers block is gone');
});
