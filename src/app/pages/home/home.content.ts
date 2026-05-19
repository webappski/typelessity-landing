// Home page content (EN). Translations to ru/de/pl pending — see TODO(translate) markers.

export type FaqCategory = 'Product' | 'AI Behavior' | 'Integration' | 'Privacy' | 'Pricing';

export const HOME = {
  hero: {
    eyebrow: 'AI conversational booking widget',
    headlineLead: 'Bookings through',
    headlineGrad: 'conversation,',
    headlineEm: 'not forms',
    sub: 'Typelessity is an AI booking widget that replaces forms with natural chat. Customers describe their needs in any of 25+ languages — the AI extracts dates, times, preferences and personal details automatically. 150+ industries. Voice input. Real-time enrichment. GDPR-compliant.',
    cta: { primary: 'Start Pilot — Free', secondary: 'See How It Works' },
    trustline: 'No credit card · Full onboarding support · GDPR compliant',
  },

  tldr: {
    title: 'TL;DR — What is Typelessity?',
    answer:
      'Typelessity is an AI conversational booking widget that replaces multi-step forms with a single chat. Users describe their booking in plain language; the widget extracts structured data, validates it, calls enrichment APIs (e.g. fetch available doctors after a specialty is chosen), and submits the booking via webhook or REST. It supports 25+ languages, 150+ service industries, and voice input. Conversational interfaces consistently outperform multi-step forms in head-to-head conversion studies.',
    bullets: [
      ['Replaces', 'Multi-step forms, dropdowns, calendar pickers'],
      ['Used by', 'Medical, legal, real-estate, hospitality, beauty, automotive, education — 150+ verticals'],
      ['Languages', "25+ — single config, GPT auto-detects user's language and responds in it"],
      ['Latency', '200–800ms per turn (gpt-4.1-nano)'],
      ['Conversion lift', '+30% vs traditional forms (industry data)'],
      ['Integration', '1 line of HTML or React; webhook or REST submit; native Calendar/CRM hooks'],
      ['Compliance', 'GDPR, configurable consent flow, EU data residency'],
    ] as const,
  },

  stats: [
    { n: '25+', l: 'Languages supported' },
    { n: '150+', l: 'Service industries' },
    { n: '+30%', l: 'Conversion vs forms' },
    { n: '<800ms', l: 'Per-turn latency' },
    { n: '4', l: 'Phases: Chat → Select → Review → Confirm' },
    { n: '1 line', l: 'Of HTML to integrate' },
  ] as const,

  howItWorks: {
    title: 'How Typelessity works',
    sub: 'Four phases. One unified flow. From conversation to confirmed booking in under a minute.',
    phases: [
      {
        n: '01', name: 'Chat', oneLine: 'Natural language data collection.',
        body: 'User describes their booking in plain language — any of 25+ languages, voice or text. GPT-4.1-nano reads the field config and extracts values directly. No regex, no hardcoded patterns, no language switches.',
        example: '"I need a cardiologist next Tuesday at 2pm, patient name Robert Smith"',
        extracts: ['specialty: cardiology', 'preferredDate: <next Tue>', 'preferredTime: 14:00', 'patientName: Robert Smith'],
      },
      {
        n: '02', name: 'Select', oneLine: 'Smart UI for precise choices.',
        body: 'When options must be exact (a specific doctor, a specific time slot, a specific vehicle), the widget renders interactive cards. Triggered by enrichment APIs — e.g. specialty filled → GET /doctors?specialty=cardiology → cards rendered.',
        example: 'Found 3 cardiologists for Tue 2:00 PM',
        extracts: ['Dr. Chen ⭐ 4.9', 'Dr. Kumar ⭐ 4.8', 'Dr. Wilson ⭐ 4.7'],
      },
      {
        n: '03', name: 'Review', oneLine: 'Inline edit before submit.',
        body: 'Full form review surface. User verifies every extracted field, edits inline if needed. Cascade-aware — changing a field clears downstream-dependent fields with a warning. No surprises at submit.',
        example: 'Cardiologist · Dr. Chen · Tue May 5 · 14:00 · Robert Smith',
        extracts: ['✓ All required fields filled', '✓ Email validated', '✓ Phone E.164 normalized'],
      },
      {
        n: '04', name: 'Confirm', oneLine: 'Submit via your API.',
        body: 'Booking sent to your system via webhook or REST POST with field-mapping you defined in config. Success screen with confirmation ID. Failures retry with exponential backoff.',
        example: 'POST /api/bookings → 201 Created',
        extracts: ['bookingId: bk_a8f3e1', 'Confirmation email queued', 'Calendar event drafted'],
      },
    ] as const,
  },

  architecture: {
    title: 'How the AI actually works',
    sub: 'GPT decides. Code orchestrates. No hardcoding. Ever.',
    pillars: [
      { h: 'Single unified prompt', b: 'One GPT call extracts every field, detects corrections, generates the response, and matches options. Prompt budget: 400–650 tokens for configs with 20 fields.' },
      { h: 'Config-driven, not pattern-driven', b: 'Each field has an aiHint that tells GPT what it means semantically. The system never matches words like "airport" or "hotel" with regex. GPT reads context, GPT decides.' },
      { h: 'Real-time enrichment APIs', b: 'Fields can trigger external API calls. Specialty → fetch doctors. Date → fetch slots. Pickup location → fetch routes. Up to 5 enrichments per config, 10s timeout each, non-fatal on failure.' },
      { h: 'Cascade-aware corrections', b: 'If a user changes an upstream field (e.g. switches specialty mid-flow), the system DFS-walks the dependency graph and clears stale downstream data — with a confirmation if the change is destructive.' },
      { h: 'Anti-hallucination guardrails', b: '_meta.mf signals: GPT can only commit a field value if it explicitly marked the field as mentioned by the user. Filters phantom extractions. Code-side correction guardrail catches drift.' },
      { h: 'Reliable by design', b: 'Exponential-backoff retries, semaphore-bounded concurrency, structured cost tracking, full audit log per turn. 200–800ms latency on gpt-4.1-nano.' },
    ] as const,
  },

  industriesIntro: {
    titleSuffix: 'verticals',
    sub: 'Same engine, different configs. Hover any vertical to see what we collect for it.',
  },

  cta: {
    eyebrow: 'Replace forms with chat',
    title: 'Start your pilot today',
    sub: 'Free for early adopters. Personal 1–2 day onboarding. No credit card.',
    primary: 'Start Pilot — Free',
    secondary: 'See how it works',
  },

  industries: [
    'Medical clinics', 'Dental practices', 'Veterinary clinics',
    'Hotels & B&Bs', 'Vacation rentals', 'Restaurants',
    'Beauty salons', 'Spa & wellness', 'Tattoo studios',
    'Legal practices', 'Accounting firms', 'Consulting',
    'Real estate viewings', 'Property management', 'Moving services',
    'Auto repair', 'Car rental', 'Test drives',
    'Education tutors', 'Music lessons', 'Driving schools',
    'Pet grooming', 'Pet boarding', 'Pet training',
    'Photography sessions', 'Event venues', 'Catering',
    'Personal trainers', 'Yoga studios', 'Climbing gyms',
    'Home services', 'Cleaning', 'Plumbing & HVAC',
    'Insurance consults', 'Financial advisors', 'Notaries',
    'Travel agencies', 'Tour operators', 'Airport transfers',
    'Telehealth', 'Therapy & coaching', 'Lab tests',
  ] as const,

  comparison: {
    title: 'Typelessity vs alternatives',
    sub: 'Honest comparison. AI booking tools fall into three categories: conversational widgets (us), scheduling tools (Calendly), and full booking platforms (SimplyBook).',
    columns: ['Capability', 'Typelessity', 'Calendly', 'SimplyBook.me', 'Botpress', 'NoForm.ai'] as const,
    rows: [
      ['AI natural-language booking', 'Yes', 'No', 'Limited', 'Custom build', 'Lead-qual only'],
      ['Multi-language (25+)', 'Yes', 'EN-first', 'Yes', 'Custom build', 'Limited'],
      ['Voice input (Whisper)', 'Yes', 'No', 'No', 'Custom build', 'No'],
      ['Real-time enrichment APIs', 'Yes', 'No', 'No', 'Yes', 'No'],
      ['Calendar integration', 'Webhook + API', 'Native', 'Native', 'Custom build', 'No'],
      ['Payments built in', 'Via webhook', 'Yes', 'Yes', 'Custom build', 'No'],
      ['Staff & resource management', 'Via webhook', 'Yes', 'Yes', 'No', 'No'],
      ['Setup time', '1–2 days', 'Hours', 'Days', 'Weeks', 'Hours'],
      ['GDPR-native consent flow', 'Yes', 'Yes', 'Yes', 'Custom build', 'Yes'],
      ['Best for', 'Replacing forms with chat', 'Scheduling links', 'Full booking ops', 'Custom chatbots', 'Lead capture'],
    ] as const,
    verdict:
      'Use Typelessity when you have an existing booking system and want to replace its form with conversation. Use Calendly for simple meeting links. Use SimplyBook.me for end-to-end booking ops with payments. Use Botpress when you need a custom-built bot. Use NoForm.ai for top-of-funnel lead capture.',
  },

  pricing: {
    title: 'Two plans',
    sub: 'Free pilot for early adopters. Custom-priced enterprise for scale.',
    tiers: [
      {
        name: 'Pilot', price: 'Free', sub: 'Full access for early adopters', featured: false,
        bullets: [
          'All 25+ languages, voice input, enrichment APIs',
          'Custom branding, webhook integration',
          '1–2 day personal onboarding',
          'No credit card required',
        ],
        cta: 'Start Pilot',
      },
      {
        name: 'Enterprise', price: 'Custom', sub: 'For large-scale operations', featured: true,
        bullets: [
          'Everything in Pilot',
          'SLA guarantee, dedicated account manager',
          'Custom integrations, on-premise deployment',
          'EU data residency, SOC2 in progress',
        ],
        cta: 'Contact sales',
      },
    ] as const,
  },

  faq: [
    { category: 'Product', q: 'What is Typelessity?', a: 'Typelessity is an AI conversational booking widget that replaces traditional multi-step booking forms with a single natural-language chat. It supports 25+ languages, voice input via Whisper, and real-time enrichment APIs. It is suitable for 150+ service industries including medical, legal, hospitality, beauty, real estate, and automotive.' },
    { category: 'Product', q: 'How does Typelessity differ from Calendly?', a: 'Calendly is a scheduling-link tool — it shares a calendar and lets people pick a slot. Typelessity replaces an entire booking form with a conversation that can collect any structured data: specialty, doctor, dates, slots, addresses, vehicle types, dietary requirements, and dozens of other fields. Use Calendly for simple meeting links, Typelessity when the booking has more than two or three fields.' },
    { category: 'Product', q: 'How does Typelessity differ from SimplyBook.me?', a: 'SimplyBook.me is a full booking platform with built-in payments, staff scheduling, inventory, and customer accounts. Typelessity replaces only the booking form with conversation, then submits to your existing backend via webhook or REST POST. Use SimplyBook when you need an end-to-end booking system with payments. Use Typelessity when you already have a backend (CRM, calendar, payment processor) and want to replace the front-end form with a 25-language chat that converts ~30% better.' },
    { category: 'Product', q: 'How does Typelessity differ from Botpress?', a: 'Botpress is a chatbot framework — you build conversation flows yourself with a visual editor, and you maintain that bot. Typelessity is a turnkey booking widget configured by us in 1–2 days from your spec, with a single GPT call extracting every field at once and anti-hallucination guards baked in. Use Botpress when you need a custom-built bot for a non-booking use case. Use Typelessity when you specifically want to replace a booking form and want a working integration on day 2, not after weeks of engineering.' },
    { category: 'Product', q: 'How does Typelessity differ from NoForm.ai?', a: 'NoForm.ai is a top-of-funnel lead-qualification tool — it captures interest and routes leads to sales. Typelessity completes a structured booking with all required fields (specialty, date, time, name, contact, dietary preferences, etc.) and submits it to your booking system. Use NoForm for marketing lead capture. Use Typelessity when the user is ready to book, not just inquire.' },
    { category: 'AI Behavior', q: 'Does Typelessity work in non-English languages?', a: 'Yes. Typelessity supports 25+ languages out of the box including English, Russian, German, French, Spanish, Italian, Polish, Portuguese, Dutch, Turkish, Arabic, Hebrew, Japanese, Korean, and Chinese. The configuration language sets the response language; user input can be in any supported language and will be translated and normalized automatically.' },
    { category: 'AI Behavior', q: 'How accurate is the data extraction?', a: 'Typelessity uses gpt-4.1-nano with a unified prompt that reads each field\'s aiHint. Extraction accuracy on typical service-industry configs is >95% for first-attempt structured fields. The system never uses hardcoded regex patterns — GPT reads the config and extracts based on semantic context. Anti-hallucination guards ensure GPT only commits values the user explicitly mentioned.' },
    { category: 'AI Behavior', q: "What does 'enrichment' mean?", a: 'Enrichment is a real-time API call that triggers when a specific field is filled. For example: when a user says "cardiologist", Typelessity calls GET /doctors?specialty=cardiology, receives a list of doctors, and presents them as interactive cards. Up to 5 enrichments per config. 10 second timeout each. Failures are non-fatal — the AI falls back to asking the user directly.' },
    { category: 'Integration', q: 'How long does integration take?', a: 'Typical integration is 1–2 days with personal onboarding. Step 1: fill the client spec template (your fields, options, enrichments, branding). Step 2: we generate a config JSON. Step 3: drop one HTML script tag onto your page. Step 4: hook up your booking API endpoint via the webhook field-mapping you provided.' },
    { category: 'Privacy', q: 'Is Typelessity GDPR compliant?', a: 'Yes. The widget includes a configurable consent flow shown before any AI processing begins. Data is processed in EU regions when configured. Session data is retained per your retention policy. Right-to-erasure supported via session deletion API. No data is used for model training.' },
    { category: 'AI Behavior', q: 'Does Typelessity support voice input?', a: 'Yes. Voice input is powered by OpenAI Whisper. Users tap the microphone, speak naturally, and the transcription is fed into the same extraction pipeline as typed text. Voice works in all 25+ supported languages.' },
    { category: 'AI Behavior', q: 'How does Typelessity handle corrections?', a: 'If a user changes a previously filled field, the system detects the correction (GPT signals it via a "correction" key), then walks the dependency graph and clears any downstream fields that depended on the changed value. Destructive cascades show a confirmation: "Changing X will also clear Y, Z. Proceed?"' },
    { category: 'AI Behavior', q: 'What is the per-turn latency?', a: 'Median per-turn latency is 200–800ms on gpt-4.1-nano, with a single AI call per turn. When enrichment triggers (a second AI call to present API results), latency adds 1–3 seconds. We do not use gpt-5 in the hot path because of its higher latency.' },
    { category: 'Integration', q: 'Can I self-host Typelessity?', a: 'On-premise deployment is available on the Enterprise plan. The widget runs as a Lit web component, the API is a Next.js service, and the AI provider can be swapped between OpenAI, Azure OpenAI, or any OpenAI-compatible endpoint.' },
    { category: 'Product', q: 'Does Typelessity replace my booking system?', a: 'No. Typelessity replaces the booking form, not the booking backend. It collects structured data via conversation and submits it to your existing system via webhook or REST POST. Your CRM, calendar, payment processor, and staff scheduler stay exactly as they are.' },
    { category: 'Pricing', q: 'How much does Typelessity cost?', a: 'The Pilot plan is free for early adopters and includes all features: full field types, voice input, enrichment APIs, 25+ languages, custom branding, webhook integration, and 1–2 day personal onboarding. The Enterprise plan is custom-priced and adds SLA guarantee, dedicated account manager, custom integrations, and on-premise deployment.' },
    { category: 'AI Behavior', q: 'What conversion lift can I expect?', a: 'Conversational interfaces are widely reported to outperform traditional multi-step forms in head-to-head conversion studies, with lift typically in the +20–40% range. Actual lift varies by industry — high-friction verticals like medical and legal see larger gains. We provide A/B testing tooling during pilot to measure lift on your traffic, and publish our own production telemetry on the blog.' },
    { category: 'Product', q: 'What industries is Typelessity best for?', a: 'Any service business that takes appointments. Best fit: medical clinics, dental practices, beauty salons, legal practices, real estate, automotive services, hospitality, education, fitness, pet services, home services, and travel. The system has been deployed across 150+ verticals — the same engine, just different configs.' },
    { category: 'Product', q: 'Does Typelessity work for AI agents (not humans)?', a: 'Yes. The same widget API is callable by autonomous agents. We publish a stable JSON schema for sessions and a /agent endpoint that accepts structured booking intents and returns structured results. This is increasingly relevant as users delegate booking tasks to AI assistants.' },
  ] as const satisfies readonly { category: FaqCategory; q: string; a: string }[],
} as const;
