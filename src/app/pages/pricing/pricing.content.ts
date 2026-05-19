// Pricing page content (EN). Translations to ru/de/pl pending.

export const PRICING_FAQ = [
  { q: 'Is the Pilot really free?', a: 'Yes. Free for early adopters with full access to every feature: 25+ languages, voice input, enrichment APIs, custom branding, webhook integration, and 1–2 day personal onboarding. No credit card required.' },
  { q: 'How long can I stay on Pilot?', a: 'There is no hard time limit. We invite teams to upgrade to Enterprise once their booking volume justifies an SLA, dedicated account manager, or on-premise deployment.' },
  { q: "What's included in onboarding?", a: 'Day 1: client spec interview (your fields, options, enrichments, branding). Day 2: config JSON generated, you drop one HTML script tag onto your page, we hook your booking endpoint. Live in 1–2 days.' },
  { q: 'Do you charge per booking, per session, or per AI call?', a: 'Pilot: no charges. Enterprise: pricing is structured per booking volume tier with no per-AI-call surprises. We absorb GPT cost variance.' },
  { q: 'Can I run my own GPT key?', a: 'Yes on Enterprise. The AI provider can be swapped between OpenAI, Azure OpenAI, or any OpenAI-compatible endpoint.' },
  { q: 'What happens if GPT is down?', a: 'The widget falls back to a minimal form path (the same fields, no chat) so booking never breaks. Enrichment failures are non-fatal — the AI continues with whatever data it has.' },
  { q: 'Do you store user input?', a: 'Sessions are retained per your retention policy (default 30 days). Right-to-erasure supported via session deletion API. No data is used for model training.' },
  { q: 'Can I cancel anytime?', a: 'Pilot has no commitment — leave whenever. Enterprise contracts are annual but include a 30-day exit clause if the SLA is missed.' },
] as const satisfies readonly { q: string; a: string }[];
