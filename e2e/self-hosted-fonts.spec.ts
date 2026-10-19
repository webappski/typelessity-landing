import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';

// A27 (c8, 2026-09-24): DM Sans and Space Mono came from fonts.googleapis.com / fonts.gstatic.com,
// so every visitor's IP address went to Google before any consent — the embed a German court
// found unlawful (LG München I, 20.01.2022, 3 O 17493/20). They are now served from our own
// origin (public/fonts, the files and CSS Google itself serves for the same request), and the
// CSP no longer allows the two hosts.
//
// Asserts the shipped bytes, like no-analytics.spec.ts: the prerendered HTML, every stylesheet and
// script the build produced, the CSP in vercel.json — and that every font the local stylesheet
// names is actually in the build, so self-hosting cannot quietly degrade to a system font.
//
// L3 (2026-10-19, D4, F19, S1): the site's own type is now Montserrat (text, headings) and Space Mono (code). DM Sans left
// `fonts.css` on purpose: the widget on the home page brings its own DM Sans from ITS origin (font-src), and if the site kept
// serving one too, the page would have two sources for it and a test of the widget's font could never go red. The licences of
// the two families sit beside the files (SIL OFL 1.1), the scan for Google hosts reads every TEXT file of the build, and the
// font preload is one file, the one fonts.css names, with crossorigin so the browser does not fetch it twice.
//
// Run: `npm run build` first, then `npm run e2e`.

const ROOT = new URL('../', import.meta.url);
const BROWSER = new URL('dist/typelessity-landing/browser/', ROOT);

const GOOGLE_FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/i;
const FONTS = new URL('fonts/', BROWSER);

async function listFiles(dir: URL, pattern: RegExp): Promise<URL[]> {
  const out: URL[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...(await listFiles(new URL(`${entry.name}/`, dir), pattern)));
    } else if (pattern.test(entry.name)) {
      out.push(new URL(entry.name, dir));
    }
  }
  return out;
}

function readBuilt(path: string): string {
  const file = new URL(path, BROWSER);
  if (!existsSync(file)) {
    throw new Error(`dist/…/browser/${path} missing — run \`npm run build\` before the smoke.`);
  }
  return readFileSync(file, 'utf8');
}

test('prerendered "/" loads its fonts from our origin and names no Google font host', () => {
  const html = readBuilt('index.html');
  assert.ok(html.includes('Typelessity'), 'home must render the brand name');
  assert.ok(!GOOGLE_FONT_HOSTS.test(html), 'the page must not load anything from Google Fonts');
  assert.match(html, /<link[^>]+href="fonts\/fonts\.css"/, 'the page must link the self-hosted stylesheet');
});

test('no text file the build shipped names a Google font host (css, js, mjs, html, txt, xml, json, webmanifest)', async () => {
  // The licence files carry Google's copyright line, so the pattern is the two HOSTS, not the word «Google» (F19).
  const files = await listFiles(BROWSER, /\.(css|m?js|html|txt|xml|json|webmanifest)$/);
  assert.ok(files.length > 0, 'the build must produce files to scan');
  const offenders: string[] = [];
  for (const file of files) {
    if (GOOGLE_FONT_HOSTS.test(await readFile(file, 'utf8'))) offenders.push(file.pathname.split('/browser/')[1]);
  }
  assert.deepEqual(offenders, [], 'Google Fonts host found in shipped files');
});

interface Face { family: string; weight: [number, number]; ranges: string; url: string }
function faces(css: string): Face[] {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const body = m[1]!;
    const w = body.match(/font-weight:\s*(\d+)(?:\s+(\d+))?/);
    return {
      family: body.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1] ?? '',
      weight: [Number(w?.[1]), Number(w?.[2] ?? w?.[1])],
      ranges: body.match(/unicode-range:\s*([^;]+)/)?.[1] ?? '',
      url: (body.match(/url\(([^)]+)\)/)?.[1] ?? '').replace(/['"]/g, ''),
    };
  });
}
const isLatin = (f: Face) => /U\+0000-00FF/i.test(f.ranges);
const isLatinExt = (f: Face) => /U\+0100-/i.test(f.ranges);

test('fonts.css: the families are Montserrat and Space Mono, and DM Sans is not among them', async (t) => {
  const css = readBuilt('fonts/fonts.css');
  const families = new Set(faces(css).map((f) => f.family));
  await t.test('Montserrat and Space Mono are declared', () => {
    assert.deepEqual([...families].sort(), ['Montserrat', 'Space Mono']);
  });
  await t.test('DM Sans is not in fonts.css: the widget serves its own from its origin, and one source keeps the widget-font test able to fail (D4)', () => {
    assert.ok(!css.includes('DM Sans'), 'fonts.css still names DM Sans');
  });
});

test('Montserrat has weights 400, 500, 600 and 700 in the latin and latin-ext subsets', () => {
  const montserrat = faces(readBuilt('fonts/fonts.css')).filter((f) => f.family === 'Montserrat');
  const missing: string[] = [];
  for (const weight of [400, 500, 600, 700]) {
    for (const [name, isSubset] of [['latin', isLatin], ['latin-ext', isLatinExt]] as const) {
      if (!montserrat.some((f) => f.weight[0] <= weight && weight <= f.weight[1] && isSubset(f))) missing.push(`${weight} ${name}`);
    }
  }
  assert.deepEqual(missing, [], 'Montserrat faces missing from fonts.css');
});

test('every font the local stylesheet names is in the build', () => {
  const css = readBuilt('fonts/fonts.css');
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]!.replace(/['"]/g, ''));
  assert.ok(urls.length > 0, 'fonts.css must point at font files');
  const missing = urls.filter((u) => /^https?:/.test(u) || !existsSync(new URL(u, FONTS)));
  assert.deepEqual(missing, [], 'fonts.css names a file that is remote or not in the build');
});

test('the licences of both families are shipped beside the files: SIL Open Font License 1.1', async (t) => {
  for (const name of ['OFL-Montserrat.txt', 'OFL-SpaceMono.txt']) {
    await t.test(name, () => {
      const file = new URL(name, FONTS);
      assert.ok(existsSync(file), `dist/…/fonts/${name} is missing`);
      assert.match(readFileSync(file, 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/i);
    });
  }
});

test('CSP in vercel.json allows no Google font host — in the headers block and in the 410 route', () => {
  const config = JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as {
    headers?: { headers: { key: string; value: string }[] }[];
    routes?: { headers?: { key: string; value: string }[] }[];
  };
  const csp = [...(config.headers ?? []), ...(config.routes ?? [])]
    .flatMap((h) => h.headers ?? [])
    .filter((h) => h.key.toLowerCase() === 'content-security-policy')
    .map((h) => h.value);
  assert.ok(csp.length >= 2, 'vercel.json must set a Content-Security-Policy in both places');
  for (const value of csp) {
    assert.ok(!GOOGLE_FONT_HOSTS.test(value), `CSP still allows Google Fonts: ${value}`);
  }
});

test('every page carries exactly one font preload: Montserrat 400 latin, the file fonts.css names, with crossorigin (M26)', async () => {
  const css = readBuilt('fonts/fonts.css');
  const html = await listFiles(BROWSER, /\.html$/);
  assert.ok(html.length >= 10, 'the build must produce its pages');
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s/>]))`, 'i'));
  const problems: string[] = [];
  let expected = '';
  for (const file of html) {
    const page = file.pathname.split('/browser/')[1]!;
    const links = [...readFileSync(file, 'utf8').matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /\srel="preload"/i.test(l) && /\sas="font"/i.test(l));
    if (links.length !== 1) { problems.push(`${page}: ${links.length} font preloads, expected exactly 1`); continue; }
    const link = links[0]!;
    if (!attr(link, 'crossorigin')) problems.push(`${page}: the preload has no crossorigin, so the font is fetched twice`);
    if (attr(link, 'type')?.[1] !== 'font/woff2') problems.push(`${page}: the preload is not type="font/woff2"`);
    const href = (attr(link, 'href')?.[1] ?? '').replace(/^\//, '');
    if (!expected) {
      const face = faces(css).find((f) => f.family === 'Montserrat' && f.weight[0] <= 400 && 400 <= f.weight[1] && isLatin(f));
      expected = face ? `fonts/${face.url}` : '';
      if (!expected) problems.push('fonts.css has no Montserrat 400 latin face to preload');
    }
    if (expected && href !== expected) problems.push(`${page}: the preload is «${href}», fonts.css names «${expected}»`);
  }
  assert.deepEqual(problems, []);
});
