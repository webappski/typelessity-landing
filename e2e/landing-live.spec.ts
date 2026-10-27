import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WIDGET_API_URL, WIDGET_SCRIPT_URL } from '../src/app/core/integrations/embed-snippet';

// A43 (founder 2026-09-25): from the 30.09 release the Free Pilot is open and Typelessity is set up
// in the Webappski portal. This reads what visitors and AI crawlers receive — the prerendered pages,
// their JSON-LD and the llms files — and fails on anything that still says «not launched yet», and
// on an embed code the portal does not hand out (cdn.typelessity.com does not resolve).
//
// Run `npm run build` first (it prerenders dist/).

const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);
const PAGES = ['index.html', 'pricing/index.html', 'faq/index.html', 'how-it-works/index.html', 'install/index.html', 'for-ai-agents/index.html'];
const SURFACES = [...PAGES, 'llms.txt', 'llms-full.txt'];
const PRE_LAUNCH = /coming soon|launching soon|launches soon|at launch|pre-?order|waitlist|get notified|private development|personal onboarding/i;

async function read(path: string): Promise<string> {
  try {
    return await readFile(new URL(path, DIST), 'utf8');
  } catch {
    throw new Error(`dist/${path} missing — run \`npm run build\` before this check.`);
  }
}

// The embed code is shown inside <pre>, so its tags arrive HTML-escaped.
const unescape = (html: string) =>
  html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;|&#34;/g, '"').replace(/&amp;/g, '&');

test('no page or AI-facing file says Typelessity is not launched yet', async () => {
  for (const path of SURFACES) {
    const match = (await read(path)).match(PRE_LAUNCH);
    assert.equal(match, null, `${path} still says «${match?.[0]}»`);
  }
});

test('every JSON-LD offer is available now, not a pre-order', async () => {
  for (const path of ['index.html', 'pricing/index.html']) {
    const availability = [...(await read(path)).matchAll(/"availability"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(availability.length > 0, `${path} carries no Offer availability`);
    assert.deepEqual([...new Set(availability)], ['https://schema.org/InStock'], `${path}: ${availability.join(', ')}`);
  }
});

test('the embed code shown is the one the portal hands out', async () => {
  for (const path of [...SURFACES]) {
    assert.ok(!(await read(path)).includes('cdn.typelessity.com'), `${path} points at cdn.typelessity.com, which does not resolve`);
  }
  for (const path of ['index.html', 'how-it-works/index.html', 'install/index.html']) {
    const body = unescape(await read(path));
    assert.ok(body.includes(`<script type="module" src="${WIDGET_SCRIPT_URL}"></script>`), `${path} lacks the portal's script tag`);
    assert.ok(body.includes(`<typelessity-widget api-url="${WIDGET_API_URL}"></typelessity-widget>`), `${path} lacks the portal's widget tag`);
  }
});

// TY-INSTALL (founder 26.10, 27.10): the home stat used to count the lines of the embed code («2 lines», from EMBED_SNIPPET) and so sold the install as two
// lines. It now counts the ways to the config of the site, and the number is /install's own — the cards of #config-first — not a literal of the home page.
// That no sentence says «two lines» without the config is held by e2e/install-config-first.spec.ts (K1).
test('the home stat counts the ways to the config: the number is the cards of /install, and no stat counts the lines of the embed code', async () => {
  for (const path of SURFACES) {
    const body = unescape(await read(path));
    assert.doesNotMatch(body, /\b(?:one|1) line of HTML|>\s*1 line\s*</i, `${path} still says one line of HTML`);
  }
  const ways = [...(await read('install/index.html')).matchAll(/class="[^"]*\binstall-config__way\b/g)].length;
  assert.ok(ways >= 2, `/install shows ${ways} ways to the config, expected at least the two the home page names`);
  const home = unescape(await read('index.html'));
  assert.match(home, new RegExp(`<b[^>]*>\\s*${ways} ways\\s*</b>`), `the home stats must say ${ways} ways, as many as /install has`);
  assert.doesNotMatch(home, />\s*\d+ lines\s*</i, 'a stat on the home page counts the lines of the embed code again');
});

// L3 (D6, S5, M8, M27): the hero holds the real widget, and the page does not ask for its script. The prerendered HTML carries
// the element — `<typelessity-widget position="inline" api-url=…>` — and NO <script> tag for widget.js: the loader runs in the
// browser after the first paint (widget-fonts-csp.pw.ts holds when). Read from the RAW bytes, without `unescape`: the embed
// code shown inside <pre> on / and /how-it-works is escaped text, and counting it would be counting an example. Only a real
// tag counts.
async function everyPage(): Promise<Map<string, string>> {
  const { readdir } = await import('node:fs/promises');
  const out = new Map<string, string>();
  const walk = async (dir: URL): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) await walk(url);
      else if (entry.name.endsWith('.html')) out.set(url.pathname.slice(DIST.pathname.length), await readFile(url, 'utf8'));
    }
  };
  await walk(DIST);
  return out;
}

test('no prerendered page carries a <script> tag for widget.js', async () => {
  const pages = await everyPage();
  assert.ok(pages.size >= 10, `only ${pages.size} pages read`);
  const offenders = [...pages].filter(([, html]) => /<script[^>]*widget\.js/i.test(html)).map(([p]) => p);
  assert.deepEqual(offenders, []);
});

// L4 (D3): the hero no longer holds the element. The prerender carries the SLOT — a host `[data-widget-host]` with an empty mount point
// and the status text — and the demo chunk puts `<typelessity-widget config-id=… api-url="https://demo.invalid">` into the mount point
// after `load` and an idle moment (home-demo.pw.ts holds the browser side). So no page of the build holds the element, and the
// api-url the widget is given is not the live API origin: the home page never asks the real API (the mock answers, home-demo-contract).
test('no prerendered page holds a <typelessity-widget> element; the hero of / holds the slot instead', async () => {
  const pages = await everyPage();
  const tags = (html: string) => [...html.matchAll(/<typelessity-widget\b[^>]*>/gi)].map((m) => m[0]);
  const offenders = [...pages].filter(([, html]) => tags(html).length > 0).map(([p]) => p);
  assert.deepEqual(offenders, []);
  const home = pages.get('index.html') ?? '';
  assert.equal((home.match(/<[a-z]+\s[^>]*\bdata-widget-host=/g) ?? []).length, 1, 'the hero of / holds one slot');
  assert.equal((home.match(/<[a-z]+\s[^>]*\bdata-widget-mount=/g) ?? []).length, 1);
  assert.match(home, /The demo chat runs in the real widget and needs JavaScript\./);
  assert.doesNotMatch(home, /Loading the chat/, 'the prerender says nothing that only becomes true after hydration');
  const others = [...pages].filter(([p, html]) => p !== 'index.html' && p !== 'index.csr.html' && /<[a-z]+\s[^>]*\bdata-widget-host=/.test(html)).map(([p]) => p);
  assert.deepEqual(others, []);
});
