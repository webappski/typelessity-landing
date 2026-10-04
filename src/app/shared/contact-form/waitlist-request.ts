// The body the question form POSTs to /api/contact. Kept free of Angular so the endpoint test
// sends exactly what the form sends — the pilot-shaped test fixture hid a 400 on every request
// (A36, 2026-09-25). `type: 'waitlist_request'` is the protocol name the endpoint switches on; it
// is not shown to anyone — the letter and its subject say «Question» (c8, 2026-10-03).

export interface WaitlistPayload {
  email: string;
  website?: string;
  /** Empty when the visitor has only a question: no plan is chosen. */
  plan: string;
  industry?: string;
  message?: string;
  /** The box beside the privacy notice. The form cannot be sent without it, and the endpoint refuses a body without it. */
  consent: boolean;
}

export function waitlistRequestBody(model: WaitlistPayload) {
  return {
    ...model,
    type: 'waitlist_request',
    product: 'typelessity',
    source: 'typelessity-question-form',
  } as const;
}
