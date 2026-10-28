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

// TYL-DEMO-LIVE (28.10, founder: «a card is the picture of the site on top and what we already had below»): every card links to its demo site
// twice — the picture (outside the tab order and hidden from a screen reader: one stop per address) and the button «Open the demo site» —
// in a new tab with rel=noopener. No flag switches the button. The picture is a decorative <img> of fixed size; the first one is eager (it
// stands in the first screen at 390 and at 1280), the rest are lazy.
test('D6 every card links to its demo site from the picture and from the button, in a new tab with rel=noopener; one tab stop, the button', () => {
  const html = read('demo/index.html');
  const cards = [...html.matchAll(/<article\b[^>]*data-demo="([^"]+)"[\s\S]*?<\/article>/g)];
  assert.equal(cards.length, DEMO_CARDS.length);
  for (const [card, id] of cards) {
    const demo = DEMO_CARDS.find((c) => c.id === id)!;
    const anchors = [...card.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
    assert.equal(anchors.length, 2, `${id} prints ${anchors.length} links, not the picture and the button`);
    for (const a of anchors) {
      assert.match(a, /target="_blank"/, `${id}: a link without a new tab`);
      assert.match(a, /rel="noopener"/, `${id}: a link without rel=noopener`);
      assert.ok(a.replace(/&amp;/g, '&').includes(`href="${new URL(demo.liveUrl).origin}/?utm_source=typelessity.com&utm_medium=demo-page&utm_content=${id}"`), `${id}: the address of a link`);
    }
    const [shot, button] = anchors as [string, string];
    assert.match(shot, /class="card__shot"/, `${id}: the first link is not the picture`);
    assert.match(shot, /tabindex="-1"/, `${id}: the picture is in the tab order`);
    assert.match(shot, /aria-hidden="true"/, `${id}: the picture is read twice`);
    assert.doesNotMatch(button, /tabindex|aria-hidden/, `${id}: the button is out of the tab order or hidden`);
    assert.match(card, new RegExp(`<a\\b[^>]*>\\s*Open the demo site[\\s\\S]*?<span\\b[^>]*class="sr-only"[^>]*>${demo.name} \\(opens in a new tab\\)</span>`), `${id}: the label and the screen-reader text of the button`);
    assert.match(card, new RegExp(`<span\\b[^>]*class="card__url"[^>]*>${new URL(demo.liveUrl).host}</span>`), `${id}: the honest address in the frame of the picture`);
    const imgs = [...card.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    assert.equal(imgs.length, 1, `${id}: ${imgs.length} images`);
    assert.match(imgs[0]!, new RegExp(`\\ssrc="/demo/${id}\\.webp"`), `${id}: the source of the picture`);
    assert.match(imgs[0]!, /\swidth="800"/);
    assert.match(imgs[0]!, /\sheight="500"/);
    assert.match(imgs[0]!, /\salt=""/, `${id}: the picture is decorative — the name is in the heading and in the button`);
    assert.match(imgs[0]!, new RegExp(`\\sloading="${id === 'glow' ? 'eager' : 'lazy'}"`), `${id}: loading`);
  }
  // outside the cards no link leads to a demo site
  const outside = html.replace(/<article\b[\s\S]*?<\/article>/g, ' ');
  assert.doesNotMatch(outside, /netlify\.app/i);
});

// The pictures are the previews of the four demo sites: 800×500 WebP, at most 60 KB each (BRIEF §6: the mobile speed bar is #75).
function webpSize(buf: Buffer): { width: number; height: number } {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
  if (kind === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  throw new Error(`unknown WebP chunk ${kind}`);
}

test('D7 the four previews are in the build: WebP, 800×500, at most 60 KB each', () => {
  for (const card of DEMO_CARDS) {
    const buf = readFileSync(join(BROWSER, 'demo', `${card.id}.webp`));
    assert.ok(buf.length <= 60 * 1024, `${card.id}.webp is ${Math.round(buf.length / 1024)} KB`);
    assert.deepEqual(webpSize(buf), { width: 800, height: 500 }, `${card.id}.webp size`);
  }
});

test('D8 the words of the page do not depend on a flag; the line about the new tab stands under the cards and above the strip; the strip leads where the header does', () => {
  const html = read('demo/index.html');
  const copy = demoCopy();
  assert.ok(html.includes(copy.h1) && html.includes(copy.eyebrow), 'the page does not print the h1 and the eyebrow of demoCopy()');
  assert.equal(copy.h1, 'See how a booking goes in the chat.');
  assert.doesNotMatch(html, /Try it on a demo website|Live demos/);
  assert.equal((html.match(/Open the demo site/g) ?? []).length, DEMO_CARDS.length, 'one button per card');
  // the first «Get it free» is in the header, above the cards: the strip is the last one
  const fine = html.indexOf(copy.fine);
  assert.ok(fine > html.lastIndexOf('</article>') && fine < html.lastIndexOf('Get it free'), 'the line about the new tab is not between the last card and the strip');
  const cta = [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"[^>]*>\s*Get it free\s*<\/a>/gi)].map((m) => m[1]!.replace(/&amp;/g, '&'));
  assert.ok(cta.length >= 2, 'the header and the strip both say «Get it free»');
  assert.equal(new Set(cta).size, 1, 'the strip and the header lead to different addresses');
});
