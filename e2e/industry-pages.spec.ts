import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_HOSTS, LANGUAGE_NAMES, SEVEN, SEVEN_PAGES, SITE_ORDER } from './industries-seven';

// L8 (2026-10-20, card D8): the seven industry pages as a visitor and a crawler receive them. Read from the built bytes
// (`npm run build` first); LANDING_DIST points it at another copy of dist/typelessity-landing/browser (the mutation run feeds
// it a copy with one defect put back; it must go red). Expected texts are the literals of `SEVEN_PAGES`, not the data the
// build was made from.
//
// Not a new class of the claims dictionary (K15): a class for the whole site would catch the home page and two articles that
// other tasks (L4, L9) rewrite, and the ratchet takes no growth. The words of this guard apply to the seven pages and the hub.

const BROWSER = process.env['LANDING_DIST'] ?? join(new URL('..', import.meta.url).pathname, 'dist', 'typelessity-landing', 'browser');

const decode = (s: string) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** The example conversation is a customer's own sentence («can I book a tour»): it is the one place these words stay. */
const withoutConversations = (html: string) => html.replace(/<li[^>]*class="conv[ "][\s\S]*?<\/li>/g, ' ');

const OUTCOME_WORDS = /\bbook(s|ed)?\b|\bscheduled\b|—\s*done\b|configured for/gi;

const HTML = new Map<string, string>();
const read = (rel: string): string => {
  const p = join(BROWSER, rel);
  if (!existsSync(p)) throw new Error(`${p} missing — run \`npm run build\` before this check.`);
  return readFileSync(p, 'utf8');
};
const page = (slug: string) => HTML.get(`industries/${slug}/index.html`)!;
const meta = (html: string, attr: 'name' | 'property', key: string) =>
  decode(html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`))?.[1] ?? html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${key}"`))?.[1] ?? '');
const h1s = (html: string) => [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]));
const jsonLd = (html: string): Record<string, unknown>[] =>
  [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => {
    const v = JSON.parse(m[1]);
    return Array.isArray(v) ? v : (v['@graph'] ?? [v]);
  });
/** The `<section class="industry__section">` whose h2 reads `heading`. */
const section = (html: string, heading: string): string | undefined =>
  [...html.matchAll(/<section[^>]*class="industry__section"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => m[1]).find((s) => text(s.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '') === heading);

before(() => {
  for (const i of SEVEN) HTML.set(`industries/${i.slug}/index.html`, read(`industries/${i.slug}/index.html`));
  HTML.set('industries/index.html', read('industries/index.html'));
});

test('the written list and the site agree: seven pages, seven entries', () => {
  assert.deepEqual([...SITE_ORDER].sort(), SEVEN.map((i) => i.slug).sort());
  assert.deepEqual(SEVEN_PAGES.map((p) => p.slug), SEVEN.map((i) => i.slug));
  assert.deepEqual(SEVEN_PAGES.map((p) => p.name), SEVEN.map((i) => i.name));
});

test('D8(а) no outcome word on the seven pages or the hub: title, meta, markup and visible text, the example conversation cut out', () => {
  const offenders: string[] = [];
  for (const [rel, html] of HTML) {
    const hits = withoutConversations(html).match(OUTCOME_WORDS) ?? [];
    if (hits.length) offenders.push(`${rel}: ${hits.length} (${[...new Set(hits.map((h) => h.toLowerCase()))].join(', ')})`);
  }
  assert.deepEqual(offenders, []);
});

test('D8(б) the title and the H1 follow the template, once, and the title fits in 60 characters', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const html = page(p.slug);
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
    if (title !== `AI booking widget for ${p.audience} — Typelessity`) bad.push(`${p.slug}: title «${title}»`);
    if (title.length > 60) bad.push(`${p.slug}: title is ${title.length} characters`);
    if (meta(html, 'property', 'og:title') !== `AI booking widget for ${p.audience}`) bad.push(`${p.slug}: og:title «${meta(html, 'property', 'og:title')}»`);
    const heads = h1s(html);
    if (heads.length !== 1 || heads[0] !== `AI booking assistant for ${p.audience}`) bad.push(`${p.slug}: H1 ${JSON.stringify(heads)}`);
  }
  assert.deepEqual(bad, []);
});

test('D8(в) the description is the written one in meta, Open Graph, Twitter and the Service markup; the seven differ and fit in 155 characters; the capsules differ', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const html = page(p.slug);
    for (const [kind, got] of [['description', meta(html, 'name', 'description')], ['og:description', meta(html, 'property', 'og:description')], ['twitter:description', meta(html, 'name', 'twitter:description')]] as const) {
      if (got !== p.description) bad.push(`${p.slug}: ${kind} «${got}»`);
    }
    if (p.description.length > 155) bad.push(`${p.slug}: description of ${p.description.length} characters`);
    const service = jsonLd(html).find((n) => n['@type'] === 'Service');
    if (!service || service['description'] !== p.description) bad.push(`${p.slug}: Service description ${JSON.stringify(service?.['description'])}`);
  }
  assert.deepEqual(bad, []);
  assert.equal(new Set(SEVEN_PAGES.map((p) => p.description)).size, 7, 'two pages share a description');
  const capsules = SEVEN_PAGES.map((p) => text(page(p.slug).match(/<p[^>]*class="industry__sub"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''));
  assert.equal(new Set(capsules).size, 7, 'two pages share a capsule');
  SEVEN_PAGES.forEach((p, i) => assert.ok(capsules[i].startsWith(p.capsuleStart), `${p.slug}: the capsule starts «${capsules[i].slice(0, 90)}»`));
});

test('D1 the bubble is a real customer sentence on four pages and absent on the others', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const html = page(p.slug);
    const bubbles = [...html.matchAll(/<p[^>]*class="industry__quote"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => text(m[1]));
    const want = p.quote === null ? [] : [`“${p.quote}”`];
    if (JSON.stringify(bubbles) !== JSON.stringify(want)) bad.push(`${p.slug}: ${JSON.stringify(bubbles)} instead of ${JSON.stringify(want)}`);
  }
  assert.deepEqual(bad, []);
});

test('D3/D4 the five deep pages carry what gets in the way and three or four questions; the two plain pages carry neither', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const html = page(p.slug);
    const way = section(html, 'What gets in the way');
    const items = way ? [...way.matchAll(/<li[\s>]/g)].length : 0;
    const faq = section(html, 'FAQ');
    const questions = faq ? [...faq.matchAll(/<details[\s>]/g)].length : 0;
    if (p.deep) {
      if (items < 2 || items > 3) bad.push(`${p.slug}: ${items} items under «What gets in the way»`);
      if (questions < 3 || questions > 4) bad.push(`${p.slug}: ${questions} questions`);
      const asks = (faq?.match(/<summary[^>]*>([\s\S]*?)<\/summary>/g) ?? []).map((s) => text(s));
      if (!asks.some((q) => /^Does it work with the booking system my .+ already uses\?$/.test(q))) bad.push(`${p.slug}: no question about the booking system already in use`);
      if (!asks.some((q) => /^Can .+ write in their own language\?$/.test(q))) bad.push(`${p.slug}: no question about the language`);
    } else {
      if (way) bad.push(`${p.slug}: «What gets in the way» on a plain page`);
      if (faq) bad.push(`${p.slug}: a FAQ on a plain page`);
    }
  }
  assert.deepEqual(bad, []);
});

test('D4 «the example above is in <language>» is said exactly when the example is not in English, and names that language', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const faq = text(section(page(p.slug), 'FAQ') ?? '');
    const said = [...faq.matchAll(/the example above is in (\w+)/gi)].map((m) => m[1]);
    const want = p.exampleLang === 'en' ? [] : [LANGUAGE_NAMES[p.exampleLang]];
    const lang = page(p.slug).match(/<span[^>]*class="conv__lang"[^>]*>([^<]*)</)?.[1].trim();
    if (lang !== p.exampleLang) bad.push(`${p.slug}: the page shows the example in «${lang}», expected ${p.exampleLang}`);
    if (p.deep && JSON.stringify(said) !== JSON.stringify(want)) bad.push(`${p.slug}: says ${JSON.stringify(said)}, expected ${JSON.stringify(want)}`);
    if (!p.deep && said.length) bad.push(`${p.slug}: says ${JSON.stringify(said)} without a FAQ`);
  }
  assert.deepEqual(bad, []);
});

test('D4 only the salon answers «Is it an AI receptionist?», and the answer says it takes no calls', () => {
  for (const p of SEVEN_PAGES) {
    const faq = section(page(p.slug), 'FAQ') ?? '';
    const asked = /Is it an AI receptionist\?/.test(text(faq));
    assert.equal(asked, p.slug === 'beauty-hair-salons', `${p.slug}: the receptionist question is ${asked ? 'there' : 'missing'}`);
  }
  const salon = text(section(page('beauty-hair-salons'), 'FAQ')!);
  assert.match(salon, /Is it an AI receptionist\? No\. It does not take phone calls: it takes booking requests in a chat on your website\./);
});

test('D5 the article of the trade, /how-it-works, the install page and the price page are linked from each page', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const main = page(p.slug).match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? page(p.slug);
    const hrefs = [...main.matchAll(/href="([^"#]*)[^"]*"/g)].map((m) => m[1]);
    for (const want of [`/blog/${p.article.slug}`, '/how-it-works', '/install', '/pricing']) if (!hrefs.includes(want)) bad.push(`${p.slug}: no link to ${want}`);
    if (hrefs.filter((h) => h.startsWith('/blog/')).length !== 1) bad.push(`${p.slug}: ${hrefs.filter((h) => h.startsWith('/blog/')).length} article links`);
  }
  assert.deepEqual(bad, []);
});

test('D7 the neighbours are the other six, by name, in the order the hub lists them; no hub, no retired address, not the page itself', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const other = section(page(p.slug), 'Other industries');
    if (!other) { bad.push(`${p.slug}: no «Other industries»`); continue; }
    const links = [...other.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [m[1], text(m[2])]);
    const want = SITE_ORDER.filter((slug) => slug !== p.slug).map((slug) => [`/industries/${slug}`, SEVEN.find((i) => i.slug === slug)!.name]);
    if (JSON.stringify(links) !== JSON.stringify(want)) bad.push(`${p.slug}: ${JSON.stringify(links)}`);
    if (page(p.slug).includes('← All industries')) bad.push(`${p.slug}: still has the link back to the hub`);
  }
  assert.deepEqual(bad, []);
});

test('D6 no page links to a demo website until the widget is on it; no demo section', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const html = page(p.slug);
    for (const host of DEMO_HOSTS) if (html.includes(host)) bad.push(`${p.slug}: links to ${host}`);
    if (section(html, 'Try it on a demo website')) bad.push(`${p.slug}: a demo section`);
  }
  assert.deepEqual(bad, []);
});

test('D3 the breadcrumb markup is Home → the trade, without the hub, as in the mock', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const crumbs = jsonLd(page(p.slug)).find((n) => n['@type'] === 'BreadcrumbList');
    const items = ((crumbs?.['itemListElement'] ?? []) as Record<string, unknown>[]).map((it) => String(it['name']));
    if (JSON.stringify(items) !== JSON.stringify(['Home', p.name])) bad.push(`${p.slug}: ${JSON.stringify(items)}`);
  }
  assert.deepEqual(bad, []);
});

test('D9 the hub no longer says «configured for»', () => {
  const hub = text(HTML.get('industries/index.html')!);
  assert.ok(hub.includes('Each one has its own setup, without forms.'), 'the new sentence is missing');
  assert.ok(!/configured for/i.test(hub));
});

// L9 (card D9, class «к»): the words of the «Read next» link on each page are the <h1> of the article it points to, taken from the
// built article page — a title changed in the article and left in lib/industries (three literals) goes red here.
test('L9(к) the «Read next» link text on each industry page is the h1 of the article it opens', () => {
  const bad: string[] = [];
  for (const p of SEVEN_PAGES) {
    const html = page(p.slug);
    const anchor = html.match(new RegExp(`<a[^>]*href="/blog/${p.article.slug}"[^>]*>([\\s\\S]*?)</a>`));
    const article = h1s(read(`blog/${p.article.slug}/index.html`))[0];
    if (!article) { bad.push(`${p.slug}: the article page has no h1`); continue; }
    if (!anchor) { bad.push(`${p.slug}: no link to /blog/${p.article.slug}`); continue; }
    const words = text(anchor[1]);
    if (words !== article) bad.push(`${p.slug}: link says «${words}», the article h1 is «${article}»`);
  }
  assert.deepEqual(bad, []);
});
