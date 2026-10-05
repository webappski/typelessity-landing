// Vercel Function: POST /api/contact
// The only caller is the question form on /pricing (type 'waitlist_request' — the protocol name, never shown).
// Body: { type, email, consent: true, plan?, website?, industry?, message?, product?, source? }
// Side effect: one Resend email to the question mailbox. Nothing is stored: the form has no database behind it.
// Without RESEND_API_KEY: returns 503 with a clear "not configured" message so deploy succeeds and integration owners can wire it.
// Any other body — no type, another type — is refused: there is no other form.
// The body is checked before anything is read from it: a JSON object, every field a string, lengths bounded,
// `plan` and `industry` one of the values the form's selects offer. Any miss is a 400 and nothing is sent.

import { ALL_INDUSTRIES } from '../src/app/lib/industries';

interface ContactPayload {
  email?: string;
  industry?: string;
  message?: string;
  type?: string;
  website?: string;
  plan?: string;
  product?: string;
  source?: string;
  consent?: boolean;
}

interface ResendBody {
  from: string;
  to: string;
  subject: string;
  text: string;
  reply_to?: string;
}

// Fallbacks are addresses that work: typelessity.com has no MX record, so a request sent to
// hello@typelessity.com was never delivered, and it is not a domain verified in Resend, so Resend
// refuses it as a sender. webappski.com is verified in Resend (resend._domainkey + send.webappski.com)
// and info@webappski.com receives mail (Cloudflare Email Routing). Checked with dig, 2026-09-24.
export const FALLBACK_FROM = 'Typelessity <info@webappski.com>';
export const FALLBACK_TO = 'info@webappski.com';

/** Read per request, not at import, so the route follows the env the function actually runs with. */
export function mailRoute(env: Record<string, string | undefined> = process.env): { from: string; to: string } {
  const unset = (['CONTACT_FROM', 'CONTACT_TO'] as const).filter((k) => !env[k]);
  if (unset.length) {
    console.warn(`[contact] ${unset.join(' and ')} not set — sending via ${FALLBACK_TO}`);
  }
  return { from: env['CONTACT_FROM'] || FALLBACK_FROM, to: env['CONTACT_TO'] || FALLBACK_TO };
}

function bad(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function ok(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// The form's textarea and inputs carry the same numbers as maxlength (a guard in contact-endpoint.spec.ts keeps them equal).
// email: the longest address SMTP carries (RFC 5321, 254); website: the 2 KB a URL is safely given; the rest is what a question needs.
export const LIMITS = { email: 254, website: 2048, message: 5000, plan: 64, industry: 64, product: 64, source: 64 } as const;
// The <option> values of the plan select in contact-form.component.ts; '' is «just a question».
const PLANS: ReadonlySet<string> = new Set(['', 'starter', 'pro', 'enterprise']);
// The industry select is built from ALL_INDUSTRIES, plus «Other» and the empty choice.
const INDUSTRIES: ReadonlySet<string> = new Set(['', 'other', ...ALL_INDUSTRIES.map((i) => i.slug)]);

const TEXT_FIELDS = ['type', 'email', 'website', 'plan', 'industry', 'message', 'product', 'source'] as const;

/** The body as a ContactPayload, or the reason it is refused. Nothing reads a field before this has passed. */
function readPayload(raw: unknown): ContactPayload | string {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return 'Body must be a JSON object';
  const body = raw as Record<string, unknown>;
  for (const k of TEXT_FIELDS) {
    if (body[k] !== undefined && typeof body[k] !== 'string') return `${k} must be a string`;
  }
  if (body['type'] !== 'waitlist_request') return 'Unknown request type';
  for (const k of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    if (((body[k] as string | undefined) ?? '').length > LIMITS[k]) return `${k} is too long`;
  }
  if (!PLANS.has((body['plan'] as string | undefined) ?? '')) return 'Unknown plan';
  if (!INDUSTRIES.has((body['industry'] as string | undefined) ?? '')) return 'Unknown industry';
  return body as ContactPayload;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return bad('Method not allowed', 405);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad('Invalid JSON');
  }

  const body = readPayload(raw);
  if (typeof body === 'string') return bad(body);
  return waitlist(body);
}

// The question form asks for an email address and the visitor's consent; a plan is optional (a
// visitor may only have a question). It is emailed, not stored.
async function waitlist(body: ContactPayload): Promise<Response> {
  const email = (body.email ?? '').trim();
  const plan = (body.plan ?? '').trim();
  if (!email || !isEmail(email)) return bad('Valid email is required');
  // The privacy notice under the form says the data is used on the visitor's consent. The form
  // cannot be sent without the box, and a body that carries no consent is refused here too.
  if (body.consent !== true) return bad('Consent is required');

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return bad('Contact endpoint is not configured (missing RESEND_API_KEY)', 503);
  }

  const field = (v: string | undefined) => (v ?? '').trim() || '—';
  const message = (body.message ?? '').trim();
  const text = [
    `New question from typelessity.com`,
    ``,
    `Email:    ${email}`,
    `Plan:     ${plan || 'no plan chosen'}`,
    `Website:  ${field(body.website)}`,
    `Industry: ${field(body.industry)}`,
    `Product:  ${field(body.product)}`,
    `Source:   ${field(body.source)}`,
    `Consent:  given on the form, box ticked next to the privacy notice of 5 October 2026`,
    message ? `\n${message}` : '',
  ].join('\n');

  const { from, to } = mailRoute();
  const payload: ResendBody = { from, to, subject: `[Question] ${plan || 'no plan'}`, text, reply_to: email };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`resend ${r.status}`);
    return ok();
  } catch {
    return bad('Submission failed', 502);
  }
}

export const config = { runtime: 'edge' };
