import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { EN } from '../src/app/i18n/translations.en';
import { BADGE } from './free-pilot-copy';
import { EXPECTED_PAGES, RETIRED_TERMS, SEVEN, SEVEN_SLUGS } from './industries-seven';
import { CLAIM_CLASSES, countClaims, LANDING_LANGUAGES, type ClaimCounts } from './claims-dictionary';

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
  assert.ok(pages.size >= EXPECTED_PAGES, `expected the prerendered site under dist/browser (at least ${EXPECTED_PAGES} text files), found ${pages.size}`);
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

// The portfolio advertisement offers Webappski's work, not a measured setup time for Typelessity.
// Exclude only the complete, unchanged canonical card on the root page; malformed or expanded ads fail closed.
const PILOT_TEXT = `${BADGE} By application 30 days of work on your AI visibility Apply for the free pilot No contract. No card. No price.`;
const PILOT_HREF = 'https://webappski.com/en/free-aeo-pilot?utm_source=typelessity.com&utm_campaign=free-pilot&utm_medium=banner';
const OPEN_TAG = /<[a-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;

function attribute(tag: string, name: string): string | undefined {
  const attrs = [...tag.matchAll(/\s([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .filter((m) => m[1].toLowerCase() === name);
  return attrs.length === 1 ? (attrs[0][2] ?? attrs[0][3]).replace(/&amp;/g, '&') : undefined;
}

function classToken(tag: string, name: string): boolean {
  return attribute(tag, 'class')?.split(/\s+/).includes(name) ?? false;
}

function withoutCanonicalPilot(path: string, html: string): string {
  if (path !== 'index.html') return html;
  const openings = [...html.matchAll(OPEN_TAG)].filter((m) => attribute(m[0], 'data-testid') === 'free-pilot-offer');
  if (openings.length !== 1) return html;
  const opening = openings[0];
  if (!/^<aside\b/i.test(opening[0]) || !classToken(opening[0], 'pilot-offer') ||
      attribute(opening[0], 'aria-labelledby') !== 'free-pilot-offer-title') return html;
  const start = opening.index!;
  let asideDepth = 0;
  // Consume comments and raw-text elements before interpreting tags as real ancestry.
  const prefixTokens = /<!--[\s\S]*?-->|<(script|style|textarea|title|xmp|iframe|noembed|noframes)\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/\1\s*>|<\/?[a-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  for (const tag of html.slice(0, start).matchAll(prefixTokens)) {
    if (/^<\/?aside\b/i.test(tag[0])) asideDepth += /^<\//.test(tag[0]) ? -1 : 1;
  }
  if (asideDepth !== 0) return html;
  const contentStart = start + opening[0].length;
  const closing = /<\/aside\s*>/gi;
  closing.lastIndex = contentStart;
  const end = closing.exec(html);
  if (!end) return html;
  const content = html.slice(contentStart, end.index);
  if (/<\/?(?:aside|li|script|style)\b/i.test(content)) return html;
  const fragment = html.slice(start, end.index + end[0].length);
  const tags = [...content.matchAll(OPEN_TAG)].map((m) => m[0]);
  const titles = tags.filter((t) => attribute(t, 'id') === 'free-pilot-offer-title');
  const links = tags.filter((t) => /^<a\b/i.test(t));
  if (titles.length !== 1 || !/^<p\b/i.test(titles[0]) || !classToken(titles[0], 'pilot-offer__title')) return html;
  if (links.length !== 1 || !classToken(links[0], 'pilot-offer__button') ||
      attribute(links[0], 'data-testid') !== 'pilot-hook-button' || attribute(links[0], 'href') !== PILOT_HREF ||
      /\s(?:target|download|onclick)\b/i.test(links[0])) return html;
  if (visibleText(fragment).trim() !== PILOT_TEXT) return html;
  return html.slice(0, start) + html.slice(end.index + end[0].length);
}

function durationOffenders(files: Iterable<readonly [string, string]>): string[] {
  const offenders: string[] = [];
  for (const [path, body] of files) {
    if (isBlog(path) || path.endsWith('.xml')) continue; // posts: see the next test
    const text = path.endsWith('.html') ? visibleText(withoutCanonicalPilot(path, body)) : body;
    for (const s of sentences(text)) {
      if (!DURATION.test(s) || CONFIG_FACT.test(s)) continue;
      offenders.push(`${path}: ${s.slice(0, 160)}`);
    }
  }
  return offenders;
}

test('no duration describes how fast the product is or how long setup takes — pages and llms files', () => {
  assert.deepEqual(durationOffenders(pages), [], 'a duration of our product has no measurement or contract behind it');
});

test('the real built portfolio card is distinct from product duration claims; mutations remain guarded', () => {
  const html = pages.get('index.html')!;
  const qualified = withoutCanonicalPilot('index.html', html);
  assert.notEqual(qualified, html, 'the actual built canonical card must qualify');
  assert.deepEqual(durationOffenders([['index.html', html]]), []);
  assert.equal(withoutCanonicalPilot('pricing/index.html', html), html, 'never exempt another route');
  const quotedTag = html.replace('<aside', '<div data-note="<aside>"></div><aside');
  assert.notEqual(withoutCanonicalPilot('index.html', quotedTag), quotedTag, 'quoted text in another tag is not ancestry');
  const commentedTag = html.replace('<aside', '<!-- <aside> --><aside');
  assert.notEqual(withoutCanonicalPilot('index.html', commentedTag), commentedTag, 'comment text is not ancestry');
  const card = html.slice(html.indexOf('<aside'), html.indexOf('</aside>') + '</aside>'.length);
  assert.match(card, /data-testid="free-pilot-offer"/);
  const outsideClaim = 'Typelessity setup takes 30 days.';
  // Terminate the preceding navigation/heading text so the guard reports this injected sentence itself.
  const outside = html.replace(card, `${card}<p>. ${outsideClaim}</p>`);
  assert.ok(durationOffenders([['index.html', outside]]).some((s) => s.includes(outsideClaim)), 'outside claim must be identified');
  const insideClaim = 'Typelessity installs in 5 minutes.';
  const inside = html.replace(card, card.replace('</aside>', `<p>${insideClaim}</p></aside>`));
  assert.equal(withoutCanonicalPilot('index.html', inside), inside, 'expanded card must not qualify');
  assert.ok(durationOffenders([['index.html', inside]]).some((s) => s.includes(insideClaim)), 'inside claim must be identified');
  const mutations = [
    ['changed title', card.replace('30 days of work on your AI visibility', '30 days of work on your AI visibility, guaranteed')],
    ['old badge without Webappski', card.replace(BADGE, 'Free pilot')],
    ['new-tab link', card.replace('<a ', '<a target="_blank" ')],
    ['wrong destination', card.replace('https://webappski.com/en/free-aeo-pilot', 'https://example.invalid/pilot')],
    ['conversation list', card.replace('</aside>', `<li class="conv">${insideClaim}</li></aside>`)],
    ['nested aside', card.replace('</aside>', '<aside></aside></aside>')],
    ['outer aside', `<aside>${card}</aside>`],
    ['outer aside with quoted closing tag', `<aside><div data-note="</aside>">${card}</div></aside>`],
    ['outer aside with commented closing tag', `<aside><!-- </aside> -->${card}</aside>`],
    ['outer aside with script text', `<aside><script>const tag="</aside>";</script>${card}</aside>`],
    ['outer aside with style text', `<aside><style>.note::after{content:"</aside>"}</style>${card}</aside>`],
    ['incomplete aside', card.replace('</aside>', '')],
    ['duplicate card', card + card],
    ['script content', card.replace('</aside>', '<script>void 0;</script></aside>')],
    ['style content', card.replace('</aside>', '<style>.pilot-offer{}</style></aside>')],
  ] as const;
  for (const [name, changedCard] of mutations) {
    const mutated = html.replace(card, changedCard);
    assert.equal(withoutCanonicalPilot('index.html', mutated), mutated, `${name} must be rejected explicitly`);
    // The existing conversation helper strips li.conv; rejection must retain the real ad's duration,
    // rather than pretend the scanner can see that hidden list item's injected phrase.
    assert.match(visibleText(mutated), /30 days of work on your AI visibility/, `${name} must retain the guarded duration`);
    assert.ok(durationOffenders([['index.html', mutated]]).length > 0, `${name} must keep the guard red`);
  }
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

test('the clinics page is not built and /industries lists the seven kept pages', () => {
  assert.equal(pages.has('industries/beauty-aesthetic-clinics/index.html'), false, 'dist still holds the clinics page');
  const industries = visibleText(pages.get('industries/index.html')!);
  assert.doesNotMatch(industries, /Aesthetic|cosmetic/i);
  const count = Number(industries.match(/AI booking that fits (\d+) verticals/)?.[1]);
  const listed = [...pages.keys()].filter((p) => /^industries\/[^/]+\/index\.html$/.test(p)).length;
  assert.equal(count, listed, 'the heading counts a different number of verticals than the build holds');
  // the expectation is the written list of the seven kept pages, not the data the build was made from (L1б)
  assert.equal(listed, SEVEN.length);
  assert.equal(count, SEVEN.length);
});

// L4 (2026-10-20): the home page no longer counts its verticals in a heading and no longer draws chips plus an «All N industries» tile;
// it has one card per industry, each linking to that industry's own page, and nothing links to the hub from here.
test('the home page links exactly the verticals that have a page, each card to its own page, and not to the hub', () => {
  const html = pages.get('index.html')!;
  const built = [...pages.keys()].map((p) => p.match(/^industries\/([^/]+)\/index\.html$/)?.[1]).filter((x): x is string => !!x).sort();
  const linked = [...new Set([...html.matchAll(/href="\/industries\/([^"]+)"/g)].map((m) => m[1]!))].sort();
  assert.deepEqual(linked, built, 'the home page lists a vertical that has no page, or leaves one out');
  assert.equal(built.length, SEVEN.length, 'the site builds a different number of industry pages than the seven it keeps');
  assert.doesNotMatch(html, /href="\/industries"/, 'the home page links to the hub');
  assert.doesNotMatch(visibleText(html), /Configured for|All \d+ industries/);
});

// L1б: the 29 industries and 4 categories taken down must not be named on the pages that list or summarise the
// verticals. Case does not matter; the class is the names of the retired industries and categories plus the phrases
// that named them ('legal' alone is a fair word: «legal basis», «legal blockers»). L9 took the last one, the post
// best-ai-booking-widgets-2026 («legal practices, real estate»), off its list: the ten articles and the /blog list are guarded too.
const ARTICLE_PAGES = readdirSync(new URL('../src/assets/content/blog/', import.meta.url))
  .filter((f) => f.endsWith('.mdx')).map((f) => `blog/${f.replace(/\.mdx$/, '')}/index.html`).sort();
const RETIRED_GUARDED = ['index.html', 'industries/index.html', 'faq/index.html', 'for-ai-agents/index.html', 'blog/index.html', ...ARTICLE_PAGES];

test('the home, hub, FAQ, for-ai-agents, /blog and the ten articles name none of the retired industries or categories', () => {
  const offenders: string[] = [];
  for (const path of RETIRED_GUARDED) {
    const html = pages.get(path);
    assert.ok(html !== undefined, `${path} is not built`);
    const text = visibleText(html).toLowerCase();
    // the meta description is not visible text; it names the verticals too
    const meta = (html.match(/<meta[^>]+(?:name="description"|property="og:description")[^>]*>/gi) ?? []).join(' ').toLowerCase();
    for (const term of RETIRED_TERMS) if (text.includes(term) || meta.includes(term)) offenders.push(`${path}: «${term}»`);
  }
  assert.deepEqual(offenders, [], 'a retired industry or category is still named');
  assert.equal(ARTICLE_PAGES.length, 10, 'the blog holds a different number of articles than the ten L9 guards');
});

test('every kept industry is named on the hub by its name, and in the right category', () => {
  const html = pages.get('industries/index.html')!;
  const text = visibleText(html);
  for (const i of SEVEN) assert.ok(text.includes(i.name), `${i.slug}: «${i.name}» is not on the hub`);
  assert.deepEqual(SEVEN_SLUGS.filter((slug) => !html.includes(`href="/industries/${slug}"`)), [], 'the hub does not link a kept page');
});

test('/gdpr says medicine only in the form «not allowed»', () => {
  const text = visibleText(pages.get('gdpr/index.html')!);
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
// The table of five vendors left the home page with L4 (card L4 §3): the facts about other vendors have one owner, the article
// best-ai-booking-widgets-2026 (L9). The cells the vendors' own pages contradicted (A56: Cal.com «EN-first», SimplyBook.me voice)
// went with the table and are not on any page now; this guard holds the home page to that.
test('the home page prints no vendor comparison: no table, no vendor name, none of the cells no vendor page backed (A56)', () => {
  const html = pages.get('index.html')!;
  const text = visibleText(html);
  assert.doesNotMatch(html, /<table\b/);
  for (const vendor of ['Calendly', 'SimplyBook', 'Cal.ai', 'Cal.com', 'Botpress', 'NoForm']) {
    assert.ok(!text.includes(vendor), `the home page names ${vendor}`);
  }
  for (const banned of ['EN-first', 'Custom build', 'Per voice config', 'Lead-qual only', 'Slot-pick page']) {
    assert.ok(!text.includes(banned), `the page still says «${banned}», which no vendor page backs`);
  }
});

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

// ── L0 (18.10): the dictionary of words the site does not print — seo-lead §6 as classes K1–K14 ──────────
// The words live in e2e/claims-dictionary.ts. The llms files are held hard: 0 matches, in public/ and in dist.
// The built HTML is held by a ratchet, because the pages still carry these words until L4–L9 rewrite them:
// e2e/claims-dictionary-baseline.json lists {page: {class: count}}. A new page or class, or a higher count, is red
// (nothing new may appear); a LOWER count with the baseline not lowered is red too (the way ESLint reports
// unused suppressions, eslint.org/docs/latest/use/suppressions). CLAIMS_BASELINE=write creates the file once (it
// must not exist); CLAIMS_BASELINE=prune lowers counts and drops entries, and fails on any growth. A .txt path
// is never written to the baseline. L10 requires the baseline to be empty.
const BASELINE = new URL('./claims-dictionary-baseline.json', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);

function describeCounts(c: ClaimCounts): string {
  return Object.entries(c).map(([k, n]) => `${k}×${n}`).join(' ');
}

test('dictionary: each class catches its mutants and lets its legal form through', () => {
  for (const c of CLAIM_CLASSES) {
    for (const m of c.mutants) assert.ok(countClaims(m)[c.id] > 0, `${c.id} (${c.name}) does not catch «${m}»`);
    assert.deepEqual(countClaims(c.legal), {}, `${c.id} (${c.name}) flags its own legal form «${c.legal}»`);
  }
  assert.deepEqual(CLAIM_CLASSES.map((c) => c.id), Array.from({ length: 14 }, (_, i) => `K${i + 1}`));
});

test('dictionary: public/*.txt print none of the words — 0 matches, no ratchet', async () => {
  const txt = (await readdir(PUBLIC_DIR)).filter((n) => n.endsWith('.txt'));
  assert.ok(txt.includes('llms.txt') && txt.includes('llms-full.txt'), 'public/ lost an llms file');
  const offenders: string[] = [];
  for (const name of txt) {
    const found = countClaims(await readFile(new URL(name, PUBLIC_DIR), 'utf8'));
    if (Object.keys(found).length) offenders.push(`public/${name}: ${describeCounts(found)}`);
  }
  assert.deepEqual(offenders, [], 'a word of the dictionary is back in a public text file');
});

test('dictionary: the built .txt files print none of the words — 0 matches, no ratchet', () => {
  const offenders: string[] = [];
  let seen = 0;
  for (const [path, body] of everything) {
    if (!path.endsWith('.txt')) continue;
    seen++;
    const found = countClaims(body);
    if (Object.keys(found).length) offenders.push(`${path}: ${describeCounts(found)}`);
  }
  assert.ok(seen >= 3, `expected llms.txt, llms-full.txt and the IndexNow key in the build, saw ${seen} .txt files`);
  assert.deepEqual(offenders, [], 'a word of the dictionary is in a built .txt file');
});

test('dictionary: the built HTML only holds the words the baseline lists, and only as many', async () => {
  const current: Record<string, ClaimCounts> = {};
  for (const [path, body] of pages) {
    if (!path.endsWith('.html')) continue;
    const found = countClaims(body);
    if (Object.keys(found).length) current[path] = found;
  }
  const mode = process.env['CLAIMS_BASELINE'];
  const exists = existsSync(BASELINE);
  if (mode === 'write') {
    assert.ok(!exists, 'CLAIMS_BASELINE=write creates the baseline once; it exists — use CLAIMS_BASELINE=prune to lower it');
    await writeFile(BASELINE, JSON.stringify(current, null, 2) + '\n');
    return;
  }
  assert.ok(exists, 'e2e/claims-dictionary-baseline.json is missing');
  const baseline = JSON.parse(await readFile(BASELINE, 'utf8')) as Record<string, ClaimCounts>;
  assert.deepEqual(Object.keys(baseline).filter((p) => p.endsWith('.txt')), [], 'the baseline lists a .txt path — those are held at 0');
  const grew: string[] = [];
  const stale: string[] = [];
  for (const [path, found] of Object.entries(current)) {
    for (const [cls, n] of Object.entries(found)) {
      const allowed = baseline[path]?.[cls] ?? 0;
      if (n > allowed) grew.push(`${path} ${cls}: ${allowed} → ${n}`);
    }
  }
  for (const [path, counts] of Object.entries(baseline)) {
    for (const [cls, n] of Object.entries(counts)) {
      const now = current[path]?.[cls] ?? 0;
      if (now < n) stale.push(`${path} ${cls}: baseline ${n}, now ${now}`);
    }
  }
  if (mode === 'prune') {
    assert.deepEqual(grew, [], 'CLAIMS_BASELINE=prune only lowers; a word grew or appeared');
    await writeFile(BASELINE, JSON.stringify(current, null, 2) + '\n');
    return;
  }
  assert.deepEqual(grew, [], 'a word of the dictionary appeared or grew in the built HTML');
  assert.deepEqual(stale, [], 'the count went down — run CLAIMS_BASELINE=prune npx tsx --test e2e/claims-class-guard.spec.ts in the same commit');
});

// L4 (2026-10-20): the home page was the last page that carried words of the dictionary (its baseline entry was index.html: K1 12, K4 2, K5 7,
// K7 6, K8 1). It carries none now and the baseline is `{}`; this test says so by name, so that a word coming back to `/` is reported as the
// home page's, with the class and the count, and not only as «the count grew» of the ratchet.
test('dictionary: the home page prints none of the words — 0 matches in index.html, nothing is lent to it by the baseline', async () => {
  const baseline = JSON.parse(await readFile(BASELINE, 'utf8')) as Record<string, ClaimCounts>;
  assert.deepEqual(baseline, {}, 'the baseline lists a page again: L4 emptied it, L10 requires it empty');
  const found = countClaims(pages.get('index.html')!);
  assert.deepEqual(found, {}, `/ prints a word of the dictionary: ${describeCounts(found)}`);
});

// The footer line is on every page (and on the 404 shell). It names the language count from the code, not a
// literal: «25+» is a claim the dictionary refuses (K1), and a count that drifts from the 25 the chat window
// has would be the same claim by another number.
test('footer.tagline names the language count of the code, without «+»', () => {
  const tagline = EN['footer.tagline'];
  assert.deepEqual(countClaims(tagline), {});
  assert.ok(tagline.includes(`${LANDING_LANGUAGES.length} languages`), `no «${LANDING_LANGUAGES.length} languages» in «${tagline}»`);
  assert.ok(!tagline.includes('+'), `a «+» in «${tagline}»`);
});

// ── L10 (2026-10-20) ─────────────────────────────────────────────────────────────────────────────────────────
// (а) The ratchet and the dictionary read the whole page. The seven industry pages put their words into the title, the H1 and the description,
// where a search result and an AI answer read them first; those three get a named check, with the slug in the report, so that a word coming
// back to a page head is not found only as «the count grew». The outcome words are the ones industry-pages.spec.ts bans in the body: a head
// that says «booked» or «scheduled» tells the visitor an outcome the widget does not give (it sends a request).
const HEAD_OUTCOME_WORDS = /\bbook(s|ed)?\b|\bscheduled\b|—\s*done\b|configured for/gi;

function headOf(html: string): string {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, ' ') ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  return [title, h1, description].join(' ¶ ');
}

test('L10(а) the title, the H1 and the description of each of the seven industry pages carry no word of the dictionary and no outcome word', () => {
  const offenders: string[] = [];
  for (const { slug } of SEVEN) {
    const html = pages.get(`industries/${slug}/index.html`);
    assert.ok(html, `industries/${slug}/index.html is not in the build`);
    const head = headOf(html);
    assert.ok(head.split(' ¶ ').every((part) => part.trim().length > 0), `${slug}: the title, the H1 or the description is empty — ${head}`);
    const found = countClaims(head);
    if (Object.keys(found).length) offenders.push(`${slug}: ${describeCounts(found)} — ${head.slice(0, 120)}`);
    const outcomes = head.match(HEAD_OUTCOME_WORDS) ?? [];
    if (outcomes.length) offenders.push(`${slug}: outcome word ${JSON.stringify(outcomes)} — ${head.slice(0, 120)}`);
  }
  assert.deepEqual(offenders, [], 'an industry page head says what the widget does not do');
});

// (б) The working notes of the mock-up and its own frame name. K14 holds them in the text of the pages; this reads EVERY file of the build,
// the JS bundles included (a string of the demo or a template travels in a chunk, not in a page). `prototype` is not in this list: in JS it
// is `Element.prototype`.
const MOCK_LABELS: readonly RegExp[] = [/Mock note/i, /Portal screenshot goes here/i, /Thin template/i, /the server answers 404/i, /widget-states/i];

test('L10(б) no file of the build — html, txt, xml, json, js — carries a working note or a frame name of the mock-up', () => {
  const offenders: string[] = [];
  for (const [path, body] of everything) for (const re of MOCK_LABELS) if (re.test(body)) offenders.push(`${path} ${re}`);
  assert.ok(everything.size > EXPECTED_PAGES, 'the scan read the build (a scan of nothing proves nothing)');
  assert.ok([...everything.keys()].some((p) => p.endsWith('.js')), 'the scan reads the JS bundles too');
  assert.deepEqual(offenders, [], 'a mock-up label reached the build');
});

// The footer line of the code is the line of every page: the tagline of the translation file is printed as it is, and the dictionary class
// «chat in N languages» is in K1 (the self-check above holds it with a mutant).
test('L10 the footer tagline is on every prerendered page and on the 404 shell as the code has it, and says «The chat window comes in N languages»', () => {
  const tagline = EN['footer.tagline'];
  assert.match(tagline, new RegExp(`The chat window comes in ${LANDING_LANGUAGES.length} languages`), 'the tagline does not say that the chat WINDOW comes in 25 languages');
  const html404 = [...everything].filter(([p]) => p.endsWith('404.html')).map(([, b]) => b);
  assert.ok(html404.length >= 1, 'the 404 shell is not in the build');
  const missing = [...pages].filter(([p]) => p.endsWith('index.html') || p.endsWith('404.html')).filter(([, b]) => !b.includes(tagline.replace(/&/g, '&amp;'))).map(([p]) => p);
  assert.deepEqual(missing, [], 'pages whose footer does not print the tagline of the code');
});
