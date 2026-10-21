import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// L15 step 4 (2026-10-21): ngx-markdown and marked (≈55 KB of JS before compression) are bundled with the three kinds of pages that
// render markdown — articles, /privacy, /legal/* — and no other page loads them. Before L15 provideMarkdown sat in app.config.ts, a
// static import of the app, so every page, `/` included, preloaded the chunk. Read from the bytes of the build:
//   (a) the JS of the markdown libraries is found by two texts only they carry (the error of marked, the prefix of ngx-markdown);
//   (b) no page other than the markdown pages reaches it: not in its modulepreload list, not in the static imports of main and of
//       the chunks it preloads (the closure the browser would load before the route runs);
//   (c) each markdown page preloads it and its prerendered <markdown> holds the rendered text (the server render had the providers).
// The browser side — a client navigation to an article renders it, and `/` requests no markdown chunk — is L15-M1 / L15-M2.
// Run `npm run build` first.

const ROOT = new URL('../', import.meta.url).pathname;
const BROWSER = join(ROOT, 'dist/typelessity-landing/browser');
const MARKERS = [/marked\(\): input parameter is undefined or null/, /\[ngx-markdown\]/];

function pages(): Array<[string, string]> {
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name === 'index.html' ? [join(dir, e.name)] : []));
  if (!existsSync(join(BROWSER, 'index.html'))) throw new Error('dist/…/browser/index.html missing — run `npm run build` first');
  return walk(BROWSER).map((f) => ['/' + relative(BROWSER, f).replace(/(^|\/)index\.html$/, ''), readFileSync(f, 'utf8')]);
}
const isMarkdownPage = (path: string) => /^\/(blog\/[^/]+|privacy|legal\/.+)$/.test(path);
const js = (name: string) => readFileSync(join(BROWSER, name), 'utf8');
const markdownChunks = () => readdirSync(BROWSER).filter((f) => f.endsWith('.js') && MARKERS.every((m) => m.test(js(f))));

function closure(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const f = queue.pop()!;
    if (seen.has(f) || !existsSync(join(BROWSER, f))) continue;
    seen.add(f);
    // static imports only: `import … from "./x.js"` and `import "./x.js"`; a dynamic import("./x.js") is a lazy route or a deferred block
    for (const m of js(f).matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([\w.-]+\.js)["']/g)) queue.push(m[1]!);
  }
  return seen;
}

test('(a) the markdown libraries are one chunk the build names by content', () => {
  const chunks = markdownChunks();
  assert.equal(chunks.length, 1, `chunks with marked and ngx-markdown: ${chunks.join(', ') || 'none'}`);
  assert.ok(!/^main-/.test(chunks[0]!), 'the markdown libraries are in main');
});

test('(b) no page other than an article, /privacy or /legal/* preloads or statically imports the markdown chunk', () => {
  const [chunk] = markdownChunks();
  const main = readdirSync(BROWSER).find((f) => /^main-[A-Z0-9]{8}\.js$/.test(f))!;
  assert.ok(chunk && main, 'the build has main and the markdown chunk');
  const problems: string[] = [];
  const all = pages();
  assert.ok(all.filter(([p]) => !isMarkdownPage(p)).length >= 8, 'the non-markdown pages of the build');
  for (const [path, html] of all) {
    if (isMarkdownPage(path)) continue;
    const preloads = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)].map((m) => m[1]!);
    if (preloads.includes(chunk!)) problems.push(`${path || '/'}: modulepreload of ${chunk}`);
    if (closure([main, ...preloads]).has(chunk!)) problems.push(`${path || '/'}: ${chunk} is a static import of main or of a preloaded chunk`);
  }
  assert.deepEqual(problems, []);
});

test('(c) every article, /privacy and /legal/security preload the markdown chunk and carry their rendered markdown', () => {
  const [chunk] = markdownChunks();
  const md = pages().filter(([p]) => isMarkdownPage(p));
  assert.ok(md.length >= 10, `${md.length} markdown pages in the build`);
  const problems: string[] = [];
  for (const [path, html] of md) {
    if (!html.includes(`<link rel="modulepreload" href="${chunk}">`)) problems.push(`${path}: no modulepreload of ${chunk}`);
    const rendered = [...html.matchAll(/<markdown\b[^>]*>([\s\S]*?)<\/markdown>/g)].map((m) => m[1]!).join('');
    if ((rendered.match(/<p\b/g) ?? []).length < 2) problems.push(`${path}: the prerendered <markdown> holds ${(rendered.match(/<p\b/g) ?? []).length} paragraphs`);
  }
  assert.deepEqual(problems, []);
});
