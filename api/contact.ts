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
}

interface ResendBody {
  from: string;
  to: string;
  subject: string;
  text: string;
  reply_to?: string;
}

const FROM = process.env.CONTACT_FROM ?? 'Typelessity <hello@typelessity.com>';
const TO = process.env.CONTACT_TO ?? 'hello@typelessity.com';

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

    const payload: ResendBody = {
      from: FROM,
      to: TO,
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

export const config = { runtime: 'edge' };
