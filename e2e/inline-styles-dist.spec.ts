import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// L15 step 2 (2026-10-21): the global styles and the @font-face rules are inline in every page (src/app/global-styles.ts), so the
// first paint waits for no stylesheet request. What a crawler and the first paint receive is the bytes of every .html of the build:
//   (a) no page has a <link rel="stylesheet">: no CSS request blocks the render;
//   (b) every page carries BOTH themes whole in its inline styles: the stored choice (`[data-theme=dark]`), the system dark while
//       nothing is chosen (`:not([data-theme=light])` inside `prefers-color-scheme: dark`), and the light :root — the defect of
//       d79e866's Beasties run was exactly a page without the dark rules (critical CSS by a DOM that has no data-theme);
//   (c) every @font-face of fonts.css is inline (the browser finds the font files in the HTML, one step earlier than through a CSS).
// The browser side (the computed tokens of both themes on the first frame, scripts blocked) is e2e/browser/l15-perf.pw.ts L15-S1.
// Run `npm run build` first.

const ROOT = new URL('../', import.meta.url).pathname;
const BROWSER = join(ROOT, 'dist/typelessity-landing/browser');

function pages(): Array<[string, string]> {
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') && e.name !== 'index.csr.html' ? [join(dir, e.name)] : []));
  if (!existsSync(join(BROWSER, 'index.html'))) throw new Error('dist/…/browser/index.html missing — run `npm run build` first');
  return walk(BROWSER).map((f) => ['/' + relative(BROWSER, f), readFileSync(f, 'utf8')]);
}
const head = (html: string) => html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? '';
const inlineCss = (html: string) => [...head(html).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');

test('(a) no page asks for a stylesheet: no <link rel="stylesheet"> anywhere in the HTML', () => {
  const all = pages();
  assert.ok(all.length >= 20, `${all.length} pages — the build must produce its pages`);
  const offenders = all.flatMap(([p, html]) => [...html.matchAll(/<link\b[^>]*\srel="?stylesheet"?[^>]*>/gi)].map((m) => `${p}: ${m[0]}`));
  assert.deepEqual(offenders, []);
});

test('(b) every page carries both themes whole in its inline styles: the stored dark, the system dark, the light :root', () => {
  const problems: string[] = [];
  for (const [p, html] of pages()) {
    const css = inlineCss(html);
    const checks: Array<[string, RegExp]> = [
      ['the light tokens on :root', /:root\s*\{[^}]*--bg:\s*#f{3}(?:f{3})?\b/i],
      ['the stored dark choice', /:root\[data-theme=["']?dark["']?\]\s*\{[^}]*--bg:\s*#0a1120/i],
      ['the system dark while nothing is chosen', /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root:not\(\[data-theme=["']?light["']?\]\)\s*\{[^}]*--bg:\s*#0a1120/i],
    ];
    for (const [what, re] of checks) if (!re.test(css)) problems.push(`${p}: no ${what}`);
  }
  assert.deepEqual(problems, []);
});

test('(c) every @font-face of fonts.css is inline in every page: the same faces (family, weight, file, range), no more, no less', () => {
  const faces = (css: string) => [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const body = m[1]!;
    const get = (re: RegExp) => (body.match(re)?.[1] ?? '').replace(/['"\s]/g, '');
    return [get(/font-family:\s*([^;]+)/), get(/font-weight:\s*([^;]+)/), get(/url\(([^)]+)\)/), get(/unicode-range:\s*([^;}]+)/).toUpperCase()].join(' ');
  }).sort();
  const source = faces(readFileSync(join(BROWSER, 'fonts/fonts.css'), 'utf8'));
  assert.ok(source.length >= 14, `fonts.css declares ${source.length} faces`);
  const problems: string[] = [];
  for (const [p, html] of pages()) {
    const inline = faces(inlineCss(html));
    if (JSON.stringify(inline) !== JSON.stringify(source)) {
      const missing = source.filter((f) => !inline.includes(f));
      problems.push(`${p}: ${inline.length} faces inline, ${source.length} in fonts.css; missing ${missing.length} (${missing[0] ?? '—'})`);
    }
  }
  assert.deepEqual(problems, []);
});
