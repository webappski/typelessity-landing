import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { inRanges, parseUnicodeRange, woff2CodePoints } from './woff2-cmap';

// L15 (2026-10-21): Montserrat latin-ext is a subset now (public/fonts/fonts.css, the comment at its top says why and how it was made).
// A subset is safe only while every letter the site shows is in it, so this guard reads the shipped bytes, not a list someone keeps:
//   - the text of every page the build prerendered (all of it: hidden blocks such as #langs-more too, option texts, placeholders),
//   - the strings the home page renders in the browser (the demo: demo-script.ts, demo-labels.ts),
// and asks the font files themselves (their cmap, e2e/woff2-cmap.ts) whether a Montserrat face draws each character.
// What it demands is no regression: a character that Google's own Montserrat latin or latin-ext file drew must still be drawn by
// ours. Characters outside both Google ranges (Cyrillic of the demo, arrows) fell back to a system font before L15 too and are not
// demanded here. The ranges are the ones Google served for Montserrat on 2026-10-19 (git show d79e866:public/fonts/fonts.css).
// Run `npm run build` first.

const ROOT = new URL('../', import.meta.url).pathname;
const BROWSER = join(ROOT, 'dist/typelessity-landing/browser');
const FONTS = join(BROWSER, 'fonts');

const GOOGLE_LATIN = parseUnicodeRange('U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD');
const GOOGLE_LATIN_EXT = parseUnicodeRange('U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF');
// The size the subset was made to (7 920 bytes on 2026-10-21); the full latin-ext file it replaced was 68 224.
const LATIN_EXT_BUDGET = 12_000;
const CLIENT_STRINGS = ['src/app/pages/home/demo/demo-script.ts', 'src/app/pages/home/demo/demo-labels.ts'];

interface Face { weight: string; url: string; ranges: Array<[number, number]> }
function montserratFaces(css: string): Face[] {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)]
    .map((m) => m[1]!)
    .filter((body) => /font-family:\s*['"]Montserrat['"]/.test(body))
    .map((body) => ({
      weight: body.match(/font-weight:\s*([\d ]+)/)?.[1]?.trim() ?? '',
      url: (body.match(/url\(([^)]+)\)/)?.[1] ?? '').replace(/['"]/g, '').replace(/^\/?fonts\//, ''),
      ranges: parseUnicodeRange(body.match(/unicode-range:\s*([^;]+)/)?.[1] ?? ''),
    }));
}

function built(path: string): string {
  const file = join(BROWSER, path);
  if (!existsSync(file)) throw new Error(`dist/…/browser/${path} missing — run \`npm run build\` first`);
  return readFileSync(file, 'utf8');
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []));
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
/** What a page can show in its own font: text nodes (hidden ones included) and the attributes a browser draws in the page's font. */
function shownText(html: string): string {
  const body = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
  const attrs = [...body.matchAll(/\s(?:placeholder|value|alt)="([^"]*)"/gi)].map((m) => m[1]!);
  return [body.replace(/<[^>]+>/g, ' '), ...attrs].join(' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (all, n: string) => ENTITIES[n.toLowerCase()] ?? all);
}

function covered(): { faces: Face[]; draws: (cp: number) => boolean } {
  const faces = montserratFaces(built('fonts/fonts.css'));
  const cmaps = new Map(faces.map((f) => [f.url, woff2CodePoints(readFileSync(join(FONTS, f.url)))]));
  return { faces, draws: (cp) => faces.some((f) => inRanges(cp, f.ranges) && cmaps.get(f.url)!.has(cp)) };
}

test('every character a page or the demo shows that Google\'s Montserrat drew is drawn by our Montserrat files (no letter falls back)', () => {
  const { draws } = covered();
  const sources = new Map<string, string>();
  for (const f of htmlFiles(BROWSER)) sources.set('/' + relative(BROWSER, f), shownText(readFileSync(f, 'utf8')));
  for (const f of CLIENT_STRINGS) sources.set(f, readFileSync(join(ROOT, f), 'utf8'));
  assert.ok(sources.size >= 20, `${sources.size} sources — the build must produce its pages`);
  assert.ok([...sources.values()].some((t) => t.includes('Gdańsk')), 'the probe word «Gdańsk» of the home page is not in any source: the text extraction is broken');
  const missing = new Map<string, Set<string>>();
  for (const [where, text] of sources) {
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (cp < 0x20 || !(inRanges(cp, GOOGLE_LATIN) || inRanges(cp, GOOGLE_LATIN_EXT)) || draws(cp)) continue;
      const key = `${ch} U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
      if (!missing.has(key)) missing.set(key, new Set());
      missing.get(key)!.add(where);
    }
  }
  assert.deepEqual([...missing].map(([k, w]) => `${k} on ${[...w].slice(0, 3).join(', ')}`), [], 'add the letter to --text of the subset command in public/fonts/fonts.css and make the file again');
});

test('the Montserrat latin-ext faces are the subset: one file under the budget, a unicode-range that names only code points it draws, all four weights', () => {
  const { faces } = covered();
  // latin-ext = a face for Latin Extended-A letters that is not the latin face (which also names U+0131 and U+0152-0153)
  const ext = faces.filter((f) => !inRanges(0x41, f.ranges) && f.ranges.some(([a, b]) => a <= 0x17f && b >= 0x100));
  assert.deepEqual(ext.map((f) => f.weight).sort(), ['400', '500', '600', '700'], 'Montserrat latin-ext faces by weight');
  const files = [...new Set(ext.map((f) => f.url))];
  assert.equal(files.length, 1, `one latin-ext file for the four weights (a variable font), got ${files.join(', ')}`);
  const bytes = readFileSync(join(FONTS, files[0]!));
  assert.ok(bytes.length <= LATIN_EXT_BUDGET, `${files[0]} is ${bytes.length} bytes, the budget is ${LATIN_EXT_BUDGET}: the full latin-ext file is back before the first paint`);
  const cmap = woff2CodePoints(bytes);
  for (const f of ext) {
    const named: number[] = [];
    for (const [a, b] of f.ranges) for (let c = a; c <= b; c++) named.push(c);
    const notDrawn = named.filter((c) => !cmap.has(c)).map((c) => `U+${c.toString(16).toUpperCase()}`);
    assert.deepEqual(notDrawn, [], `weight ${f.weight}: the unicode-range names code points the file has no glyph for, so the browser downloads it and still falls back`);
  }
});

test('the cmap reader tells a drawn letter from a missing one (Montserrat latin has «A», not «ń»)', () => {
  const latin = montserratFaces(built('fonts/fonts.css')).find((f) => inRanges(0x41, f.ranges))!;
  const cmap = woff2CodePoints(readFileSync(join(FONTS, latin.url)));
  assert.ok(cmap.has(0x41) && !cmap.has(0x144), `${latin.url}: A ${cmap.has(0x41)}, ń ${cmap.has(0x144)}`);
});
