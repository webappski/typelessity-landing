import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ALL_INDUSTRIES } from '../src/app/lib/industries';

// A45e (c8 2026-10-03; legal verdict B1, Art. 13 and Art. 28 document identity):
//  - every «Terms» link on the landing led to the TypelessForm Terms of Service, and every «Privacy» link to a
//    policy whose scope is TypelessForm end users. Typelessity's own Terms (terms-typelessity, version 2026-09-25)
//    are published, so that is where «Terms» goes. There is no Typelessity privacy policy yet: the page-wide link
//    goes to the Typelessity DPA, labelled for what it is («Data processing (DPA)»);
//  - the question form on /pricing sends the visitor's email, website, plan, industry and message by Resend to
//    info@webappski.com, and no notice covered that. The notice now sits in the form, above the box that gives
//    consent, and says who, why, on what basis, to whom, how long, which rights, which authority;
//  - judge r2 (2026-10-04, Art. 13 against the WP260 privacy-notice list): the notice names where a copy of the safeguards
//    can be had (13(1)(f)), says that withdrawing consent does not undo the earlier processing (13(2)(c)), names the mail
//    routing and mailbox providers instead of «our email hosting provider» (13(1)(e)), and no longer sends the visitor
//    to the DPA — a processor agreement for customers, where the operator is the processor — to learn who the controller is;
//  - founder 2026-10-05 (judge answer (a), option i): the controller is named as the canonical legal documents name her —
//    Victoria Isayeuskaya, sole proprietorship, address, VAT ID — and the retention is 12 months after the last message.
// This reads the prerendered pages and the llms files — what a visitor and a crawler receive. Run `npm run build` first.

const DIST = process.env['LANDING_DIST']
  ? pathToFileURL(`${process.env['LANDING_DIST']}/`)
  : new URL('../dist/typelessity-landing/browser/', import.meta.url);

async function walk(dir: URL, out: URL[] = []): Promise<URL[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await walk(url, out);
    else out.push(url);
  }
  return out;
}

const files = new Map<string, string>();
before(async () => {
  let all: URL[];
  try {
    all = await walk(DIST);
  } catch {
    throw new Error('dist/typelessity-landing/browser missing — run `npm run build` before this check.');
  }
  for (const f of all) {
    if (!/\.(html|txt|xml|js)$/.test(f.pathname) || f.pathname.endsWith('3rdpartylicenses.txt')) continue;
    files.set(f.pathname.slice(DIST.pathname.length), await readFile(f, 'utf8'));
  }
});

const TERMS = 'https://webappski.com/en/legal/terms-typelessity';
const DPA = 'https://webappski.com/en/legal/dpa-typelessity';

test('no page, llms file or bundle links the TypelessForm privacy policy or Terms of Service', () => {
  const offenders: string[] = [];
  for (const [path, body] of files) {
    if (/legal\/product-privacy/.test(body)) offenders.push(`${path}: legal/product-privacy (TypelessForm end-user policy)`);
    if (/webappski\.com\/en\/legal\/terms(?!-typelessity)/.test(body)) offenders.push(`${path}: legal/terms (TypelessForm Terms of Service)`);
  }
  assert.deepEqual(offenders, []);
});

test('the footer, on every prerendered page, leads «Terms» to the Typelessity Terms and the page-wide data link to the Typelessity DPA', () => {
  const pages = [...files].filter(([p]) => p.endsWith('index.html'));
  assert.ok(pages.length > 50);
  for (const [path, body] of pages) {
    const footer = body.match(/<footer[^>]*class="vc-footer"[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(footer, `${path}: no footer`);
    assert.ok(footer.includes(`href="${TERMS}"`), `${path}: «Terms» does not lead to ${TERMS}`);
    assert.match(footer, new RegExp(`<a[^>]*href="${DPA.replace(/[.\/]/g, '\\$&')}"[^>]*>\\s*Data processing \\(DPA\\)\\s*</a>`), `${path}: the DPA link lost its honest label`);
    assert.doesNotMatch(footer, />\s*Privacy\s*</, `${path}: a bare «Privacy» link points at a document that is not Typelessity's`);
  }
});

test('llms.txt and llms-full.txt print the Typelessity Terms and DPA, and point to the notice under the form', () => {
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const body = files.get(name)!;
    assert.ok(body.includes(TERMS), `${name} never prints ${TERMS}`);
    assert.ok(body.includes(DPA), `${name} never prints ${DPA}`);
    assert.match(body, /Privacy notice for the question form[^\n]*https:\/\/typelessity\.com\/pricing#start-pilot/, `${name} does not say where the form's privacy notice is`);
  }
});

test('the question form carries its Art. 13 notice, and the consent box is required and says what it consents to', () => {
  const html = files.get('pricing/index.html')!;
  const notice = html.match(/<div[^>]*class="cf__notice"[\s\S]*?<\/div>/)?.[0];
  assert.ok(notice, '/pricing has no privacy notice in the form');
  const text = notice.replace(/<[^>]+>/g, ' ').replace(/&#64;/g, '@').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
  const mustSay: Readonly<Record<string, RegExp>> = {
    'the controller, by the name of the canonical legal documents, with address and VAT ID': /Controller: Victoria Isayeuskaya, sole proprietorship \(jednoosobowa działalność gospodarcza\), the owner of webappski\.com, ul\. Staniszewskiego 19b, 81-603 Gdynia, Poland, VAT ID \(EU\): PL5862405795/,
    'a contact': /info@webappski\.com/,
    'the purpose': /only to answer your question/,
    'the legal basis': /your consent \(Art\. 6\(1\)\(a\) GDPR\)/,
    'withdrawal, and that it leaves earlier processing as it was': /withdraw it at any time by writing to info@webappski\.com; this does not affect processing before the withdrawal/,
    'the recipient': /Resend, which delivers the message \(United States, under Standard Contractual Clauses\)/,
    'the mail routing and mailbox providers': /our mail routing and mailbox providers, Cloudflare and Google \(United States\)/,
    'where a copy of the safeguards is available': /A copy of the safeguards is available from info@webappski\.com; see also Resend's DPA/,
    'the retention, a number and not «as long as needed»': /we keep the details you send \(email address, website, plan, industry and message\) until your question is answered and for 12 months after our last message, then delete them; if you withdraw consent we delete them sooner\. Resend keeps a delivery log for 30 days/,
    'the rights': /access, correction, erasure, restriction, portability and objection/,
    'the authority': /UODO/,
    'that giving the data is voluntary': /voluntary/,
    'no automated decisions': /No automated decisions/,
    'a date': /Notice of 5 October 2026/,
  };
  for (const [what, re] of Object.entries(mustSay)) assert.match(text, re, `the notice does not state ${what}`);
  assert.doesNotMatch(text, /operator named in the Typelessity DPA/, 'the notice sends the visitor to a processor agreement to learn who the controller is');
  assert.doesNotMatch(notice, /dpa-typelessity/, 'the notice links the Typelessity DPA, where the same person is the processor, not the controller');
  assert.match(notice, /href="https:\/\/resend\.com\/legal\/dpa"/, "the notice does not link Resend's DPA");
  assert.doesNotMatch(text, /as long as needed/, 'the retention is a period, not the generic formula');
  // Art. 13(2)(a): the retention covers what «Why» says is used — every field the form sends, not a subset (judge r2, c8 2026-10-05).
  const used = text.match(/we use the (.+?) you enter only to answer your question/)?.[1];
  const kept = text.match(/we keep the details you send \((.+?)\) until/)?.[1];
  assert.ok(used, 'the notice does not list what is used');
  assert.ok(kept, 'the notice does not list what is kept');
  assert.equal(kept, used, `the retention names «${kept}», the purpose names «${used}» — they must cover the same details`);

  const box = html.match(/<input[^>]*type="checkbox"[^>]*name="consent"[^>]*>/)?.[0] ?? '';
  assert.match(box, /required/, 'the consent box is not required');
  assert.match(html, /I agree that Webappski uses these details to answer my question, as set out in the privacy notice above/);
  assert.doesNotMatch(html, /Preferred Plan \*/, 'a plan is no longer required to ask a question');
});

test('nothing a visitor reads on /pricing calls the question form a waitlist', () => {
  const html = files.get('pricing/index.html')!;
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visible, /waitlist/i);
});

// CRO r2 (2026-10-04, R2-N1): the form's industry select was a waitlist-era list (Hospitality / Transfers / Freight) while the
// site has one page per industry and no Transfers or Freight. It is built from the pages; the browser spec checks the live DOM,
// this reads the bytes a crawler receives.
test('the industry select of the question form lists every industry page and «Other», and nothing from the waitlist era', () => {
  const html = files.get('pricing/index.html')!;
  const select = html.match(/<select[^>]*id="cf-industry"[\s\S]*?<\/select>/)?.[0];
  assert.ok(select, '/pricing has no industry select');
  const options = [...select.matchAll(/<option[^>]*\svalue="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((m) => ({ value: m[1], label: m[2].replace(/&amp;/g, '&').trim() }));
  const real = options.filter((o) => o.value && o.value !== 'other');
  assert.deepEqual(real.map((o) => o.value).sort(), ALL_INDUSTRIES.map((i) => i.slug).sort());
  assert.equal(options.filter((o) => o.value === 'other').length, 1, 'exactly one «Other»');
  assert.doesNotMatch(options.map((o) => o.label).join(' | '), /Transfers|Freight|Hospitality & Restaurants/);
});
