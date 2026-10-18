// The dictionary of words this site does not print — seo-lead-typelessity-redesign.md §6 (18.10) read as classes,
// not as phrases. One module, imported by claims-class-guard.spec.ts; every pattern carries the `i` flag, the way
// `grep -i` reads (the guard counts raw bytes: title, meta and JSON-LD included).
//
// `allowed` lists the forms of a class that stay legal: they are cut out before counting.
// `mutants` / `legal` feed the guard's self-check: each class must catch every mutant and let its legal form through.

/** The 25 chat-window languages, English names, in the order of SUPPORTED_LOCALES.
 *  Source: ~/Projects/typelessity packages/shared/src/i18n/types.ts:219-245 @ 027a177 (checked 18.10).
 *  The landing does not depend on the product package, so the list is a literal here. */
export const LANDING_LANGUAGES: readonly string[] = [
  'English', 'Russian', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Ukrainian',
  'Czech', 'Slovak', 'Hungarian', 'Romanian', 'Bulgarian', 'Croatian', 'Serbian', 'Slovenian', 'Greek', 'Turkish',
  'Swedish', 'Danish', 'Finnish', 'Norwegian', 'Japanese',
];

/** Languages that are NOT in the code and must not be named as supported. */
export const NOT_SUPPORTED_LANGUAGES: readonly string[] = ['Arabic', 'Hebrew', 'Korean', 'Chinese'];

export interface ClaimClass {
  id: string;
  name: string;
  patterns: readonly RegExp[];
  allowed?: readonly RegExp[];
  mutants: readonly string[];
  legal: string;
}

export const CLAIM_CLASSES: readonly ClaimClass[] = [
  {
    id: 'K1', name: 'languages: 25+, unsupported names, replies in the customer language',
    patterns: [
      /\b25\+/i,
      /\b(Arabic|Hebrew|Korean|Chinese)\b/i,
      /replies in the customer['’]?s language/i,
      /detects? the language/i,
      /any of \d+\+? languages/i,
      /<title>[^<]*in 25 languages/i,
      /<h1[^>]*>[^<]*in 25 languages/i,
    ],
    mutants: ['Languages: 25+ (English)', 'Chinese, Korean and Arabic', 'It replies in the customer’s language', 'It detects the language', 'Say it in any of 25 languages', '<title>Booking widget in 25 languages</title>'],
    legal: 'The chat window comes in 25 languages; the assistant replies in the language you set.',
  },
  {
    id: 'K2', name: 'field labels in the owner’s email (F-111, open)',
    patterns: [/under the labels you chose/i, /labell?ed details/i, /reads? them in your own language/i],
    mutants: ['Details arrive under the labels you chose', 'Labelled details in your inbox', 'Your team reads them in your own language'],
    legal: 'The request arrives by email with the details filled in.',
  },
  {
    id: 'K3', name: 'popularity and endorsement with no paying customers',
    patterns: [/most chosen/i, /most popular/i, /trusted by/i, /recommended by ChatGPT/i, /AI recommends us/i],
    mutants: ['Most chosen plan', 'The most popular tier', 'Trusted by 40 salons', 'Recommended by ChatGPT', 'AI recommends us'],
    legal: 'Four published tiers, each starting with the free pilot.',
  },
  {
    id: 'K4', name: 'EU-data absolutes and GDPR as a seal',
    patterns: [
      /data in the EU/i, /hosted in the EU/i, /EU hosting/i, /EU-only/i, /never leaves Europe/i,
      /GDPR[- ]compliant/i, /DSGVO-konform/i, /zgodny z RODO/i,
    ],
    mutants: ['Your data in the EU', 'Hosted in the EU', 'EU hosting included', 'EU-only', 'Data never leaves Europe', 'A GDPR-compliant widget', 'Ist DSGVO-konform', 'Jest zgodny z RODO'],
    legal: 'Service and database in the EU; OpenAI and Resend in the US under the 2021 SCCs. You are the controller, we are your processor under a DPA.',
  },
  {
    id: 'K5', name: 'consent absolute before any processing',
    patterns: [/before any (AI )?processing/i, /before anything happens/i, /consent before processing/i],
    mutants: ['Consent before any AI processing', 'Consent before anything happens', 'Consent before processing'],
    legal: 'Consent is asked before the chat starts.',
  },
  {
    id: 'K6', name: 'works on any site / named website builders',
    patterns: [/works (on|with) any (site|website)/i, /\b(WordPress|Wix|Squarespace)\b/i],
    mutants: ['Works on any site', 'Works with any website', 'Paste it into WordPress', 'Wix and Squarespace'],
    legal: 'A standard web component you paste into your page; your site must use HTTPS.',
  },
  {
    id: 'K7', name: 'webhook, integrations, unconditional booking-system checks',
    patterns: [
      /webhook/i,
      /integrates with/i,
      /connects to (Booksy|Google Calendar|Calendly|SimplyBook)/i,
      /checks your booking system(?![^.]{0,60}if [^.]{0,30}has an API)/i,
    ],
    mutants: ['Sends a webhook', 'It integrates with any backend', 'Connects to Booksy', 'It checks your booking system for free slots.'],
    legal: 'It checks your booking system for free slots if your booking system has an API. By email or as a REST POST to your endpoint.',
  },
  {
    id: 'K8', name: 'booking confirmed on the email path',
    patterns: [/Booking Confirmed/i, /confirmed booking/i, /books the appointment for you/i],
    mutants: ['Booking Confirmed', 'A confirmed booking', 'It books the appointment for you'],
    legal: 'The widget sends a booking request; the screen says Request Received.',
  },
  {
    id: 'K9', name: 'receptionist, calls, messengers, spoken replies',
    patterns: [/AI receptionist/i, /answers (calls|WhatsApp|SMS)/i, /voice AI/i, /talks back/i],
    mutants: ['Your AI receptionist', 'It answers calls', 'It answers WhatsApp', 'Voice AI for salons', 'The widget talks back'],
    legal: 'It does the front-desk job of taking a booking, on your website. Speak or type.',
  },
  {
    id: 'K10', name: 'phone quality beyond the code',
    patterns: [/works just as well on phones/i, /mobile-optimi[sz]ed/i],
    mutants: ['Works just as well on phones', 'A mobile-optimized widget', 'Mobile-optimised'],
    legal: 'It adapts to small screens; voice recording has settings for iPhone and Safari.',
  },
  {
    id: 'K11', name: 'setup time, savings and conversion claims without a measurement',
    patterns: [/set up in \d+ minutes/i, /saves? \d+ hours/i, /\+\d+ ?% conversion/i, /fewer no-shows/i],
    mutants: ['Set up in 5 minutes', 'Saves 10 hours a week', '+23% conversions', 'Fewer no-shows'],
    legal: 'We have not measured setup time or conversion.',
  },
  {
    id: 'K12', name: 'every feature, free forever, unlimited (except sites)',
    patterns: [/full feature access/i, /every feature/i, /free forever/i, /\bunlimited\b/i],
    allowed: [/unlimited sites/gi],
    mutants: ['Full feature access', 'Every feature on every tier', 'Free forever', 'Unlimited submissions'],
    legal: 'Up to 6,000 submissions/month and unlimited sites. Tiers differ in submission volume and the number of websites.',
  },
  {
    id: 'K13', name: 'uptime, HIPAA, clinics, Zero Data Retention',
    patterns: [/99\.9 ?% uptime/i, /HIPAA[- ](compliant|ready|certified)/i, /for clinics/i, /Zero Data Retention/i],
    mutants: ['99.9% uptime', 'HIPAA-compliant', 'HIPAA ready', 'Booking for clinics', 'Zero Data Retention'],
    legal: 'Not for health data; Typelessity is not HIPAA-attested.',
  },
  {
    id: 'K14', name: 'mock-up working notes',
    patterns: [/Mock note/i, /Portal screenshot goes here/i, /Thin template/i, /the server answers 404/i],
    mutants: ['Mock note: replace', 'Portal screenshot goes here', 'Thin template', 'the server answers 404'],
    legal: 'Typelessity is an AI booking widget.',
  },
];

export type ClaimCounts = Record<string, number>;

/** How many times each class matches in `text` (only classes with a non-zero count are returned). */
export function countClaims(text: string): ClaimCounts {
  const out: ClaimCounts = {};
  for (const c of CLAIM_CLASSES) {
    let body = text;
    for (const a of c.allowed ?? []) body = body.replace(a, ' ');
    let n = 0;
    for (const p of c.patterns) n += (body.match(new RegExp(p.source, 'gi')) ?? []).length;
    if (n > 0) out[c.id] = n;
  }
  return out;
}
