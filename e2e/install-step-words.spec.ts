import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// TY-SETUP-WORDS-LAND (founder 05.11, question 7 of the comparison architecture = «variant A»; card TYC-FU-14). /install said
// «The Install step shows the exact code for your platform.» The Install step of the portal wizard shows ONE block of HTML code for the
// owner's site (two lines: the script and the element); the tabs per platform live under «For developers» on the product page and reach the
// wizard step only with WA-TY-INSTALL-FRAMEWORK. Until then no page, llms file or source of the landing says that the step is per platform.
// Classes of the guard:
//   W1  nowhere (build output: html and txt, JSON-LD included; sources of src/) is the Install step said to show code «for your platform»
//       or «exact code» per platform;
//   W2  the replacement is there on /install, and the tail «Before you publish, you can try the widget as a customer.» stays.
// It reads the bytes a visitor and an AI crawler receive (dist/typelessity-landing/browser) and the sources of src/. Run `npm run build`
// first. LANDING_DIST / LANDING_SRC point the guard at another copy (the mutation runs feed them a copy with the old text put back; each
// must go red).

const DIST = process.env['LANDING_DIST'] ?? join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const SRC = process.env['LANDING_SRC'] ?? join(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** What a reader sees: no scripts or styles, no tags, entities decoded, whitespace collapsed. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ');
}

// ── W1: the forms, by class ──────────────────────────────────────────────────────────────────────
// A window never crosses a full stop or a tag («[^.<>]»), so one sentence cannot borrow the words of the next one.
const FORBIDDEN: ReadonlyArray<readonly [string, RegExp]> = [
  ['exact code for your platform', /\bexact code\b[^.<>]{0,30}\bplatform\b/i],
  ['code for your platform', /\bcode\b[^.<>]{0,20}\bfor your (?:platform|framework|stack|cms)\b/i],
  ['Install step per platform', /\bInstall step\b[^.<>]{0,40}\b(?:platform|framework)\b/i],
];

function offences(text: string): string[] {
  const out: string[] = [];
  for (const [name, re] of FORBIDDEN) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(g)) out.push(`${name}: «${m[0].trim()}»`);
  }
  return out;
}

test('[W1] the checker catches the old sentence and its near forms and lets the new sentence through', () => {
  for (const mutant of [
    'The Install step shows the exact code for your platform.',
    'The Install step shows the exact code for your platform. Before you publish, you can try the widget as a customer.',
    'The Install step gives you the exact code for each platform.',
    'Paste the code for your platform from the Install step.',
    'The Install step shows the code for your framework.',
    'the Install step has a tab per platform',
  ]) assert.ok(offences(mutant).length > 0, `W1 does not catch «${mutant}»`);
  for (const legal of [
    'The Install step shows one block of HTML code for your site. Before you publish, you can try the widget as a customer.',
    'Paste these two lines once, in the part of your site that every page shares.',
    'Typelessity works on any website platform that lets you add a script.',
    'it is the same code on every platform',
  ]) assert.deepEqual(offences(legal), [], `W1 flags the legal form «${legal}»`);
});

let pages: Map<string, string>;
let sources: Map<string, string>;

before(() => {
  assert.ok(existsSync(DIST), `${DIST} missing — run \`npm run build\` before this check`);
  pages = new Map(
    walk(DIST)
      .filter((f) => f.endsWith('.html') || f.endsWith('.txt'))
      .filter((f) => !f.endsWith('3rdpartylicenses.txt'))
      .map((f) => [relative(DIST, f), readFileSync(f, 'utf8')] as const),
  );
  assert.ok(pages.size >= 20 && pages.has('install/index.html') && pages.has('llms.txt'), `expected the prerendered site in ${DIST}, found ${pages.size} text files`);
  sources = new Map(
    walk(SRC)
      .filter((f) => /\.(ts|html)$/.test(f) && !/\.spec\.ts$/.test(f))
      .map((f) => [relative(SRC, f), readFileSync(f, 'utf8')] as const),
  );
  assert.ok(sources.has('app/pages/install/install.content.ts'), `expected src/ in ${SRC}`);
});

test('[W1] no page, post, llms file or structured data of the build says the Install step shows code per platform', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    // the raw bytes (meta, JSON-LD included) and what a reader sees: an entity in the middle of a phrase must not hide it
    for (const o of new Set([...offences(body), ...offences(visibleText(body))])) offenders.push(`${path}: ${o}`);
  }
  assert.deepEqual(offenders, [], 'the Install step shows one block of code for the owner\'s site, not a code per platform');
});

test('[W1] no source of src/ says it either (a place the prerender does not reach yet)', () => {
  const offenders: string[] = [];
  for (const [path, body] of sources) for (const o of offences(body)) offenders.push(`src/${path}: ${o}`);
  assert.deepEqual(offenders, [], 'a source file of the landing says the Install step shows code per platform');
});

// ── W2: the replacement is there ─────────────────────────────────────────────────────────────────
test('[W2] /install says the Install step shows one block of HTML code for the site, and keeps the sentence about trying the widget', () => {
  const text = visibleText(pages.get('install/index.html')!);
  assert.ok(text.includes('The Install step shows one block of HTML code for your site.'), '/install lost «The Install step shows one block of HTML code for your site.»');
  assert.ok(
    text.includes('The Install step shows one block of HTML code for your site. Before you publish, you can try the widget as a customer.'),
    '/install lost the tail «Before you publish, you can try the widget as a customer.» next to the new sentence',
  );
});
