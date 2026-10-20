import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOME } from './home.content';
import { HOW } from '../how-it-works/how-it-works.content';
import { PRICING_FAQ } from '../pricing/pricing.content';
import { FAQ_GROUPS } from '../faq/faq.content';

// L6: the FAQ moved to /faq (faq.content.ts, seven groups). L4 (D8): the home page keeps no FAQ of its own (HOME.faq is gone, with
// its nine questions and five vendor comparisons): it draws six questions of /faq, found by their exact text. The data answers
// below are read from the FAQ page's list: a claim does not escape a guard by moving to another list.
const FAQ_ALL: readonly { q: string; a: string }[] = FAQ_GROUPS.flatMap((g) => g.items);

test('HOME.faq: the six preview questions are questions of /faq, each found exactly once, each different (track-by key in the template)', () => {
  assert.equal(HOME.faq.questions.length, 6);
  assert.equal(new Set(HOME.faq.questions).size, HOME.faq.questions.length, 'a question is listed twice');
  for (const q of HOME.faq.questions) {
    assert.equal(FAQ_ALL.filter((qa) => qa.q === q).length, 1, `"${q}" is not on /faq exactly once`);
  }
});

// What HOME.comparison (the table of five vendors) and the five «How does Typelessity differ from …» questions used to guard — the
// facts about other vendors — now has one owner: the article best-ai-booking-widgets-2026 (L9). The home page names no vendor.
test('HOME: the home content names no competitor vendor — the vendor facts have one owner, the comparison article', () => {
  assert.ok(!('comparison' in HOME), 'HOME.comparison is gone');
  const vendors = /Calendly|SimplyBook|Cal\.ai|Cal\.com|Botpress|NoForm/i;
  assert.doesNotMatch(JSON.stringify(HOME), vendors);
});

test('FAQ_GROUPS: the seven groups of the page, every question unique across the page, every group links to the page with the full answer', () => {
  assert.deepEqual(FAQ_GROUPS.map((g) => g.id), ['product', 'ai-behavior', 'integration', 'privacy', 'pricing', 'security', 'competitor-migration']);
  const seen = new Set<string>();
  for (const g of FAQ_GROUPS) {
    assert.ok(g.items.length > 0, `group ${g.id} is empty`);
    assert.ok(g.more.href.startsWith('/') || g.more.href.startsWith('https://'), `group ${g.id} has no link`);
    for (const qa of g.items) {
      assert.ok(!seen.has(qa.q), `duplicate FAQ question: "${qa.q}"`);
      seen.add(qa.q);
    }
  }
  assert.equal(FAQ_GROUPS.find((g) => g.id === 'integration')?.more.href, '/install');
});


// A27 (c8, 2026-09-24): two Compliance answers promised what the product does not do.
function answer(fragment: RegExp): string {
  const qa = FAQ_ALL.find((item) => fragment.test(item.q));
  assert.ok(qa, `no FAQ question matches ${fragment}`);
  return qa.a;
}

test('FAQ: the sub-processor answer lists exactly what Appendix B of the Typelessity DPA lists', () => {
  // Source: https://webappski.com/en/legal/dpa-typelessity, Appendix B (provider terms read 2026-09-20).
  // "AWS Frankfurt" was never a sub-processor: the database is Supabase on AWS eu-west-1 (Ireland).
  const a = answer(/sub-processors/i);
  for (const name of ['Vercel', 'Supabase', 'OpenAI', 'Resend']) {
    assert.ok(a.includes(name), `the answer must name ${name}`);
  }
  assert.ok(!/AWS Frankfurt/i.test(a), 'AWS Frankfurt is not a sub-processor');
});

test('FAQ: no answer promises region-aware consent or analytics cookies — the widget has neither', () => {
  // Consent is asked from every visitor the same way (typelessity widget, consent.service.ts);
  // there is no region detection anywhere in the widget, the API or shared.
  for (const qa of FAQ_ALL) {
    assert.ok(!/region-aware|CCPA/i.test(qa.a), `"${qa.q}" promises region-aware consent`);
    assert.ok(!/analytics cookies/i.test(qa.a), `"${qa.q}" promises analytics cookies`);
  }
});

// L4: the four phases left the home page; /how-it-works owns them (HOW.phases) and the home page prints their names in its stats strip.
test('HOW.phases: numbers are sequential 01..04, and the home strip prints their names in order', () => {
  const nums = HOW.phases.map((p) => p.n);
  assert.deepEqual([...nums], ['01', '02', '03', '04']);
  const strip = HOME.whatItIs.stats.find((s) => s.l.startsWith('Steps:'));
  assert.equal(strip?.l, `Steps: ${HOW.phases.map((p) => p.name).join(' → ')}`);
  assert.equal(strip?.n, String(HOW.phases.length));
});

test('HOME.pricing: no tier is marked featured — the four cards are equal (L6, seo-lead §2.5)', () => {
  const featured = HOME.pricing.tiers.filter((t) => 'featured' in t);
  assert.equal(featured.length, 0);
  assert.deepEqual(HOME.pricing.tiers.filter((t) => 'period' in t).map((t) => t.name), ['Starter', 'Pro', 'Enterprise']);
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
  { name: 'home FAQ (the six questions of /faq)', text: HOME.faq.questions.map((q) => FAQ_ALL.find((qa) => qa.q === q)?.a ?? '').join('\n') },
  { name: 'faq page', text: FAQ_GROUPS.flatMap((g) => g.items).map((qa) => qa.a).join('\n') },
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
    ...FAQ_ALL.map((qa) => ({ name: qa.q, text: qa.a })),
    ...HOME.whatItIs.facts.map(([k, v]) => ({ name: `what it is: ${k}`, text: v })),
    ...PRICING_FAQ.map((qa) => ({ name: `pricing: ${qa.q}`, text: qa.a })),
  ];
  for (const { name, text } of surfaces) {
    for (const re of banned) assert.ok(!re.test(text), `${name} still says ${re}`);
  }
  assert.match(answer(/self-host/i), /^No\.[\s\S]*no on-premise or self-hosted build/);
  assert.match(PRICING_FAQ.find((qa) => /What does Enterprise add/i.test(qa.q))?.a ?? '', /agreed on request/);
  assert.doesNotMatch(answer(/handle GDPR/i), /^Yes\b/, 'a compliance status is not ours to guarantee');
});

// A45b (founder 2026-09-25): the terms define no support levels, so every tier says the one thing
// that is true — «Support by email». The engine (typelessity 15305e9) has no /agent route, exposes
// no per-turn audit log, has no form fallback when OpenAI fails (one retry, then the chat asks for
// the field), and only logs _meta.mf — it drops out-of-config fields instead.
test('A45b: one support line on every tier, no dated /agent, audit log, GDPR-native or form fallback', () => {
  for (const tier of HOME.pricing.tiers) {
    assert.ok((tier.bullets as readonly string[]).includes('Support by email'), `${tier.name} card lacks «Support by email»`);
  }
  const banned: readonly RegExp[] = [
    /standard support|priority support|\bemail support\b|support level/i, /Q3 2026/, /full audit log/i,
    /GDPR-native/i, /minimal form path/i, /phantom extractions/i, /only commits values the user explicitly mentioned/i,
    /400.650 tokens/, /configured by us/i, /same day, not after weeks/i, /config in a few hours/i, /^Setup time\b/,
  ];
  const surfaces = [
    ...FAQ_ALL.map((qa) => ({ name: qa.q, text: qa.a })),
    ...PRICING_FAQ.map((qa) => ({ name: `pricing: ${qa.q}`, text: qa.a })),
    ...HOW.ai.pillars.map((p) => ({ name: `pillar ${p.h}`, text: p.b })),
    ...HOME.pricing.tiers.map((t) => ({ name: `tier ${t.name}`, text: t.bullets.join(' · ') })),
    { name: 'hero capsule', text: HOME.hero.capsule },
    { name: 'hero trust', text: HOME.hero.trust.join(' ') },
  ];
  for (const { name, text } of surfaces) {
    for (const re of banned) assert.ok(!re.test(text), `${name} still says ${re}`);
  }
  // L6: «What happens if GPT is down?» left the pricing page (not a pricing question); nothing on the site promises a form mode.
  for (const qa of PRICING_FAQ) assert.doesNotMatch(qa.a, /form mode|fallback form/i, `pricing: ${qa.q}`);
});


// A45c (c8 2026-09-25/27). The Typelessity DPA forbids health data (GDPR Art. 9), so no example
// books medical care — the enrichment example is an auto repair shop. And the lines the engine
// (typelessity 15305e9) does not back: cost tracking only writes to the log, there is no cap on
// enrichments per config (the 10 s timeout is a default), no HMAC signature, no dev tenant, no
// calendar step, no schemaVersion, and the booking is sent from our server, not the browser.
test('A45c: no medical example and no promise the engine does not back', () => {
  const text = JSON.stringify(HOME) + JSON.stringify(PRICING_FAQ) + JSON.stringify(FAQ_GROUPS);
  const banned: readonly RegExp[] = [
    /cardiolog/i, /GET \/doctors/i, /patientName|patient_name/, /dentist|dental/i, /\bdoctors?\b/i, /specialty/i,
    /EU clinics/i, /cost tracking/i, /up to 5 (enrichments )?per config/i, /optional HMAC/i, /dev tenant/i,
    /synthetic-data/i, /Calendar event/i, /version-pinned/i, /directly from the browser/i, /Typical setup time:/i,
    /annual contract/i, /business-day/i, /insurance details/i, /consistently outperform/i, /higher-converting/i, /800\s?ms/,
    /production vertical/i, /\bUsed by\b/, /widely reported/i, /GDPR-compliant/i, /home services, travel/, /bk_a8f3e1/, /auto-detects/i, /via webhook or REST/i,
  ];
  for (const re of banned) assert.doesNotMatch(text, re);
  const answer = (q: RegExp) => FAQ_ALL.find((qa) => q.test(qa.q))?.a ?? '';
  assert.match(answer(/HIPAA/), /DPA does not allow health data/);
  assert.match(answer(/How does the widget submit/), /From our server[\s\S]*There is no HMAC signature/);
});
