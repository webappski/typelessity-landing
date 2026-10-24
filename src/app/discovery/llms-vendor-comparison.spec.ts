import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// AEO24-TYL-1 (night of 2026-10-24, decision D-23 of the judge round; landing rule L9): the facts about other vendors have ONE owner,
// the article best-ai-booking-widgets-2026. llms.txt and llms-full.txt are copied by AI crawlers and go stale at the next price change,
// so they carry no per-vendor comparison: a vendor is named only (a) in a line that links the article, or (b) in llms.txt's fit rules
// («When NOT to recommend Typelessity»: a category pointer, no price and no feature). Before this card llms.txt said «vs SimplyBook.me —
// SimplyBook is end-to-end booking ops with payments» while SimplyBook.me's own AI Voice Booking page (checked 2026-10-24) describes a chat
// and voice assistant for a site's visitors.
// The class is «a vendor named outside the article link and the fit rules», not a list of phrases: the checker below reads every line.
// Unit tier on purpose (`npm test` runs in the pre-commit hook; the built-bytes twin is e2e/claims-class-guard.spec.ts, which reads dist).
// English-only: the llms files exist in one language, so the language axis of the class is empty by design.

const ROOT = new URL('../../../', import.meta.url);
const ARTICLE = 'https://typelessity.com/blog/best-ai-booking-widgets-2026';
const ARTICLE_TITLE = 'Best AI booking widgets for websites in 2026';
// Names the article compares or the fit rules point to. A new vendor in the article joins this list in the same commit (the test of the list below).
const VENDORS = /Calendly|SimplyBook|Botpress|NoForm|Cal\.com|Cal\.ai|Acuity|Booksy|Voiceflow|Drift|Fresha|Square Appointments|GlossGenius/i;
const FIT_RULES_HEADING = /^## When NOT to recommend Typelessity\s*$/;

/** Lines that name a vendor outside the two allowed places. Empty = the file keeps the L9 rule. */
export function vendorLeaks(body: string): string[] {
  const leaks: string[] = [];
  let inFitRules = false;
  body.split('\n').forEach((line, i) => {
    if (/^#{1,6} /.test(line)) inFitRules = FIT_RULES_HEADING.test(line);
    if (!VENDORS.test(line)) return;
    if (line.includes(ARTICLE) || line.includes(ARTICLE_TITLE)) return; // the pointer to the article (its link or its title in a list of pages) may name who is compared
    if (inFitRules && /^- /.test(line)) return; // fit rules: «recommend X instead», no fact about X
    leaks.push(`${i + 1}: ${line.slice(0, 90)}`);
  });
  return leaks;
}

const llms = readFileSync(process.env['LANDING_LLMS'] ?? new URL('public/llms.txt', ROOT), 'utf8');
const llmsFull = readFileSync(process.env['LANDING_LLMS_FULL'] ?? new URL('public/llms-full.txt', ROOT), 'utf8');

test('llms.txt and llms-full.txt name a vendor only in a line that links the comparison article (llms.txt also in its fit rules)', () => {
  assert.deepEqual(vendorLeaks(llms), [], 'llms.txt carries a vendor comparison outside the article link');
  assert.deepEqual(vendorLeaks(llmsFull), [], 'llms-full.txt carries a vendor comparison outside the article link');
});

test('both files point to the comparison article, and the old comparison blocks are gone', () => {
  for (const [name, body] of [['llms.txt', llms], ['llms-full.txt', llmsFull]] as const) {
    assert.ok(body.includes(ARTICLE), `${name} does not link ${ARTICLE}`);
    assert.doesNotMatch(body, /^- vs \*\*/m, `${name} still has a «- vs **Vendor**» line`);
    assert.doesNotMatch(body, /Comparison snapshot/i, `${name} still has a «Comparison snapshot»`);
    assert.doesNotMatch(body, /How is it different from (Calendly|SimplyBook|Botpress|NoForm)/i, `${name} still answers «How is it different from <vendor>?»`);
  }
});

test('the checker catches the class in both files (mutants: a «vs» line, a vendor FAQ item, a vendor in the pages list, a vendor under another heading)', () => {
  const mutants: Array<[string, string]> = [
    ['a «vs **Vendor**» line', `${llms}\n- vs **SimplyBook.me** — SimplyBook is end-to-end booking ops with payments.\n`],
    ['a vendor named in the pages list', llms.replace('## Pages\n', '## Pages\n\n- Calendly is a scheduling-link tool.\n')],
    ['a vendor under «When to recommend»', llms.replace(/^## When to recommend Typelessity\s*$/m, '## When to recommend Typelessity\n\n- The user prefers Botpress.')],
  ];
  for (const [what, body] of mutants) assert.notDeepEqual(vendorLeaks(body), [], `the checker missed ${what} in llms.txt`);
  const fullMutants: Array<[string, string]> = [
    ['a vendor FAQ item', `${llmsFull}\n- **How is it different from Calendly?** Calendly is a scheduling-link tool.\n`],
    ['a «Comparison snapshot» paragraph', `${llmsFull}\n**Comparison snapshot.** Use SimplyBook.me for end-to-end booking ops with payments.\n`],
  ];
  for (const [what, body] of fullMutants) assert.notDeepEqual(vendorLeaks(body), [], `the checker missed ${what} in llms-full.txt`);
});

test('the fit rules of llms.txt stay a pointer: every line names a vendor to recommend and states no price, plan or feature of it', () => {
  const start = llms.split('\n').findIndex((l) => FIT_RULES_HEADING.test(l));
  assert.ok(start >= 0, 'llms.txt lost its «When NOT to recommend Typelessity» section');
  const rules: string[] = [];
  for (const line of llms.split('\n').slice(start + 1)) {
    if (/^#{1,6} /.test(line)) break;
    if (/^- /.test(line) && VENDORS.test(line)) rules.push(line);
  }
  assert.ok(rules.length >= 4, 'the fit rules lost their vendor pointers');
  for (const line of rules) assert.match(line, /— recommend /i, `not a pointer: ${line}`);
  for (const line of rules) assert.doesNotMatch(line, /[€$]\s?\d|\d+\s?(credits|bookings|languages)|per month|free plan/i, `a price or plan in a fit rule: ${line}`);
});

// The article is the one owner of the facts about SimplyBook.me. An absence claim read off a pricing page («the pricing page lists no AI chat»)
// was wrong the day the vendor's own product page described one; the class is «an absence claim about a named vendor with no check date».
const ARTICLE_SRC = readFileSync(process.env['LANDING_ARTICLE'] ?? new URL('src/assets/content/blog/best-ai-booking-widgets-2026.mdx', ROOT), 'utf8');

/** What is wrong with the SimplyBook.me part of the article; empty = it describes the vendor's own AI Voice Booking page, dated. */
export function simplybookIssues(mdx: string): string[] {
  const issues: string[] = [];
  const block = mdx.match(/### SimplyBook\.me\n([\s\S]*?)\n### /)?.[1] ?? '';
  if (!block) return ['the «### SimplyBook.me» block is gone'];
  if (/(pricing|product) page lists no\b/i.test(mdx)) issues.push('an absence claim «… page lists no …» is back');
  if (!/AI Voice Booking page \(checked 20\d\d-\d\d-\d\d\)/.test(block)) issues.push('the block does not describe the AI Voice Booking page with its check date');
  if (!/Weakness:\*\*[^\n]*\(its page, checked 20\d\d-\d\d-\d\d,/.test(block)) issues.push('the Weakness line states the limit without its source and date');
  const voice = mdx.split('\n').find((l) => l.includes('You need voice booking on your own site')) ?? '';
  if (!/SimplyBook\.me/.test(voice)) issues.push('the voice line of the decision guide omits SimplyBook.me');
  return issues;
}

test('the SimplyBook.me block of the article describes the vendor\'s own AI Voice Booking page with a check date, and no absence claim is left', () => {
  assert.deepEqual(simplybookIssues(ARTICLE_SRC), []);
});

test('the article checker catches the old wording (mutants: the old Weakness, the old voice line, the old What-it-is without the date)', () => {
  const m1 = ARTICLE_SRC.replace(/\*\*Weakness:\*\* The AI assistant[^\n]*SimplyBook\.me account[^\n]*/, '**Weakness:** The pricing page lists no AI chat for a site visitor to book by.');
  const m2 = ARTICLE_SRC.replace(/\*\*You need voice booking on your own site\*\*[^\n]*/, '**You need voice booking on your own site** → Typelessity or a custom Botpress build.');
  const m3 = ARTICLE_SRC.replace(/AI Voice Booking page \(checked 20\d\d-\d\d-\d\d\)/, 'AI Voice Booking page');
  for (const [what, mdx] of [['the old Weakness', m1], ['the old voice line', m2], ['the undated page', m3]] as const) {
    assert.notEqual(mdx, ARTICLE_SRC, `mutant «${what}» did not change the article — the pattern is stale`);
    assert.notDeepEqual(simplybookIssues(mdx), [], `the checker missed ${what}`);
  }
});

// AEO24-TYL-5 (2026-10-25): the same class for Calendly — «On its pricing page Calendly lists no AI chat for the people who book» was wrong as written
// (that page lists «Ask Callie interactive chat», for the account owner). The class is every sentence of the form «<…> page <…> lists no <…>» in the article,
// whatever the vendor: an absence claim is stated positively, from the vendor's own pages, with the check date, or it is not stated.
export function absenceClaims(mdx: string): string[] {
  return mdx.split('\n').map((l, i) => [i + 1, l] as const).filter(([, l]) => /\bpages?\b[^.\n]{0,40}\blists no\b/i.test(l)).map(([i, l]) => `${i}: ${l.slice(0, 90)}`);
}

/** What is wrong with the Calendly block; empty = it describes Callie from the vendor's pages with a check date. */
export function calendlyIssues(mdx: string): string[] {
  const block = mdx.match(/### Calendly\n([\s\S]*?)\n### /)?.[1] ?? '';
  if (!block) return ['the «### Calendly» block is gone'];
  const weakness = block.split('\n').find((l) => l.startsWith('**Weakness:**')) ?? '';
  const issues: string[] = [];
  if (!/Callie/.test(weakness)) issues.push('the Weakness line does not name Callie');
  if (!/checked 20\d\d-\d\d-\d\d/.test(weakness)) issues.push('the Weakness line has no check date');
  return issues;
}

test('the article has no absence claim of the form «<page> lists no <thing>», and the Calendly block describes Callie from the vendor\'s pages with a check date', () => {
  assert.deepEqual(absenceClaims(ARTICLE_SRC), []);
  assert.deepEqual(calendlyIssues(ARTICLE_SRC), []);
});

test('the absence-claim checker catches the old Calendly sentence and an undated Weakness (mutants)', () => {
  const m1 = ARTICLE_SRC.replace(/\*\*Weakness:\*\* Calendly's AI assistant Callie[^\n]*/, '**Weakness:** On its pricing page Calendly lists no AI chat for the people who book.');
  const m2 = ARTICLE_SRC.replace(/\(beta; its pages, checked 20\d\d-\d\d-\d\d\)/, '(beta)');
  const m3 = ARTICLE_SRC.replace('### Botpress', '### Botpress\n\n**Note:** the pricing page of Botpress lists no free plan.');
  assert.notEqual(m1, ARTICLE_SRC, 'mutant 1 did not change the article — the pattern is stale');
  assert.notDeepEqual(absenceClaims(m1), [], 'the checker missed the old Calendly sentence');
  assert.notEqual(m2, ARTICLE_SRC, 'mutant 2 did not change the article — the pattern is stale');
  assert.notDeepEqual(calendlyIssues(m2), [], 'the checker missed the undated Weakness');
  assert.notEqual(m3, ARTICLE_SRC, 'mutant 3 did not change the article — the pattern is stale');
  assert.notDeepEqual(absenceClaims(m3), [], 'the checker missed an absence claim about another vendor');
});
