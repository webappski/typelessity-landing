import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONTROLLER_SENTENCE, PRIVACY } from './privacy.content';

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
