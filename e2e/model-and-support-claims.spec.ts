import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// A45b (founder 2026-09-25). Two kinds of claim the engine and the terms do not back:
//  - support levels: the cards sold Email / Standard / Priority Support, and the terms define
//    none of them. Every tier now says the one thing that is true: «Support by email»;
//  - the blog named models and a voice engine the engine no longer calls (gpt-4.1-nano, Whisper —
//    it calls gpt-5.4-mini and gpt-4o-mini-transcribe: typelessity constants.ts AI.DEFAULT_MODEL,
//    api/transcribe/route.ts), quoted latency percentiles and conversion results nobody measured,
//    and described voice mechanics the widget does not have (streamed audio, a Web Speech
//    fallback, a confidence prompt, per-clinic vocabulary in the transcription prompt).
// Plus three promises from the A45 list: an /agent endpoint «shipping Q3 2026» (the engine has
// no such route), a «full audit log per turn» and «GDPR-native».
//
// A45c (c8 2026-09-25/27): the Typelessity DPA forbids health data (GDPR Art. 9), so no page or
// post books medical care as an example — the enrichment example is an auto repair shop, the hero
// opens on a hair salon. hello@typelessity.com has no MX record, so contact is info@webappski.com.
// And the lines the engine (typelessity 15305e9) does not back: structured cost tracking, a cap of
// 5 enrichments, HMAC, a dev tenant, a calendar step, schemaVersion, a «Doctor reset» message,
// «twelve lines», a topological re-run, a DPA review turnaround, «42 verticals», 320 ms, one prompt
// template across the portfolio, and unmeasured voice-adoption and conversion claims.
//
// Reads what visitors and AI crawlers receive — prerendered HTML with its JSON-LD, the llms
// files, and every post the build emitted under blog/ (not a fixed list, so a new post is
// checked too). Run `npm run build` first.

const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);

const PAGES = ['index.html', 'pricing/index.html', 'faq/index.html', 'for-ai-agents/index.html',
  'how-it-works/index.html', 'about/index.html', 'demo/index.html', 'llms.txt', 'llms-full.txt'];

const BANNED: readonly RegExp[] = [
  // support levels
  /Standard Support/i, /Priority Support/i, /\bemail support\b/i, /support level/i,
  // models and the voice engine, in the present tense
  /gpt-4\.1-nano/i, /\b(uses|using|via|runs on) (OpenAI )?Whisper\b/i, /Whisper-based/i, /\(Whisper\)/,
  /Whisper is Typelessity/i, /Whisper adds/i,
  // latency and results nobody measured
  /\bp(50|95|99)\b/i, /Real User Monitoring/i, /tracked in production telemetry/i, /telemetry window/i,
  /production window/i, /pages? on-call/i, /in-house edge endpoint/i, /headroom/i,
  /(conversion|contract)[^.]{0,60}rose (sharply|significantly)/i, /conversion (was small|is small|rises)/i,
  // voice mechanics the widget does not have
  /Web Speech fallback/i, /streaming audio chunks/i, /did you mean/i, /initial_prompt/,
  // promises and mechanics without code behind them
  /Q3 2026/, /full audit log/i, /GDPR-native/i, /callable by autonomous agents/i, /minimal form path/i,
  /phantom extractions/i, /only committed if its name appears/i, /400.650.token/, /chrono-node/, /libphonenumber/,
  /_meta\.lang/, /messages\.\{locale\}\.json/,
  // setup time nobody measured, ours or a competitor's
  /<t[dh][^>]*>\s*Setup time\s*</, /same day, not after weeks/i, /config in a few hours/i,
];

const BANNED_A45C: readonly RegExp[] = [
  // medical examples
  /cardiolog/i, /GET \/doctors/i, /patientName|patient_name/, /dentist|dental|стоматолог/i, /MedBook/i,
  /Medical \(clinics\)/, /EU clinics/i, /Doctor reset/i,
  // the mailbox with no MX record, in either spelling
  /hello@typelessity|hello&#64;typelessity/i,
  // engine claims without code behind them
  /cost tracking/i, /up to 5 (enrichments )?per config/i, /enrichment_per_config_max/, /optional HMAC/i,
  /dev tenant/i, /synthetic-data/i, /Calendar event/i, /version-pinned/i, /directly from the browser/i,
  /Twelve lines/i, /topological/i, /depends_on/, /\/agent\/turn extracts/i,
  // numbers and promises nobody measured or signed
  /annual contract/i, /business-day/i, /\b42 vertical/i, /120 lines/i, /a day, not a sprint/i,
  /Typical setup time:/i, /config in 1 day/i, /\b320\s?ms\b/i, /\b800\s?ms\b/i, /one extraction prompt template/i,
  /adoption on mobile is significantly higher/i, /higher-converting/i, /consistently outperform/i,
  // no live deployments before 30.09; a booking shape the engine returns; no «travel» config
  /production vertical/i, /Production categor/, /\bUsed by\b/, /widely reported to outperform/i, /home services, travel/,
  /bk_a8f3e1/, /"submittedAt"/, /Stable JSON/i, /auto-detects/i,
  // email is a delivery mode too (c8 27.09): no list of the modes leaves it out
  /via webhook or REST/i,
];
// A45c: a compliance status is not ours to state on our own pages — the facts are (a post may quote
// the phrase as a reader's question, so this one is checked on pages only).
const BANNED_PAGES_A45C: readonly RegExp[] = [/GDPR-compliant/];


// The dated note and the truthful replacement each edited post must carry — so an empty page or
// a wrong path cannot pass the bans by accident.
const UPDATED = /Updated 2026-(?:09-2[57]|10-03) — what changed/;
const UPDATED_27 = /Updated 2026-09-27 — what changed/;
// A45e (c8 2026-10-03): the three comparison posts got a new dated note on top of the 09-27 one (the Pricing line).
const UPDATED_1003 = /Updated 2026-10-03 — what changed[\s\S]{0,1200}?Earlier, on 2026-09-27/;
const POST_TRUTH: Readonly<Record<string, readonly RegExp[]>> = {
  'whisper-vs-webspeech': [UPDATED, /gpt-4o-mini-transcribe/, /We have not measured/],
  'latency-budgets': [UPDATED, /a target, not a measurement/, /currently gpt-5\.4-mini/],
  '25-languages-one-prompt': [UPDATED_27, /currently gpt-5\.4-mini/, /GET \/mechanics\?service=brakes/],
  'single-gpt-call': [UPDATED_27, /currently gpt-5\.4-mini/, /brake_pads/],
  'best-ai-booking-widgets-2026': [UPDATED_1003, /gpt-4o-mini-transcribe/, /Not testing voice on mobile/],
  'cascade-corrections': [UPDATED_27, /Changing Service will also clear: Mechanic, Time slot/, /dependsOn/],
  'best-ai-booking-beauty-salons-2026': [UPDATED_1003, /gpt-4o-mini-transcribe/],
  'best-ai-booking-transfer-services-2026': [UPDATED_1003, /gpt-4o-mini-transcribe/],
  'pricing-ai-products': [UPDATED, /Starter €39/, /up to 50 booking requests a month/],
};

const PAGE_TRUTH: Readonly<Record<string, readonly RegExp[]>> = {
  // L3: `/GET \/stylists/` is gone from this list. It was printed only by the hero demo (app-live-demo, the sample API call of its
  // first scenario), which the real widget replaced in the hero slot; the demo scenarios of L4 are held by the script scan below.
  // L4: «on model calls and on booking submission» (the retry line of the old pillars) moved to llms.txt below; «supported verticals
  // (configurations)» was printed by the old FAQ answer only and is on no page now (FINDINGS, L4 B1-notes).
  'index.html': [/mailto:info@webappski\.com/],
  'pricing/index.html': [/Customers speak or type their request/, /Support by email/, /contract terms agreed on request/],
  'faq/index.html': [/mailto:info@webappski\.com/, /There is no HMAC signature/, /Publishing a configuration is refused until the Typelessity DPA has been accepted in the Webappski portal/],
  'for-ai-agents/index.html': [/mailto:info@webappski\.com/, /is designed to take an intent like this/, /bookingResult/,
    /booking \| request/],
  // L10 (FL-32, D9): two answers left /faq with the L6 rewrite and lived on nowhere else in the checked set; the facts stay where the page says them.
  'how-it-works/index.html': [/Submit endpoint returns 502, 503 or 504/, /brake_pads/, /The model call is retried once/, /there is no separate form mode/],
  'blog/cascade-corrections/index.html': [/will also clear/],
  'about/index.html': [/mailto:info@webappski\.com/, /Typelessity and TypelessForm are separate codebases/],
  'llms.txt': [/Support is by email on every tier/, /health data is not permitted under the Typelessity DPA/, /on model calls and on booking submission/],
  'llms-full.txt': [/Up to 2,000 submissions\/month, up to 10 websites, support by email/,
    /Each business has its own configuration/],
};

async function read(path: string): Promise<string> {
  try {
    return await readFile(new URL(path, DIST), 'utf8');
  } catch {
    throw new Error(`dist/${path} missing — run \`npm run build\` before this check.`);
  }
}

async function posts(): Promise<string[]> {
  const entries = await readdir(new URL('blog/', DIST), { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function banned(path: string, body: string): void {
  for (const re of BANNED) assert.doesNotMatch(body, re, `${path} still says ${re}`);
  // TY-DEMO: /demo is scanned like the other pages, with one exception — the name MedBook, held on that page by the guard at the end of this file.
  for (const re of BANNED_A45C) {
    if (path === 'demo/index.html' && re.source === 'MedBook') continue;
    assert.doesNotMatch(body, re, `${path} still says ${re}`);
  }
}

// The home page shows compact tier cards without bullets; /pricing carries the full cards.
test('every tier card on /pricing says «Support by email»', async () => {
  const body = await read('pricing/index.html');
  const cards = body.match(/<li[^>]*>\s*Support by email\s*<\/li>/g) ?? [];
  assert.equal(cards.length, 4, `expected «Support by email» on all four tier cards, found ${cards.length}`);
});

for (const path of PAGES) {
  test(`${path}: no support level, old model, unmeasured latency or dated promise`, async () => {
    const body = await read(path);
    banned(path, body);
    for (const re of BANNED_PAGES_A45C) assert.doesNotMatch(body, re, `${path} still says ${re}`);
    for (const re of PAGE_TRUTH[path] ?? []) assert.match(body, re, `${path} lost the line ${re}`);
  });
}

test('every blog post the build emitted: no old model, unmeasured latency or missing mechanics', async () => {
  const slugs = await posts();
  assert.ok(slugs.length >= 10, `expected the 10 posts under dist/blog, found ${slugs.length}`);
  for (const slug of Object.keys(POST_TRUTH)) assert.ok(slugs.includes(slug), `dist/blog/${slug} missing`);
  for (const slug of slugs) {
    const path = `blog/${slug}/index.html`;
    const body = await read(path);
    banned(path, body);
    for (const re of POST_TRUTH[slug] ?? []) assert.match(body, re, `${path} lost the line ${re}`);
  }
});

// A45c. The hero used to rotate five demos; only the first was prerendered, so the rest were checked in the scripts the build
// emitted. L3 (F3.3) removed that rotation — the hero holds the real widget now — but the test stays: it scans every script
// the build shipped, which is where the demo scenarios of L4 would be written, and a medical demo must not come back through them.
//
// TY-DEMO (25.10, founder: «a simple example; we do not give it to medical practices, we only show how well it copes with a complex
// task»): the /demo page names MedBook, as an example, and the lazy chunk of that page carries the name. So the ban on the NAME is narrowed,
// explicitly and in one place: MedBook may stand in the chunk of /demo (found by the selector inside it, not by its hashed file name) and in
// demo/index.html, and only together with the mark («Typelessity is not available to medical practices», «Do not enter real health data»).
// Everywhere else — every other script, every other page, the llms files, the sitemap — the name stays banned, and the medical SCENARIO
// (cardiology, GET /doctors, doctorGender) stays banned in every file, the /demo chunk included. The mark is held by the mutants below.
const MEDBOOK = /MedBook/i;
const DEMO_CHUNK = /app-demo-page/;
const MEDBOOK_MARK: readonly RegExp[] = [/Typelessity is not available to medical practices/, /Do not enter real health data/];
const MEDICAL_SCENARIO: readonly RegExp[] = [/cardiolog/i, /GET \/doctors/i, /doctorGender/];

/** What is wrong with the name MedBook in these scripts: it stands outside the chunk of /demo, or in that chunk without the whole mark. */
function medbookScriptProblems(files: ReadonlyArray<readonly [name: string, body: string]>): string[] {
  const problems: string[] = [];
  for (const [name, body] of files) {
    if (!MEDBOOK.test(body)) continue;
    if (!DEMO_CHUNK.test(body)) problems.push(`${name}: names MedBook outside the chunk of /demo`);
    else for (const re of MEDBOOK_MARK) if (!re.test(body)) problems.push(`${name}: names MedBook without ${re}`);
  }
  return problems;
}

/** The same for the prerendered /demo page: every <article> that names MedBook holds the whole mark inside it. */
function medbookCardProblems(html: string): string[] {
  const problems: string[] = [];
  for (const [card] of html.matchAll(/<article\b[\s\S]*?<\/article>/g)) {
    if (!MEDBOOK.test(card)) continue;
    for (const re of MEDBOOK_MARK) if (!re.test(card)) problems.push(`the MedBook card has no ${re}`);
  }
  return problems;
}

test('the emitted scripts: no medical scenario anywhere, MedBook only in the chunk of /demo and next to its mark', async () => {
  const files = (await readdir(DIST)).filter((f) => f.endsWith('.js'));
  assert.ok(files.length > 0, 'no scripts under dist/browser — run `npm run build` first');
  const scripts: Array<readonly [string, string]> = [];
  for (const f of files) {
    const body = await read(f);
    scripts.push([f, body]);
    for (const re of MEDICAL_SCENARIO) assert.doesNotMatch(body, re, `${f} still says ${re}`);
  }
  assert.deepEqual(medbookScriptProblems(scripts), []);
  assert.ok(scripts.some(([, b]) => DEMO_CHUNK.test(b) && MEDBOOK.test(b)), 'no script of /demo carries MedBook — the guard would pass on nothing');
});

test('MedBook outside /demo: no page, llms file or sitemap of the build names it, and /demo names it only inside its card with the mark', async () => {
  const all = (await readdir(DIST, { recursive: true })).filter((f) => /\.(html|txt|xml)$/.test(f)).sort();
  assert.ok(all.includes('demo/index.html'), 'dist has no demo/index.html');
  const named: string[] = [];
  for (const f of all) {
    const body = await read(f);
    if (MEDBOOK.test(body) && f !== 'demo/index.html') named.push(f);
  }
  assert.deepEqual(named, [], 'a file other than /demo names MedBook');
  const demo = await read('demo/index.html');
  assert.match(demo, MEDBOOK, '/demo no longer shows MedBook');
  assert.deepEqual(medbookCardProblems(demo), []);
  // outside its card the name must not stand: the title, the description and the lead do not name it either
  assert.doesNotMatch(demo.replace(/<article\b[\s\S]*?<\/article>/g, ' '), MEDBOOK, 'MedBook stands on /demo outside a card');
});

// Mutants of the guard (a test that has not been seen to fail proves nothing): each is the chunk or the card of /demo with one thing taken away.
test('MedBook guard mutants: the mark taken out, or the name put into another chunk, is caught', () => {
  const chunk = 'selectors:[["app-demo-page"]],name:"MedBook",note:"Typelessity is not available to medical practices. This demo only shows how the widget copes. Do not enter real health data."';
  assert.deepEqual(medbookScriptProblems([['chunk-demo.js', chunk]]), [], 'the real chunk passes');
  assert.equal(medbookScriptProblems([['chunk-demo.js', chunk.replace('Typelessity is not available to medical practices.', '')]]).length, 1, 'the sentence «not available to medical practices» removed');
  assert.equal(medbookScriptProblems([['chunk-demo.js', chunk.replace('Do not enter real health data.', '')]]).length, 1, 'the sentence «Do not enter real health data» removed');
  assert.equal(medbookScriptProblems([['main.js', chunk.replace('app-demo-page', 'app-home')]]).length, 1, 'MedBook in a chunk that is not /demo');
  const card = '<article class="card"><h3>MedBook</h3><p>Typelessity is not available to medical practices. Do not enter real health data.</p></article>';
  assert.deepEqual(medbookCardProblems(card), [], 'the real card passes');
  assert.equal(medbookCardProblems(card.replace('Typelessity is not available to medical practices. ', '')).length, 1, 'the card without the first sentence');
  assert.equal(medbookCardProblems(card.replace(/<p>[\s\S]*<\/p>/, '')).length, 2, 'the card without the mark at all');
});
