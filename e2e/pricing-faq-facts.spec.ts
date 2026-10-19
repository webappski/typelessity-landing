import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// L6 seam guard (R67 п.3): the prices, the request limits, the number of sites, the languages, the phone widths and the
// encryption that /pricing and /faq print are READ from the code of the product (~/Projects/typelessity, or TY_PRODUCT_ROOT),
// not typed here. They are compared with the built pages dist/typelessity-landing/browser/{pricing,faq}/index.html.
// A missing source FAILS with a text, it never skips (the way e2e/browser/global-setup.ts does it): a cloud session with
// no clone has a red run, by design (FL-26). Run `npm run build` first. LANDING_DIST points at another copy of dist
// (the mutation run). Design: pending-review/2026-10-19/L6/card.md D9.

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
const DIST = process.env['LANDING_DIST'] ?? join(process.cwd(), 'dist', 'typelessity-landing', 'browser');

function product(rel: string): string {
  const file = join(PRODUCT_ROOT, rel);
  assert.ok(existsSync(file), `нет исходника продукта: ${file}; задай TY_PRODUCT_ROOT или клонируй репозиторий`);
  return readFileSync(file, 'utf8');
}

const decode = (s: string) =>
  s.replace(/&#38;|&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8209;/g, '-');

function html(rel: string): string {
  const file = join(DIST, rel);
  assert.ok(existsSync(file), `${file} missing — run \`npm run build\` before this check`);
  return readFileSync(file, 'utf8');
}
/** the text a visitor reads: tags, scripts and styles out */
function text(rel: string): string {
  return decode(html(rel).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
}
const main = (rel: string) => html(rel).match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '';
const mainText = (rel: string) => decode(main(rel).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

interface Tier { key: string; name: string; price: number; calls: number; domains: number }
// product key → the name the site sells it under (the product calls the free tier «Pilot»; the site says «Free Pilot»)
const SITE_NAME: Record<string, string> = { free: 'Free Pilot', starter: 'Starter', professional: 'Pro', enterprise: 'Enterprise' };

function tiers(): Tier[] {
  const src = product('packages/api/src/lib/developer-tiers.ts');
  const limits = src.match(/TIER_LIMITS\s*=\s*\{([\s\S]*?)\}\s*as const/)?.[1] ?? '';
  const display = src.match(/TIER_DISPLAY[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? '';
  const out: Tier[] = [];
  for (const m of limits.matchAll(/(\w+):\s*\{\s*monthlyCallLimit:\s*(\d+),[^}]*maxDomains:\s*(\d+)/g)) {
    const price = display.match(new RegExp(`${m[1]}:\\s*\\{[^}]*price:\\s*(\\d+)`))?.[1];
    assert.ok(price !== undefined, `TIER_DISPLAY has no price for ${m[1]} — the product changed its file, fix this guard`);
    out.push({ key: m[1]!, name: SITE_NAME[m[1]!] ?? m[1]!, price: Number(price), calls: Number(m[2]), domains: Number(m[3]) });
  }
  assert.deepEqual(out.map((t) => t.key), ['free', 'starter', 'professional', 'enterprise'], 'the product changed its list of tiers — read the new list and fix /pricing');
  return out;
}
const fmt = (n: number) => n.toLocaleString('en-US');
const sites = (d: number) => (d === 0 ? 'Unlimited sites' : d === 1 ? '1 site' : `Up to ${d} sites`);

/** the markup of one tier card, found by its name */
function card(rel: string, name: string): string {
  const cards = [...html(rel).matchAll(/<article\b[^>]*class="[^"]*\btier\b[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);
  const hit = cards.find((c) => new RegExp(`class="tier__name"[^>]*>\\s*${name}\\s*<`).test(c));
  assert.ok(hit, `/pricing has no tier card named ${name}`);
  return hit!;
}
const plain = (s: string) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

test('every tier card on /pricing says the price, the booking requests a month and the sites of the product', () => {
  for (const t of tiers()) {
    const c = plain(card('pricing/index.html', t.name));
    assert.ok(new RegExp(`€${t.price}(?![\\d.,])`).test(c), `${t.name}: the card does not say €${t.price}`);
    assert.ok(c.includes(`Up to ${fmt(t.calls)} booking requests a month`), `${t.name}: the card does not say «Up to ${fmt(t.calls)} booking requests a month»`);
    assert.ok(c.includes(sites(t.domains)), `${t.name}: the card does not say «${sites(t.domains)}»`);
    const raw = card('pricing/index.html', t.name);
    if (t.price > 0) assert.ok(/class="tier__period"[^>]*>\s*\/\s*month/.test(raw), `${t.name}: a paid tier shows «/ month»`);
    else assert.ok(!/tier__period/.test(raw), `${t.name}: the free tier shows no period`);
  }
});

test('no price or request count on /pricing and /faq is a number the product does not have', () => {
  const ts = tiers();
  const prices = new Set(ts.map((t) => String(t.price)));
  const counts = new Set(ts.map((t) => fmt(t.calls)).concat(ts.map((t) => String(t.calls))));
  const sitesN = new Set(ts.filter((t) => t.domains > 0).map((t) => String(t.domains)));
  const bad: string[] = [];
  for (const rel of ['pricing/index.html', 'faq/index.html']) {
    const t = mainText(rel);
    for (const m of t.matchAll(/€\s?(\d[\d,]*)/g)) if (!prices.has(m[1]!.replace(/,$/, ''))) bad.push(`${rel}: €${m[1]}`);
    for (const m of t.matchAll(/(\d[\d,]*)\s+booking requests/g)) if (!counts.has(m[1]!)) bad.push(`${rel}: ${m[1]} booking requests`);
    for (const m of t.matchAll(/[Uu]p to (\d+) sites/g)) if (!sitesN.has(m[1]!)) bad.push(`${rel}: up to ${m[1]} sites`);
  }
  assert.deepEqual(bad, []);
});

test('the <title> and description of /pricing carry the lowest paid and the highest price of the product', () => {
  const ts = tiers();
  const paid = ts.filter((t) => t.price > 0).map((t) => t.price);
  const h = html('pricing/index.html');
  const title = decode(h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const description = decode(h.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  assert.ok(title.includes(`€${Math.min(...paid)}–€${Math.max(...paid)}`), `the title of /pricing does not say €${Math.min(...paid)}–€${Math.max(...paid)}: ${title}`);
  for (const t of ts) assert.ok(description.includes(`€${t.price}`), `the description of /pricing does not say €${t.price}`);
});

test('the languages /faq lists are the 25 locales of the product', () => {
  const src = product('packages/shared/src/i18n/types.ts');
  const locales = (src.match(/SUPPORTED_LOCALES\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '').match(/'[a-z-]+'/g) ?? [];
  assert.equal(locales.length, 25, 'the product no longer has 25 chat locales — fix /faq, /pricing and the landing');
  const answer = faqAnswer('Which languages does the chat speak?');
  assert.ok(answer.includes('25 languages'), 'the answer does not say «25 languages»');
  const list = answer.match(/25 languages: (.*?)\. The assistant/)?.[1]?.split(', ') ?? [];
  assert.equal(list.length, 25, `the answer lists ${list.length} languages, want ${locales.length}`);
  assert.ok(!/25\+|Arabic|Hebrew|Korean|Chinese/.test(answer), 'the answer names a language the chat window does not have');
});

function faqAnswer(question: string): string {
  const items = [...html('faq/index.html').matchAll(/<details\b[\s\S]*?<\/details>/g)].map((m) => plain(m[0]));
  const hit = items.find((i) => i.startsWith(question));
  assert.ok(hit, `/faq has no question «${question}»`);
  return hit!.slice(question.length).trim();
}

test('the phone answer is only what the widget code says: 520 px and 380 px, its own voice settings, no «Yes»', () => {
  const css = product('packages/widget/src/components/widget.styles.ts');
  assert.ok(/max-width:\s*520px/.test(css) && /max-width:\s*380px/.test(css), 'the widget no longer has the 520 px and 380 px breakpoints — fix the answer');
  const answer = faqAnswer('Does it work on phones?');
  assert.ok(!/^\s*Yes\b/i.test(answer), 'the phone answer starts with «Yes»: nobody has tested it on a phone');
  assert.ok(answer.includes('520 px') && answer.includes('380 px'), 'the phone answer does not name 520 px and 380 px');
  assert.ok(/iPhone and Safari/.test(answer), 'the phone answer does not name iPhone and Safari');
  assert.ok(!/fits the width|Try the demo on your phone/i.test(answer), 'the phone answer claims what is still open (FL-19)');
});

test('/faq names the encryption the product uses, and not the ones it has not checked', () => {
  const enc = product('packages/api/src/lib/encryption.ts');
  assert.ok(/aes-256-gcm/i.test(enc), 'the product no longer encrypts with AES-256-GCM — fix the answer');
  assert.ok(faqAnswer('Is stored data encrypted?').includes('AES-256-GCM'), 'the answer does not say AES-256-GCM');
  for (const rel of ['pricing/index.html', 'faq/index.html']) {
    const t = text(rel);
    assert.ok(!/encrypted at rest/i.test(t), `${rel} says «encrypted at rest»: not checked`);
    assert.ok(!/\bTLS\b/.test(t), `${rel} says «TLS»: not checked`);
  }
});
