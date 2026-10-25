import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_CARDS, demoCopy } from '../src/app/pages/demo/demo.content';

// TY-DEMO (25.10): what a crawler and a no-JavaScript visitor receive of the /demo page — the bytes of the build. Written before the
// code (red-before). Holds only what does not depend on the mock: the address is in the sitemap, it is a prerendered file, the
// discovery file lists it, and every page's header (server HTML) links to it. What the page prints is held by the specs written after
// the mock is approved. The behaviour a person sees (the link in the nav at 1440, in the menu at 390) is e2e/browser/demo-nav.pw.ts.
// Reads the built bytes (run `npm run build` first). LANDING_DIST points at another copy of dist.

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const SITE = 'https://typelessity.com';

function read(name: string): string {
  const p = join(BROWSER, name);
  if (!existsSync(p)) throw new Error(`${p} missing — run \`npm run build\` before this check.`);
  return readFileSync(p, 'utf8');
}

function walkHtml(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

test('D1 sitemap.xml lists https://typelessity.com/demo once', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.filter((l) => l === `${SITE}/demo`).length, 1, `${SITE}/demo in the sitemap`);
});

test('D2 /demo is a prerendered file of the build, not the 404 shell', () => {
  const html = read('demo/index.html');
  assert.match(html, /<h1[\s>]/, 'the prerendered /demo has no <h1>');
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/, 'the prerendered /demo is noindex');
});

test('D3 llms.txt lists the /demo page', () => {
  const links = [...read('llms.txt').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  assert.ok(links.includes(`${SITE}/demo`), `llms.txt links: ${links.filter((l) => l.startsWith(SITE)).join(', ')}`);
});

test('D4 the header of every page with a shell links to /demo in the server HTML', () => {
  const problems: string[] = [];
  let checked = 0;
  for (const file of walkHtml(BROWSER)) {
    const html = readFileSync(file, 'utf8');
    if (!/<footer[^>]*class="vc-footer"/.test(html)) continue; // index.csr.html is the empty shell the server falls back to
    checked++;
    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? '';
    const hrefs = [...header.matchAll(/<a\b[^>]*\shref="([^"]*)"/gi)].map((m) => m[1]);
    if (!hrefs.includes('/demo')) problems.push(`${file.slice(BROWSER.length)}: the header has no /demo`);
  }
  assert.ok(checked >= 10, `${checked} pages with a footer were read`);
  assert.deepEqual(problems, []);
});

// ── the page itself (written with the code; the four tests above are the red-before of 25.10) ──
test('D5 /demo prints the four cards in the order of the mock, each with the three scenes of its scenario', () => {
  const html = read('demo/index.html');
  assert.deepEqual([...html.matchAll(/<article\b[^>]*data-demo="([^"]+)"/g)].map((m) => m[1]), ['glow', 'autopro', 'transedge', 'medbook']);
  for (const [card] of html.matchAll(/<article\b[\s\S]*?<\/article>/g)) {
    assert.match(card, /The visitor says/);
    assert.match(card, /The widget asks/);
    assert.match(card, /GETS A REQUEST/);
  }
});

// APPROVED p.1: the Typelessity widget answers on none of the four demo sites on 25.10, so no card leads to one. A card that is switched on
// (`live: true` in demo.content.ts, one line after the founder has checked the site) prints exactly one link, to its site, in a new tab with
// rel=noopener; a card that is off prints none. Read from the same list the page is drawn from, so the flag is held in both states.
test('D6 a card links to its demo site if and only if it is switched on, and then in a new tab with rel=noopener', () => {
  const html = read('demo/index.html');
  const cards = [...html.matchAll(/<article\b[^>]*data-demo="([^"]+)"[\s\S]*?<\/article>/g)];
  assert.equal(cards.length, DEMO_CARDS.length);
  for (const [card, id] of cards) {
    const demo = DEMO_CARDS.find((c) => c.id === id)!;
    const anchors = [...card.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
    if (!demo.live) { assert.deepEqual(anchors, [], `${id} is off and prints a link`); continue; }
    assert.equal(anchors.length, 1, `${id} is on and prints ${anchors.length} links`);
    assert.match(anchors[0]!, /target="_blank"/);
    assert.match(anchors[0]!, /rel="noopener"/);
    assert.ok(anchors[0]!.replace(/&amp;/g, '&').includes(`href="${new URL(demo.liveUrl).origin}/?utm_source=typelessity.com&utm_medium=demo-page&utm_content=${id}"`), `${id}: the address of the button`);
  }
  // outside the cards no link leads to a demo site, whatever the flags say
  const outside = html.replace(/<article\b[\s\S]*?<\/article>/g, ' ');
  assert.doesNotMatch(outside, /netlify\.app/i);
});

test('D7 the words of the page follow the flags: the scenario words while no demo is on, the words of a live demo once one is; the strip leads where the header does', () => {
  const html = read('demo/index.html');
  const copy = demoCopy();
  assert.ok(html.includes(copy.h1) && html.includes(copy.eyebrow), 'the page does not print the h1 and the eyebrow of demoCopy()');
  if (DEMO_CARDS.some((c) => c.live)) assert.equal(copy.h1, 'Try it on a demo website.');
  else {
    assert.equal(copy.h1, 'See how a booking goes in the chat.');
    assert.doesNotMatch(html, /Try it on a demo website|Live demos|Open the demo site/);
  }
  const cta = [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"[^>]*>\s*Get it free\s*<\/a>/gi)].map((m) => m[1]!.replace(/&amp;/g, '&'));
  assert.ok(cta.length >= 2, 'the header and the strip both say «Get it free»');
  assert.equal(new Set(cta).size, 1, 'the strip and the header lead to different addresses');
});
