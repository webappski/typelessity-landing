import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WIDGET_SCRIPT_URL } from '../src/app/core/integrations/embed-snippet';
import { cspValues, type VercelCspConfig } from './vercel-csp';

// L12 (C16, decision on FL-38), meaning corrected at L14 (legal L-1) and at LG-1 (legal 27.10). Until 26.10 the widget loaded from its CDN asked for Google Fonts
// and this policy blocked that request (checked 2026-10-20 over CDP: `Network.requestWillBeSent` then `loadingFailed blockedReason=csp`). Since 26.10 the widget on
// the CDN takes its typefaces from its own origin (85c8cbb) and asks Google nothing; the block stays as a second line. This file holds ONE thing: the CSP of
// typelessity.com does not open Google Fonts. What /gdpr must say is another perimeter (the widget on the customer's site, where this CSP does not apply): it is held
// by e2e/gdpr-facts.spec.ts, which reads the widget code. If this test goes red, the CSP was opened to Google Fonts: if the widget asks Google again, the visitor's
// IP would reach Google here too — write that on /gdpr (FL-38, gate) BEFORE the policy is changed.
// vercel.json is read as the file that ships; CSP_VERCEL_JSON points the mutation run at a copy (vercel.json itself stays untouched).

const ROOT = new URL('../', import.meta.url);
const path = process.env['CSP_VERCEL_JSON'];
const config = JSON.parse(readFileSync(path ?? new URL('vercel.json', ROOT), 'utf8')) as VercelCspConfig;
const policies = cspValues(config);
const GOOGLE_FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

test('the CSP exists in vercel.json (headers and the 410 route), so the next test reads something', () => {
  assert.ok(policies.length >= 2, `${policies.length} CSP values found`);
});

test('no copy of the CSP lets style-src, font-src or connect-src (or the default-src they fall back to) reach Google Fonts', () => {
  const bad: string[] = [];
  for (const [i, policy] of policies.entries()) {
    for (const part of policy.split(';').map((p) => p.trim()).filter(Boolean)) {
      const [name, ...tokens] = part.split(/\s+/);
      if (!['style-src', 'font-src', 'connect-src', 'default-src'].includes(name!.toLowerCase())) continue;
      for (const host of GOOGLE_FONTS) if (tokens.some((t) => t.includes(host))) bad.push(`copy ${i + 1}: ${name} names ${host}`);
    }
  }
  assert.deepEqual(bad, [], 'the CSP is open to Google Fonts: the widget would load them before consent on this site too. Say so on /gdpr first (FL-38).');
});

test("font-src still names the widget's own origin, taken from the embed code (the guard has something to compare with)", () => {
  const origin = new URL(WIDGET_SCRIPT_URL).origin;
  for (const policy of policies) assert.ok((policy.match(/font-src[^;]*/)?.[0] ?? '').includes(origin), `font-src lacks ${origin}`);
});
