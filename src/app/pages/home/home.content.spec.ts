import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOME, type FaqCategory } from './home.content';
import { PRICING_FAQ } from '../pricing/pricing.content';

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

// A34 (c8, 2026-09-24): the data answers said what the product does not do — «24 hours» for
// abandoned conversations (the widget notice and the code say 48: eligible at 24 h, removed by the
// nightly job), a 90-day default, «Frankfurt, Paris», a DELETE /api/session route that does not
// exist, dpo@/security@typelessity.com (typelessity.com has no MX record), daily snapshots with
// point-in-time recovery (the free tiers have neither). Sources: ~/Projects/typelessity
// constants.ts SESSION_DELETION_WORST_CASE_HOURS, cleanup-sessions/route.ts, and the Typelessity
// DPA §5.5, §5.6, §5.8, §7.1, Appendix A. The guard reads every surface that repeats these answers.
import { readFileSync } from 'node:fs';
import { PRICING_FAQ } from '../pricing/pricing.content';

const DATA_SURFACES: readonly { name: string; text: string }[] = [
  { name: 'home FAQ', text: HOME.faq.map((qa) => qa.a).join('\n') },
  { name: 'pricing FAQ', text: PRICING_FAQ.map((qa) => qa.a).join('\n') },
  { name: '/legal/security', text: readFileSync('src/app/pages/legal/legal-page.component.ts', 'utf8') },
  { name: 'llms-full.txt', text: readFileSync('public/llms-full.txt', 'utf8') },
];

test('data answers: every email address is one that receives mail', () => {
  const allowed = new Set(['info@webappski.com']);
  for (const { name, text } of DATA_SURFACES) {
    for (const addr of text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) {
      assert.ok(allowed.has(addr), `${name} publishes ${addr}, which no mailbox receives`);
    }
  }
});

test('data answers: no API route is promised that the typelessity API does not serve', () => {
  for (const { name, text } of DATA_SURFACES) {
    assert.ok(!/DELETE \/api|session deletion API/i.test(text), `${name} promises a session deletion API`);
  }
});

test('data answers: retention, location, backups and training are stated as the code and the DPA state them', () => {
  const banned: readonly RegExp[] = [
    /24 hours for abandoned/i, /90 days for completed/i, /default 30 days/i, /retained per your retention policy/i,
    /Paris/, /EU regions when configured/i, /residency available on Enterprise/i,
    /TLS 1\.3/, /Field-level encryption/i, /Point-in-time recovery to any minute/i, /Daily automated Postgres snapshots/i,
    /penetration test/i, /data-opt-out flag/i, /propagates to backups/i,
  ];
  for (const { name, text } of DATA_SURFACES) {
    for (const re of banned) assert.ok(!re.test(text), `${name} still says ${re}`);
  }
  assert.match(answer(/How long is conversation data retained/i), /within 48 hours/);
  assert.match(answer(/physically stored/i), /Frankfurt[\s\S]*Ireland/);
  assert.match(answer(/right-to-erasure/i), /info@webappski\.com/);
});

test('data answers: no erase feature is promised that the owner cannot use today', () => {
  // POST /api/admin/conversations/erase exists (typelessity 7231ca2) but the portal has no screen for
  // it, and no card builds one — so the written instruction is the only route, and nothing says «planned».
  for (const { name, text } of DATA_SURFACES) {
    assert.ok(!/self-service (erase )?button|erase button[^.]*planned/i.test(text), `${name} promises an erase button`);
  }
});

// A45 (founder 2026-09-25): Enterprise promised what neither the code nor the contracts back.
// Sources: terms-typelessity.md §2.3 and DPA App. A «no availability SLA»; no Dockerfile or
// self-host build in the typelessity repo; client-cache.ts calls OpenAI only (Azure is a dormant
// enum); vercel.json fra1 + DPA App. B eu-west-1, OpenAI and Resend in the US.
test('enterprise claims: no SLA figure, on-premise, residency tier, custom provider or dedicated manager', () => {
  const banned: readonly RegExp[] = [
    /99\.9/, /on-premise (deployment )?(is )?available/i, /self-hosted deployment/i, /EU data residency/i,
    /dedicated (account|success) manager/i, /swapped between OpenAI/i, /Azure OpenAI, or any/i,
    /planned for a future Enterprise/i, /gpt-4\.1-nano/i, /Whisper/, /200.800 ?ms/, />95%/,
  ];
  const surfaces = [
    ...HOME.faq.map((qa) => ({ name: qa.q, text: qa.a })),
    ...HOME.tldr.bullets.map(([k, v]) => ({ name: `tldr ${k}`, text: v })),
    ...PRICING_FAQ.map((qa) => ({ name: `pricing: ${qa.q}`, text: qa.a })),
  ];
  for (const { name, text } of surfaces) {
    for (const re of banned) assert.ok(!re.test(text), `${name} still says ${re}`);
  }
  assert.match(answer(/self-host/i), /^No\.[\s\S]*no on-premise or self-hosted build/);
  assert.match(answer(/How much does Typelessity cost/i), /agreed on request/);
  assert.doesNotMatch(answer(/GDPR compliant/i), /^Yes\b/, 'a compliance status is not ours to guarantee');
});
