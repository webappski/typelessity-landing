import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { STATIC_PATH_COUNT } from './retired-industries';

// L11 (2026-10-20, founder): the site has no industry pages and no link to one. «Industries can be anything, so the site says it adapts to
// any business and links to no industry.» The hub /industries and the seven pages answer 410 (src/app/discovery/retired-industries.spec.ts
// holds the rule); this file holds the bytes: nothing a visitor, a crawler or an AI agent receives names an /industries address.
//
// The scan is wider than «href in the HTML»: a `routerLink` that lives in a lazy chunk never appears in a prerendered page, and a link in
// llms.txt or sitemap.xml is a link too. So every text file of the build is read (html, js, txt, xml, json), the files of `public/`, and the
// source a build is made from (templates, content, the generated manifest, the API, the tools) — a link put back is red before the build.
// Reads the built bytes (run `npm run build` first). LANDING_DIST points at another copy of dist (the mutation run feeds it a spoiled one).

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');

/** An address under /industries in any spelling: `href="/industries"`, `routerLink="/industries"`, `https://typelessity.com/industries/x`, `'/industries'`. */
export function industryAddresses(text: string): string[] {
  return [...text.matchAll(/\/industries(?![\w-])/gi)].map((m) => text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, ' '));
}

function walk(dir: string, keep: (file: string) => boolean, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === '.angular') continue;
      walk(p, keep, out);
    } else if (keep(p)) out.push(p);
  }
  return out;
}

const TEXT = /\.(html|js|mjs|txt|xml|json|webmanifest)$/;
const SOURCE = /\.(ts|html|mdx|md|json)$/;

const built = existsSync(BROWSER) ? walk(BROWSER, (f) => TEXT.test(f)) : [];
const publicFiles = walk(join(ROOT, 'public'), (f) => /\.(txt|xml|json|webmanifest)$/.test(f));
const sources = [
  ...walk(join(ROOT, 'src'), (f) => SOURCE.test(f) && !/\.spec\.ts$/.test(f)),
  ...walk(join(ROOT, 'api'), (f) => /\.ts$/.test(f) && !/\.spec\.ts$/.test(f)),
  ...walk(join(ROOT, 'tools'), (f) => /\.ts$/.test(f)),
];

function offenders(files: string[]): string[] {
  return files.flatMap((f) => industryAddresses(readFileSync(f, 'utf8')).map((c) => `${relative(ROOT, f)}: …${c}…`));
}

test('the build exists and the guard reads it whole, not a sample', () => {
  assert.ok(existsSync(BROWSER), `${BROWSER} is missing — run \`npm run build\` before this check.`);
  assert.ok(built.filter((f) => f.endsWith('.html')).length >= 20, 'fewer than 20 html files in the build');
  assert.ok(built.filter((f) => f.endsWith('.js')).length >= 5, 'the lazy chunks are not read');
  assert.ok(built.some((f) => f.endsWith('sitemap.xml')) && built.some((f) => f.endsWith('llms.txt')) && built.some((f) => f.endsWith('llms-full.txt')));
});

test('no file of the build names an /industries address: no href, no routerLink in a chunk, no URL in a text file or in the markup', () => {
  assert.deepEqual(offenders(built), []);
});

test('no file of public/ names an /industries address (llms.txt, llms-full.txt, robots.txt)', () => {
  assert.deepEqual(offenders(publicFiles), []);
});

test('no source file names an /industries address: templates, articles, the generated manifest, the API and the tools', () => {
  assert.deepEqual(offenders(sources), []);
});

test('the build holds no industries directory and no page under it', () => {
  assert.equal(existsSync(join(BROWSER, 'industries')), false, 'dist still holds industries/');
});

test('sitemap.xml lists the eleven static pages and the articles, and not one /industries address', () => {
  const xml = readFileSync(join(BROWSER, 'sitemap.xml'), 'utf8');
  assert.equal((xml.match(/industries/gi) ?? []).length, 0, 'sitemap.xml mentions industries');
  const articles = readdirSync(join(ROOT, 'src', 'assets', 'content', 'blog')).filter((f) => f.endsWith('.mdx')).length;
  assert.equal((xml.match(/<loc>/g) ?? []).length, STATIC_PATH_COUNT + articles, `${STATIC_PATH_COUNT} static paths + ${articles} article files`);
});

test('self-check: every spelling of a link to an industry address is found, and the fair uses of the word are not', () => {
  const links = [
    '<a href="/industries">Industries</a>',
    '<a class="card" href="/industries/beauty-hair-salons">Hair salons</a>',
    'routerLink="/industries"',
    "[routerLink]=\"['/industries', i.slug]\"",
    '- [Hair salons](https://typelessity.com/industries/beauty-hair-salons)',
    '<loc>https://typelessity.com/industries</loc>',
    'e.navigate(["/industries/automotive-repair"])',
    'see /industries for current verticals',
  ];
  for (const l of links) assert.ok(industryAddresses(l).length > 0, `a link that the guard misses: ${l}`);
  const fair = [
    'an industry standard for technical longform',
    'results vary by industry, audience and baseline',
    'a per-industry config',
    'The /industriesx path',
    'industries-x',
    'Industry / Use Case (optional)',
  ];
  for (const f of fair) assert.equal(industryAddresses(f).length, 0, `a fair use that the guard flags: ${f}`);
});
