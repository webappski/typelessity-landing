import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { FALLBACK_FROM, FALLBACK_TO } from '../../../../api/contact';
import { waitlistRequestBody } from './waitlist-request';

// A36 (c8, 2026-09-24): with CONTACT_TO unset the pilot form mailed hello@typelessity.com, a domain
// with no MX record — every request was lost. The real handler runs here; only the network is stubbed.

const VALID = { email: 'owner@clinic.example', company: 'Clinic', industry: 'Health', monthlyBookings: '100' };

async function submit(env: Record<string, string | undefined>, body: object = VALID) {
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
  assert.equal(mail.body['reply_to'], VALID.email);
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

// A36 (2026-09-25): the waitlist form is the only caller of /api/contact, and the pilot-only
// validation answered every waitlist request with 400 «Company is required». The body below is
// built by the same function the form posts with, so a drift between them shows up here.
const WAITLIST = waitlistRequestBody({
  email: 'owner@clinic.example',
  website: 'https://clinic.example',
  plan: 'starter',
  industry: 'hospitality',
  message: 'Two locations, about 300 bookings a month.',
});

test('waitlist: the body the form sends is emailed as a waitlist request', async () => {
  const { status, sent } = await submit({}, WAITLIST);
  assert.equal(status, 200);
  assert.equal(sent.length, 1, 'waitlist requests are emailed only, never written to the pilot leads table');
  const mail = sent[0];
  assert.equal(mail.url, 'https://api.resend.com/emails');
  assert.equal(mail.body['subject'], '[Waitlist] starter');
  assert.equal(mail.body['reply_to'], WAITLIST.email);
  const text = String(mail.body['text']);
  for (const value of [WAITLIST.email, WAITLIST.website, WAITLIST.industry, WAITLIST.message, WAITLIST.product, WAITLIST.source]) {
    assert.ok(text.includes(String(value)), `the email must carry ${value}`);
  }
  assert.ok(!/Pilot/.test(`${mail.body['subject']} ${text}`), 'a waitlist request is not labelled as a pilot signup');
});

test('waitlist: without RESEND_API_KEY the endpoint answers 503 and sends nothing', async () => {
  const { status, sent } = await submit({ RESEND_API_KEY: undefined }, WAITLIST);
  assert.equal(status, 503);
  assert.equal(sent.length, 0);
});

test('waitlist: email and plan are required', async () => {
  for (const missing of ['email', 'plan'] as const) {
    const { status, sent } = await submit({}, { ...WAITLIST, [missing]: '' });
    assert.equal(status, 400, `without ${missing} the request is refused`);
    assert.equal(sent.length, 0);
  }
});
