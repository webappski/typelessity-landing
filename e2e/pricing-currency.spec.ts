import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HOME } from '../src/app/pages/home/home.content';

// A42 (founder 2026-09-25: «всё в евро»): every Typelessity tier is priced in euro, the way
// webappski.com already shows it. This reads what a visitor and an AI crawler receive — the
// prerendered pages, their JSON-LD, and the llms files the build copies to dist/ — and fails on
// any tier price in dollars. The tier numbers come from home.content.ts, never typed here.
//
// Run `npm run build` first (it prerenders dist/).

const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);
const SURFACES = ['index.html', 'pricing/index.html', 'for-ai-agents/index.html', 'faq/index.html', 'llms.txt', 'llms-full.txt'];

const amounts = HOME.pricing.tiers.map((tier) => tier.price.replace(/[^0-9]/g, ''));

async function read(path: string): Promise<string> {
  try {
    return await readFile(new URL(path, DIST), 'utf8');
  } catch {
    throw new Error(`dist/${path} missing — run \`npm run build\` before this check.`);
  }
}

test('the canonical tiers are priced in euro', () => {
  for (const tier of HOME.pricing.tiers) {
    assert.match(tier.price, /^€\d+$/, `${tier.name} is priced "${tier.price}", not in euro`);
  }
});

test('no page or AI-facing file shows a tier price in dollars', async () => {
  for (const path of SURFACES) {
    const body = await read(path);
    for (const n of amounts) {
      const dollars = new RegExp(`(?:\\$|US\\$|USD\\s?)${n}(?![0-9])|(?<![0-9])${n}\\s?(?:\\$|USD)`);
      assert.doesNotMatch(body, dollars, `${path} shows the ${n} tier in dollars`);
    }
    // «€» written through a Latin-1 round trip reads «â‚¬» or «â¬» — it looks like a price to a
    // test that compares against the same broken string, so it is checked on its own.
    assert.ok(!/\u00e2\u0082\u00ac|\u00e2\u201a\u00ac/.test(body), `${path} carries a mis-encoded euro sign`);
  }
});

test('the pricing page shows every tier in euro', async () => {
  const body = await read('pricing/index.html');
  for (const tier of HOME.pricing.tiers) {
    assert.ok(body.includes(tier.price), `/pricing does not show ${tier.name} at ${tier.price}`);
  }
});

test('every JSON-LD offer is in EUR', async () => {
  for (const path of ['index.html', 'pricing/index.html']) {
    const currencies = [...(await read(path)).matchAll(/"priceCurrency"\s*:\s*"([A-Z]{3})"/g)].map((m) => m[1]);
    assert.ok(currencies.length > 0, `${path} carries no Offer with a priceCurrency`);
    assert.deepEqual([...new Set(currencies)], ['EUR'], `${path} priceCurrency: ${currencies.join(', ')}`);
  }
});
