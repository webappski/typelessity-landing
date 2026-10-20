// AUTO-GENERATED — do not edit by hand.
// Source: src/assets/content/blog/*.mdx
// Regenerate: npm run build:blog

import type { BlogIndexEntry } from './types';

export const BLOG_INDEX: BlogIndexEntry[] = [
  {
    "slug": "best-ai-booking-beauty-salons-2026",
    "title": "AI booking widgets for beauty salons, compared",
    "description": "What a hair or beauty salon needs from online booking, how booking platforms differ from a booking chat on your own site, and what to ask each vendor.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Comparison"
  },
  {
    "slug": "best-ai-booking-transfer-services-2026",
    "title": "AI booking widget for transfer services 2026",
    "description": "What a chauffeur or airport-transfer company needs from online booking, and how dispatch platforms differ from a booking chat on its own site.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Comparison"
  },
  {
    "slug": "best-ai-booking-widgets-2026",
    "title": "Best AI booking widgets for websites in 2026",
    "description": "Calendly, SimplyBook.me, Botpress, NoForm.ai and Typelessity compared: what each one is for, where it fits and when it is the wrong choice.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Comparison"
  },
  {
    "slug": "pricing-ai-products",
    "title": "Pricing an AI product: why our pilot is free",
    "description": "Free pilot with no time limit (50 booking requests a month), then Starter €39, Pro €149 and Enterprise €399 a month: our reasoning and its limits.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Business"
  },
  {
    "slug": "latency-budgets",
    "title": "A one-second latency target for AI booking",
    "description": "How Typelessity plans a one-second booking turn: model call, enrichment, render. A target, not a measurement: what is built and what is not.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Engineering"
  },
  {
    "slug": "designing-for-ai-agents",
    "title": "What typelessity.com publishes for AI agents",
    "description": "JSON-LD, llms.txt and the /for-ai-agents page: what each one says about Typelessity, what it is for, and what no AI engine has promised us.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "AEO"
  },
  {
    "slug": "whisper-vs-webspeech",
    "title": "Whisper vs Web Speech API for booking voice",
    "description": "Typelessity transcribes booking voice on its server, first with Whisper, now with gpt-4o-mini-transcribe, not in the browser. What it does and does not do.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Engineering"
  },
  {
    "slug": "cascade-corrections",
    "title": "Cascade corrections in conversational booking",
    "description": "When a customer changes one detail mid-booking, the details that depended on it must be cleared. How Typelessity tracks this and asks first.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Engineering"
  },
  {
    "slug": "25-languages-one-prompt",
    "title": "25 interface languages, one booking prompt",
    "description": "The chat window comes in 25 languages; the assistant replies in the language you set and reads what customers write. One prompt, no per-language code.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Engineering"
  },
  {
    "slug": "single-gpt-call",
    "title": "Replacing a booking form with one GPT call",
    "description": "One model call reads the customer's sentence and fills every detail it can; the chat asks only for what is missing. The architecture and its limits.",
    "publishedAt": "2026-05-21",
    "updatedAt": "2026-10-20",
    "category": "Engineering"
  }
];

export function getBlogIndexEntry(slug: string): BlogIndexEntry | undefined {
  return BLOG_INDEX.find((p) => p.slug === slug);
}
