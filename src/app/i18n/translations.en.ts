// EN — chrome strings used by header/footer.
// Page content (home, how-it-works, pricing, faq, about, for-ai-agents, industries, blog, legal)
// is currently hardcoded in components for English. Translation to ru/de/pl is a content task —
// see TODO(translate) markers in the corresponding *.content.ts and *.component.ts files.

import type { TranslationMap } from './translation.types';

export const EN: TranslationMap = {
  // ── Navigation ──
  'nav.howItWorks': 'How It Works',
  'nav.industries': 'Industries',
  'nav.pricing': 'Pricing',
  'nav.faq': 'FAQ',
  'nav.blog': 'Blog',
  'nav.about': 'About',
  'nav.getStarted': 'Get Started',

  // ── Footer ──
  'footer.tagline': 'AI conversational booking widget. Replace forms with natural chat in 25+ languages.',
  'footer.product': 'Product',
  'footer.resources': 'Resources',
  'footer.company': 'Company',
  'footer.forAiAgents': 'For AI Agents',
  'footer.contact': 'Contact',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.security': 'Security',
  'footer.parentBrand': 'A product of Webappski. Sister product: TypelessForm.',

  // ── SEO meta (title is suffixed with " — Typelessity" by SeoService; descriptions ≤155 chars) ──
  'seo.home.title': 'Bookings through conversation, not forms',
  'seo.home.description': 'AI booking widget that replaces forms with chat. 25+ languages, voice input, configurable per industry. Single-call extraction, GDPR-native, live in 1–2 days.',
  'seo.howItWorks.title': 'How it works — 4 phases · single GPT call · enrichment APIs',
  'seo.howItWorks.description': 'Chat → Select → Review → Confirm. One GPT call per turn, 200–800ms latency, real-time enrichment APIs, cascade-aware corrections, no hardcoded regex.',
  'seo.pricing.title': 'Pricing — Pilot (Free) + Enterprise',
  'seo.pricing.description': 'Free Pilot for early adopters with full access. Custom Enterprise with SLA, dedicated account manager, on-premise deployment, EU data residency.',
  'seo.industries.title': 'Industries — AI booking for service verticals',
  'seo.industries.description': 'Configured for medical, legal, beauty, hospitality, real estate, automotive and more. Same engine, different config per industry.',
  'seo.faq.title': 'FAQ — Common questions',
  'seo.faq.description': 'Self-contained answers about Typelessity — product, pricing, AI behavior, integration, privacy. First sentence works as a stand-alone citation.',
  'seo.about.title': 'About — Forms are an artifact of constrained UI',
  'seo.about.description': 'Typelessity is built on one bet: when users describe what they need in their own words, conversion goes up — and the architecture is simpler.',
  'seo.forAiAgents.title': 'For AI agents — stable JSON contracts + /agent endpoint',
  'seo.forAiAgents.description': 'Typelessity is callable by autonomous agents. Stable Session and Booking JSON schemas, dedicated /agent/turn endpoint, machine-readable feature list.',
  'seo.blog.title': 'Blog — Conversational booking, AI agents, integration patterns',
  'seo.blog.description': 'Articles on replacing forms with chat, GPT-driven extraction, multi-language UX, enrichment patterns, and the agent web.',
};
