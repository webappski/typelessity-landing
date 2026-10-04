// Vercel Function: POST /api/contact
// Body: { email, company, industry, monthlyBookings, message? }
// Side effects: sends a Resend email (if RESEND_API_KEY) + inserts into Supabase leads (if SUPABASE_URL+SUPABASE_SERVICE_KEY).
// Without env vars: returns 503 with a clear "not configured" message so deploy succeeds and integration owners can wire it.

interface ContactPayload {
  email?: string;
  company?: string;
  industry?: string;
  monthlyBookings?: string;
  message?: string;
  // Question form (/pricing): type 'waitlist_request' (the protocol name — never shown), no company or volume.
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return bad('Method not allowed', 405);

  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return bad('Invalid JSON');
  }

  if (body.type === 'waitlist_request') return waitlist(body);

  const email = (body.email ?? '').trim();
  const company = (body.company ?? '').trim();
  const industry = (body.industry ?? '').trim();
  const monthlyBookings = (body.monthlyBookings ?? '').trim();
  const message = (body.message ?? '').trim();

  if (!email || !isEmail(email)) return bad('Valid email is required');
  if (!company) return bad('Company is required');
  if (!industry) return bad('Industry is required');
  if (!monthlyBookings) return bad('Monthly bookings volume is required');

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!RESEND_API_KEY && !(SUPABASE_URL && SUPABASE_SERVICE_KEY)) {
    return bad('Contact endpoint is not configured (missing RESEND_API_KEY and Supabase env vars)', 503);
  }

  const tasks: Promise<unknown>[] = [];

  if (RESEND_API_KEY) {
    const text = [
      `New Pilot signup`,
      ``,
      `Email:    ${email}`,
      `Company:  ${company}`,
      `Industry: ${industry}`,
      `Volume:   ${monthlyBookings}`,
      message ? `\n${message}` : '',
    ].join('\n');

    const { from, to } = mailRoute();
    const payload: ResendBody = {
      from,
      to,
      subject: `[Pilot] ${company} (${industry})`,
      text,
      reply_to: email,
    };

    tasks.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then((r) => {
        if (!r.ok) throw new Error(`resend ${r.status}`);
      }),
    );
  }

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    tasks.push(
      fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'content-type': 'application/json',
          'prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email,
          company,
          industry,
          monthly_bookings: monthlyBookings,
          message: message || null,
          source: 'pricing-form',
        }),
      }).then((r) => {
        if (!r.ok) throw new Error(`supabase ${r.status}`);
      }),
    );
  }

  try {
    await Promise.all(tasks);
    return ok();
  } catch {
    return bad('Submission failed', 502);
  }
}

// The question form asks for an email address and the visitor's consent; a plan is optional (a
// visitor may only have a question). It is emailed, not stored: the Supabase leads table is shaped
// for pilot requests.
async function waitlist(body: ContactPayload): Promise<Response> {
  const email = (body.email ?? '').trim();
  const plan = (body.plan ?? '').trim();
  if (!email || !isEmail(email)) return bad('Valid email is required');
  // The privacy notice under the form says the data is used on the visitor's consent. The form
  // cannot be sent without the box, and a request that did not come from the form is refused too.
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
    `Consent:  given on the form (box ticked next to the privacy notice)`,
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
