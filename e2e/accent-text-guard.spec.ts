import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// L3 F1, F2 (M29): in the light theme the orange fill of the site (--accent, #F77300) is 2.84:1 on white — a fill, never a
// text colour. Orange TEXT is its own token, --ink (a darker orange on light, a lighter one on dark), whose contrast the
// browser spec gray-text-contrast.pw.ts measures on every address. This guard keeps the old habit from coming back: no rule in
// `src` colours text with var(--accent) or var(--accent-hover). Only `color:` is the text colour — `background-color`,
// `border-color`, `outline-color` and `text-decoration-color` are fills and lines, which is why the match refuses a hyphen
// or a word character before `color` (the card's plain grep for «color:var(--accent» would also count 21 honest fills).

const SRC = join(new URL('.', import.meta.url).pathname, '..', 'src');
const TEXT_COLOUR = /(?<![-\w])color\s*:\s*var\(\s*--accent(?:-hover)?\s*[,)]/g;

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(scss|css|ts|html)$/.test(name)) out.push(p);
  }
  return out;
}

export function accentTextUses(text: string): number {
  return [...text.matchAll(TEXT_COLOUR)].length;
}

test('the guard counts text colours and leaves fills and lines alone (control)', () => {
  assert.equal(accentTextUses('a { color: var(--accent); }'), 1);
  assert.equal(accentTextUses('a:hover { color:var(--accent-hover) }'), 1);
  assert.equal(accentTextUses('a { color: var(--accent, #f60); }'), 1);
  assert.equal(accentTextUses('<span style="color: var(--accent)">'), 1);
  assert.equal(accentTextUses('a { background-color: var(--accent); border-color: var(--accent); outline-color: var(--accent-hover); text-decoration-color: var(--accent); }'), 0);
  assert.equal(accentTextUses('a { color: var(--ink); background: var(--accent); }'), 0);
});

test('no rule in src colours text with --accent or --accent-hover: orange text goes through --ink', () => {
  const all = files(SRC);
  assert.ok(all.length > 50, `${all.length} source files read`);
  const offenders: string[] = [];
  for (const file of all) {
    const text = readFileSync(file, 'utf8');
    const n = accentTextUses(text);
    if (n) offenders.push(`${file.slice(SRC.length + 1)}: ${n}`);
  }
  assert.deepEqual(offenders, [], 'orange text is 2.84:1 on white — use var(--ink)');
});
