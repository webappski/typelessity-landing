import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import handler, { FALLBACK_FROM, FALLBACK_TO, LIMITS } from '../../../../api/contact';
import { ALL_INDUSTRIES } from '../../lib/industries';
import { waitlistRequestBody } from './waitlist-request';

// A36 (c8, 2026-09-24): with CONTACT_TO unset the form mailed hello@typelessity.com, a domain
// with no MX record — every request was lost. The real handler runs here; only the network is stubbed.
//
// The body below is built by the same function the form posts with, so a drift between them shows up here.
// (The protocol name `waitlist_request` stays; nothing visitor- or owner-facing says «waitlist» any more — c8 2026-10-03.)
const WAITLIST = waitlistRequestBody({
  email: 'owner@clinic.example',
  website: 'https://clinic.example',
  plan: 'starter',
  industry: ALL_INDUSTRIES[0].slug,
  message: 'Two locations, about 300 bookings a month.',
  consent: true,
});

async function submit(env: Record<string, string | undefined>, body: unknown = WAITLIST) {
  const saved = { ...process.env };
  const sent: { url: string; body: Record<string, unknown> }[] = [];
  const warnings: string[] = [];
  const realFetch = globalThis.fetch;
  const realWarn = console.warn;
  for (const k of ['CONTACT_FROM', 'CONTACT_TO', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']) delete process.env[k];
  Object.assign(process.env, { RESEND_API_KEY: 're_test' }, env);
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init.body)) });
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  console.warn = (msg: string) => { warnings.push(msg); };
  try {
    const res = await handler(new Request('https://typelessity.com/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    }));
    return { status: res.status, sent, warnings };
  } finally {
    globalThis.fetch = realFetch;
    console.warn = realWarn;
    process.env = saved;
  }
}

test('contact: with CONTACT_* unset the request goes to a mailbox that exists, from a Resend-verified domain', async () => {
  const { status, sent, warnings } = await submit({});
  assert.equal(status, 200);
  const mail = sent.find((s) => s.url === 'https://api.resend.com/emails');
  assert.ok(mail, 'the request must be emailed');
  assert.equal(mail.body['to'], FALLBACK_TO);
  assert.equal(mail.body['to'], 'info@webappski.com');
  assert.match(String(mail.body['from']), /@webappski\.com>$/);
  assert.equal(mail.body['reply_to'], WAITLIST.email);
  assert.ok(!/typelessity\.com/.test(`${FALLBACK_FROM} ${FALLBACK_TO}`), 'typelessity.com receives and sends no mail');
  assert.equal(warnings.length, 1, 'exactly one log line says the env is missing');
  assert.match(warnings[0], /CONTACT_FROM and CONTACT_TO not set/);
});

test('contact: configured CONTACT_* are used as they are, with no warning', async () => {
  const { sent, warnings } = await submit({ CONTACT_FROM: 'Pilot <pilot@webappski.com>', CONTACT_TO: 'sales@example.com' });
  const mail = sent.find((s) => s.url === 'https://api.resend.com/emails');
  assert.equal(mail?.body['to'], 'sales@example.com');
  assert.equal(mail?.body['from'], 'Pilot <pilot@webappski.com>');
  assert.equal(warnings.length, 0);
});

// A36 (2026-09-25): the question form is the only caller of /api/contact, and the pilot-only
// validation answered every request with 400 «Company is required».
test('question form: the body the form sends is emailed as a question', async () => {
  const { status, sent } = await submit({}, WAITLIST);
  assert.equal(status, 200);
  assert.equal(sent.length, 1, 'waitlist requests are emailed only, never written to the pilot leads table');
  const mail = sent[0];
  assert.equal(mail.url, 'https://api.resend.com/emails');
  assert.equal(mail.body['subject'], '[Question] starter');
  assert.equal(mail.body['reply_to'], WAITLIST.email);
  const text = String(mail.body['text']);
  for (const value of [WAITLIST.email, WAITLIST.website, WAITLIST.industry, WAITLIST.message, WAITLIST.product, WAITLIST.source]) {
    assert.ok(text.includes(String(value)), `the email must carry ${value}`);
  }
  assert.ok(!/Pilot/.test(`${mail.body['subject']} ${text}`), 'a question is not labelled as a pilot signup');
  assert.ok(!/waitlist/i.test(`${mail.body['subject']} ${text}`), 'the letter does not call the request a waitlist entry');
  assert.match(text, /^New question from typelessity\.com/);
  assert.match(text, /Consent:\s+given on the form/, 'the letter records that the box was ticked');
  // The letter names the version of the notice the visitor saw (Art. 7(1): the consent can be shown). The date lives in
  // the form's template and here; they must say the same day.
  const noticeDate = readFileSync(new URL('./contact-form.component.ts', import.meta.url), 'utf8').match(/Notice of (\d{1,2} \w+ \d{4})/)?.[1];
  assert.ok(noticeDate, 'the form carries no «Notice of <date>» line');
  assert.ok(text.includes(`privacy notice of ${noticeDate}`), `the letter names a notice other than the form's («Notice of ${noticeDate}»)`);
});

test('question form: without RESEND_API_KEY the endpoint answers 503 and sends nothing', async () => {
  const { status, sent } = await submit({ RESEND_API_KEY: undefined }, WAITLIST);
  assert.equal(status, 503);
  assert.equal(sent.length, 0);
});

test('question form: an email address and the consent are required — a plan is not', async () => {
  const noEmail = await submit({}, { ...WAITLIST, email: '' });
  assert.equal(noEmail.status, 400, 'without an email the request is refused');
  assert.equal(noEmail.sent.length, 0);

  // The box beside the privacy notice: a body without it — unticked, absent or not a boolean — sends nothing.
  for (const consent of [false, undefined, 'true', 1]) {
    const { status, sent } = await submit({}, { ...WAITLIST, consent });
    assert.equal(status, 400, `consent ${JSON.stringify(consent)} is refused`);
    assert.equal(sent.length, 0, 'nothing is emailed without consent');
  }

  const noPlan = await submit({}, { ...WAITLIST, plan: '' });
  assert.equal(noPlan.status, 200, 'a visitor with only a question needs no plan');
  assert.equal(noPlan.sent.length, 1);
  assert.equal(noPlan.sent[0].body['subject'], '[Question] no plan');
  assert.match(String(noPlan.sent[0].body['text']), /Plan:\s+no plan chosen/);
});

// F9 (judge r2, 2026-10-04): an older branch took a body without `type` — a pilot signup with a company and a
// monthly volume — emailed it and wrote it to Supabase `leads` with no consent check. No form posts it any more, so
// it is gone: a body that is not the question form is refused and nothing leaves the function.
test('a body that is not the question form is refused: no type, another type, a pilot-shaped body', async () => {
  const pilotShaped = { email: 'owner@clinic.example', company: 'Clinic', industry: 'Health', monthlyBookings: '100', consent: true };
  const noType = { ...WAITLIST, type: undefined };
  const otherType = { ...WAITLIST, type: 'pilot_signup' };
  for (const [what, body] of Object.entries({ pilotShaped, noType, otherType })) {
    const { status, sent } = await submit({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_KEY: 'service-key' }, body);
    assert.equal(status, 400, `${what} must be refused`);
    assert.equal(sent.length, 0, `${what}: nothing is emailed or stored`);
  }
});

// C1 (code-review r3, 2026-10-05): a body of `null` or a number in a field threw before any check and answered 500; a
// plan of 200k characters went into the subject line. The body is now checked as a whole before anything is read from it.
test('a body that is not a JSON object is refused: null, an array, a string, a number', async () => {
  for (const [what, body] of Object.entries({ null: null, array: [], 'array with the form body': [WAITLIST], string: 'waitlist_request', number: 42 })) {
    const { status, sent } = await submit({}, body);
    assert.equal(status, 400, `${what} must be refused, not crash`);
    assert.equal(sent.length, 0, `${what}: nothing is emailed`);
  }
});

test('a field that is not a string is refused: numbers, objects, arrays, null', async () => {
  const wrong: unknown[] = [42, true, { a: 1 }, ['x'], null];
  for (const field of ['email', 'website', 'plan', 'industry', 'message', 'product', 'source', 'type']) {
    for (const value of wrong) {
      const { status, sent } = await submit({}, { ...WAITLIST, [field]: value });
      assert.equal(status, 400, `${field}: ${JSON.stringify(value)} must be refused`);
      assert.equal(sent.length, 0, `${field}: ${JSON.stringify(value)} — nothing is emailed`);
    }
  }
});

test('lengths are bounded: one character over the limit is refused, the limit itself goes through', async () => {
  const fits = (field: keyof typeof LIMITS) =>
    field === 'email' ? `${'a'.repeat(LIMITS.email - '@b.co'.length)}@b.co` : 'x'.repeat(LIMITS[field]);
  for (const field of ['email', 'website', 'message', 'product', 'source'] as const) {
    const over = field === 'email' ? `a${fits(field)}` : `${fits(field)}x`;
    const refused = await submit({}, { ...WAITLIST, [field]: over });
    assert.equal(refused.status, 400, `${field} of ${over.length} characters must be refused (limit ${LIMITS[field]})`);
    assert.equal(refused.sent.length, 0);
    const accepted = await submit({}, { ...WAITLIST, [field]: fits(field) });
    assert.equal(accepted.status, 200, `${field} of exactly ${LIMITS[field]} characters must be accepted`);
  }
  const huge = await submit({}, { ...WAITLIST, plan: 'p'.repeat(200_000) });
  assert.equal(huge.status, 400, 'a plan of 200k characters must not reach the subject line');
  assert.equal(huge.sent.length, 0);
});

test('plan and industry must be values the form offers', async () => {
  for (const plan of ['platinum', 'STARTER', ' pro', 'starter\r\nBcc: x@y.z']) {
    const { status, sent } = await submit({}, { ...WAITLIST, plan });
    assert.equal(status, 400, `plan ${JSON.stringify(plan)} must be refused`);
    assert.equal(sent.length, 0);
  }
  for (const plan of ['', 'starter', 'pro', 'enterprise']) {
    assert.equal((await submit({}, { ...WAITLIST, plan })).status, 200, `plan ${JSON.stringify(plan)} is on the form`);
  }
  for (const industry of ['Hospitality', 'hospitality', 'Health', 'x'.repeat(65)]) {
    const { status, sent } = await submit({}, { ...WAITLIST, industry });
    assert.equal(status, 400, `industry ${JSON.stringify(industry)} is not a page of the site`);
    assert.equal(sent.length, 0);
  }
  for (const industry of ['', 'other', ...ALL_INDUSTRIES.map((i) => i.slug)]) {
    assert.equal((await submit({}, { ...WAITLIST, industry })).status, 200, `industry ${JSON.stringify(industry)} is on the form`);
  }
});

// The form must not let a visitor type what the endpoint then refuses: the inputs carry the endpoint's limits as maxlength.
test('the form fields carry the endpoint limits as maxlength', () => {
  const source = readFileSync(new URL('./contact-form.component.ts', import.meta.url), 'utf8');
  for (const [id, limit] of [['cf-email', LIMITS.email], ['cf-website', LIMITS.website], ['cf-message', LIMITS.message]] as const) {
    const tag = source.match(new RegExp(`<(?:input|textarea)[^>]*id="${id}"[^>]*>`))?.[0];
    assert.ok(tag, `no #${id} in the form`);
    assert.match(tag, new RegExp(`maxlength="${limit}"`), `#${id} does not carry maxlength="${limit}"`);
  }
});

// R2-W2: the form turns an address away at the field with the rule the endpoint applies, so nothing the form lets through is
// then answered with a 400. Both sides get the same addresses.
test('the email pattern of the form and the email rule of the endpoint accept and refuse the same addresses', async () => {
  const source = readFileSync(new URL('./contact-form.component.ts', import.meta.url), 'utf8');
  const pattern = source.match(/<input[^>]*id="cf-email"[^>]*\spattern="([^"]+)"/)?.[1];
  assert.ok(pattern, 'the email input carries no pattern');
  const form = new RegExp(`^(?:${pattern})$`); // what Angular's PatternValidator does with the attribute
  for (const address of ['abc', 'abc@def', 'a@b.co', 'a b@c.co', 'a@b .co', 'a@@b.co', '@b.co', 'a@.co', 'müller@müller.de', 'x+tag@sub.example.org']) {
    const server = (await submit({}, { ...WAITLIST, email: address })).status === 200;
    assert.equal(form.test(address), server, `«${address}»: the form says ${form.test(address)}, the endpoint says ${server}`);
  }
});
