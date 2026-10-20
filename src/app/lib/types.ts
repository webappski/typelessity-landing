export interface IndustryHero {
  eyebrow?: string;
  /** The capsule under the H1: the first sentence says what Typelessity adds to this kind of website. */
  subtitle: string;
  cta?: { primary: string; secondary: string };
}

export interface IndustryConversation {
  lang: string;
  user: string;
  extracted: Record<string, unknown>;
}

export interface IndustryFAQ {
  q: string;
  a: string;
}

export interface IndustryDemo {
  name: string;
  url: string;
}

export interface IndustryContent {
  slug: string;
  category: string;
  name: string;
  /** The tail of the title and the H1: «AI booking widget for <audience> — Typelessity», «AI booking assistant for <audience>». */
  audience: string;
  /** Meta, Open Graph and the Service markup; at most 155 characters. */
  description: string;
  hero: IndustryHero;
  /** A real sentence a customer of this trade says; shown as a bubble under the H1. Left out where the old headline was not one. */
  quote?: string;
  /** What gets in the way of taking a booking request in this trade (no numbers, no market claims). */
  challenges?: string[];
  article: { slug: string; title: string };
  /** A demo website with the widget on it. Left out until the widget is on the demo site. */
  demo?: IndustryDemo;
  exampleConversations?: IndustryConversation[];
  fields: string[];
  enrichments?: string[];
  proofPoints: string[];
  industryFAQ?: IndustryFAQ[];
  jsonLd?: Record<string, unknown>;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  ogImage?: string;
  body: string;
}

/** One post as a list shows it: no body. The source is blog-index.generated.ts (tools/build-blog-index.ts). */
export interface BlogIndexEntry {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
}
