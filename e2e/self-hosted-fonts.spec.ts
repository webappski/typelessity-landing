import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { cspValues, type VercelCspConfig } from './vercel-csp';
import { inRanges, isLatinExtFace, parseUnicodeRange, woff2Metrics } from './woff2-cmap';

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
  // L15: fonts.css is no longer linked (a render-blocking request); its @font-face rules come inline (src/app/global-styles.ts).
  assert.doesNotMatch(html, /<link[^>]+href="\/?fonts\/fonts\.css"/, 'fonts.css must not be a stylesheet request before the first paint');
  const inline = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  const urls = [...readBuilt('fonts/fonts.css').matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]!.replace(/['"]/g, ''));
  assert.ok(urls.length >= 14, `fonts.css names ${urls.length} font files`);
  assert.deepEqual(urls.filter((u) => !inline.includes(u)), [], 'every font file of fonts.css is named by the @font-face rules inline in the page');
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
// L15: the latin-ext face is a subset now (its range starts at U+0102, not U+0100), and so does a vietnamese face: the face is told
// by the code points its range names, the same predicate as font-coverage.spec.ts (isLatinExtFace, woff2-cmap.ts)
const isLatinExt = (f: Face) => f.ranges !== '' && isLatinExtFace(parseUnicodeRange(f.ranges));

test('the latin-ext predicate tells the latin-ext faces of fonts.css from the latin and the vietnamese ones (control)', () => {
  const all = faces(readBuilt('fonts/fonts.css'));
  const kinds = (family: string) => [...new Set(all.filter((f) => f.family === family).map((f) => (isLatin(f) ? 'latin' : isLatinExt(f) ? 'latin-ext' : 'other')))].sort();
  // Space Mono keeps Google's three splits (latin, latin-ext, vietnamese — the vietnamese range starts at U+0102 like our subset)
  assert.ok(all.some((f) => f.family === 'Space Mono' && /U\+1EA0-1EF9/i.test(f.ranges)), 'fonts.css lost the vietnamese face of Space Mono, the control case');
  assert.deepEqual(kinds('Space Mono'), ['latin', 'latin-ext', 'other'], 'Space Mono: latin, latin-ext and the vietnamese face as «other»');
  assert.deepEqual(kinds('Montserrat'), ['latin', 'latin-ext'], 'Montserrat: latin and the latin-ext subset');
});

test('fonts.css: the families are Montserrat, its local fallback and Space Mono, and DM Sans is not among them', async (t) => {
  const css = readBuilt('fonts/fonts.css');
  const families = new Set(faces(css).map((f) => f.family));
  await t.test('Montserrat, Montserrat Fallback (L17 D2) and Space Mono are declared', () => {
    assert.deepEqual([...families].sort(), ['Montserrat', 'Montserrat Fallback', 'Space Mono']);
  });
  await t.test('DM Sans is not in fonts.css: the widget serves its own from its origin, and one source keeps the widget-font test able to fail (D4)', () => {
    assert.ok(!css.includes('DM Sans'), 'fonts.css still names DM Sans');
  });
});

// L17 D2 (FL-107, FL-114): «Montserrat Fallback» is the system Arial scaled to Montserrat's width and line box, so the swap from the fallback to the file moves
// nothing. It is a font of the visitor's machine (`local()`), not a file of ours: no `url(`, no request, no new licence. The metrics are not typed into the test:
// they are read from the shipped Montserrat file (hhea, head) and the overrides must equal ascent / (unitsPerEm × size-adjust) — the formulas of
// developer.chrome.com/blog/font-fallbacks. The widths (size-adjust) come from a frequency-weighted measure of the text of / and /pricing (22.10).
test('Montserrat Fallback: four local() faces, no url(), the unicode-range of Montserrat, the line box of the Montserrat file', async (t) => {
  const css = readBuilt('fonts/fonts.css');
  const blocks = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]!).filter((b) => /font-family:\s*['"]Montserrat Fallback['"]/.test(b));
  const prop = (b: string, name: string): string => b.match(new RegExp(`${name}:\\s*([^;]+)`))?.[1]?.trim() ?? '';
  await t.test('four faces that tile the weights 100–900 without a gap and name a system font only', () => {
    assert.equal(blocks.length, 4);
    const weights = blocks.map((b) => prop(b, 'font-weight').split(/\s+/).map(Number)).sort((x, y) => x[0]! - y[0]!);
    assert.deepEqual(weights, [[100, 449], [450, 549], [550, 649], [650, 900]]);
    for (const b of blocks) {
      assert.doesNotMatch(b, /url\(/, 'a local() face asks for no file');
      assert.match(prop(b, 'src'), /^local\('[^']+'\)(, local\('[^']+'\))*$/, 'src names system fonts only');
      assert.match(prop(b, 'font-style'), /^normal$/);
    }
    const regular = blocks.filter((b) => Number(prop(b, 'font-weight').split(/\s+/)[0]) < 550), bold = blocks.filter((b) => Number(prop(b, 'font-weight').split(/\s+/)[0]) >= 550);
    for (const b of regular) assert.match(prop(b, 'src'), /local\('Arial'\)/);
    for (const b of bold) assert.match(prop(b, 'src'), /local\('Arial Bold'\)/, 'weights 550 and up are drawn from Arial Bold, not from a synthetic bold of Arial');
  });
  await t.test('the unicode-range is the union of the two Montserrat faces: a letter Montserrat lacks (Cyrillic, Greek) is not drawn in stretched Arial', () => {
    const own = faces(css).filter((f) => f.family === 'Montserrat').flatMap((f) => parseUnicodeRange(f.ranges));
    const fallback = blocks.flatMap((b) => parseUnicodeRange(prop(b, 'unicode-range')));
    const sample = (ranges: ReadonlyArray<readonly [number, number]>): number[] => ranges.flatMap(([a, z]) => [a, z, Math.floor((a + z) / 2)]);
    for (const cp of [...sample(own), ...sample(fallback)]) assert.equal(inRanges(cp, fallback), inRanges(cp, own), `U+${cp.toString(16)} is in one range and not in the other`);
    for (const cp of [0x41, 0x7a, 0x20ac, 0x0141, 0x017e]) assert.ok(inRanges(cp, fallback), `U+${cp.toString(16)} is covered`);
    for (const cp of [0x0416, 0x03a9, 0x3042]) assert.ok(!inRanges(cp, fallback), `U+${cp.toString(16)} (Cyrillic, Greek, Japanese) is not covered`);
    for (let i = 1; i < blocks.length; i++) assert.equal(prop(blocks[i]!, 'unicode-range'), prop(blocks[0]!, 'unicode-range'), 'the four faces carry one range');
  });
  await t.test('ascent-override, descent-override and line-gap-override follow from the hhea of the shipped Montserrat file and the face\'s own size-adjust', () => {
    const file = readFileSync(new URL('fonts/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2', BROWSER));
    const m = woff2Metrics(file);
    const pct = (v: string): number => parseFloat(v) / 100;
    for (const b of blocks) {
      const adjust = pct(prop(b, 'size-adjust'));
      assert.ok(adjust > 1.0 && adjust < 1.2, `size-adjust ${adjust}: Arial is narrower than Montserrat, the scale is above 100 %`);
      assert.ok(Math.abs(pct(prop(b, 'ascent-override')) - m.ascent / (m.unitsPerEm * adjust)) < 0.0006, `ascent-override of ${prop(b, 'font-weight')}`);
      assert.ok(Math.abs(pct(prop(b, 'descent-override')) - Math.abs(m.descent) / (m.unitsPerEm * adjust)) < 0.0006, `descent-override of ${prop(b, 'font-weight')}`);
      assert.equal(pct(prop(b, 'line-gap-override')), m.lineGap / (m.unitsPerEm * adjust));
    }
  });
  await t.test('the font stacks name it right after Montserrat', () => {
    const tokens = readFileSync(new URL('src/styles/tokens.scss', ROOT), 'utf8');
    for (const name of ['--font-display', '--font-body']) assert.match(tokens, new RegExp(`${name}:\\s*'Montserrat', 'Montserrat Fallback', system-ui`), `${name}`);
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
  // L15: the urls are absolute (/fonts/…), so that they resolve the same from /fonts/fonts.css and from the inline copy in a page
  const missing = urls.filter((u) => /^https?:/.test(u) || !u.startsWith('/fonts/') || !existsSync(new URL(u.slice(1), BROWSER)));
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
  const csp = cspValues(JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as VercelCspConfig);
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
      expected = face ? face.url.replace(/^\//, '') : '';
      if (!expected) problems.push('fonts.css has no Montserrat 400 latin face to preload');
    }
    if (expected && href !== expected) problems.push(`${page}: the preload is «${href}», fonts.css names «${expected}»`);
  }
  assert.deepEqual(problems, []);
});
