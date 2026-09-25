import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOME } from '../pages/home/home.content';

// Discovery files (llms.txt / llms-full.txt) are served verbatim from public/ and are
// what AI crawlers read alongside the deployed JSON-LD schema. They must NOT drift from
// the canonical pricing in home.content.ts (which mirrors schemas.ts + pricing.content.ts).
// This guard derives every expected string from HOME.pricing.tiers — it never hardcodes a
// price — so editing a price in home.content.ts without re-syncing the llms files fails here.
// (Same derive-don't-hardcode principle as reference_mc_dashboard_e2e_must_derive_from_snapshot.)

const llms = readFileSync(new URL('../../../public/llms.txt', import.meta.url), 'utf8');
const llmsFull = readFileSync(new URL('../../../public/llms-full.txt', import.meta.url), 'utf8');

test('llms.txt + llms-full.txt list every canonical pricing tier (name + price)', () => {
  for (const tier of HOME.pricing.tiers) {
    assert.ok(
      llms.includes(tier.name) && llms.includes(tier.price),
      `llms.txt missing tier "${tier.name}" (${tier.price})`,
    );
    assert.ok(
      llmsFull.includes(tier.name) && llmsFull.includes(tier.price),
      `llms-full.txt missing tier "${tier.name}" (${tier.price})`,
    );
  }
});

test('llms-full.txt header date is bumped (no stale 2026-05-19)', () => {
  assert.ok(!llmsFull.includes('2026-05-19'), 'stale Last-updated date 2026-05-19 still present');
});

test('llms files carry no 2-tier or pre-launch markers', () => {
  // A43 (founder 2026-09-25): from the 30.09 release the Free Pilot is open and set up in the
  // Webappski portal. This test used to demand pre-launch wording («Free Pilot at launch»); it now
  // forbids it, together with the old 2-tier framing.
  for (const [name, body] of [['llms.txt', llms], ['llms-full.txt', llmsFull]] as const) {
    assert.ok(!body.includes('Enterprise — Custom'), `${name} still says "Enterprise — Custom"`);
    assert.ok(!/>\s*5,000 sessions/.test(body), `${name} still says "> 5,000 sessions"`);
    assert.doesNotMatch(
      body,
      /coming soon|launching soon|launches soon|at launch|pre-?order|waitlist|get notified|private development/i,
      `${name} still describes Typelessity as not yet launched`,
    );
  }
});
