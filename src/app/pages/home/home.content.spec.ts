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
    'Security',
    'Compliance',
    'For Developers',
    'Competitor Migration',
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

// A27 (c8, 2026-09-24): two Compliance answers promised what the product does not do.
function answer(fragment: RegExp): string {
  const qa = HOME.faq.find((item) => fragment.test(item.q));
  assert.ok(qa, `no FAQ question matches ${fragment}`);
  return qa.a;
}

test('HOME.faq: the sub-processor answer lists exactly what Appendix B of the Typelessity DPA lists', () => {
  // Source: https://webappski.com/en/legal/dpa-typelessity, Appendix B (provider terms read 2026-09-20).
  // "AWS Frankfurt" was never a sub-processor: the database is Supabase on AWS eu-west-1 (Ireland).
  const a = answer(/sub-processors/i);
  for (const name of ['Vercel', 'Supabase', 'OpenAI', 'Resend']) {
    assert.ok(a.includes(name), `the answer must name ${name}`);
  }
  assert.ok(!/AWS Frankfurt/i.test(a), 'AWS Frankfurt is not a sub-processor');
});

test('HOME.faq: no answer promises region-aware consent or analytics cookies — the widget has neither', () => {
  // Consent is asked from every visitor the same way (typelessity widget, consent.service.ts);
  // there is no region detection anywhere in the widget, the API or shared.
  for (const qa of HOME.faq) {
    assert.ok(!/region-aware|CCPA/i.test(qa.a), `"${qa.q}" promises region-aware consent`);
    assert.ok(!/analytics cookies/i.test(qa.a), `"${qa.q}" promises analytics cookies`);
  }
});

test('HOME.howItWorks.phases: numbers are sequential 01..04', () => {
  const nums = HOME.howItWorks.phases.map((p) => p.n);
  assert.deepEqual([...nums], ['01', '02', '03', '04']);
});

test('HOME.pricing: exactly one tier marked featured', () => {
  const featured = HOME.pricing.tiers.filter((t) => t.featured);
  assert.equal(featured.length, 1);
});
