import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { effectiveRoutes, respond } from './vercel-effective';

// L13, card C10 (seo-lead page audit F-15): `immutable` promises that the file at a URL never changes. Every file the build puts in dist/ is
// asked what vercel.json says about it (the platform's own route list, e2e/vercel-effective.ts); the answer must be a year-long `immutable`
// for a file whose name carries a hash of its content — the chunks, main, styles, polyfills the compiler names — and never for any other. A new
// unhashed file (an image, an icon, a script copied from public/) is covered the day it appears, which a list of probes written by hand is not.
// ONE DECLARED EXCEPTION: /fonts/*.woff2, FONT_FILE below, one line, so that it can be seen and revoked. Two kinds of file are under it:
//   - our subset (montserrat-latin-ext-subset-<8 hex>.woff2, L15): the 8 hex are the first 8 of the sha256 of its bytes, so new bytes get
//     a new name; the third test below holds that the name and the bytes agree, in public/fonts and in dist (test-design L15, F-1);
//   - the files of the font host (JTUS…, i7d…): their names are an id of Google's, not a hash of the bytes, so one replaced under the same
//     name would be served from the browsers' caches for a year. They stay under the exception only while none is ever replaced under
//     its name (a new font or a new version gets a new file name); no test can hold that, the rule is this line.
// Run `npm run build` first. LANDING_VERCEL_JSON points the guard at another copy of vercel.json (mutation run).

const ROOT = new URL('../', import.meta.url).pathname;
const DIST = join(ROOT, 'dist/typelessity-landing/browser');
const routes = effectiveRoutes(JSON.parse(readFileSync(process.env['LANDING_VERCEL_JSON'] ?? join(ROOT, 'vercel.json'), 'utf8')) as object);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
}

const HASHED_BUILD_FILE = /^\/(?:main|chunk|polyfills|styles)-[A-Z0-9]{8}\.(?:js|css)$/;
// the declared exception of the header: the subset is held by its content hash (third test), the font host's files by the rule of never replacing one
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

test('fonts: the 8 hex in the name of each Montserrat subset file are the first 8 of the sha256 of its bytes, in public/fonts and in dist', () => {
  const SUBSET = /^montserrat-latin-ext-subset-([0-9a-f]{8})\.woff2$/;
  const named = [...readFileSync(join(DIST, 'fonts/fonts.css'), 'utf8').matchAll(/url\(\/fonts\/(montserrat-latin-ext-subset-[^)'"]+)\)/g)].map((m) => m[1]!);
  assert.ok(named.length > 0, 'fonts.css names no montserrat-latin-ext-subset file: the subset was renamed, and this guard with it');
  const problems: string[] = [];
  let checked = 0;
  for (const dir of [join(ROOT, 'public/fonts'), join(DIST, 'fonts')]) {
    const here = readdirSync(dir).filter((n) => n.startsWith('montserrat-latin-ext-subset-'));
    for (const n of new Set(named)) if (!here.includes(n)) problems.push(`${relative(ROOT, dir)}: fonts.css names ${n}, the folder has no such file`);
    for (const n of here) {
      const m = n.match(SUBSET);
      if (!m) { problems.push(`${relative(ROOT, join(dir, n))}: the name does not end in 8 hex of the content`); continue; }
      const sha = createHash('sha256').update(readFileSync(join(dir, n))).digest('hex');
      checked++;
      if (!sha.startsWith(m[1]!)) problems.push(`${relative(ROOT, join(dir, n))}: the name says ${m[1]}, the bytes hash to ${sha.slice(0, 8)}`);
    }
  }
  assert.ok(checked >= 2, `${checked} subset files read in public/fonts and dist`);
  assert.deepEqual(problems, [], 'new bytes under an old name stay in the browsers\' caches for a year (immutable): rename the file to the first 8 of its sha256 and point fonts.css at it');
});
