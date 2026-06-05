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

test('llms files carry no 2-tier / live-pilot contradiction markers', () => {
  // Old 2-tier framing the deployed 4-tier PreOrder schema contradicts.
  for (const [name, body] of [['llms.txt', llms], ['llms-full.txt', llmsFull]] as const) {
    assert.ok(!body.includes('Enterprise — Custom'), `${name} still says "Enterprise — Custom"`);
    assert.ok(!/>\s*5,000 sessions/.test(body), `${name} still says "> 5,000 sessions"`);
    // Present-tense "included in the Pilot" asserts a live pilot; pre-launch copy must say
    // "Free Pilot at launch". Guards the L51/L98 amendment against regression.
    assert.ok(
      !/is included in the Pilot\b/.test(body),
      `${name} still uses present-tense "is included in the Pilot" (pre-launch drift)`,
    );
  }
});
