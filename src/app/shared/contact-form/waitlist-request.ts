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
 * industry pages (L11, 2026-10-20), so the list of what the select shows lives here and nowhere else. The seven are the ones the select sent
 * before as well; the other 29 values of that select are LEGACY_INDUSTRY_VALUES below — the endpoint takes them, the select no longer shows them.
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

/**
 * Values of the select until 2026-10-20: the select was built from the 36 industry pages of the site, and these are the 29 of them that
 * BUSINESS_TYPES does not offer (the seven it does offer are in BUSINESS_TYPES). A tab of /pricing opened before the release sends them
 * until it is reloaded, and the endpoint takes them: refusing one turns a form that worked a minute ago into «We couldn't send your request».
 * The select does not show them. The list is frozen from origin/main at 9badff6 (e2e/retired-industries.ts holds the same 36, and the
 * endpoint test holds this list against it). Do not add to it: a value that was never on the select stays refused.
 */
export const LEGACY_INDUSTRY_VALUES: readonly string[] = [
  'beauty-nail-salons',
  'beauty-spas',
  'beauty-tattoo-studios',
  'professional-legal',
  'professional-accounting',
  'professional-financial-advisors',
  'professional-coaching',
  'fitness-personal-training',
  'fitness-martial-arts',
  'fitness-sports-coaching',
  'home-cleaning',
  'home-handyman',
  'home-hvac',
  'home-landscaping',
  'home-moving',
  'automotive-detailing',
  'automotive-test-drives',
  'education-language-schools',
  'education-music-schools',
  'education-test-prep',
  'hospitality-hotels',
  'hospitality-event-venues',
  'hospitality-tours',
  'realestate-residential',
  'realestate-commercial',
  'realestate-property-management',
  'pet-veterinary',
  'pet-grooming',
  'pet-training',
];

/** The values of the industry field the select shows: none, «other», and one per business type. */
export const INDUSTRY_VALUES: ReadonlySet<string> = new Set(['', 'other', ...BUSINESS_TYPES.map((t) => t.value)]);

/** The values of the industry field the endpoint accepts: what the select shows, and the legacy values of the select as it was until 2026-10-20. */
export const ACCEPTED_INDUSTRY_VALUES: ReadonlySet<string> = new Set([...INDUSTRY_VALUES, ...LEGACY_INDUSTRY_VALUES]);

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
