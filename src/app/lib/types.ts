export interface IndustryHero {
  eyebrow?: string;
  title: string;
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

export interface IndustryContent {
  slug: string;
  category: string;
  name: string;
  hero: IndustryHero;
  exampleConversations?: IndustryConversation[];
  fields: string[];
  enrichments?: string[];
  proofPoints: string[];
  industryFAQ?: IndustryFAQ[];
  jsonLd?: Record<string, unknown>;
}

export interface BlogPostFAQ {
  q: string;
  a: string;
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
  faqs?: BlogPostFAQ[];
  body: string;
}
