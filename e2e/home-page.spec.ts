import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { EN } from '../src/app/i18n/translations.en';
import { EMBED_SNIPPET } from '../src/app/core/integrations/embed-snippet';
import { LANDING_LANGUAGES } from '../src/app/core/languages/landing-languages';
import { BLOG_INDEX } from '../src/app/lib/blog-index.generated';
import { FAQ_GROUPS } from '../src/app/pages/faq/faq.content';
import { HOME, PILOT_REQUESTS } from '../src/app/pages/home/home.content';
import { DEMO_LANGS, DEMO_TABS, LANGNOTE, SLOT_TEXT } from '../src/app/pages/home/demo/demo-labels';

// L4 C2 — the prerendered `/` the build produced: what a crawler, a visitor without JavaScript and every browser before hydration receive.
// Real bytes of dist/typelessity-landing/browser, no mocks (run `npm run build` first). The words come from the sources that print them
// (translations.en.ts, home.content.ts, faq.content.ts, the blog index, the demo labels), not from this file, except where a
// decision of the card names the text itself (D8: the six questions; D1: the two sentences of demo__langnote).
//   (a) title, description, H1, capsule  (b) the slot, no widget, no demo script   (c) the chunk of the demo   (d) the 25 languages
//   (e) one caption   (f) what is gone and what is linked   (g) FAQ preview = /faq   (h) blog   (i) CTA code   (j) pilot plaque and offers
//   (k) the order of the sections   (l) «Your data» says only what /gdpr says

const DIST = join(process.cwd(), 'dist/typelessity-landing/browser');
const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');

const decode = (s: string): string => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const textOf = (html: string): string => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const visible = (html: string): string => textOf(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '));

let home = '';
let faqPage = '';
let gdprPage = '';
before(() => {
  for (const f of ['index.html', 'faq/index.html', 'gdpr/index.html']) {
    if (!existsSync(join(DIST, f))) throw new Error(`${join(DIST, f)} missing — run \`npm run build\` before this check.`);
  }
  home = readFileSync(join(DIST, 'index.html'), 'utf8');
  faqPage = readFileSync(join(DIST, 'faq/index.html'), 'utf8');
  gdprPage = readFileSync(join(DIST, 'gdpr/index.html'), 'utf8');
});

const firstGroup = (html: string, re: RegExp): string => decode((re.exec(html)?.[1] ?? '').replace(/<!--[\s\S]*?-->/g, ''));

test('C2(a) title, description, H1 and capsule are the words of the sources, within 60 / 155, and say the category', () => {
  const title = firstGroup(home, /<title>([^<]*)<\/title>/);
  const description = firstGroup(home, /<meta name="description" content="([^"]*)"/);
  assert.equal(title, `${EN['seo.home.title']} — Typelessity`, 'the <title> is not seo.home.title with the brand suffix');
  assert.ok(title.length <= 60, `title is ${title.length} characters`);
  assert.equal(description, EN['seo.home.description']);
  assert.ok(description.length <= 155, `description is ${description.length} characters`);
  assert.match(title, /^AI booking assistant\b/, 'the title names the category first (seo-lead §2.1)');
  assert.doesNotMatch(title + ' ' + description, /\b25\+|in 25 languages|before any (AI )?processing/i);
  const h1 = textOf(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(home)?.[1] ?? '');
  assert.equal(h1, `${HOME.hero.h1Lead} ${HOME.hero.h1Grad}`);
  assert.equal(h1, 'Customers just say it. You get the booking request.', 'the H1 of the card');
  const capsule = textOf(/<p\b[^>]*class="lead"[^>]*>([\s\S]*?)<\/p>/.exec(home)?.[1] ?? '');
  assert.equal(capsule, HOME.hero.capsule);
  assert.match(capsule, /^Typelessity is an AI booking assistant/, 'the capsule starts with the sentence that names the category');
  assert.match(capsule, /by email or, if your booking system has an API, straight into it/, 'R1: the condition on the API stays in the sentence');
  assert.equal([...home.matchAll(/<h1\b/g)].length, 1, 'one H1');
});

test('C2(b) the prerender holds the slot and the neutral sentence; no <typelessity-widget>, no script or preload of the demo; «Loading the chat…» is nowhere', () => {
  assert.equal([...home.matchAll(/<typelessity-widget\b/gi)].length, 0, '<typelessity-widget> in the prerendered HTML');
  assert.equal([...home.matchAll(/<script\b[^>]*widget\.js/gi)].length, 0, '<script> for widget.js');
  const hosts = [...home.matchAll(/<div\b[^>]*\bdata-widget-host\b[^>]*>/g)];
  assert.equal(hosts.length, 1, 'one slot host');
  assert.match(hosts[0]![0], /data-slot-state="prerender"/);
  const slotText = textOf(/data-widget-host[^>]*>([\s\S]*?)<\/app-typelessity-widget>/.exec(home)?.[1] ?? '');
  assert.equal(slotText, `${SLOT_TEXT.prerender} ${SLOT_TEXT.linkText}`, 'the host says the neutral sentence and offers the page that tells the story without the widget');
  assert.equal(SLOT_TEXT.prerender, 'The demo chat runs in the real widget and needs JavaScript.', 'D-F11: the text of the prerender slot');
  const link = /data-widget-host[\s\S]*?<a\b[^>]*href="([^"]*)"/.exec(home)?.[1];
  assert.equal(link, '/how-it-works');
  assert.equal([...home.matchAll(/Loading the chat/g)].length, 0, '«Loading the chat…» in the prerender: it only becomes true after hydration');
  assert.equal([...home.matchAll(/<div\b[^>]*\bdata-widget-mount\b/g)].length, 1, 'one mount point, empty');
  assert.match(home, /<div\b[^>]*\bdata-widget-mount\b[^>]*>\s*<\/div>/, 'the mount point is not empty: Angular must not own what the controller puts in it');
  const chunk = demoChunk();
  assert.equal(home.includes(chunk.name), false, 'the demo chunk is named in index.html (script, modulepreload or import)');
  assert.equal([...home.matchAll(/<link\b[^>]*modulepreload[^>]*>/g)].filter((m) => m[0].includes(chunk.name)).length, 0);
  assert.equal([...home.matchAll(/https:\/\/demo\.invalid/g)].length, 0, 'the demo origin is in the HTML');
});

/** The one file of dist that holds the scripted scenarios. */
function demoChunk(): { name: string; bytes: number } {
  const marker = SCEN_MARKER();
  const hits = readdirSync(DIST).filter((f) => f.endsWith('.js')).filter((f) => readFileSync(join(DIST, f), 'utf8').includes(marker));
  assert.equal(hits.length, 1, `${hits.length} files of dist hold the scenario marker «${marker}» (${hits.join(', ')}); exactly one lazy chunk must`);
  return { name: hits[0]!, bytes: gzipSync(readFileSync(join(DIST, hits[0]!))).length };
}
/** A string only the scripted scenarios hold: the service of the German salon, from the demo script itself. */
function SCEN_MARKER(): string {
  const text = readFileSync(join(process.cwd(), 'src/app/pages/home/demo/demo-script.ts'), 'utf8');
  const marker = text.match(/Balayage und Spitzen/)?.[0];
  assert.ok(marker, 'the demo script no longer holds the German salon sentence');
  return marker;
}

test('C2(c) the chunk of the demo: one file, 30 720 bytes gzipped at most, not named in index.html', () => {
  const chunk = demoChunk();
  assert.ok(chunk.bytes <= 30_720, `the demo chunk ${chunk.name} is ${chunk.bytes} bytes gzipped (DECISIONS #79: 30 720)`);
  assert.equal(home.includes(chunk.name), false);
  const main = readdirSync(DIST).filter((f) => /^main-.*\.js$/.test(f));
  assert.ok(main.length >= 1);
  for (const f of main) assert.equal(readFileSync(join(DIST, f), 'utf8').includes(SCEN_MARKER()), false, `${f}: the scenarios travel in the main bundle`);
});

test('C2(d) the languages: the list holds the languages of the product and no others; «+N» is 25 minus the languages the demo plays', () => {
  const types = readFileSync(join(PRODUCT_ROOT, 'packages/shared/src/i18n/types.ts'), 'utf8');
  const block = types.slice(types.indexOf('export const SUPPORTED_LOCALES'));
  const codes = [...block.slice(0, block.indexOf('] as const')).matchAll(/^\s*'([a-z]{2})',/gm)].map((m) => m[1]!);
  assert.ok(codes.length >= 20, 'SUPPORTED_LOCALES of the product not read');
  assert.equal(LANDING_LANGUAGES.length, codes.length, 'the landing lists a different number of languages than the product');
  assert.deepEqual([...LANDING_LANGUAGES.map((l) => l.code)].sort(), [...codes].sort(), 'the landing lists other language codes than SUPPORTED_LOCALES');
  const list = /<ul\b[^>]*class="langlist"[^>]*>([\s\S]*?)<\/ul>/.exec(home)?.[1];
  assert.ok(list, 'no langlist');
  const items = [...list.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/g)];
  assert.equal(items.length, codes.length, '<li> in the language list');
  const seen = items.map((m) => (/\blang="([a-z]{2})"/.exec(m[1]! + m[2]!)?.[1]) ?? '?');
  assert.deepEqual(seen, LANDING_LANGUAGES.map((l) => l.code), 'every item carries the code of its language in `lang`, in the order of the data');
  const buttons = [...home.matchAll(/<button\b[^>]*\bdata-lang="([a-z]{2})"/g)].map((m) => m[1]);
  assert.deepEqual(buttons, DEMO_LANGS.map((l) => l.code), 'language buttons of the demo');
  const more = textOf(/<button\b[^>]*\bdata-langs-more\b[^>]*>([\s\S]*?)<\/button>/.exec(home)?.[1] ?? '');
  assert.match(more, new RegExp(`\\+${codes.length - buttons.length}\\b`), `«+N» of the more-button is ${codes.length - buttons.length}: ${more}`);
  assert.equal(codes.length - buttons.length, LANDING_LANGUAGES.length - DEMO_LANGS.length);
  assert.equal(DEMO_TABS.length, 4);
  assert.deepEqual([...home.matchAll(/\bdata-scenario-tab="([a-z]+)"/g)].map((m) => m[1]), DEMO_TABS.map((t) => t.id));
  assert.match(home, /data-take-over/);
});

test('C2(e) the caption under the languages is ONE paragraph that holds both the language sentence and the sentence about scripted replies', () => {
  const paragraphs = [...home.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => textOf(m[1]!));
  const holders = paragraphs.filter((p) => p.includes('answers in the language you set for your business') && p.includes('The replies in this demo are scripted.'));
  assert.equal(holders.length, 1, 'D1: the two sentences must sit in one <p>');
  assert.equal(holders[0], LANGNOTE);
  assert.match(holders[0]!, /^The chat window comes in 25 languages\./);
  const classed = /<p\b[^>]*class="demo__langnote"[^>]*>([\s\S]*?)<\/p>/.exec(home)?.[1];
  assert.equal(textOf(classed ?? ''), LANGNOTE, 'the paragraph carries the class demo__langnote');
});

const LINKS = (): string[] => [
  '/install', '/pricing', '/gdpr', '/faq', '/blog', '/how-it-works', '/blog/best-ai-booking-widgets-2026', '/blog/25-languages-one-prompt',
];

test('C2(f) what the redesign took away is gone from the prerender; what it adds is linked', () => {
  const body = visible(home);
  const counts: Record<string, number> = {
    vendors: (home.match(/Calendly|SimplyBook|Cal\.ai|Cal\.com|Botpress|NoForm/g) ?? []).length,
    'twenty-five-plus': (home.match(/25\+/g) ?? []).length,
    'configured-for': (home.match(/Configured for/g) ?? []).length,
    tldr: (home.match(/TL;DR/g) ?? []).length,
    'all-n-industries': (body.match(/All \d+ industries/g) ?? []).length,
    'hub-link': (home.match(/href="\/industries"/g) ?? []).length,
    'comparison-table': (home.match(/<table\b/g) ?? []).length,
  };
  assert.deepEqual(Object.entries(counts).filter(([, n]) => n > 0), [], 'the prerender still carries what L4 removed');
  const missing = LINKS().filter((p) => !home.includes(`href="${p}"`));
  assert.deepEqual(missing, [], 'a link the page must carry is missing');
  assert.equal(LINKS().length, 8);
  // L11: no link into /industries of any kind, and no industries directory behind one
  assert.deepEqual(home.match(/href="\/industries[^"]*"/g) ?? [], [], 'the home page links to an industry address');
  assert.equal(existsSync(join(DIST, 'industries')), false, 'dist holds an industries directory');
});

// L11 (2026-10-20, founder): one block where the six industry cards were — one engine, set up for any business that takes bookings. The examples are
// plain text (no link), in the order of home.content.ts, followed by «and any other business that takes bookings».
test('C2(f2) the «any business» block says the one thing, names the examples as plain text and links only to /install', () => {
  const section = /<section\b[^>]*id="any-business"[^>]*>([\s\S]*?)<\/section>/.exec(home)?.[1];
  assert.ok(section, 'no section#any-business');
  const b = HOME.business;
  assert.equal(textOf(/<span\b[^>]*class="eyebrow[^"]*"[^>]*>([\s\S]*?)<\/span>/.exec(section)?.[1] ?? ''), b.kicker);
  assert.equal(textOf(/<h2\b[^>]*>([\s\S]*?)<\/h2>/.exec(section)?.[1] ?? ''), `${b.h2Lead} ${b.h2Grad}`);
  assert.equal(textOf(/<p\b[^>]*class="lead"[^>]*>([\s\S]*?)<\/p>/.exec(section)?.[1] ?? ''), b.sub);
  assert.match(b.sub, /adapts to any business that takes bookings/);
  const list = /<ul\b[^>]*class="bizlist"[^>]*>([\s\S]*?)<\/ul>/.exec(section)?.[1] ?? '';
  const items = [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1]!));
  assert.deepEqual(items, [...b.examples, b.rest], 'the examples and the closing line, in order');
  assert.ok(!/<a[\s>]/.test(list), 'an example is a link');
  assert.deepEqual([...section.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]), ['/install'], 'the block leads nowhere but to /install');
  assert.equal(items.length, 7);
});

test('C2(g) the FAQ preview is the six questions of D8, found on /faq by their text, with the answers of /faq', () => {
  const six = [
    'Which languages does the chat speak?',
    'Does it work on phones?',
    'What is a booking widget?',
    'Does Typelessity replace my booking system?',
    'How does Typelessity handle GDPR?',
    'How much does Typelessity cost?',
  ];
  assert.deepEqual([...HOME.faq.questions], six, 'HOME.faq.questions is not the list of D8');
  const items = [...home.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>\s*<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => ({ q: textOf(m[1]!), a: textOf(m[2]!) }));
  assert.deepEqual(items.map((i) => i.q), six, 'the questions printed on / (order included)');
  const faqText = textOf(faqPage);
  for (const item of items) {
    const source = FAQ_GROUPS.flatMap((g) => g.items).find((i) => i.q === item.q);
    assert.ok(source, `«${item.q}» is not a question of /faq (FAQ_GROUPS)`);
    assert.equal(item.a, textOf(source.a), `the answer to «${item.q}» on / differs from the answer on /faq`);
    assert.ok(faqText.includes(item.q) && faqText.includes(item.a), `/faq (the built page) does not print «${item.q}» with that answer`);
  }
  assert.doesNotMatch(items.map((i) => i.q + ' ' + i.a).join(' '), /Calendly|SimplyBook|Cal\.ai|Botpress|NoForm|25\+|webhook/i);
});

test('C2(h) the blog band: three articles, their titles and categories from the blog index, and the link to all of them', () => {
  assert.equal(HOME.blog.slugs.length, 3);
  for (const slug of HOME.blog.slugs) {
    const entry = BLOG_INDEX.find((p) => p.slug === slug);
    assert.ok(entry, `${slug} is not in the blog index`);
    const card = new RegExp(`<a\\b[^>]*href="/blog/${slug}"[^>]*>([\\s\\S]*?)</a>`).exec(home)?.[1];
    assert.ok(card, `no card for ${slug}`);
    const text = textOf(card);
    assert.ok(text.includes(entry.title), `the card of ${slug} does not carry the title «${entry.title}» of the index`);
    assert.ok(text.includes(entry.category), `the card of ${slug} does not carry the category «${entry.category}»`);
  }
  // the cards carry a category and a title and no description: the description of the comparison names four vendors and `/` names none
  const all = home.match(/href="\/blog"/g) ?? [];
  assert.ok(all.length >= 1, '«All articles →»');
  assert.ok(home.includes(HOME.blog.more.replace(' →', '')), 'the link text of the blog band');
});

test('C2(i) the code of the final call to action is the embed code, escaped, and the install page is linked under it', () => {
  const pre = /<pre\b[^>]*class="code"[^>]*>([\s\S]*?)<\/pre>/.exec(home);
  assert.ok(pre, 'no <pre class="code">');
  assert.equal(decode(pre[1]!.replace(/<!--[\s\S]*?-->/g, '')), EMBED_SNIPPET);
  assert.equal(/<typelessity-widget/i.test(pre[1]!), false, 'the embed code is printed as an element, not escaped');
  const tail = home.slice(home.indexOf(pre[0]) + pre[0].length, home.indexOf(pre[0]) + pre[0].length + 400);
  assert.match(tail, /href="\/install"/, 'the install link is not right under the code');
});

test('C2(j) the pilot plaque and the offers: 50 and the Starter price come from the tiers; the four prices of the markup are visible as text', () => {
  const tiers = HOME.pricing.tiers;
  const bignum = textOf(/<div\b[^>]*class="bignum"[^>]*>([\s\S]*?)<\/div>/.exec(home)?.[1] ?? '');
  assert.equal(bignum, PILOT_REQUESTS);
  assert.equal(PILOT_REQUESTS, String(/\d+/.exec(tiers[0].bullets[0])![0]));
  const body = visible(home);
  assert.ok(body.includes(`Then from ${tiers[1].price} a month`), 'the plaque names the Starter price from the tiers');
  assert.ok(body.includes(`Free pilot: ${PILOT_REQUESTS} booking requests a month`), 'the trust line names the pilot size from the tiers');
  // offers: one SoftwareApplication, the four tiers, the prices of the tiers (the markup is not changed by L4: D9)
  const ld = [...home.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!) as Record<string, unknown>);
  const app = ld.find((d) => d['@type'] === 'SoftwareApplication') as { offers?: { price?: string | number; priceCurrency?: string }[] } | undefined;
  assert.ok(app?.offers, 'no SoftwareApplication with offers');
  assert.equal([...home.matchAll(/"offers"/g)].length, 1);
  assert.deepEqual(app.offers.map((o) => Number(o.price)), tiers.map((t) => Number(t.price.replace('€', ''))), 'offers = the tiers');
  // Google: do not mark up content that is not visible — every price of the markup is printed on the page as text
  for (const t of tiers) assert.ok(body.includes(t.price), `${t.price} (${t.name}) is in the markup and not visible as text on /`);
  assert.doesNotMatch(body, /\/ month/, 'a tier grid is back on /');
});

test('C2(k) the sections come in the order of D7', () => {
  const kickers = [...home.matchAll(/<span\b[^>]*class="eyebrow[^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => textOf(m[1]!));
  assert.deepEqual(kickers, [
    HOME.chain.kicker, HOME.whatItIs.kicker, HOME.steps.kicker, HOME.business.kicker, HOME.data.kicker, HOME.blog.kicker, HOME.faq.kicker, HOME.languages.kicker, HOME.cta.eyebrow,
  ]);
  const at = (needle: string): number => { const i = home.indexOf(needle); assert.ok(i >= 0, `${needle} is not on /`); return i; };
  const order = ['free-pilot-offer', 'class="hero"', 'data-ty-chain', 'id="how"', 'id="any-business"', 'class="plaque"', 'id="languages"', 'class="cta-band"'].map(at);
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'banner, hero, chain, how, any business, plaque, languages, call to action');
});

test('C2(l) «Your data» says only what /gdpr says: every sentence of the three cards is printed on /gdpr', () => {
  const gdpr = textOf(gdprPage.replace(/<script[\s\S]*?<\/script>/g, ' '));
  const sentences = (p: string): string[] => p.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (const card of HOME.data.cards) {
    for (const s of sentences(card.p)) assert.ok(gdpr.includes(s), `«${s}» (card «${card.h}») is not a sentence of /gdpr`);
    assert.ok(visible(home).includes(card.p), `the card «${card.h}» is not on /`);
  }
  assert.ok(home.includes('href="/gdpr"'));
});
