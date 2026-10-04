import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// A45e (c8 2026-10-03; legal verdict B1, Art. 13 and Art. 28 document identity):
//  - every «Terms» link on the landing led to the TypelessForm Terms of Service, and every «Privacy» link to a
//    policy whose scope is TypelessForm end users. Typelessity's own Terms (terms-typelessity, version 2026-09-25)
//    are published, so that is where «Terms» goes. There is no Typelessity privacy policy yet: the page-wide link
//    goes to the Typelessity DPA, labelled for what it is («Data processing (DPA)»);
//  - the question form on /pricing sends the visitor's email, website, plan, industry and message by Resend to
//    info@webappski.com, and no notice covered that. The notice now sits in the form, above the box that gives
//    consent, and says who, why, on what basis, to whom, how long, which rights, which authority.
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
  const text = notice.replace(/<[^>]+>/g, ' ').replace(/&#64;/g, '@').replace(/\s+/g, ' ');
  const mustSay: Readonly<Record<string, RegExp>> = {
    'the controller': /Controller: Webappski, ul\. Staniszewskiego 19b, 81-603 Gdynia, Poland/,
    'a contact': /info@webappski\.com/,
    'the purpose': /only to answer your question/,
    'the legal basis': /your consent \(Art\. 6\(1\)\(a\) GDPR\)/,
    'withdrawal': /withdraw it at any time/,
    'the recipient': /Resend, which delivers the message \(United States, under Standard Contractual Clauses\)/,
    'the retention': /as long as needed to deal with your question; Resend keeps a delivery log for 30 days/,
    'the rights': /access, correction, erasure, restriction, portability and objection/,
    'the authority': /UODO/,
    'that giving the data is voluntary': /voluntary/,
    'no automated decisions': /No automated decisions/,
    'a date': /Notice of 3 October 2026/,
  };
  for (const [what, re] of Object.entries(mustSay)) assert.match(text, re, `the notice does not state ${what}`);
  assert.doesNotMatch(text, /Victoria|Isayeuskaya/, 'the legal name belongs in the canonical legal documents, not on this page (the notice links the DPA that names it)');

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
