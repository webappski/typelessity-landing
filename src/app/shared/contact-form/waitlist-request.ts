// The body the question form POSTs to /api/contact. Kept free of Angular so the endpoint test
// sends exactly what the form sends — the pilot-shaped test fixture hid a 400 on every request
// (A36, 2026-09-25). `type: 'waitlist_request'` is the protocol name the endpoint switches on; it
// is not shown to anyone — the letter and its subject say «Question» (c8, 2026-10-03).

/**
 * The one rule for an email address: something@something.something, no white space anywhere (`\s` — a space, a tab,
 * a no-break space, U+2028 …). The form binds it as the input's `pattern` and the endpoint anchors it, so what the form lets
 * through the endpoint accepts. Not Angular's `email` validator: it lets `a@b` through, which the endpoint refuses, and it
 * turns away `müller@müller.de`, which the endpoint takes. A string, not a RegExp, because the template binds it.
 */
export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[^\\s@]+';

/**
 * What the form's «Industry / Use Case» select offers: the value the endpoint receives and the words the visitor reads. The site has no
 * industry pages (L11, 2026-10-20), so the list lives here and nowhere else; the values are the ones the select has always sent, so a tab
 * opened before that release still sends a value the endpoint takes. The endpoint imports INDUSTRY_VALUES — one list, two readers.
 */
export const BUSINESS_TYPES = [
  { value: 'beauty-hair-salons', label: 'Hair and beauty salon' },
  { value: 'hospitality-restaurants', label: 'Restaurant' },
  { value: 'fitness-yoga-studios', label: 'Yoga or pilates studio' },
  { value: 'fitness-gyms', label: 'Gym or fitness centre' },
  { value: 'automotive-driving-schools', label: 'Driving school' },
  { value: 'automotive-repair', label: 'Auto repair shop' },
  { value: 'education-tutoring', label: 'Tutoring' },
] as const;

/** The values of the industry field the endpoint accepts: none, «other», and one per business type of the select. */
export const INDUSTRY_VALUES: ReadonlySet<string> = new Set(['', 'other', ...BUSINESS_TYPES.map((t) => t.value)]);

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
