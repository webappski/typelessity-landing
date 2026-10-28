import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// SEO24-TYL-1: every reader of vercel.json goes through ONE loader (e2e/vercel-effective.ts: loadVercelConfig / loadRoutes), which honours LANDING_VERCEL_JSON and
// returns the rules the way the platform runs them. A spec that opens the file on its own reads one way of writing the rules (the keys `headers`, `redirects`,
// `trailingSlash`), breaks the day the file is written another way, and ignores the copy a mutation run feeds the others — it stays green on a spoiled file.
// This guard lists the files of the repo that name the file as a path and fails on any that is not in ALLOWED. The mutation run of the wiring (every reader red on a
// file that gives no rules) is in pending-review/2026-10-28/SEO24-TYL-1/mut-wiring.log; this is the part of it that stays.

const ROOT = new URL('../../../', import.meta.url).pathname;

/** The files that may name vercel.json as a path, and why. Others of this repo name `packages/<x>/vercel.json` (the product repo, another file) or only speak of it in a comment. */
const ALLOWED: Record<string, string> = {
  'e2e/vercel-effective.ts': 'the loader',
  'src/app/discovery/vercel-schema.spec.ts': 'validates the raw file against the schema Vercel publishes: the form is what it holds',
};

/** A path to the file as a string: `'vercel.json'`, `"../vercel.json"`, `` `vercel.json` `` — not `'packages/api/vercel.json'` and not the word in a sentence. */
const PATH_OF_THE_FILE = /['"`](?:\.{1,2}\/)*vercel\.json['"`]/;

/** The source without its comments: a sentence in a comment may name the file in backticks. */
const code = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', 'dist', '.angular', 'test-results'].includes(e.name) ? [] : walk(full);
    return /\.(ts|mjs|js|cjs)$/.test(e.name) ? [full] : [];
  });
}

test('only the loader (and the schema guard) open vercel.json: every other reader asks the routes', () => {
  const opening = ['e2e', 'src', 'tools', 'scripts']
    .flatMap((d) => { try { return walk(join(ROOT, d)); } catch { return []; } })
    .map((f) => relative(ROOT, f))
    .filter((f) => PATH_OF_THE_FILE.test(code(readFileSync(join(ROOT, f), 'utf8'))));
  assert.deepEqual(opening.filter((f) => !(f in ALLOWED)), [], 'a file opens vercel.json on its own: read it with loadVercelConfig() or loadRoutes() from e2e/vercel-effective.ts');
  assert.deepEqual(Object.keys(ALLOWED).filter((f) => !opening.includes(f)), [], 'an allowed file no longer opens vercel.json: drop it from ALLOWED');
});
