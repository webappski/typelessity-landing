import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { RETIRED_SLUGS, RETIRED_TERMS, SEVEN, SEVEN_CATEGORIES, SEVEN_SLUGS } from './industries-seven';

// L1б: what the build holds after 30 industry addresses are taken down — read from the built bytes (run
// `npm run build` first), held against the written lists of industries-seven.ts, not against the data the build was
// made from. The 410 answer itself is the platform's and is proved on the preview of the commit (card L1b).

const BROWSER = process.env['LANDING_DIST'] ?? join(new URL('..', import.meta.url).pathname, 'dist', 'typelessity-landing', 'browser');
const read = (name: string): string => {
  const p = join(BROWSER, name);
  if (!existsSync(p)) throw new Error(`${p} missing — run \`npm run build\` before this check.`);
  return readFileSync(p, 'utf8');
};
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

test('dist holds a directory for each of the seven kept industries and for none of the 30 taken down', () => {
  const dir = join(BROWSER, 'industries');
  const built = readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory()).sort();
  assert.deepEqual(built, [...SEVEN_SLUGS].sort());
  for (const s of RETIRED_SLUGS) assert.equal(existsSync(join(dir, s)), false, `dist still holds industries/${s}`);
  for (const s of SEVEN_SLUGS) assert.ok(existsSync(join(dir, s, 'index.html')), `industries/${s}/index.html is missing`);
  assert.ok(existsSync(join(dir, 'index.html')), 'the hub is not built');
});

test('the hub: seven cards in the five kept categories, each card in its own category, the heading says seven', () => {
  const html = read('industries/index.html');
  const sections = [...html.matchAll(/<section[^>]*class="[^"]*industries-cat[^"]*"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => m[1]);
  const byCategory = new Map<string, string[]>();
  for (const body of sections) {
    const h2 = decode(body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, '').trim() ?? '');
    byCategory.set(h2, [...body.matchAll(/href="\/industries\/([^"]+)"/g)].map((m) => m[1]).sort());
  }
  assert.deepEqual([...byCategory.keys()].sort(), SEVEN_CATEGORIES, 'the hub groups the industries in different categories');
  for (const c of SEVEN_CATEGORIES) {
    assert.deepEqual(byCategory.get(c), SEVEN.filter((i) => i.category === c).map((i) => i.slug).sort(), `${c}: a different set of cards`);
  }
  assert.equal((html.match(/class="industry-card"/g) ?? []).length, SEVEN.length);
  assert.match(decode(html), /fits 7 verticals/);
});

test('the home page: seven industry cells (not counting the «all» tile), the names of the seven, the link to the hub', () => {
  const html = read('index.html');
  const cells = [...html.matchAll(/<li[^>]*class="home-industries__cell"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '').trim()));
  assert.deepEqual([...cells].sort(), SEVEN.map((i) => i.name).sort());
  assert.match(html, /<li[^>]*class="home-industries__cell home-industries__cell--more"[^>]*>\s*<a[^>]*href="\/industries"[^>]*>\s*All 7 industries/);
  assert.match(decode(html), /Configured for 7 verticals/);
});

// The JSON-LD FAQPage and the meta tags are not visible text, so the page-text guard of claims-class-guard does not read
// them; they are what a crawler quotes, and they must not name a retired vertical.
test('scripts and meta tags of the home, hub, FAQ and for-ai-agents pages name none of the retired industries or categories', () => {
  const offenders: string[] = [];
  for (const page of ['index.html', 'industries/index.html', 'faq/index.html', 'for-ai-agents/index.html']) {
    const html = read(page);
    const machine = [
      ...(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g) ?? []),
      ...(html.match(/<meta[^>]*>/g) ?? []),
    ].join(' ');
    const low = decode(machine).toLowerCase().replace(/\\u0026/g, '&');
    for (const term of RETIRED_TERMS) if (low.includes(term)) offenders.push(`${page}: «${term}»`);
  }
  assert.deepEqual(offenders, []);
});
