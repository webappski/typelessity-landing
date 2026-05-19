import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOME, type FaqCategory } from './home.content';

test('HOME.faq: every item has a known category', () => {
  const allowed: ReadonlySet<FaqCategory> = new Set([
    'Product',
    'AI Behavior',
    'Integration',
    'Privacy',
    'Pricing',
  ]);
  for (const qa of HOME.faq) {
    assert.ok(allowed.has(qa.category), `unknown category for "${qa.q}": ${qa.category}`);
  }
});

test('HOME.faq: every question is unique (used as track-by key in templates)', () => {
  const seen = new Set<string>();
  for (const qa of HOME.faq) {
    assert.ok(!seen.has(qa.q), `duplicate FAQ question: "${qa.q}"`);
    seen.add(qa.q);
  }
});

test('HOME.faq: at least one question per Product category (drives /home preview)', () => {
  const productCount = HOME.faq.filter((qa) => qa.category === 'Product').length;
  assert.ok(productCount >= 3, `Product category needs ≥3 entries, found ${productCount}`);
});

test('HOME.howItWorks.phases: numbers are sequential 01..04', () => {
  const nums = HOME.howItWorks.phases.map((p) => p.n);
  assert.deepEqual([...nums], ['01', '02', '03', '04']);
});

test('HOME.pricing: exactly one tier marked featured', () => {
  const featured = HOME.pricing.tiers.filter((t) => t.featured);
  assert.equal(featured.length, 1);
});
