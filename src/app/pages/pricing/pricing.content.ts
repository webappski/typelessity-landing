// Pricing page content (EN). Translations to ru/de/pl pending.
// The numbers (prices, booking requests a month, sites) are the tier cards' (HOME.pricing.tiers); they come from the
// product's developer-tiers.ts and e2e/pricing-faq-facts.spec.ts reads that file. Nothing here repeats them as a literal,
// except the capsule and the answers below, which that spec reads too.

/**
 * The date of the last edit of the prices page, `YYYY-MM-DD`. One source for two readers: the visible line under the tiers («Prices last
 * updated …», pricing-page.component.ts) and the `<lastmod>` of /pricing in tools/build-sitemap.ts. e2e/sitemap-contract.spec.ts holds that the
 * two are the same day in the built bytes, and that a page is not dated before its last edit; edit anything in this folder, move this date.
 */
export const PRICING_LAST_UPDATED = '2026-10-21';

export const PRICING_PAGE = {
  kicker: 'Pricing',
  h1: 'Typelessity pricing: free pilot, then from €39',
  capsule:
    'Free Pilot €0 (up to 50 booking requests a month), Starter €39 (500), Pro €149 (2,000) and Enterprise €399 (6,000) a month. Every plan starts with the free pilot. 1, 5, 10 or unlimited sites, by plan.',
  pilotLine: 'Free pilot: 50 booking requests a month, no time limit.',
  // Counted from the product: confirm/route.ts (a confirmed request is +1), session.repository.ts (a practice run in the
  // portal has no key and is not counted), developer-key.repository.ts (the month resets on the 1st), confirm-integration.ts
  // and quota-notice.ts (past the limit a request goes to the owner by email, is not counted, and does not reach his system).
  whatCountsLabel: 'What counts:',
  whatCounts: 'one booking request your customer sends. An abandoned conversation and a practice run in the portal do not count. The count starts again on the 1st of each month.',
  afterLimitLabel: 'After the limit:',
  afterLimit:
    'requests are not refused. Each new one reaches you by email, is not counted and does not go to your booking system; whether a conversation is over the limit is decided when it starts. On Free Pilot, Starter and Pro, move to the next plan in the Webappski portal (invoiced) to keep requests going to your system.',
  install: { label: 'How to install it', href: '/install' },
  aboutH2: 'About the price',
} as const;

export const PRICING_FAQ = [
  { q: 'Is the pilot really free?', a: 'Yes. The free pilot has no time limit: up to 50 booking requests a month. You pay only if you need more.' },
  { q: 'What does Enterprise add?', a: 'Up to 6,000 booking requests a month, unlimited sites, and a named contact and other contract terms agreed on request.' },
  { q: 'How do I move to a paid plan?', a: 'Start with the free pilot. When you want a paid plan, request it under Billing in the Webappski portal; it is invoiced.' },
  { q: 'Can I run my own GPT key?', a: 'No. Typelessity runs every conversation through its own OpenAI account; using your own OpenAI key or another AI provider is not offered.' },
  { q: 'Is there an uptime commitment or a self-hosted build?', a: 'No availability SLA in the standard terms yet; one becomes possible once the hosting plans support it. Typelessity is hosted by us; there is no on-premise or self-hosted build.' },
] as const satisfies readonly { q: string; a: string }[];
