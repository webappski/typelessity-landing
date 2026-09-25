import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EMBED_SNIPPET, WIDGET_API_URL, WIDGET_SCRIPT_URL } from '../src/app/core/integrations/embed-snippet';

// A43 (founder 2026-09-25): from the 30.09 release the Free Pilot is open and Typelessity is set up
// in the Webappski portal. This reads what visitors and AI crawlers receive — the prerendered pages,
// their JSON-LD and the llms files — and fails on anything that still says «not launched yet», and
// on an embed code the portal does not hand out (cdn.typelessity.com does not resolve).
//
// Run `npm run build` first (it prerenders dist/).

const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);
const PAGES = ['index.html', 'pricing/index.html', 'faq/index.html', 'how-it-works/index.html', 'for-ai-agents/index.html'];
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
  for (const path of ['index.html', 'how-it-works/index.html']) {
    const body = unescape(await read(path));
    assert.ok(body.includes(`<script type="module" src="${WIDGET_SCRIPT_URL}"></script>`), `${path} lacks the portal's script tag`);
    assert.ok(body.includes(`<typelessity-widget api-url="${WIDGET_API_URL}"></typelessity-widget>`), `${path} lacks the portal's widget tag`);
  }
});

test('the line count of HTML to integrate is the embed code\'s own', async () => {
  const lines = EMBED_SNIPPET.split('\n').length;
  for (const path of SURFACES) {
    const body = unescape(await read(path));
    assert.doesNotMatch(body, /\b(?:one|1) line of HTML|>\s*1 line\s*</i, `${path} still says one line of HTML`);
  }
  assert.match(unescape(await read('index.html')), new RegExp(`>\\s*${lines} lines\\s*<`), `the home stats must say ${lines} lines`);
});
