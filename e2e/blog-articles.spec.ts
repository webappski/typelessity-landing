import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import matter from 'gray-matter';

// L9 (2026-10-20, card «Таблица стражей», classes а–з): the ten articles and the /blog list as a reader and a crawler receive
// them, read from the built bytes (`npm run build` first). LANDING_DIST points it at another copy of dist/typelessity-landing/browser
// (the mutation run feeds it a copy with one defect put back; it must go red). Expected texts are the literals below, not the data the
// build was made from. The vendor facts of the comparison are the figures of pending-review/2026-10-15/typelessity-4a-vendor-facts.md
// (checked 2026-10-15 on each vendor's own pricing page), written here as literals on purpose: a price that drifts from that table goes red.

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const BLOG_DIR = join(ROOT, 'src', 'assets', 'content', 'blog');

const decode = (s: string) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** (а) the pairs: literals, title WITHOUT the « — Typelessity» suffix. */
const BLOG_PAGES: ReadonlyArray<readonly [slug: string, title: string, description: string]> = [
  ['best-ai-booking-widgets-2026', 'Best AI booking widgets for websites in 2026', 'Calendly, SimplyBook.me, Botpress, NoForm.ai and Typelessity compared: what each one is for, where it fits and when it is the wrong choice.'],
  ['best-ai-booking-beauty-salons-2026', 'AI booking widgets for beauty salons, compared', 'What a hair or beauty salon needs from online booking, how booking platforms differ from a booking chat on your own site, and what to ask each vendor.'],
  ['best-ai-booking-transfer-services-2026', 'AI booking widget for transfer services 2026', 'What a chauffeur or airport-transfer company needs from online booking, and how dispatch platforms differ from a booking chat on its own site.'],
  ['pricing-ai-products', 'Pricing an AI product: why our pilot is free', 'Free pilot with no time limit (50 booking requests a month), then Starter €39, Pro €149 and Enterprise €399 a month: our reasoning and its limits.'],
  ['latency-budgets', 'A one-second latency target for AI booking', 'How Typelessity plans a one-second booking turn: model call, enrichment, render. A target, not a measurement: what is built and what is not.'],
  ['designing-for-ai-agents', 'What typelessity.com publishes for AI agents', 'JSON-LD, llms.txt and the /for-ai-agents page: what each one says about Typelessity, what it is for, and what no AI engine has promised us.'],
  ['whisper-vs-webspeech', 'Whisper vs Web Speech API for booking voice', 'Typelessity transcribes booking voice on its server, first with Whisper, now with gpt-4o-mini-transcribe, not in the browser. What it does and does not do.'],
  ['25-languages-one-prompt', '25 interface languages, one booking prompt', 'The chat window comes in 25 languages; the assistant replies in the language you set and reads what customers write. One prompt, no per-language code.'],
  ['single-gpt-call', 'Replacing a booking form with one GPT call', "One model call reads the customer's sentence and fills every detail it can; the chat asks only for what is missing. The architecture and its limits."],
  ['cascade-corrections', 'Cascade corrections in conversational booking', 'When a customer changes one detail mid-booking, the details that depended on it must be cleared. How Typelessity tracks this and asks first.'],
];
const SUFFIX = ' — Typelessity';
const BLOG_LIST = { title: 'Blog: AI booking guides and comparisons', description: 'Articles on booking by chat: how the engine works, how the pilot is priced, and how booking tools differ.', h1: 'AI booking guides and comparisons' };
const SLUGS = BLOG_PAGES.map((p) => p[0]);
const WIDGETS = 'best-ai-booking-widgets-2026';
const SALON = 'best-ai-booking-beauty-salons-2026';
const TRANSFER = 'best-ai-booking-transfer-services-2026';

const HTML = new Map<string, string>();
const read = (rel: string): string => {
  const p = join(BROWSER, rel);
  if (!existsSync(p)) throw new Error(`${p} missing — run \`npm run build\` before this check.`);
  return readFileSync(p, 'utf8');
};
const page = (slug: string) => HTML.get(`blog/${slug}/index.html`)!;
const meta = (html: string, attr: 'name' | 'property', key: string) =>
  decode(html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`))?.[1] ?? html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${key}"`))?.[1] ?? '');
const titleTag = (html: string) => decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
const h1 = (html: string) => text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '');
/** the article body: from class="blog-post__body" to the footer of the post */
const body = (slug: string) => page(slug).match(/class="blog-post__body"[\s\S]*?<\/markdown>/)?.[0] ?? '';
/** the body without links, code and pre: what a reader sees as plain words */
const plain = (slug: string) => body(slug).replace(/<a\b[\s\S]*?<\/a>/g, ' ').replace(/<code\b[\s\S]*?<\/code>/g, ' ').replace(/<pre\b[\s\S]*?<\/pre>/g, ' ');

before(() => {
  for (const s of SLUGS) HTML.set(`blog/${s}/index.html`, read(`blog/${s}/index.html`));
  HTML.set('blog/index.html', read('blog/index.html'));
});

test('the written list and the blog agree: ten articles, ten entries', () => {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')).sort();
  assert.deepEqual([...SLUGS].sort(), files);
  assert.equal(SLUGS.length, 10);
});

test('L9(а) title, description, h1 and lede of each article follow the pair written here, within 60 and 155 characters', () => {
  const bad: string[] = [];
  for (const [slug, title, description] of BLOG_PAGES) {
    const html = page(slug);
    const tag = titleTag(html);
    if (tag !== `${title}${SUFFIX}`) bad.push(`${slug}: <title> «${tag}»`);
    if (tag.length > 60) bad.push(`${slug}: title is ${tag.length} characters`);
    if (meta(html, 'name', 'description') !== description) bad.push(`${slug}: meta description «${meta(html, 'name', 'description')}»`);
    if (description.length > 155) bad.push(`${slug}: description is ${description.length} characters`);
    if (meta(html, 'property', 'og:title') !== title && meta(html, 'property', 'og:title') !== `${title}${SUFFIX}`) bad.push(`${slug}: og:title «${meta(html, 'property', 'og:title')}»`);
    if (h1(html) !== title) bad.push(`${slug}: h1 «${h1(html)}»`);
    const lede = text(html.match(/class="blog-post__lede"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
    if (lede !== description) bad.push(`${slug}: lede «${lede}»`);
  }
  assert.deepEqual(bad, []);
});

test('L9(а) /blog: title, description, h1 and subtitle follow the strings written here', () => {
  const html = HTML.get('blog/index.html')!;
  assert.equal(titleTag(html), `${BLOG_LIST.title}${SUFFIX}`);
  assert.equal(meta(html, 'name', 'description'), BLOG_LIST.description);
  assert.ok(BLOG_LIST.description.length <= 155);
  assert.equal(h1(html), BLOG_LIST.h1);
  assert.equal(text(html.match(/class="blog-hero__sub"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''), BLOG_LIST.description);
  const links = new Set([...html.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...links].sort(), [...SLUGS].sort(), '/blog links a different set of articles than the ten');
});

test('L9(б) no path is printed as plain words in an article body: every path is a link or code', () => {
  const bad: string[] = [];
  for (const slug of SLUGS) {
    const found = [...plain(slug).matchAll(/(?<![\w/.])\/(blog|pricing|how-it-works|gdpr|install|industries|for-ai-agents|faq|about)\b/g)].map((m) => m[0]);
    if (found.length) bad.push(`${slug}: ${[...new Set(found)].join(' ')}`);
  }
  assert.deepEqual(bad, []);
});

test('L9(в) the articles lead to the pages that own the subject', () => {
  const href = (slug: string, to: string) => body(slug).includes(`href="${to}"`);
  const bad: string[] = [];
  for (const slug of ['latency-budgets', 'whisper-vs-webspeech', 'single-gpt-call', '25-languages-one-prompt', 'cascade-corrections']) if (!href(slug, '/how-it-works')) bad.push(`${slug}: no link to /how-it-works`);
  if (!href(SALON, '/industries/beauty-hair-salons')) bad.push(`${SALON}: no link to the salon page`);
  if (!href(SALON, `/blog/${WIDGETS}`)) bad.push(`${SALON}: no link to the comparison`);
  if (!href(TRANSFER, `/blog/${WIDGETS}`)) bad.push(`${TRANSFER}: no link to the comparison`);
  if (!href('single-gpt-call', `/blog/${WIDGETS}`)) bad.push('single-gpt-call: the pointer to other tools does not lead to the comparison');
  assert.deepEqual(bad, []);
});

// the vendors that only the comparison may name; Voiceflow is on the list although no article names it now
const VENDORS = /calendly|simplybook|botpress|noform|voiceflow/i;
test('L9(г) vendor facts live in the comparison only; there they are the figures of the 4a table, dated', () => {
  const outside = SLUGS.filter((s) => s !== WIDGETS).filter((s) => VENDORS.test(plain(s))).map((s) => `${s}: ${[...new Set(plain(s).match(new RegExp(VENDORS, 'gi')))].join(' ')}`);
  assert.deepEqual(outside, [], 'a vendor named outside the comparison article (outside a link)');
  const t = text(body(WIDGETS));
  for (const must of ['$150/mo', '$10 /seat/mo', '$29 / for the first month then $99 / month', '€11.9 per month, billed annually', 'billed annually', 'billed yearly', 'checked 2026-10-15']) {
    assert.ok(t.includes(must), `the comparison lost «${must}»`);
  }
  for (const gone of ['low double digits', 'Free open-source tier', 'mid double digits', 'scaling with leads captured', 'scaling by features', 'low-to-mid monthly fee', '$12 monthly', '189']) {
    assert.ok(!t.includes(gone), `the comparison still says «${gone}»`);
  }
  assert.match(body(WIDGETS), /<\/table>\s*<p>Vendor columns: each vendor's official pricing page, checked 2026-10-15; recheck after 90 days\./, 'the line «checked 2026-10-15» does not stand right under the table');
  for (const url of ['https://botpress.com/pricing', 'https://calendly.com/pricing', 'https://noform.ai/pricing/', 'https://simplybook.me/en/pricing']) {
    assert.ok(body(WIDGETS).includes(`href="${url}"`), `the comparison does not link ${url}`);
  }
});

/** the section of a salon/transfer article that speaks of Typelessity today: from its h2 to the next h2 */
const todaySection = (slug: string) => {
  const m = body(slug).match(/<h2[^>]*>What does Typelessity do for[\s\S]*?(?=<h2|<\/markdown>)/);
  return m ? m[0] : '';
};
test('L9(д) the salon and the transfer article say nothing about Typelessity that its code does not do', () => {
  const bad: string[] = [];
  for (const slug of [SALON, TRANSFER]) {
    const sec = todaySection(slug);
    if (!sec) { bad.push(`${slug}: the section «What does Typelessity do for…» is not found`); continue; }
    const t = text(sec);
    for (const re of [/geocod/i, /time ?zone/i, /customer['’]?s history/i, /booking history/i]) if (re.test(t)) bad.push(`${slug}: ${re} in the Typelessity section`);
    if (/5\+ languages/.test(text(body(slug)))) bad.push(`${slug}: «5+ languages»`);
    const ths = (body(slug).match(/<th\b/g) ?? []).length;
    if (ths !== 3) bad.push(`${slug}: the table has ${ths} columns, 3 expected`);
    if (!/<td>[^<]*(your (booking|dispatch) system's API|Not built in)/.test(sec)) bad.push(`${slug}: no cell says «through your system's API» or «not built in»`);
  }
  assert.deepEqual(bad, []);
});

test('L9(е) the transfer article ends with the line about the demo, just above the signature', () => {
  const paragraphs = [...body(TRANSFER).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => text(m[1]));
  const sign = paragraphs.findIndex((p) => p.startsWith('— Alex Isa'));
  assert.ok(sign > 0, 'no signature paragraph');
  assert.equal(paragraphs[sign - 1], 'There is no public demo of a transfer setup yet; the TransEdge demo shows freight pickups.');
});

test('L9(ж) no promise of citation, no percentage and no engine behaviour that we have not measured', () => {
  const BANNED: readonly RegExp[] = [/\d+ ?%/, /Princeton/i, /preferentially/i, /citation probability/i, /ends up in a model/i, /highest-leverage/i, /is becoming/i, /most-cited/i, /prefer voice/i, /conversion lift/i, /conversion ceiling/i, /GDPR[- ]compliant/i];
  const bad: string[] = [];
  for (const slug of SLUGS) for (const re of BANNED) {
    const t = text(body(slug));
    if (re.test(t)) bad.push(`${slug}: ${re}`);
  }
  assert.deepEqual(bad, []);
});

test('L9(з) updatedAt is the day of the last change of the article, and not before its last commit', () => {
  const bad: string[] = [];
  for (const slug of SLUGS) {
    const { data } = matter(readFileSync(join(BLOG_DIR, `${slug}.mdx`), 'utf8'));
    const updated = String(data['updatedAt']);
    let committed = '';
    try { committed = execFileSync('/usr/bin/git', ['log', '-1', '--date=format-local:%F', '--format=%cd', '--', join('src', 'assets', 'content', 'blog', `${slug}.mdx`)], { cwd: ROOT, env: { ...process.env, TZ: 'Europe/Warsaw' } }).toString().trim(); } catch { /* no git: the other classes still hold */ }
    if (committed && updated < committed) bad.push(`${slug}: updatedAt ${updated} is before its last commit ${committed}`);
    if (!page(slug).includes(`datetime="${updated}"`)) bad.push(`${slug}: the page does not carry updatedAt ${updated}`);
  }
  assert.deepEqual(bad, []);
});
