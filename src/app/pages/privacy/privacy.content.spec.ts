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
