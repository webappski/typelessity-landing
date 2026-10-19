// The words of /how-it-works (L5). The phases and the six columns of the AI are written for this page; the home page keeps
// its own copy in home.content.ts (HOME.howItWorks), which L4 rewrites — the two are not shared on purpose.

export const HOW = {
  title: 'How Typelessity works',
  // The answer capsule: seo-lead §2.2. The condition «if your booking system has an API» stays in the same sentence.
  capsule:
    'Four phases: chat, select, review, send. Typelessity turns one sentence from your customer into a booking request with one AI call per turn; if your booking system has an API, it asks it what is free.',

  // The one example of the page, a literal: 20 October 2026 is a Tuesday.
  say: 'Brake pads for my RAV4 on Tuesday 20 October at 2pm, name Robert Smith',
  extracted: `{ "service": "brake_pads",
  "date": "2026-10-20",
  "time": "14:00",
  "name": "Robert Smith" }`,

  phasesHead: { kicker: 'Four phases', title: 'From conversation to booking request' },
  phases: [
    {
      n: '01', name: 'Chat', oneLine: 'Natural-language data collection.',
      body: 'The customer describes the booking in plain language, in their own language, by voice or text. The AI model reads your field configuration and extracts the values directly. No regex, no hardcoded patterns, no language switches.',
      example: '“Brake pads for my RAV4 next Tuesday at 2pm, name Robert Smith”',
      extracts: ['service: brake pads', 'date: 2026-10-20', 'time: 14:00', 'name: Robert Smith'],
    },
    {
      n: '02', name: 'Select', oneLine: 'Smart cards for precise choices.',
      body: 'When an option must be exact (a specific mechanic, a time slot, a vehicle) the widget shows tappable cards. If your booking system has an API, the cards come from it: service filled → GET /mechanics?service=brakes → cards.',
      example: 'Found 3 mechanics for Tuesday 2:00 PM',
      extracts: ['M. Chen · Bay 2', 'R. Kumar · Bay 4', 'J. Wilson · Bay 1'],
    },
    {
      n: '03', name: 'Review', oneLine: 'Edit inline before you send.',
      body: 'A full review card. The customer checks every extracted field and edits it inline. Cascade-aware: changing a field clears the fields that depended on it, after asking.',
      example: 'Brake pads · M. Chen · Tue · 14:00 · Robert Smith',
      extracts: ['All required fields filled', 'Email validated', 'Phone number checked'],
    },
    {
      n: '04', name: 'Send', oneLine: 'Send it to your system.',
      body: 'The request goes to your endpoint as JSON, shaped by the field mapping in your config, or by email. A 502, 503 or 504 from your endpoint is retried with exponential backoff.',
      example: 'POST /api/bookings → 201 Created',
      extracts: ['bookingId read from your response', 'X-Idempotency-Key sent', 'Stored with the conversation'],
    },
  ],

  ai: {
    kicker: 'The AI',
    title: 'How the AI actually works',
    sub: 'The model decides. Code orchestrates. No hardcoding.',
    pillars: [
      { h: 'Single unified prompt', b: 'One AI call extracts every field, detects corrections, writes the reply and matches options. The prompt is built from your configuration.' },
      { h: 'Config-driven, not pattern-driven', b: 'Each field has an aiHint that tells the model what it means. The system never matches words like “airport” with regex.' },
      { h: 'Enrichment APIs', b: 'Fields can trigger calls to your system: service → mechanics, date → slots. A call times out after 10 s by default and a failure is never fatal.' },
      { h: 'Cascade-aware corrections', b: 'Change an upstream field and every dependent field is cleared, with a confirmation if the change is destructive.' },
      { h: 'Anti-hallucination guardrails', b: 'Fields outside your configuration are dropped; a reply claiming the booking is done before the visitor sends the request is discarded.' },
      { h: 'Reliable by design', b: 'Retries with backoff on model calls and on submission; every message is stored with its conversation.' },
    ],
  },

  // The section the page is built around (seo-lead §2.2): a plain H2 and text, no markup of the HowTo kind.
  chatInsteadOfForm: {
    h2: 'How to let customers book by chat instead of a form',
    paragraphs: [
      'A booking form asks the customer to fit their request into your fields. With Typelessity the customer writes or says what they want, and the widget fills the same fields for them to check.',
      'Nothing else on your website changes: the widget is added next to the page you have, and the request reaches you by email or at your own endpoint, in the same shape as a form would send it.',
    ],
    linkText: 'See what you need and the code to paste',
  },

  edge: {
    kicker: 'Edge cases handled',
    title: 'What happens when things go wrong',
    items: [
      { h: 'GPT outage', b: 'The model call is retried once. If it still fails, the widget stays in the chat and asks for the next field directly — there is no separate form mode.' },
      { h: 'Enrichment timeout (10s)', b: 'Non-fatal. AI continues with partial data and asks the user to confirm what was extracted.' },
      { h: 'User changes upstream field mid-flow', b: 'DFS-walk over the dependency graph clears stale downstream fields. Destructive cascades show a confirmation.' },
      { h: 'GPT hallucinates a value', b: 'Fields outside the configuration are dropped; a changed value for a filled field is treated as a correction; the visitor reviews every field before sending. _meta.mf is logged, not enforced.' },
      { h: 'Submit endpoint returns 502, 503 or 504', b: 'Retried with exponential backoff, 3 retries by default. If it still fails, the widget shows a Retry button and keeps everything the visitor entered.' },
    ],
  },

  turn: {
    kicker: 'One turn, end to end',
    title: 'What happens in a single turn',
    sub: 'User → widget → API → GPT → enrichment → response.',
    nodes: [
      ['User', 'Types or speaks'],
      ['Widget', 'Captures input'],
      ['API', 'Session API'],
      ['GPT', 'Single call'],
      ['Enrichment', 'Optional API · 10s timeout'],
      ['Response', 'Filled fields + reply'],
    ] as const,
  },

  installTeaser: {
    kicker: 'Install',
    title: 'Two lines of HTML',
    sub: 'It is a standard web component (a custom HTML element) that you paste into your page.',
    link: 'Add Typelessity to your website',
  },

  cta: {
    title: 'Ready to replace your form?',
    primary: 'Get it free',
    secondary: 'Add Typelessity to your website',
  },
} as const;
