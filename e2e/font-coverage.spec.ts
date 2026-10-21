import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { inRanges, isLatinExtFace, parseUnicodeRange, woff2CodePoints, woff2TableTags } from './woff2-cmap';

// L15 (2026-10-21): Montserrat latin-ext is a subset now (public/fonts/fonts.css, the comment at its top says why and how it was made).
// A subset is safe only while every letter the site shows is in it, so this guard reads the shipped bytes, not a list someone keeps:
//   - the text of every page the build prerendered (all of it: hidden blocks such as #langs-more too, option texts, placeholders),
//   - every string literal of the client code (src/**/*.ts but the specs, read by the TypeScript parser): what the browser renders
//     without a server render (the demo script, its labels) is in them, and a new file with a new letter is read the day it appears,
//     which a list of two files was not (L15 code review, item 7),
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
/** Every string literal and template text of the .ts files under src/ but the specs, one source per file (the cooked text: escapes resolved). */
function clientStrings(): Map<string, string> {
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts') ? [join(dir, e.name)] : []));
  const out = new Map<string, string>();
  for (const file of walk(join(ROOT, 'src'))) {
    const parts: string[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) parts.push(node.text);
      ts.forEachChild(node, visit);
    };
    visit(ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true));
    out.set(relative(ROOT, file), parts.join(' '));
  }
  return out;
}

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
  const client = clientStrings();
  for (const f of ['src/app/pages/home/demo/demo-script.ts', 'src/app/pages/home/demo/demo-labels.ts']) assert.ok(client.has(f), `${f} is not among the client sources: the walk of src/ is broken`);
  assert.ok((client.get('src/app/pages/home/demo/demo-script.ts') ?? '').length > 1000, 'the parser read no strings of the demo script');
  for (const [f, text] of client) sources.set(f, text);
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

test('the Montserrat latin-ext faces are the subset: one variable file under the budget, a unicode-range that names exactly the code points it draws, all four weights', () => {
  const { faces } = covered();
  // latin-ext: a face for Latin Extended-A letters that is neither the latin face nor a vietnamese one (isLatinExtFace, woff2-cmap.ts)
  const ext = faces.filter((f) => isLatinExtFace(f.ranges));
  assert.deepEqual(ext.map((f) => f.weight).sort(), ['400', '500', '600', '700'], 'Montserrat latin-ext faces by weight');
  const files = [...new Set(ext.map((f) => f.url))];
  assert.equal(files.length, 1, `one latin-ext file for the four weights (a variable font), got ${files.join(', ')}`);
  const bytes = readFileSync(join(FONTS, files[0]!));
  assert.ok(bytes.length <= LATIN_EXT_BUDGET, `${files[0]} is ${bytes.length} bytes, the budget is ${LATIN_EXT_BUDGET}: the full latin-ext file is back before the first paint`);
  // the four weights are one file only while it is variable: a static cut of one weight would have 500, 600 and 700 drawn as a
  // synthetic bold of it (the fvar table declares the wght axis, gvar carries the glyph outlines along it)
  const tables = woff2TableTags(bytes);
  assert.ok(tables.includes('fvar') && tables.includes('gvar'), `${files[0]} has no ${['fvar', 'gvar'].filter((t) => !tables.includes(t)).join(' and ')} table (tables: ${tables.join(' ')}): a static cut, not the variable font`);
  const cmap = woff2CodePoints(bytes);
  const hex = (c: number) => `U+${c.toString(16).toUpperCase()}`;
  for (const f of ext) {
    const named = new Set<number>();
    for (const [a, b] of f.ranges) for (let c = a; c <= b; c++) named.add(c);
    const notDrawn = [...named].filter((c) => !cmap.has(c)).map(hex);
    assert.deepEqual(notDrawn, [], `weight ${f.weight}: the unicode-range names code points the file has no glyph for, so the browser downloads it and still falls back`);
    const notNamed = [...cmap].filter((c) => !named.has(c)).map(hex);
    assert.deepEqual(notNamed, [], `weight ${f.weight}: the file draws code points its unicode-range does not name, so the browser never asks it for them (the range and the --text of the subset command disagree)`);
  }
});

test('the cmap reader tells a drawn letter from a missing one (Montserrat latin has «A», not «ń»)', () => {
  const latin = montserratFaces(built('fonts/fonts.css')).find((f) => inRanges(0x41, f.ranges))!;
  const cmap = woff2CodePoints(readFileSync(join(FONTS, latin.url)));
  assert.ok(cmap.has(0x41) && !cmap.has(0x144), `${latin.url}: A ${cmap.has(0x41)}, ń ${cmap.has(0x144)}`);
});
