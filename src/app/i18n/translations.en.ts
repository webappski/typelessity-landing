// EN — chrome strings used by header/footer.
// Page content (home, how-it-works, pricing, faq, about, for-ai-agents, industries, blog, legal)
// is currently hardcoded in components for English. Translation to ru/de/pl is a content task —
// see TODO(translate) markers in the corresponding *.content.ts and *.component.ts files.

import type { TranslationMap } from './translation.types';

export const EN: TranslationMap = {
  // ── Navigation ──
  'nav.howItWorks': 'How It Works',
  'nav.install': 'Install',
  'nav.pricing': 'Pricing',
  'nav.gdpr': 'Data & privacy',
  'nav.faq': 'FAQ',
  'nav.blog': 'Blog',
  'nav.about': 'About',
  'nav.getStarted': 'Get it free',

  // ── Footer ──
  'footer.tagline': 'AI conversational booking widget. Replace forms with natural chat in 25 languages.',
  'footer.product': 'Product',
  'footer.guides': 'Guides',
  'footer.allArticles': 'All articles',
  'footer.company': 'Company',
  'footer.forAiAgents': 'For AI Agents',
  'footer.contact': 'Contact',
  'footer.privacy': 'Data processing (DPA)',
  'footer.terms': 'Terms',
  'footer.security': 'Security',
  'footer.parentBrand': 'A product of Webappski. Sister product: TypelessForm.',

  // ── SEO meta (title is suffixed with " — Typelessity" by SeoService; descriptions ≤155 chars) ──
  'seo.home.title': 'AI booking assistant for your website',
  'seo.home.description': 'Typelessity is an AI booking assistant (a booking widget) for your site: customers say what they want by voice or text; you get a booking request.',
  'seo.howItWorks.title': 'How Typelessity works: from chat to booking request',
  'seo.howItWorks.description': 'Chat, select, review, send: the AI booking assistant turns one sentence into a booking request; if your booking system has an API, it asks it what is free.',
  'seo.install.title': 'Add an AI booking widget to your website',
  'seo.install.description': 'Set up Typelessity in the Webappski portal, paste two lines of HTML, and receive booking requests by email or straight into your booking system.',
  'seo.pricing.title': 'Pricing: free pilot, then €39–€399 a month — Typelessity',
  'seo.pricing.description': 'Free Pilot €0 (50 booking requests a month), Starter €39, Pro €149, Enterprise €399 a month. Every plan starts with the free pilot.',
  'seo.industries.title': 'Industries — AI booking for service verticals',
  'seo.industries.description': 'AI booking assistant pages for hair salons, restaurants, yoga studios, gyms, driving schools, auto repair and tutoring.',
  'seo.faq.title': 'Typelessity FAQ: AI booking widget, pricing, GDPR, setup',
  'seo.faq.description': 'Answers about Typelessity: what it does, AI behaviour, setup, data protection, pricing, security and switching from another booking tool.',
  'seo.gdpr.title': 'Typelessity and GDPR: consent, where data is processed',
  'seo.gdpr.description': 'Consent before the chat starts; service and database in the EU; OpenAI and Resend in the US with safeguards. Five checks for any AI booking widget.',
  'seo.about.title': 'About Typelessity, the AI booking widget by Webappski',
  'seo.about.description': 'Who builds Typelessity, how the booking assistant works and why a chat replaces the booking form.',
  'seo.forAiAgents.title': 'Typelessity for developers and AI agents: JSON shapes',
  'seo.forAiAgents.description': 'The JSON shapes of a Typelessity session and a submitted booking request, for developers and AI agents. The agent endpoint is not built yet.',
  'seo.blog.title': 'Blog: AI booking guides and comparisons',
  'seo.blog.description': 'Articles on booking by chat: how the engine works, how the pilot is priced, and how booking tools differ.',
};
