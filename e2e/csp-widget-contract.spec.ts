import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WIDGET_API_URL, WIDGET_SCRIPT_URL } from '../src/app/core/integrations/embed-snippet';
import { cspValues, type VercelCspConfig } from './vercel-csp';

// L3 D5 (S2): the widget on the page needs three origins in the Content-Security-Policy, and the policy is written TWICE in
// vercel.json — in `headers[]` for every page and in the 410 route of L1б (`routes[].headers`), because routes run before
// headers on Vercel. The contract, by token sets, not by substring (a substring passes `…/widget.js` with a path in
// font-src, an `http://` origin and a stray `https:`):
//   script-src  = 'self' + 'unsafe-inline' + cal.com + the origin of WIDGET_SCRIPT_URL
//   font-src    = 'self' + data: + the origin of WIDGET_SCRIPT_URL            (the widget draws DM Sans from its own origin)
//   connect-src = what the site already allowed + the origin of WIDGET_API_URL
//   every other directive is as it was
// The origins are IMPORTED from the code the site ships (embed-snippet.ts), never typed here (R67 item 3): a changed embed
// origin moves this test with it. `vercel.json` is not applied locally; this file is the proof of what is deployed, and
// widget-fonts-csp.pw.ts puts the same text on a document in a browser. Preview check: `curl -sI $PREVIEW/` equals it.

const ROOT = new URL('../', import.meta.url);
const config = JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as VercelCspConfig;
const copies = cspValues(config);

const widgetOrigin = new URL(WIDGET_SCRIPT_URL).origin;
const apiOrigin = new URL(WIDGET_API_URL).origin;

function directives(policy: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const part of policy.split(';').map((p) => p.trim()).filter(Boolean)) {
    const [name, ...tokens] = part.split(/\s+/);
    map.set(name!.toLowerCase(), new Set(tokens));
  }
  return map;
}
const sorted = (set: Set<string> | undefined) => [...(set ?? [])].sort();

test('the CSP is written in vercel.json twice — the headers block and the 410 route — and the copies are equal', () => {
  assert.ok(copies.length >= 2, `${copies.length} CSP values in vercel.json (headers[] and routes[].headers), expected at least 2`);
  assert.equal(new Set(copies).size, 1, 'the copies of the CSP differ; routes run before headers on Vercel, so the route repeats the block');
});

test('the origins come from the embed code: https, no path, two different hosts', () => {
  assert.match(widgetOrigin, /^https:\/\/[^/]+$/);
  assert.match(apiOrigin, /^https:\/\/[^/]+$/);
  assert.notEqual(widgetOrigin, apiOrigin);
});

test('script-src is self, unsafe-inline, cal.com and the widget origin — in every copy', async (t) => {
  for (const [i, policy] of copies.entries()) {
    await t.test(`copy ${i + 1}`, () => {
      assert.deepEqual(sorted(directives(policy).get('script-src')), ["'self'", "'unsafe-inline'", 'https://cal.com', widgetOrigin].sort());
    });
  }
});

test('font-src is self, data: and the widget origin — in every copy', async (t) => {
  for (const [i, policy] of copies.entries()) {
    await t.test(`copy ${i + 1}`, () => {
      assert.deepEqual(sorted(directives(policy).get('font-src')), ["'self'", 'data:', widgetOrigin].sort());
    });
  }
});

test('connect-src is what the site allowed before plus the API origin — in every copy', async (t) => {
  for (const [i, policy] of copies.entries()) {
    await t.test(`copy ${i + 1}`, () => {
      assert.deepEqual(sorted(directives(policy).get('connect-src')), ["'self'", 'https://api.resend.com', 'https://*.supabase.co', 'https://cal.com', apiOrigin].sort());
    });
  }
});

test('every other directive is as it was before the widget', async (t) => {
  const before: Record<string, string[]> = {
    'default-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'frame-src': ['https://cal.com'],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  for (const [i, policy] of copies.entries()) {
    await t.test(`copy ${i + 1}`, () => {
      const d = directives(policy);
      const known = new Set([...Object.keys(before), 'script-src', 'font-src', 'connect-src']);
      assert.deepEqual([...d.keys()].filter((k) => !known.has(k)), [], 'a directive the contract does not know');
      for (const [name, tokens] of Object.entries(before)) assert.deepEqual(sorted(d.get(name)), [...tokens].sort(), name);
    });
  }
});
