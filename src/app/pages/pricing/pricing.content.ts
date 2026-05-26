// Pricing page content (EN). Translations to ru/de/pl pending.

export const PRICING_FAQ = [
  { q: 'When does Typelessity launch?', a: 'Typelessity is in private development and launches soon. All four tiers — Free Pilot ($0), Starter ($39/mo), Pro ($149/mo), and Enterprise ($399/mo) — will become available at the same time. Join the waitlist to be notified the moment it goes live.' },
  { q: 'What does the Free Pilot include?', a: 'Up to 50 submissions/month, full access to every feature (25+ languages, voice input, enrichment APIs, custom branding, webhook integration), and email support. It is intended for risk-free evaluation on a real site.' },
  { q: 'How are paid plans different?', a: 'Starter ($39/mo, up to 500 submissions/month, standard support). Pro ($149/mo, up to 2,000 submissions/month, priority support). Enterprise ($399/mo, up to 6,000 submissions/month, dedicated success manager). All plans share the same engine; the tier defines volume and support level.' },
  { q: "What's included in onboarding?", a: 'Step 1: client spec interview (your fields, options, enrichments, branding). Step 2: config JSON generated. Step 3: you drop one HTML script tag onto your page. Step 4: we hook your booking endpoint. Typically live within a couple of hours after launch.' },
  { q: 'Do you charge per booking, per session, or per AI call?', a: 'Paid tiers are structured per submission volume per month — no per-AI-call surprises. We absorb GPT cost variance.' },
  { q: 'Can I run my own GPT key?', a: 'No, not currently. Typelessity manages the AI provider on its infrastructure. Bringing your own OpenAI or Azure OpenAI key is planned for a future Enterprise tier.' },
  { q: 'What happens if GPT is down?', a: 'The widget falls back to a minimal form path (the same fields, no chat) so booking never breaks. Enrichment failures are non-fatal — the AI continues with whatever data it has.' },
  { q: 'Do you store user input?', a: 'Sessions will be retained per your retention policy (default 30 days). Right-to-erasure supported via session deletion API. No data is used for model training.' },
  { q: 'Is there a commitment?', a: 'No. Pilot is free and capped at 50 submissions/month. Paid plans bill monthly with no long-term commitment unless you choose an annual contract for a discount.' },
] as const satisfies readonly { q: string; a: string }[];
