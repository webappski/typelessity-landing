import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { HOME } from '../src/app/pages/home/home.content';

// A45e (c8 2026-10-03): the second CRO and promises/legal verdicts on the landing release found four classes
// the earlier guards (A45, A45c) did not reach, because those guards listed phrases instead of reading the class:
//   1. the pre-launch offer — «Custom Enterprise quote», «engineering-supported», «early adopters», an «SLA tier» —
//      survived in four blog posts and in /pricing's <title>, while enterprise-claims.spec.ts passed;
//   2. speed and setup time of OUR product without a measurement («under a minute», «Typical setup: 1 day»,
//      «30 seconds», «real-time») — the founder rule of 28.09: the class is every speed/latency/duration word,
//      not a list of phrases; what stays are configuration facts (timeouts, retention, notice periods) and a
//      figure that says it is a target;
//   3. invitations to health data (Art. 9) — an aesthetic-clinic page, a prenatal-yoga example with «second
//      trimester», «Allergy info preserved verbatim» — against the DPA §4.4 and the «medicine is demo only» rule;
//   4. features the engine does not have — photo upload, VIN lookup, price estimates, an /agent/turn node in the
//      turn diagram, phone «E.164 normalized», Session/Booking shapes that the API does not return.
// And one claim about other people's products: every competitor cell in the home comparison table is a quote
// from that vendor's page, or «—» (A56).
//
// This reads the bytes a visitor and an AI crawler receive — every prerendered page, the llms files, the sitemap
// and the JS bundle (the blog manifest is baked into it) — not the sources. Run `npm run build` first.

// LANDING_DIST points the guard at another copy of dist/typelessity-landing/browser (the mutation-sanity run
// feeds it a copy with the old claims put back; it must go red).
const DIST = process.env['LANDING_DIST']
  ? pathToFileURL(`${process.env['LANDING_DIST']}/`)
  : new URL('../dist/typelessity-landing/browser/', import.meta.url);
const SERVER_DIST = new URL('../server/', DIST);

async function walk(dir: URL, out: URL[] = []): Promise<URL[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await walk(url, out);
    else out.push(url);
  }
  return out;
}

async function loadAll(root: URL, extensions: readonly string[]): Promise<Map<string, string>> {
  let files: URL[];
  try {
    files = await walk(root);
  } catch {
    throw new Error(`${root.pathname} missing — run \`npm run build\` before this check.`);
  }
  const map = new Map<string, string>();
  for (const f of files) {
    if (!extensions.some((e) => f.pathname.endsWith(e))) continue;
    if (f.pathname.endsWith('3rdpartylicenses.txt')) continue;
    map.set(f.pathname.slice(root.pathname.length), await readFile(f, 'utf8'));
  }
  return map;
}

/** What a reader sees: no scripts, styles or tags; entities decoded; the example conversations of an industry page cut out. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<li[^>]*class="conv"[\s\S]*?<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ');
}

const sentences = (text: string) => text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

let pages: Map<string, string>;
let everything: Map<string, string>;
let bundles: Map<string, string>;

before(async () => {
  everything = await loadAll(DIST, ['.html', '.txt', '.xml', '.js', '.json']);
  bundles = await loadAll(SERVER_DIST, ['.mjs', '.js', '.json']);
  pages = new Map([...everything].filter(([p]) => p.endsWith('.html') || p.endsWith('.txt')));
  assert.ok(pages.size > 50, `expected the prerendered site under dist/browser, found ${pages.size} text files`);
});

// ── 1. the pre-launch offer ──────────────────────────────────────────────────────────────────────
// A class, not a list: any wording that sells a quote-only Enterprise, hands-on engineering, an early-adopter
// programme or an SLA tier. Every published tier has a price. There is no SLA: «no availability SLA in the standard terms yet;
// one becomes possible once the hosting plans support it» (DPA Appendix A(b), Terms §2.3; founder 2026-10-05 — an uptime
// commitment is never «agreed by contract, on request»).
const OLD_OFFER: readonly RegExp[] = [
  /Enterprise quote/i, /Custom Enterprise/i, /Enterprise \(custom\)/i, /engineering[- ]supported/i,
  /early[- ]adopters?/i, /\bSLA tier/i, /Pilot \(Free\)/i, /Pilot \(free\)/i, /Free pilot \+ Enterprise/i,
];

test('no page, llms file, sitemap or bundle sells the pre-launch offer', () => {
  const offenders: string[] = [];
  for (const [path, body] of [...everything, ...[...bundles].map(([p, b]) => [`server/${p}`, b] as const)]) {
    for (const re of OLD_OFFER) if (re.test(body)) offenders.push(`${path} ${re}`);
  }
  assert.deepEqual(offenders, [], 'the old offer is still published');
});

test('/pricing says all four published tiers in its title and description', () => {
  const html = pages.get('pricing/index.html')!;
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  for (const tier of ['Free Pilot', 'Starter', 'Pro', 'Enterprise']) {
    assert.ok(title.includes(tier) || description.includes(tier), `/pricing title and description never name ${tier}`);
  }
  assert.match(description, /€39/);
  assert.match(description, /€399/);
});

test('the four posts that carry a Pricing line name the published tiers', () => {
  for (const slug of ['best-ai-booking-widgets-2026', 'best-ai-booking-beauty-salons-2026', 'best-ai-booking-transfer-services-2026']) {
    const text = visibleText(pages.get(`blog/${slug}/index.html`)!);
    assert.match(text, /Four published tiers, each starting with the free pilot/, `${slug} lost its Pricing line`);
    assert.match(text, /Starter €39\/mo, Pro €149\/mo and Enterprise €399\/mo/, `${slug} does not name the tiers`);
  }
  const agents = visibleText(pages.get('blog/designing-for-ai-agents/index.html')!);
  assert.match(agents, /Free Pilot, Starter, Pro, Enterprise \(four published tiers\)/);
});

// The same class, in the words the pages used for it: an uptime commitment or SLA «agreed by/per contract» or «on request». The DPA
// (Appendix A(b)) says the processor gives no availability SLA and will not until the underlying plans support one; Terms §2.3
// says there is no uptime commitment. A named contact and volume above 6,000 submissions are still «by contract, on request».
const SLA_BY_CONTRACT: readonly RegExp[] = [
  /\b(?:uptime commitment|SLA)\b[^.;\n]{0,90}\b(?:by|per) contract/i,
  /\b(?:by|per) contract\b[^.;\n]{0,60}\b(?:uptime commitment|SLA)\b/i,
  /\buptime commitment\b[^.;\n]{0,60}\bon request/i,
];
// A table row is read cell by cell: the row «Uptime commitment (SLA) | None | By contract, on request» is the same promise,
// and the neighbouring row «Named contact person | — | By contract, on request» is not.
const SLA_TABLE_ROW = /Uptime commitment \(SLA\)\s*<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>\s*By contract/i;

test('no page, post or llms file offers an uptime commitment or SLA «by contract» or «on request»', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    const isHtml = path.endsWith('.html');
    // The end of a cell, item or paragraph ends the sentence: «None yet» in one cell must not run into «By contract» in the next row.
    const text = isHtml ? visibleText(body.replace(/<\/(?:td|th|tr|li|p)>/gi, '. ')) : body;
    for (const re of SLA_BY_CONTRACT) {
      const at = text.search(re);
      if (at >= 0) offenders.push(`${path}: ${re} — …${text.slice(Math.max(0, at - 50), at + 130).replace(/\s+/g, ' ')}…`);
    }
    if (isHtml && SLA_TABLE_ROW.test(body)) offenders.push(`${path}: the SLA row of the table says «By contract» for Enterprise`);
  }
  assert.deepEqual(offenders, []);
});

// ── 2. speed, latency and setup time of our product ──────────────────────────────────────────────
// Founder 28.09 (feedback_speed_claims_class_rule_not_list): any word about speed, latency or setup time of OUR
// product — fast / fastest / lightning / instant(ly) / quick(ly) / real-time / any duration — is in the class
// unless it is (a) a configuration fact (a timeout, a retention period, a notice period, a retry count),
// (b) a figure that says it is a target and not a measurement, (c) the reader's own scenario (a user's request in
// an example conversation, a salon service that takes an hour). The three forms of «real time» are one class.
const SPEED_WORD = /\b(fast(?:er|est)?|lightning|instant(?:ly)?|quick(?:ly)?|rapid(?:ly)?|speedy|blazing|real[- ]?time)\b/i;
// «a second call» and «a second, application-level encryption» are ordinals; a duration is a number of seconds,
// «a/one minute|hour|day|week», or «in/under/within/than a second».
const DURATION =
  /\b(\d+(?:[.,]\d+)?|two|three|four|five|ten|twenty|thirty)[ -]?(ms|milliseconds?|seconds?|minutes?|mins?|hours?|days?|weeks?)\b|\b(?:an?|one) (?:minute|hour|day|week)\b|\b(?:in|under|within|than|per|every) (?:an?|one) second\b|\bone[- ]second\b/i;
const CONFIG_FACT =
  /\b(deleted?|erase[sd]?|kept|keeps?|retain(?:ed)?|retention|removed|notif\w*|notice|breach|times? out|timeout|retr(?:y|ied|ies)|back-?off|abuse|working days|consent record|delivery log|a target|target,? not a measurement|budget|not measured|no number|do not quote|nobody measured|after two minutes|in advance|per minute|billed|a night|each night|every night|nightly|inactivity|no activity|72-hour)\b|\b10 ?s\b/i;

/** Pages and files where durations of our product would be a claim: everything but the reader scenarios in blog posts. */
function isBlog(path: string): boolean {
  return path.startsWith('blog/');
}

test('no speed word describes the product anywhere — pages, posts, llms files', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    const text = path.endsWith('.html') ? visibleText(body) : body;
    for (const s of sentences(text)) {
      if (!SPEED_WORD.test(s)) continue;
      // «Quick decision guide» is a heading for the reader; a product name such as FASTTRAK is a word-boundary miss.
      if (/Quick decision guide/i.test(s) && !SPEED_WORD.test(s.replace(/Quick decision guide/gi, ''))) continue;
      // The sentence that says the word is gone is not the claim ("«real-time» is no longer used"), nor is a «Where does the
      // 'Updated' note…» line: the Updated notes quote what was removed.
      if (/Updated \d{4}-\d{2}-\d{2} — what changed/i.test(s) || /no longer used|not as real-time|is gone/i.test(s)) continue;
      offenders.push(`${path}: ${s.slice(0, 160)}`);
    }
  }
  assert.deepEqual(offenders, [], 'speed words describe the product');
});

test('no duration describes how fast the product is or how long setup takes — pages and llms files', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    if (isBlog(path) || path.endsWith('.xml')) continue; // posts: see the next test
    const text = path.endsWith('.html') ? visibleText(body) : body;
    for (const s of sentences(text)) {
      if (!DURATION.test(s) || CONFIG_FACT.test(s)) continue;
      offenders.push(`${path}: ${s.slice(0, 160)}`);
    }
  }
  assert.deepEqual(offenders, [], 'a duration of our product has no measurement or contract behind it');
});

test('posts: no duration of the product, no setup time, no «time to live» row', () => {
  const claims: readonly RegExp[] = [
    /under (?:a|one|\d+) (?:minute|second)s?/i, /in (?:a|one|\d+) (?:minute|second)s?\b/i, /Typical setup/i,
    /\b(?:1|one)[–-](?:2|two) days\b/i, /Time to live/i, /in a day\b/i, /within a day/i, /measured in weeks/i,
  ];
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    if (!isBlog(path)) continue;
    const text = visibleText(body);
    for (const re of claims) {
      const m = text.match(re);
      if (!m) continue;
      const at = text.indexOf(m[0]);
      const context = text.slice(Math.max(0, at - 90), at + 90);
      // The reader's own world (what a pilot costs a vendor, how long a competitor takes) is not our speed:
      // allow the two sentences the posts use about the category and the pilot, nothing else.
      if (/evaluate it in a minute|measured in weeks, not days|design rule is not|a target|budget/i.test(context)) continue;
      offenders.push(`${path}: ${re} — …${context}…`);
    }
  }
  assert.deepEqual(offenders, [], 'a post quotes a time for our product');
});

test('«Many customers» is gone: no page counts customers it cannot show', () => {
  for (const [path, body] of pages) {
    assert.doesNotMatch(visibleText(body), /\bMany (?:customers|businesses|teams|companies) (?:use|run|rely|trust)/i, `${path} counts customers`);
  }
});

// ── 3. health data (Art. 9, DPA §4.4, «medicine is demo only») ───────────────────────────────────
// The only form the site may use for medicine is «not allowed». These are the words that INVITE the data:
// a clinical procedure, pregnancy, allergies, dietary needs — in a title, a field, an example or a proof point.
const HEALTH_INVITING = /\b(Botox|fillers?|prenatal|trimester|allerg\w*|dietary|vegan|vegetarian|procedure_interest|pre-care|aesthetic (?:&|and) cosmetic|cosmetic clinics?|aesthetic clinics?)\b/i;

test('no page, post, llms file or sitemap entry invites health data', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    const text = path.endsWith('.html') ? visibleText(body) : body;
    // The page for the clinics may not exist, so a link to it may not either.
    if (/beauty-aesthetic-clinics/.test(body)) offenders.push(`${path}: still names beauty-aesthetic-clinics`);
    for (const s of sentences(text)) {
      if (HEALTH_INVITING.test(s)) offenders.push(`${path}: ${s.slice(0, 140)}`);
    }
  }
  const sitemap = everything.get('sitemap.xml') ?? '';
  assert.ok(sitemap.includes('/industries/beauty-hair-salons'), 'the sitemap must still list the other beauty pages');
  assert.doesNotMatch(sitemap, /beauty-aesthetic-clinics/, 'the sitemap still lists the clinics page');
  assert.deepEqual(offenders, [], 'a page invites health data');
});

test('the clinics page is not built and /industries shows one page fewer', () => {
  assert.equal(pages.has('industries/beauty-aesthetic-clinics/index.html'), false, 'dist still holds the clinics page');
  const industries = visibleText(pages.get('industries/index.html')!);
  assert.doesNotMatch(industries, /Aesthetic|cosmetic/i);
  const count = Number(industries.match(/AI booking that fits (\d+) verticals/)?.[1]);
  const listed = [...pages.keys()].filter((p) => /^industries\/[^/]+\/index\.html$/.test(p)).length;
  assert.equal(count, listed, 'the heading counts a different number of verticals than the build holds');
  assert.equal(listed, 36);
});

test('the home page names exactly the verticals that have a page', () => {
  const html = pages.get('index.html')!;
  const claimed = Number(visibleText(html).match(/Configured for (\d+) verticals/)?.[1]);
  const chips = (html.match(/class="home-industries__cell"/g) ?? []).length;
  const built = [...pages.keys()].filter((p) => /^industries\/[^/]+\/index\.html$/.test(p)).length;
  assert.equal(claimed, built, 'the heading counts a different number of verticals than the build holds');
  assert.equal(chips, built, 'the home page lists a vertical that has no page, or leaves one out');
});

test('the gdpr post says medicine only in the form «not allowed»', () => {
  const text = visibleText(pages.get('blog/gdpr-compliance/index.html')!);
  assert.match(text, /The service refuses a configuration that declares the medical business type/);
  assert.doesNotMatch(text, /Medical example configurations are demos/i);
  assert.doesNotMatch(text, /we can apply for it/i, 'an offer to apply for Zero Data Retention that no contract makes');
  assert.doesNotMatch(text, /There is no self-service erasure or export endpoint/);
});

// ── 4. what the engine does not do ───────────────────────────────────────────────────────────────
const UNBUILT: readonly RegExp[] = [
  /photo upload/i, /image upload/i, /reference image/i, /image_attachment/, /photo_attachment/, /file upload/i,
  /VIN lookup/i, /inventory check/i, /first-class discount/i, /price estimat/i, /estimated price/i, /inline pric/i,
  /conflict-check/i, /KYC pre-questions/i, /emergency keyword/i, /emergency dispatcher/i, /trial-to-membership/i,
  /premium voice tone/i, /package upsell/i, /direct booking conversion/i, /handles 14 practice areas/i,
  /18 trade categories/i, /20\+ class types/i, /E\.164/, /we review customer-provided DPAs/i, /DPA review/i,
  /We absorb GPT cost/i, /unlimited bookings/i,
];

test('no page invents a capability the engine does not have', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    const text = path.endsWith('.html') ? visibleText(body) : body;
    for (const re of UNBUILT) if (re.test(text)) offenders.push(`${path} ${re}`);
  }
  assert.deepEqual(offenders, [], 'a page promises something the code does not do');
});

test('/how-it-works routes the turn through the Session API, not through an endpoint that is not built', () => {
  const text = visibleText(pages.get('how-it-works/index.html')!);
  assert.doesNotMatch(text, /\/agent\/turn/);
  assert.match(text, /Session API/);
  assert.doesNotMatch(text, /confirmed booking in under a minute/i);
});

test('llms-full.txt prints the Session and Booking shapes /for-ai-agents prints, and /for-ai-agents is honest about versions', () => {
  const full = pages.get('llms-full.txt')!;
  const agents = visibleText(pages.get('for-ai-agents/index.html')!);
  assert.match(full, /\*\*Session schema\.\*\* `\{ id, configId, state, extractedData, createdAt, updatedAt, bookingResult \}`/);
  assert.match(full, /\*\*Booking schema\.\*\* `\{ success, bookingId, outcome \}`/);
  assert.doesNotMatch(full, /submittedAt|_meta: \{ mf, correction \}|published and stable/);
  for (const field of ['"configId"', '"extractedData"', '"bookingResult"', '"success": true', '"outcome"']) {
    assert.ok(agents.includes(field), `/for-ai-agents lost ${field}`);
  }
  assert.doesNotMatch(agents, /schemas are stable/i);
});

test('the structured data names the embed as the two-line web component it is', () => {
  const home = pages.get('index.html')!;
  assert.doesNotMatch(home, /One-line HTML or React embed/);
  assert.match(home, /Two-line HTML embed \(web component\)/);
});

// ── A56. competitor cells ────────────────────────────────────────────────────────────────────────
test('the comparison table keeps only cells that quote a vendor page, and names those pages', () => {
  const text = visibleText(pages.get('index.html')!);
  for (const banned of ['EN-first', 'Custom build', 'Limited', 'Per voice config', 'Lead-qual only', 'Slot-pick page']) {
    assert.ok(!text.includes(banned), `the table still says «${banned}», which no vendor page backs`);
  }
  const rows = HOME.comparison.rows;
  assert.equal(rows.length, 9);
  for (const row of rows) assert.equal(row.length, HOME.comparison.columns.length, `row ${row[0]} has a missing cell`);
  for (const host of ['calendly.com/features', 'cal.com/ai', 'simplybook.me/en/features', 'botpress.com', 'noform.ai']) {
    assert.ok(HOME.comparison.sources.includes(host), `the sources line does not name ${host}`);
    assert.ok(text.includes(host), `the page does not print ${host}`);
  }
  assert.match(text, /A dash means we found no statement on those pages/);
  // The three cells the vendors' own pages contradicted.
  const row = (label: string) => rows.find((r) => r[0] === label)!;
  assert.equal(row('Languages')[3], '65+', 'Cal.com states 65+ languages');
  assert.match(row('Voice input')[5], /AI Voice Booking/, 'SimplyBook.me sells AI Voice Booking');
});

// ── r2 (judges, 2026-10-04). Two more members of the classes above that the number-and-speed word lists did not reach ──
// F5: a post told readers Typelessity «leads» on conversion and on time to a deployed widget — the 28.09 class (speed and
// uplift of OUR product without a measurement) in list form, with no number and no speed word in it; one sentence in a
// post said the same of the salon's «customer-facing conversion», and a post description said «25+ languages work the same
// day». The Updated notes that say the conversion claim is gone are not this claim and match none of these.
test('posts: Typelessity is not named the leader on conversion or on time to deploy, and no description says «work the same day»', () => {
  const claims: readonly RegExp[] = [/\bconversion\s*→/i, /Time to a deployed/i, /customer-facing conversion/i, /work the same day/i];
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    if (!isBlog(path)) continue;
    // Both readings: «<strong>conversion</strong> → Typelessity» matches only in the visible text, and a post description sits in
    // <meta> and in the JSON-LD, which only the raw bytes carry.
    for (const text of [visibleText(body), body]) {
      for (const re of claims) {
        const at = text.search(re);
        if (at >= 0) offenders.push(`${path}: ${re} — …${text.slice(Math.max(0, at - 60), at + 90).replace(/\s+/g, ' ')}…`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

// F8: the engine collects the fields and delivers a booking or a request; whether a specialist, a coach, a court, a
// test drive or a viewing is booked is the business's act. Industry pages say «collects», like their neighbours.
test('industry pages: the widget collects a request or the details — it does not book a specialist, a coach, a test drive or a viewing', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    if (!/^industries\/(?:[^/]+\/)?index\.html$/.test(path)) continue;
    for (const s of sentences(visibleText(body))) {
      if (/\bwidget books\b|\bbooks (?:with|the right|a coach|a test drive|a viewing|a consultation|the session|the vet)\b/i.test(s)) offenders.push(`${path}: ${s.slice(0, 160)}`);
    }
  }
  assert.deepEqual(offenders, []);
});
