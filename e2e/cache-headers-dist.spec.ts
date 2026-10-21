import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { effectiveRoutes, respond } from './vercel-effective';

// L13, card C10 (seo-lead page audit F-15): `immutable` promises that the file at a URL never changes. Every file the build puts in dist/ is
// asked what vercel.json says about it (the platform's own route list, e2e/vercel-effective.ts); the answer must be a year-long `immutable`
// for a file whose name carries a hash of its content — the chunks, main, styles, polyfills the compiler names — and never for any other. A new
// unhashed file (an image, an icon, a script copied from public/) is covered the day it appears, which a list of probes written by hand is not.
// ONE DECLARED EXCEPTION: /fonts/*.woff2. Their names are the ones the font host gave the downloaded files (an id of its own, not a hash of the file we serve), so a font file replaced under the same
// name would be served from the browsers' caches for a year. `immutable` is allowed for them only while the set of fonts is never changed under an
// existing name (a new font or a new version gets a new file name). The exception is FONT_FILE below, one line, so that it can be seen and revoked.
// Run `npm run build` first. LANDING_VERCEL_JSON points the guard at another copy of vercel.json (mutation run).

const ROOT = new URL('../', import.meta.url).pathname;
const DIST = join(ROOT, 'dist/typelessity-landing/browser');
const routes = effectiveRoutes(JSON.parse(readFileSync(process.env['LANDING_VERCEL_JSON'] ?? join(ROOT, 'vercel.json'), 'utf8')) as object);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
}

const HASHED_BUILD_FILE = /^\/(?:main|chunk|polyfills|styles)-[A-Z0-9]{8}\.(?:js|css)$/;
// the declared exception of the header: immutable on a name that is not a content hash (see the top of the file for when it stops being safe)
const FONT_FILE = /^\/fonts\/[^/]+\.woff2$/;

test('dist: a file has the year-long immutable cache if and only if its name carries a content hash', () => {
  const paths = files(DIST).map((f) => '/' + relative(DIST, f).split('\\').join('/'));
  assert.ok(paths.length > 40, `${paths.length} files in dist — run \`npm run build\` first`);
  assert.ok(paths.some((p) => HASHED_BUILD_FILE.test(p)), 'no hashed build file in dist: the hash pattern of the compiler changed, and the rule with it');
  const wrong: string[] = [];
  for (const p of paths) {
    const value = respond(routes, p).headers['cache-control'] ?? '';
    const immutable = /max-age=31536000, immutable/.test(value);
    const mayBe = HASHED_BUILD_FILE.test(p) || FONT_FILE.test(p);
    if (immutable !== mayBe) wrong.push(`${p}: ${value || '(no Cache-Control from vercel.json)'} — ${mayBe ? 'a hashed file lost its long cache' : 'an unhashed file is promised never to change'}`);
  }
  assert.deepEqual(wrong, []);
});

test('dist: the files that carry a name a person chose (images, icons, the OG card) keep a day at most', () => {
  const named = files(DIST).map((f) => '/' + relative(DIST, f).split('\\').join('/')).filter((p) => /^\/[^/]+\.(?:jpg|png|svg|webp|avif|ico)$/.test(p));
  assert.ok(named.length >= 4, `${named.length} root images in dist`);
  for (const p of named) {
    const value = respond(routes, p).headers['cache-control'] ?? '';
    const maxAge = Number(value.match(/max-age=(\d+)/)?.[1]);
    assert.ok(maxAge > 0 && maxAge <= 86400, `${p}: ${value || 'no Cache-Control'}`);
  }
});
