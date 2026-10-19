// Home page content (EN). Translations to ru/de/pl pending — see TODO(translate) markers.

export type FaqCategory =
  | 'Product'
  | 'AI Behavior'
  | 'Integration'
  | 'Privacy'
  | 'Pricing'
  | 'Security'
  | 'Compliance'
  | 'For Developers'
  | 'Competitor Migration';

// Typelessity is set up inside the Webappski portal (A43, founder 2026-09-25). A link to another site
// carries utm_* — webappski.com records it on load; ?via= is only for links within webappski.com.
export const PORTAL_SIGNUP_URL = 'https://webappski.com/en/portal/login';

export function pilotSignupUrl(medium: string, content: string): string {
  const url = new URL(PORTAL_SIGNUP_URL);
  url.searchParams.set('start', 'typelessity');
  url.searchParams.set('utm_source', 'typelessity.com');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_content', content);
  return url.toString();
}

export const HOME = {
  hero: {
    eyebrow: 'AI conversational booking widget',
    headlineLead: 'Bookings through',
    headlineGrad: 'conversation,',
    headlineEm: 'not forms',
    sub: 'Typelessity is an AI booking widget that replaces forms with natural chat. Customers describe their needs in any of 25+ languages — the AI extracts dates, times, preferences and personal details automatically. Voice input. Enrichment from your own APIs. Consent before any AI processing.',
    cta: { primary: 'Start free pilot', secondary: 'See How It Works' },
    trustline: 'Free pilot · 25+ languages · Consent before any AI processing',
  },

  tldr: {
    title: 'TL;DR — What is Typelessity?',
    answer:
      'Typelessity is an AI conversational booking widget that replaces multi-step forms with a single chat. Users describe their booking in plain language; the widget extracts structured data, validates it, calls enrichment APIs (e.g. fetch available mechanics after a service is chosen), and submits the booking by email, webhook or REST. It supports 25+ languages and voice input, and is configurable for any service-business booking flow.',
    bullets: [
      ['Replaces', 'Multi-step forms, dropdowns, calendar pickers'],
      ['Languages', '25+ — visitors write in any of them; the reply language is set in your config'],
      ['AI model', 'OpenAI (currently gpt-5.4-mini), one call per turn; voice via OpenAI gpt-4o-mini-transcribe'],
      ['Integration', 'Two lines of HTML (a web component); submits by email, webhook or REST'],
      ['Compliance', 'Consent before any AI processing; service and database in the EU, OpenAI and Resend in the US under the 2021 SCCs; DPA included'],
    ] as const,
  },

  stats: [
    { n: '25+', l: 'Languages supported' },
    { n: '€0', l: 'Free pilot, up to 50 submissions a month' },
    { n: '4', l: 'Phases: Chat → Select → Review → Confirm' },
    { n: '2 lines', l: 'Of HTML to integrate' },
  ] as const,

  howItWorks: {
    title: 'How Typelessity works',
    sub: 'Four phases. One unified flow. From conversation to confirmed booking.',
    phases: [
      {
        n: '01', name: 'Chat', oneLine: 'Natural language data collection.',
        body: 'User describes their booking in plain language — any of 25+ languages, voice or text. The AI model — OpenAI (currently gpt-5.4-mini) — reads the field config and extracts values directly. No regex, no hardcoded patterns, no language switches.',
        example: '"Brake pads for my RAV4 next Tuesday at 2pm, name Robert Smith"',
        extracts: ['service: brake pads', 'preferredDate: <next Tue>', 'preferredTime: 14:00', 'customerName: Robert Smith'],
      },
      {
        n: '02', name: 'Select', oneLine: 'Smart UI for precise choices.',
        body: 'When options must be exact (a specific mechanic, a specific time slot, a specific vehicle), the widget renders interactive cards. Triggered by enrichment APIs — e.g. service filled → GET /mechanics?service=brakes → cards rendered.',
        example: 'Found 3 mechanics for Tue 2:00 PM',
        extracts: ['M. Chen · Bay 2', 'R. Kumar · Bay 4', 'J. Wilson · Bay 1'],
      },
      {
        n: '03', name: 'Review', oneLine: 'Inline edit before submit.',
        body: 'Full form review surface. User verifies every extracted field, edits inline if needed. Cascade-aware — changing a field clears downstream-dependent fields with a warning. No surprises at submit.',
        example: 'Brake pads · M. Chen · Tue May 5 · 14:00 · Robert Smith',
        extracts: ['✓ All required fields filled', '✓ Email validated', '✓ Phone number checked'],
      },
      {
        n: '04', name: 'Confirm', oneLine: 'Submit via your API.',
        body: 'Booking sent to your system — as JSON to your endpoint, shaped by the field mapping in your config, or by email. The success screen shows a reference: the ID your system returned, or our own when it returned none. A 502, 503 or 504 from your endpoint is retried with exponential backoff.',
        example: 'POST /api/bookings → 201 Created',
        extracts: ['bookingId read from your response', 'X-Idempotency-Key sent', 'Stored with the conversation'],
      },
    ] as const,
  },

  architecture: {
    title: 'How the AI actually works',
    sub: 'GPT decides. Code orchestrates. No hardcoding. Ever.',
    pillars: [
      { h: 'Single unified prompt', b: 'One GPT call extracts every field, detects corrections, generates the response, and matches options. The prompt is built from your configuration, so its size grows with your fields and options.' },
      { h: 'Config-driven, not pattern-driven', b: 'Each field has an aiHint that tells GPT what it means semantically. The system never matches words like "airport" or "hotel" with regex. GPT reads context, GPT decides.' },
      { h: 'Enrichment APIs', b: 'Fields can trigger external API calls. Service → fetch mechanics. Date → fetch slots. Pickup location → fetch routes. Each call times out after 10 s by default (configurable) and is non-fatal on failure.' },
      { h: 'Cascade-aware corrections', b: 'If a user changes an upstream field (e.g. switches the service mid-flow), the system DFS-walks the dependency graph and clears stale downstream data — with a confirmation if the change is destructive.' },
      { h: 'Anti-hallucination guardrails', b: 'Fields outside your configuration are dropped; a reply claiming the booking is done before the visitor confirms is discarded; a new value for a filled field becomes a correction. The visitor reviews every field before sending.' },
      { h: 'Reliable by design', b: 'Exponential-backoff retries on model calls and on booking submission, semaphore-bounded concurrency for model calls, every message stored with its conversation.' },
    ] as const,
  },

  industriesIntro: {
    titleSuffix: 'verticals',
    sub: 'Same engine, different configs. Each vertical has its own page with the fields it collects.',
  },

  cta: {
    eyebrow: 'Replace forms with chat',
    title: 'Start your free pilot',
    sub: 'Up to 50 submissions a month with no time limit. Set it up step by step in the Webappski portal, or let your own AI fill it in.',
    primary: 'Start free pilot',
    secondary: 'See how it works',
  },

  comparison: {
    title: 'Typelessity vs alternatives',
    sub: 'AI booking tools span several categories: inbound conversational widgets (us), scheduling tools (Calendly, Cal.com), full booking platforms (SimplyBook), and AI that places phone calls (Cal.ai). Different layers — they can sit side by side.',
    columns: ['Capability', 'Typelessity', 'Calendly', 'Cal.com', 'Cal.ai', 'SimplyBook.me', 'Botpress', 'NoForm.ai'] as const,
    // A56 (c8, 2026-10-03): every competitor cell below is a statement from that vendor's own page, read on
    // 2026-10-03 (see `sources`). Where the page says nothing the cell is «—»; three earlier cells were
    // contradicted by the pages (Cal.com «EN-first» — its page says 65+ languages; SimplyBook.me voice «No»
    // — its page sells AI Voice Booking; SimplyBook.me «Limited» — same).
    rows: [
      ['Interaction model', 'Inbound chat widget', 'Booking link; the invitee picks a time', 'Scheduling software', 'Phone calls', 'Online booking system', 'AI agent platform', 'Chatbot for pre-sales and leads'],
      ['AI natural-language booking', 'Yes', '—', '—', 'Yes, by phone call', 'Yes, by voice (AI Voice Booking)', '—', '—'],
      ['Languages', '25+', '—', '65+', '—', '24 in the site menu', '—', 'Multilingual bots, no number given'],
      ['Voice input', 'Yes (inbound)', '—', '—', 'Yes (phone calls)', 'Yes (AI Voice Booking)', '—', '—'],
      ['Enrichment APIs', 'Yes', '—', '—', '—', '—', 'Integrations and workflow actions', '—'],
      ['Calendar integration', 'Webhook + API', 'Google, Outlook, Microsoft Office', 'Google Calendar, Zoom, Google Meet, Microsoft Teams', 'Built into Cal.com Workflows', 'Google or Outlook sync', '—', '—'],
      ['Staff & resource management', 'Via webhook', 'Team templates, meeting distribution', 'Teams: round-robin, shared availability', '—', 'Providers, schedules, resources', '—', '—'],
      ['GDPR stated on their site', 'Consent before any AI processing; DPA', '—', '—', '—', 'GDPR compliant', 'GDPR compliant', '—'],
      ['Best for', 'Replacing intake forms with chat', 'Booking links', 'Scheduling software', 'Phone calls that book, remind and follow up', 'All-in-one online booking', 'AI agents for customer support', 'Pre-sales support and lead capture'],
    ] as const,
    sources:
      'Competitor cells quote each vendor\'s own pages, read on 2026-10-03: calendly.com/features, cal.com, cal.com/ai, simplybook.me and simplybook.me/en/features, botpress.com, noform.ai. A dash means we found no statement on those pages; it does not mean the product lacks the feature.',
    verdict:
      'Use Typelessity when you have an existing booking system and want to replace its intake form with an inbound conversation. Use Calendly or Cal.com for scheduling links. Use Cal.ai when you want AI phone calls inside Cal.com Workflows to book, remind and follow up — a different layer that pairs with, rather than replaces, an inbound widget. Use SimplyBook.me for an all-in-one online booking system. Use Botpress when you need an AI agent platform for customer support. Use NoForm.ai for pre-sales support and lead capture.',
  },

  pricing: {
    title: 'Simple, Transparent Pricing',
    sub: 'Choose the plan that fits your business needs.',
    // The numbers are the product's (packages/api/src/lib/developer-tiers.ts: 50/500/2000/6000 booking requests a month,
    // 1/5/10/unlimited sites, 0/39/149/399 €); e2e/pricing-faq-facts.spec.ts reads that file and compares. `period` is
    // drawn on /pricing only; the home page draws name, price, sub and cta (L4 turns the period on there).
    tiers: [
      {
        name: 'Free Pilot', price: '€0', sub: 'Test Typelessity on your site risk-free.',
        comingSoon: false,
        bullets: [
          'Up to 50 booking requests a month',
          'Customers speak or type their request',
          '1 site',
          'Support by email',
        ],
        // comingSoon: true renders a disabled «Coming soon» button instead of the link.
        cta: 'Start free pilot', slug: 'free-pilot',
      },
      {
        name: 'Starter', price: '€39', period: '/ month', sub: 'Perfect for small businesses.',
        comingSoon: false,
        bullets: [
          'Up to 500 booking requests a month',
          'Customers speak or type their request',
          'Up to 5 sites',
          'Support by email',
        ],
        cta: 'Start with the free pilot', slug: 'starter',
      },
      {
        name: 'Pro', price: '€149', period: '/ month', sub: 'For growing companies with higher volume.',
        comingSoon: false,
        bullets: [
          'Up to 2,000 booking requests a month',
          'Customers speak or type their request',
          'Up to 10 sites',
          'Support by email',
        ],
        cta: 'Start with the free pilot', slug: 'pro',
      },
      {
        name: 'Enterprise', price: '€399', period: '/ month', sub: 'For large organizations with high volume and contract terms.',
        comingSoon: false,
        bullets: [
          'Up to 6,000 booking requests a month',
          'Customers speak or type their request',
          'Unlimited sites',
          'Support by email',
        ],
        cta: 'Start with the free pilot', slug: 'enterprise',
      },
    ] as const,
  },

  // L6: the FAQ lives on /faq now (src/app/pages/faq/faq.content.ts, seven groups). Home keeps only what it draws: the Product
  // preview. Its five vendor comparisons go with L4 (the home page rebuild); FL-L6-2.
  faq: [
    { category: 'Product', q: 'What is Typelessity?', a: 'Typelessity is an AI conversational booking widget that replaces traditional multi-step booking forms with a single natural-language chat. It supports 25+ languages, voice input transcribed by OpenAI gpt-4o-mini-transcribe, and enrichment APIs. It is configured per industry — supported verticals (configurations) include beauty, hospitality, fitness, automotive and education.' },
    { category: 'Product', q: 'How does Typelessity differ from Calendly?', a: 'Calendly is a scheduling-link tool — it shares a calendar and lets people pick a slot. Typelessity replaces an entire booking form with a conversation that can collect any structured data: service, staff member, dates, slots, addresses, vehicle types, party size, and any other field you configure. Use Calendly for simple meeting links, Typelessity when the booking has more than two or three fields.' },
    { category: 'Product', q: 'How does Typelessity differ from SimplyBook.me?', a: 'SimplyBook.me is a full booking platform with built-in payments, staff scheduling, inventory, and customer accounts. Typelessity replaces only the booking form with conversation, then submits to your existing backend by email, webhook or REST POST. Use SimplyBook when you need an end-to-end booking system with payments. Use Typelessity when you already have a backend (CRM, calendar, payment processor) and want to replace the front-end form with a 25-language chat.' },
    { category: 'Product', q: 'How does Typelessity differ from Cal.ai?', a: 'Cal.ai is an outbound AI phone-calling feature built into Cal.com Workflows — it places lifelike phone calls to book meetings, send reminders and follow up with leads who have not scheduled yet, billed per minute. Typelessity works the other direction: it is an inbound conversational widget on your own site that collects a complete, structured booking through chat in 25+ languages and submits it to your backend. They sit at different layers and pair well — Cal.ai can follow up by phone after Typelessity captured the booking. Use Cal.ai when your gap is outbound reminder and confirmation calls on top of Cal.com; use Typelessity when your gap is the inbound intake form itself.' },
    { category: 'Product', q: 'How does Typelessity differ from Botpress?', a: 'Botpress is a chatbot framework — you build conversation flows yourself with a visual editor, and you maintain that bot. Typelessity is a ready-made booking widget you set up yourself in the Webappski portal, with a single GPT call extracting every field at once and a review step before anything is sent. Use Botpress when you need a custom-built bot for a non-booking use case. Use Typelessity when you specifically want to replace a booking form and would rather set it up yourself in the portal wizard than build conversation flows.' },
    { category: 'Product', q: 'How does Typelessity differ from NoForm.ai?', a: 'NoForm.ai is a top-of-funnel lead-qualification tool — it captures interest and routes leads to sales. Typelessity completes a structured booking with all required fields (service, date, time, name, contact, party size, etc.) and submits it to your booking system. Use NoForm for marketing lead capture. Use Typelessity when the user is ready to book, not just inquire.' },
    { category: 'Product', q: 'Does Typelessity replace my booking system?', a: 'No. Typelessity replaces the booking form, not the booking backend. It collects structured data via conversation and submits it to your existing system by email, webhook or REST POST. Your CRM, calendar, payment processor, and staff scheduler stay exactly as they are.' },
    { category: 'Product', q: 'What industries is Typelessity best for?', a: 'Any service business that takes appointments. Supported verticals (configurations) include beauty salons, hospitality, fitness, automotive services and education. The same engine handles every vertical — configuration changes the field schema, prompts, and enrichments per tenant.' },
    { category: 'Product', q: 'Does Typelessity work for AI agents (not humans)?', a: 'Not through a dedicated endpoint yet. We publish the JSON shapes of a session and a booking on /for-ai-agents. A dedicated /agent endpoint (a synchronous turn-by-turn API with the same field-extraction pipeline) is designed there, but it is not built and has no release date.' },
  ] as const satisfies readonly { category: FaqCategory; q: string; a: string }[],
} as const;
