import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROLLER_SENTENCE, PRIVACY, PRIVACY_LAST_UPDATED } from './privacy.content';

// L13 (legal L-2, G-3): the notice for a visitor of the site names the controller, and the question form on /pricing names it too. One person, one
// string: when the requisites change (gate G-8) they change in both places, and this reads the two sources side by side, so a change in one is red.
const flat = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&#64;/g, '@').replace(/\s+/g, ' ').trim();

test('the controller on /privacy is the controller of the form notice on /pricing, word for word', () => {
  const form = flat(readFileSync('src/app/shared/contact-form/contact-form.component.ts', 'utf8'));
  assert.ok(form.includes(`${CONTROLLER_SENTENCE}.`), 'the form notice does not carry the controller sentence of /privacy');
});

test('the notice says what Art. 13 asks of a site that sets no analytics: who, what, basis, recipient, transfer, storage, rights, complaint', () => {
  const body = flat(PRIVACY.body);
  for (const part of ['Who runs this website', 'info@webappski.com', 'IP address', 'Art. 6(1)(f)', 'Vercel Inc.', 'Standard Contractual Clauses', 'Data Privacy Framework', 'ty-theme', 'access, correction, erasure, restriction, portability', 'UODO']) {
    assert.ok(body.includes(part), `the notice lost «${part}»`);
  }
});

test('the notice claims nothing it cannot back: no analytics, no seal, no residency, no log period it does not know', () => {
  const body = flat(PRIVACY.body);
  assert.doesNotMatch(body, /GDPR[- ](compliant|aligned)|hosted in the EU|runs in the EU|\b\d+ days\b|cookie banner/i);
  assert.ok(PRIVACY.seoTitle.length <= 60 && PRIVACY.description.length >= 70 && PRIVACY.description.length <= 160, 'title or description out of range');
});

// The round of judges (legal verdict F-1…F-6, 21.10): the sentences that were wrong are gone, the ones that replace them are there. A guard that only asks
// for the new sentence would stay green if the old, false one came back next to it.
test('the legal round: the host and the fonts, the log period, the right to object, Art. 13(2)(f), the pointer to /gdpr — and none of the sentences that were wrong', () => {
  const body = flat(PRIVACY.body);
  for (const part of [
    'sends no request to Google Fonts', // F-1
    'does not let your browser fetch fonts or stylesheets from Google',
    'kept for no longer than one day', // F-2 (the longest plan of the two the docs name: Hobby 1 hour, Pro 1 day)
    'only as long as it needs them for those purposes',
    'Your right to object', 'on grounds relating to your particular situation (GDPR Art. 21(1))', // F-3
    'loads by itself', 'your own answer to the demo\'s consent question', 'one display setting of the chat window stays in session storage until you close the tab', // F-5
    'No automated decisions are made about you on this website', // F-6
    'is described on [/gdpr](/gdpr)',
  ]) assert.ok(body.includes(part), `the notice lost «${part}»`);
  for (const wrong of ['and its fonts from our widget host', 'for the period its own terms set', 'while it plays']) assert.ok(!body.includes(wrong), `the notice says again what was wrong: «${wrong}»`);
});

test('«Your right to object» is its own paragraph, bold, not a seventh section', () => {
  assert.match(PRIVACY.body, /\n\n\*\*Your right to object\.\*\* /);
  assert.equal((PRIVACY.body.match(/^## /gm) ?? []).length, 6, 'six sections: who, host, browser, form, rights, other notices');
});

// L17 (legal L17-3, 22.10): the Webappski strip of the home page reads the address of the page the visitor came from and the utm_source of the link. The notice says so, and what
// it says is held against the code of the strip: the words «nothing is stored and nothing is sent to us» against the sources (no storage, no request), the marker against the
// addresses of the strip, «the browser sends no referrer» against the `rel` of both links. A sentence the code can contradict is only as good as the test that reads the code.
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const STRIP_DIRS = ['src/app/pages/home/pilot-offer', 'src/app/core/pilot-offer'];
const stripSources = (): Array<[string, string]> => STRIP_DIRS.flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => /\.(ts|html)$/.test(f) && !f.endsWith('.spec.ts')).map((f): [string, string] => [`${d}/${f}`, readFileSync(join(ROOT, d, f), 'utf8')]));

test('the notice says that the home page reads where the visitor came from, why, that nothing is stored or sent to us, and what the strip link carries', () => {
  const body = flat(PRIVACY.body);
  for (const part of [
    'On the home page, your browser checks the address of the page you came from and the utm_source in the link, only to choose which of two texts the Webappski strip shows',
    'nothing is stored and nothing is sent to us',
    'the link to webappski.com carries a campaign marker (utm_source=typelessity.com, utm_content=a, b, a-name or b-name)',
    'tells webappski.com whether you came from an AI assistant; the browser sends no referrer',
    'webappski.com is run by the same person',
  ]) assert.ok(body.includes(part), `the notice lost: ${part}`);
  // it stands in the section about the browser, after the sentence about the theme and before the demo
  const browser = PRIVACY.body.slice(PRIVACY.body.indexOf('## What stays in your browser'), PRIVACY.body.indexOf('## The question form'));
  assert.ok(browser.indexOf('(`ty-theme`)') < browser.indexOf('On the home page, your browser checks') && browser.indexOf('On the home page, your browser checks') < browser.indexOf('Once the page has painted'));
  assert.ok(PRIVACY_LAST_UPDATED >= '2026-10-22', `the notice is dated on or after the day of the paragraph: ${PRIVACY_LAST_UPDATED}`);
});

test('what the notice says about the strip is true of its code: it reads referrer and utm_source, stores nothing, sends nothing, and the links carry the marker it names, with no referrer', () => {
  const files = stripSources();
  assert.ok(files.length >= 4, 'the strip sources were found');
  const all = files.map(([, t]) => t).join('\n');
  assert.match(all, /document\.referrer|doc\.referrer/, 'it reads the referrer');
  assert.match(all, /utm_source/, 'it reads the utm_source');
  for (const [name, text] of files) {
    assert.doesNotMatch(text, /localStorage|sessionStorage|document\.cookie|\bfetch\(|XMLHttpRequest|sendBeacon|HttpClient/, `${name}: the notice says nothing is stored and nothing is sent`);
  }
  // the marker: the values of the notice are the values of the component
  const comp = readFileSync(join(ROOT, 'src/app/pages/home/pilot-offer/free-pilot-offer.component.ts'), 'utf8');
  assert.match(comp, /utm_source=typelessity\.com&utm_campaign=free-pilot&utm_medium=banner/);
  assert.match(comp, /utm_content=\$\{this\.source\(\)\.state\}`/, 'the button carries utm_content=a|b');
  assert.match(comp, /utm_content=\$\{this\.source\(\)\.state\}-name`/, 'the name link carries utm_content=a-name|b-name');
  // the browser sends no referrer: every link of the strip that leaves the site has noreferrer
  const html = readFileSync(join(ROOT, 'src/app/pages/home/pilot-offer/free-pilot-offer.component.html'), 'utf8');
  const links = [...html.matchAll(/<a\b[\s\S]*?>/g)].map((m) => m[0]);
  assert.equal(links.length, 2, 'two links: the name and the button');
  for (const l of links) assert.match(l, /rel="noopener noreferrer"/, `a link of the strip without noreferrer: ${l.slice(0, 80)}`);
});
