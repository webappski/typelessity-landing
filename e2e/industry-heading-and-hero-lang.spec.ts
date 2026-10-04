import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ALL_INDUSTRIES } from '../src/app/lib/industries';

// r64 frames of the landing release (c8, 2026-10-04) found two wording defects the claims guards do not read:
//   1. «Why {{ industry.name }} needs Typelessity» on every industry page: the industry names are plural
//      («Hair salons»), so the sentence disagreed in number («Hair salons needs»), and the name's capital
//      stood in the middle of the phrase. The class is any heading built from the data's name — the fix is a
//      heading that does not depend on the name, so the guard reads all pages and asks for exactly that.
//   2. «VOICE · 25 LANG» in the hero mock-up while the rest of the site says «25+ languages». The class is the
//      abbreviated count: no page may carry «<number> lang» as a word of its own.
//
// Like the other guards this reads the prerendered bytes a visitor and a crawler receive — run `npm run build`
// first. LANDING_DIST points it at another copy of dist/typelessity-landing/browser (the mutation-sanity run
// feeds it a copy with the old wording put back; it must go red).

const DIST = process.env['LANDING_DIST']
  ? pathToFileURL(`${process.env['LANDING_DIST']}/`)
  : new URL('../dist/typelessity-landing/browser/', import.meta.url);

async function walk(dir: URL, out: URL[] = []): Promise<URL[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await walk(url, out);
    else out.push(url);
  }
  return out;
}

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

const visibleText = (html: string) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');

const h2s = (html: string) =>
  [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => visibleText(m[1]).trim());

let pages: Map<string, string>;

before(async () => {
  let files: URL[];
  try {
    files = await walk(DIST);
  } catch {
    throw new Error(`${DIST.pathname} missing — run \`npm run build\` before this check.`);
  }
  pages = new Map();
  for (const f of files) {
    if (f.pathname.endsWith('.html')) pages.set(f.pathname.slice(DIST.pathname.length), await readFile(f, 'utf8'));
  }
  assert.ok(pages.size > 50, `expected the prerendered site under dist/browser, found ${pages.size} html files`);
});

test('every industry page is built and the guard reads all of them, not a sample', () => {
  assert.ok(ALL_INDUSTRIES.length >= 30, `only ${ALL_INDUSTRIES.length} industries in the data`);
  const missing = ALL_INDUSTRIES.filter((i) => !pages.has(`industries/${i.slug}/index.html`)).map((i) => i.slug);
  assert.deepEqual(missing, [], `industry pages not prerendered: ${missing.join(', ')}`);
});

test('the «Why …» heading on each industry page does not depend on the industry name — no number clash, no capital mid-phrase', () => {
  const headings = new Map<string, string>();
  const problems: string[] = [];
  for (const industry of ALL_INDUSTRIES) {
    if (!industry.proofPoints.length) continue;
    const html = pages.get(`industries/${industry.slug}/index.html`);
    if (html === undefined) continue; // reported by the test above
    const why = h2s(html).filter((h) => /^Why\b/.test(h));
    if (why.length !== 1) {
      problems.push(`${industry.slug}: ${why.length} «Why …» headings (${why.join(' | ')}), expected exactly one`);
      continue;
    }
    const heading = why[0];
    headings.set(industry.slug, heading);
    if (heading.toLowerCase().includes(industry.name.toLowerCase())) {
      problems.push(`${industry.slug}: «${heading}» is built from the name «${industry.name}»`);
    }
    if (/\bneeds?\b/i.test(heading)) problems.push(`${industry.slug}: «${heading}» still says «need(s)» — the verb agrees with the name`);
    const capitals = heading.split(' ').slice(1).filter((w) => /^[A-Z]/.test(w) && w !== 'Typelessity');
    if (capitals.length) problems.push(`${industry.slug}: «${heading}» has a capital mid-phrase: ${capitals.join(', ')}`);
  }
  assert.deepEqual(problems, []);
  assert.ok(headings.size >= 30, `only ${headings.size} pages carried the heading`);
  assert.equal(new Set(headings.values()).size, 1, `the heading differs between pages: ${[...new Set(headings.values())].join(' | ')}`);
});

test('the hero mock-up says «25+ languages» like the rest of the site, and no page abbreviates a count to «<n> lang»', () => {
  const home = visibleText(pages.get('index.html') ?? '');
  assert.match(home, /voice · 25\+ languages/i, 'the mic line of the hero mock-up must read «voice · 25+ languages»');
  const offenders = [...pages].filter(([, html]) => /\b\d+\+?\s+lang\b/i.test(visibleText(html))).map(([p]) => p);
  assert.deepEqual(offenders, [], `an abbreviated «<n> lang» is left on: ${offenders.join(', ')}`);
});
