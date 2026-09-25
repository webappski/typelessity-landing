// The body the waitlist form POSTs to /api/contact. Kept free of Angular so the endpoint test
// sends exactly what the form sends — the pilot-shaped test fixture hid a 400 on every waitlist
// request (A36, 2026-09-25).

export interface WaitlistPayload {
  email: string;
  website?: string;
  plan: string;
  industry?: string;
  message?: string;
}

export function waitlistRequestBody(model: WaitlistPayload) {
  return {
    ...model,
    type: 'waitlist_request',
    product: 'typelessity',
    source: 'typelessity-waitlist-form',
  } as const;
}
