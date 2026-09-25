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
    sub: 'Typelessity is an AI booking widget that replaces forms with natural chat. Customers describe their needs in any of 25+ languages — the AI extracts dates, times, preferences and personal details automatically. Voice input. Real-time enrichment. Consent before any AI processing.',
    cta: { primary: 'Start free pilot', secondary: 'See How It Works' },
    trustline: 'Free pilot · 25+ languages · Consent before any AI processing',
  },

  tldr: {
    title: 'TL;DR — What is Typelessity?',
    answer:
      'Typelessity is an AI conversational booking widget that replaces multi-step forms with a single chat. Users describe their booking in plain language; the widget extracts structured data, validates it, calls enrichment APIs (e.g. fetch available doctors after a specialty is chosen), and submits the booking via webhook or REST. It supports 25+ languages and voice input, and is configurable for any service-business booking flow. Conversational interfaces consistently outperform multi-step forms in head-to-head conversion studies.',
    bullets: [
      ['Replaces', 'Multi-step forms, dropdowns, calendar pickers'],
      ['Used by', 'Service businesses with appointment booking — legal, real-estate, hospitality, beauty, automotive, education, and more'],
      ['Languages', "25+ — single config, GPT auto-detects user's language and responds in it"],
      ['AI model', 'OpenAI (currently gpt-5.4-mini), one call per turn; voice via OpenAI gpt-4o-mini-transcribe'],
      ['Integration', 'Two lines of HTML (a web component); submits by email, webhook or REST'],
      ['Compliance', 'Consent before any AI processing; service and database in the EU, OpenAI and Resend in the US under the 2021 SCCs; DPA included'],
    ] as const,
  },

  stats: [
    { n: '25+', l: 'Languages supported' },
    { n: '~800ms', l: 'Per-turn latency' },
    { n: '4', l: 'Phases: Chat → Select → Review → Confirm' },
    { n: '2 lines', l: 'Of HTML to integrate' },
  ] as const,

  howItWorks: {
    title: 'How Typelessity works',
    sub: 'Four phases. One unified flow. From conversation to confirmed booking in under a minute.',
    phases: [
      {
        n: '01', name: 'Chat', oneLine: 'Natural language data collection.',
        body: 'User describes their booking in plain language — any of 25+ languages, voice or text. The AI model — OpenAI (currently gpt-5.4-mini) — reads the field config and extracts values directly. No regex, no hardcoded patterns, no language switches.',
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
      { h: 'Single unified prompt', b: 'One GPT call extracts every field, detects corrections, generates the response, and matches options. The prompt is built from your configuration, so its size grows with your fields and options.' },
      { h: 'Config-driven, not pattern-driven', b: 'Each field has an aiHint that tells GPT what it means semantically. The system never matches words like "airport" or "hotel" with regex. GPT reads context, GPT decides.' },
      { h: 'Real-time enrichment APIs', b: 'Fields can trigger external API calls. Specialty → fetch doctors. Date → fetch slots. Pickup location → fetch routes. Up to 5 enrichments per config, 10s timeout each, non-fatal on failure.' },
      { h: 'Cascade-aware corrections', b: 'If a user changes an upstream field (e.g. switches specialty mid-flow), the system DFS-walks the dependency graph and clears stale downstream data — with a confirmation if the change is destructive.' },
      { h: 'Anti-hallucination guardrails', b: 'Fields outside your configuration are dropped; a reply claiming the booking is done before the visitor confirms is discarded; a new value for a filled field becomes a correction. The visitor reviews every field before sending.' },
      { h: 'Reliable by design', b: 'Exponential-backoff retries, semaphore-bounded concurrency, structured cost tracking, every message stored with its conversation.' },
    ] as const,
  },

  industriesIntro: {
    titleSuffix: 'verticals',
    sub: 'Same engine, different configs. Hover any vertical to see what we collect for it.',
  },

  cta: {
    eyebrow: 'Replace forms with chat',
    title: 'Start your free pilot',
    sub: 'Up to 50 submissions a month with no time limit. Set it up step by step in the Webappski portal, or let your own AI fill it in.',
    primary: 'Start free pilot',
    secondary: 'See how it works',
  },

  industries: [
    'Veterinary clinics', 'Hotels & B&Bs', 'Vacation rentals',
    'Restaurants', 'Beauty salons', 'Spa & wellness',
    'Tattoo studios', 'Legal practices', 'Accounting firms',
    'Consulting', 'Real estate viewings', 'Property management',
    'Moving services', 'Auto repair', 'Car rental',
    'Test drives', 'Education tutors', 'Music lessons',
    'Driving schools', 'Pet grooming', 'Pet boarding',
    'Pet training', 'Photography sessions', 'Event venues',
    'Catering', 'Personal trainers', 'Yoga studios',
    'Climbing gyms', 'Home services', 'Cleaning',
    'Plumbing & HVAC', 'Insurance consults', 'Financial advisors',
    'Notaries', 'Travel agencies', 'Tour operators',
    'Airport transfers',
  ] as const,

  comparison: {
    title: 'Typelessity vs alternatives',
    sub: 'Honest comparison. AI booking tools span several categories: inbound conversational widgets (us), scheduling tools (Calendly, Cal.com), full booking platforms (SimplyBook), and outbound AI voice callers (Cal.ai). Different layers — many businesses use more than one together.',
    columns: ['Capability', 'Typelessity', 'Calendly', 'Cal.com', 'Cal.ai', 'SimplyBook.me', 'Botpress', 'NoForm.ai'] as const,
    rows: [
      ['Interaction model', 'Inbound chat widget', 'Slot-pick page', 'Slot-pick page', 'Outbound voice call', 'Booking pages', 'Custom bot flows', 'Lead chat'],
      ['AI natural-language booking', 'Yes', 'No', 'No', 'Voice, outbound only', 'Limited', 'Custom build', 'Lead-qual only'],
      ['Multi-language (25+)', 'Yes', 'EN-first', 'EN-first', 'Per voice config', 'Yes', 'Custom build', 'Limited'],
      ['Voice input', 'Yes (inbound)', 'No', 'No', 'Yes (phone calls)', 'No', 'Custom build', 'No'],
      ['Real-time enrichment APIs', 'Yes', 'No', 'No', 'No', 'No', 'Yes', 'No'],
      ['Calendar integration', 'Webhook + API', 'Native', 'Native', 'Native (Cal.com)', 'Native', 'Custom build', 'No'],
      ['Staff & resource management', 'Via webhook', 'Yes', 'Yes', 'Via Cal.com', 'Yes', 'No', 'No'],
      ['GDPR consent flow', 'Yes', 'Yes', 'Yes', 'N/A (voice)', 'Yes', 'Custom build', 'Yes'],
      ['Best for', 'Replacing intake forms with chat', 'Scheduling links', 'Open-source scheduling', 'Reminder & no-show calls', 'Full booking ops', 'Custom chatbots', 'Lead capture'],
    ] as const,
    verdict:
      'Use Typelessity when you have an existing booking system and want to replace its intake form with an inbound conversation. Use Calendly or Cal.com for simple meeting links and slot-picking. Use Cal.ai when you want outbound AI phone calls inside Cal.com to confirm bookings and chase no-shows — a different layer that pairs with, rather than replaces, an inbound widget. Use SimplyBook.me for end-to-end booking ops with payments. Use Botpress when you need a custom-built bot. Use NoForm.ai for top-of-funnel lead capture.',
  },

  pricing: {
    title: 'Simple, Transparent Pricing',
    sub: 'Choose the plan that fits your business needs.',
    tiers: [
      {
        name: 'Free Pilot', price: '€0', sub: 'Test Typelessity on your site risk-free.', featured: false,
        comingSoon: false,
        bullets: [
          'Up to 50 submissions/month',
          'Supports 25+ Languages',
          'Support by email',
        ],
        // comingSoon: true renders a disabled «Coming soon» button instead of the link.
        cta: 'Start free pilot', slug: 'free-pilot',
      },
      {
        name: 'Starter', price: '€39', sub: 'Perfect for small businesses.', featured: false,
        comingSoon: false,
        bullets: [
          'Up to 500 submissions/month',
          'Supports 25+ Languages',
          'Support by email',
        ],
        cta: 'Start free pilot', slug: 'starter',
      },
      {
        name: 'Pro', price: '€149', sub: 'For growing companies with higher volume.', featured: true,
        comingSoon: false,
        bullets: [
          'Up to 2,000 submissions/month',
          'Supports 25+ Languages',
          'Support by email',
        ],
        cta: 'Start free pilot', slug: 'pro',
      },
      {
        name: 'Enterprise', price: '€399', sub: 'For large organizations with high volume and contract terms.', featured: false,
        comingSoon: false,
        bullets: [
          'Up to 6,000 submissions/month',
          'Supports 25+ Languages',
          'Unlimited sites',
          'Support by email',
        ],
        cta: 'Start free pilot', slug: 'enterprise',
      },
    ] as const,
  },

  faq: [
    { category: 'Product', q: 'What is Typelessity?', a: 'Typelessity is an AI conversational booking widget that replaces traditional multi-step booking forms with a single natural-language chat. It supports 25+ languages, voice input transcribed by OpenAI gpt-4o-mini-transcribe, and real-time enrichment APIs. It is configured per industry — current production verticals include legal practices, hospitality, beauty, real estate, automotive, and education.' },
    { category: 'Product', q: 'How does Typelessity differ from Calendly?', a: 'Calendly is a scheduling-link tool — it shares a calendar and lets people pick a slot. Typelessity replaces an entire booking form with a conversation that can collect any structured data: specialty, doctor, dates, slots, addresses, vehicle types, dietary requirements, and dozens of other fields. Use Calendly for simple meeting links, Typelessity when the booking has more than two or three fields.' },
    { category: 'Product', q: 'How does Typelessity differ from SimplyBook.me?', a: 'SimplyBook.me is a full booking platform with built-in payments, staff scheduling, inventory, and customer accounts. Typelessity replaces only the booking form with conversation, then submits to your existing backend via webhook or REST POST. Use SimplyBook when you need an end-to-end booking system with payments. Use Typelessity when you already have a backend (CRM, calendar, payment processor) and want to replace the front-end form with a 25-language chat.' },
    { category: 'Product', q: 'How does Typelessity differ from Cal.ai?', a: 'Cal.ai is an outbound AI phone-calling feature built into Cal.com Workflows — it places lifelike voice calls to confirm bookings, send reminders, and follow up on no-shows, billed per minute. Typelessity works the other direction: it is an inbound conversational widget on your own site that collects a complete, structured booking through chat in 25+ languages and submits it to your backend. They sit at different layers and pair well — Cal.ai can chase a no-show after Typelessity captured the booking. Use Cal.ai when your gap is outbound reminder and confirmation calls on top of Cal.com; use Typelessity when your gap is the inbound intake form itself.' },
    { category: 'Product', q: 'How does Typelessity differ from Botpress?', a: 'Botpress is a chatbot framework — you build conversation flows yourself with a visual editor, and you maintain that bot. Typelessity is a ready-made booking widget you set up yourself in the Webappski portal, with a single GPT call extracting every field at once and a review step before anything is sent. Use Botpress when you need a custom-built bot for a non-booking use case. Use Typelessity when you specifically want to replace a booking form and would rather set it up yourself in the portal wizard than build conversation flows.' },
    { category: 'Product', q: 'How does Typelessity differ from NoForm.ai?', a: 'NoForm.ai is a top-of-funnel lead-qualification tool — it captures interest and routes leads to sales. Typelessity completes a structured booking with all required fields (specialty, date, time, name, contact, dietary preferences, etc.) and submits it to your booking system. Use NoForm for marketing lead capture. Use Typelessity when the user is ready to book, not just inquire.' },
    { category: 'AI Behavior', q: 'Does Typelessity work in non-English languages?', a: 'Yes. Typelessity supports 25+ languages out of the box including English, Russian, German, French, Spanish, Italian, Polish, Portuguese, Dutch, Turkish, Arabic, Hebrew, Japanese, Korean, and Chinese. The configuration language sets the response language; user input can be in any supported language and will be translated and normalized automatically.' },
    { category: 'AI Behavior', q: 'How accurate is the data extraction?', a: 'Typelessity uses OpenAI (currently gpt-5.4-mini) with a unified prompt that reads each field\'s aiHint. We have not published a measured extraction accuracy for the current model, so we do not quote one. The system never uses hardcoded regex patterns — GPT reads the config and extracts based on semantic context. Code-side guards drop any field the configuration does not define, and the visitor reviews every field before the booking is sent.' },
    { category: 'AI Behavior', q: "What does 'enrichment' mean?", a: 'Enrichment is a real-time API call that triggers when a specific field is filled. For example: when a user says "cardiologist", Typelessity calls GET /doctors?specialty=cardiology, receives a list of doctors, and presents them as interactive cards. Up to 5 enrichments per config. 10 second timeout each. Failures are non-fatal — the AI falls back to asking the user directly.' },
    { category: 'Integration', q: 'How long does integration take?', a: 'We have not measured a typical setup time, so we do not quote one. Setup is a wizard in the Webappski portal that you complete yourself. Step by step: Your business → Questions → Data & delivery → Messages → Review → Install. Or let your own AI write it: copy our instructions into ChatGPT or Claude with your API docs and paste the answer back (Your business → Your AI’s answer → Review → Install). Before you publish you can try the widget as a customer; the Install step gives you the embed code for your platform.' },
    { category: 'Privacy', q: 'Is Typelessity GDPR compliant?', a: 'You are the controller and Typelessity is your processor under a DPA, so here is what we do on our side. The widget asks every visitor for consent before any AI processing begins. The service runs in the EU (Vercel, Frankfurt) and its database is in the EU (Supabase, Ireland); OpenAI, which understands the conversation and transcribes voice, processes in the United States under the 2021 Standard Contractual Clauses. An abandoned conversation is deleted within 48 hours of the visitor\'s last message; one that led to a booking is kept until the business erases it. No data is used for model training.' },
    { category: 'AI Behavior', q: 'Does Typelessity support voice input?', a: 'Yes. Voice input is transcribed by OpenAI gpt-4o-mini-transcribe. Users tap the microphone, speak naturally, and the transcription is fed into the same extraction pipeline as typed text. Voice works in all 25+ supported languages.' },
    { category: 'AI Behavior', q: 'How does Typelessity handle corrections?', a: 'If a user changes a previously filled field, the system detects the correction (GPT signals it via a "correction" key), then walks the dependency graph and clears any downstream fields that depended on the changed value. Destructive cascades show a confirmation: "Changing X will also clear Y, Z. Proceed?"' },
    { category: 'AI Behavior', q: 'What is the per-turn latency?', a: 'We have not measured it on the current model, so we do not quote a number. Each turn makes one AI call to OpenAI (currently gpt-5.4-mini); when an enrichment triggers, a second call presents the API results, which adds time.' },
    { category: 'Integration', q: 'Can I self-host Typelessity?', a: 'No. Typelessity is a hosted service: the service runs on Vercel in Frankfurt and the database on Supabase in Ireland, and there is no on-premise or self-hosted build. The widget is a Lit web component and the API is a Next.js service; conversations are understood by OpenAI through our account.' },
    { category: 'Product', q: 'Does Typelessity replace my booking system?', a: 'No. Typelessity replaces the booking form, not the booking backend. It collects structured data via conversation and submits it to your existing system via webhook or REST POST. Your CRM, calendar, payment processor, and staff scheduler stay exactly as they are.' },
    { category: 'Pricing', q: 'How much does Typelessity cost?', a: 'Free Pilot (€0): up to 50 submissions/month — full feature access. Starter (€39/mo): up to 500 submissions/month. Pro (€149/mo): up to 2,000 submissions/month. Enterprise (€399/mo): up to 6,000 submissions/month and unlimited sites; a named contact and other contract terms are agreed on request. Support is by email on every plan.' },
    { category: 'AI Behavior', q: 'Will conversational booking convert better than my current form?', a: 'Head-to-head A/B testing is the only honest answer. Typelessity does not include A/B testing tooling — to measure lift, run the widget and your existing form side by side with your own analytics. We do not publish a hero conversion-lift number on this site because every claim of that shape we have seen in the AI-booking space is either uncited or based on a study with assumptions that do not transfer.' },
    { category: 'Product', q: 'What industries is Typelessity best for?', a: 'Any service business that takes appointments. Production verticals include beauty salons, legal practices, real estate, automotive services, hospitality, education, fitness, pet services, home services, travel, and more. The same engine handles every vertical — configuration changes the field schema, prompts, and enrichments per tenant.' },
    { category: 'Product', q: 'Does Typelessity work for AI agents (not humans)?', a: 'Not through a dedicated endpoint yet. We publish stable JSON schemas for sessions and bookings on /for-ai-agents. A dedicated /agent endpoint (a synchronous turn-by-turn API with the same field-extraction pipeline) is designed there, but it is not built and has no release date.' },

    // ── Security ──
    { category: 'Security', q: 'Is data encrypted in transit and at rest?', a: 'Yes. Every connection the service receives and makes uses TLS — browser to service, service to database, service to each sub-processor — and a booking endpoint must be an https:// URL; plain http:// is refused. The database is encrypted at rest by the database platform, and integration secrets you store, such as an API key for your booking system, carry a second, application-level AES-256-GCM encryption on top.' },
    { category: 'Security', q: 'Where is conversation data physically stored?', a: 'Our own storage is in the EU. The service runs on Vercel in Frankfurt (fra1) and the database is Supabase on AWS in Ireland (eu-west-1). Two providers process outside the EEA: OpenAI (conversation understanding and speech-to-text) and Resend (delivery of request emails), both in the United States under the 2021 Standard Contractual Clauses. Appendix B of the Typelessity DPA names each one.' },
    { category: 'Security', q: 'How long is conversation data retained?', a: 'An abandoned conversation — no booking and no activity for 24 hours — is removed by a job that runs once a night, so it is gone within 48 hours of the visitor\'s last message. A conversation that led to a booking or a forwarded request has no automatic expiry: it is kept until the business erases it. The record that the visitor consented, with their IP address and browser, is kept for 3 years and then deleted by the same nightly job. Voice audio is never saved — it exists only while it is being transcribed.' },
    { category: 'Security', q: 'Is OpenAI training on my customer conversations?', a: 'No. OpenAI does not use data sent to its API to train its models unless the account opts in, and ours has not. OpenAI keeps the text for up to 30 days to check for abuse, then deletes it — the consent notice in the widget tells every visitor this. The Typelessity DPA also forbids us from using conversation content to train any AI model, ours or anyone else\'s.' },
    { category: 'Security', q: 'What is the breach notification process?', a: 'We notify the business without undue delay and in any event within 48 hours of becoming aware of a personal data breach, add details in phases as they are established, and help the business meet its own 72-hour deadline to the supervisory authority. Security reports: info@webappski.com.' },

    // ── Compliance ──
    { category: 'Compliance', q: 'Do you provide a DPA (Data Processing Agreement)?', a: 'Yes. A standard GDPR-compliant DPA is included with the pilot package. We also accept customer-provided DPAs with a 5–10 business-day review turnaround.' },
    { category: 'Compliance', q: 'Which sub-processors does Typelessity use?', a: 'The current list is Appendix B of the Typelessity DPA, published at /legal/sub-processors: Vercel (hosting, EU — Frankfurt), Supabase (database, EU — AWS Ireland), OpenAI (conversation understanding and speech-to-text) and Resend (delivery of request emails). Each entry names the contracting entity, where the data is processed and the transfer mechanism. Changes are notified at least 30 days in advance.' },
    { category: 'Compliance', q: 'How do I handle right-to-erasure (GDPR Article 17) requests?', a: 'Send a written instruction to info@webappski.com naming the conversation. We erase the conversation and its messages and strip the personal content from its delivery record, leaving a skeleton with no visitor data (status and timing) so you keep proof of what was delivered. A copy already delivered to your own mailbox or system is yours to delete. Requests covering more than one conversation are handled within 10 working days.' },
    { category: 'Compliance', q: 'Does the widget use analytics or cookies, and does consent depend on the visitor\'s region?', a: 'No analytics and no cookies. The widget asks every visitor for consent before the assistant works — typing or speaking — the same way in every region; there is no region-specific mode. The consent is recorded on our side and remembered in the visitor\'s browser storage so they are not asked again, and it can be withdrawn at any time from the privacy panel inside the widget.' },
    { category: 'Compliance', q: 'Is Typelessity certified for US healthcare (HIPAA)?', a: 'No, and we don\'t target US healthcare. The widget is configurable for non-US health-adjacent flows (wellness, fitness, EU clinics under GDPR) but US healthcare with HIPAA/BAA requirements is an explicit non-goal until we ship the relevant attestation.' },

    // ── For Developers ──
    { category: 'For Developers', q: 'What does the embed snippet look like in production?', a: 'Two lines: a <script type="module"> tag that loads the widget from typelessity-widget.vercel.app, and a <typelessity-widget api-url="https://typelessity.vercel.app"> element where the widget should appear. It is a web component, so the same code works in plain HTML, WordPress, React or Vue; the Install step in the Webappski portal shows the exact code for your platform.' },
    { category: 'For Developers', q: 'How does the widget submit to my backend?', a: 'Two options: (a) Webhook — the widget POSTs the structured Booking JSON to your endpoint with optional HMAC signature; (b) REST POST — you provide the endpoint shape and field mapping in your config and the widget calls it directly from the browser with a short-lived token.' },
    { category: 'For Developers', q: 'What is the JSON shape of a submitted booking?', a: 'Stable schema: `{ bookingId, sessionId, fields: {...}, submittedAt, status }`. Full schemas (Session, Booking, /agent request/response) are published on /for-ai-agents and version-pinned with a `schemaVersion` field.' },
    { category: 'For Developers', q: 'Can I customize the AI prompt itself?', a: 'You customize via `aiHint` per field — a short instruction telling GPT what each field means semantically. The system prompt is single, unified, and not editable per tenant; that\'s the architectural guarantee that gives us anti-hallucination behavior and predictable latency.' },
    { category: 'For Developers', q: 'How does cascade-aware correction work?', a: 'Field dependencies are declared in config (e.g. `doctor depends_on specialty`). When the user changes an upstream field, the system walks the dependency graph via DFS and clears downstream-stale values. Destructive cascades surface a confirmation: "Changing specialty will clear doctor and time slot — proceed?"' },
    { category: 'For Developers', q: 'What happens if an enrichment API call fails?', a: 'Non-fatal. Each enrichment has a 10-second timeout. On failure, the widget falls back to asking the user directly (e.g. "I couldn\'t fetch doctor list — please type the doctor name"). Errors are logged with full context for your debugging.' },
    { category: 'For Developers', q: 'Is there an /agent endpoint for autonomous AI agents?', a: 'Not yet. Its design is published on /for-ai-agents: a synchronous turn-by-turn API with the same field-extraction pipeline as the human-facing widget, just without the chat UI. It is not built and has no release date.' },
    { category: 'For Developers', q: 'How do I test the integration before going live?', a: 'Every pilot includes a dev tenant with a test booking endpoint. You receive synthetic-data conversations to validate field mapping, webhook delivery, error handling, and rollback behavior before pointing the widget at your production submit URL.' },

    // ── Competitor Migration ──
    { category: 'Competitor Migration', q: 'We use Calendly today — how do we migrate?', a: 'You keep Calendly for the slot pick if it works for you; Typelessity replaces the intake form that captures specialty, requirements, contact info, and dietary/insurance details before the slot. Hybrid integration: Typelessity submits the intake JSON to your CRM or directly into Calendly\'s webhook.' },
    { category: 'Competitor Migration', q: 'We use SimplyBook.me — what changes?', a: 'SimplyBook stays as your booking backend (calendar, staff, payments). Typelessity replaces only the front-end form. The migration is one config: map Typelessity field outputs to SimplyBook\'s booking API. Typical setup time: 1 day.' },
    { category: 'Competitor Migration', q: 'We have a custom HTML form — how do we replace it?', a: 'Field mapping in your tenant config maps Typelessity extraction output to your existing API\'s expected JSON shape. We never ask you to rewrite the backend. If your form is multi-step with conditional fields, the cascade dependency feature replaces the conditional logic on the front-end side.' },
    { category: 'Competitor Migration', q: 'We tried Botpress and it was hard — what is different about Typelessity?', a: 'Botpress is a chatbot framework: you build the flow yourself, you maintain it. Typelessity is ready-made — you set up a booking-specific flow yourself in the portal wizard, with code-side guards already wired up: fields outside your configuration are dropped and a changed value becomes a correction. Use Botpress when you need a custom general-purpose bot; use Typelessity when the use case is bookings specifically.' },
    { category: 'Competitor Migration', q: 'We use NoForm.ai for lead capture — does Typelessity replace it?', a: 'Different layer. NoForm is top-of-funnel marketing lead capture; Typelessity is structured booking with all required fields completed before submit. Many customers use both: NoForm on the marketing site, Typelessity on the booking page.' },
    { category: 'Competitor Migration', q: 'How does Typelessity compare to Acuity Scheduling?', a: 'Acuity is in the same class as Calendly — strong for slot picking, weak for multi-field intake. Typelessity replaces the intake; Acuity can stay as the slot backend. If your bookings are simple (1 service, 1 duration, just pick a time), Acuity alone is fine — use Typelessity when bookings have 5+ fields.' },
    { category: 'Competitor Migration', q: 'We use Setmore — when should we switch?', a: 'When your bookings have grown past simple slot-picking. Setmore handles the calendar well; Typelessity adds natural-language intake on top. Migration is the same as SimplyBook: keep Setmore as backend, replace the intake form. Typical setup: 1 day.' },
    { category: 'Competitor Migration', q: 'We already have a chatbot — can it coexist?', a: 'Yes. Typelessity is booking-specific and routable. A general chatbot can hand off to Typelessity when intent classification detects a booking ("I want to schedule X"). The handoff is a single redirect with optional context pre-fill via URL params.' },
  ] as const satisfies readonly { category: FaqCategory; q: string; a: string }[],
} as const;
