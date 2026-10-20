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

// L4: the home page draws one card per industry (a link to that industry's own page, "See the setup →"), in the order of the data; the chips,
// the «All 7 industries» tile and the «Configured for 7 verticals» heading are gone, and so is every link from the home page to the hub.
test('the home page: seven industry cards, each linking to its own page, the names of the seven, no link to the hub', () => {
  const html = read('index.html');
  const section = html.match(/<section[^>]*id="industries"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const cards = [...section.matchAll(/<a[^>]*class="[^"]*card--link[^"]*"[^>]*href="\/industries\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ slug: m[1]!, name: decode(m[2]!.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '') }));
  assert.deepEqual(cards.map((c) => c.slug).sort(), SEVEN.map((i) => i.slug).sort());
  assert.deepEqual(cards.map((c) => c.name).sort(), SEVEN.map((i) => i.name).sort());
  assert.doesNotMatch(html, /href="\/industries"/, 'a link from the home page to the hub');
  assert.doesNotMatch(decode(html), /Configured for \d+ verticals|All \d+ industries/);
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
