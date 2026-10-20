// Home page content (EN), L4 (2026-10-20): the page of the redesign mock (build.mjs «HOME») on the words of seo-lead §2.1 and the
// corrections of the card. What is NOT here: the TL;DR, the old stats strip, the four phases and the six pillars (they live on
// /how-it-works: how-it-works.content.ts), the table of vendors (one owner: the article best-ai-booking-widgets-2026), the tier
// grid (/pricing) and the FAQ (/faq: faq.content.ts — the home page draws six of its questions by their exact text).
// Numbers are derived from the data they count: the languages from LANDING_LANGUAGES, the pilot and the Starter price from
// HOME.pricing.tiers (= the product's developer-tiers.ts, e2e/pricing-faq-facts.spec.ts compares), the phases from HOW.

import { LANDING_LANGUAGES } from '../../core/languages/landing-languages';
import { HOW } from '../how-it-works/how-it-works.content';

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

const PRICING = {
  title: 'Simple, Transparent Pricing',
  sub: 'Choose the plan that fits your business needs.',
  // The numbers are the product's (packages/api/src/lib/developer-tiers.ts: 50/500/2000/6000 booking requests a month,
  // 1/5/10/unlimited sites, 0/39/149/399 €); e2e/pricing-faq-facts.spec.ts reads that file and compares. `period` is
  // drawn on /pricing only; the home page draws the pilot plaque (50 and the Starter price come from here) and no tier grid (L4, D9).
  tiers: [
    {
      name: 'Free Pilot', price: '€0', sub: 'Test Typelessity on your site risk-free.',
      comingSoon: false,
      bullets: [
        'Up to 50 booking requests a month',
        'Customers speak or type their request',
        '1 site',
        'Support by email',
      ],
      // comingSoon: true renders a disabled «Coming soon» button instead of the link.
      cta: 'Start free pilot', slug: 'free-pilot',
    },
    {
      name: 'Starter', price: '€39', period: '/ month', sub: 'Perfect for small businesses.',
      comingSoon: false,
      bullets: [
        'Up to 500 booking requests a month',
        'Customers speak or type their request',
        'Up to 5 sites',
        'Support by email',
      ],
      cta: 'Start with the free pilot', slug: 'starter',
    },
    {
      name: 'Pro', price: '€149', period: '/ month', sub: 'For growing companies with higher volume.',
      comingSoon: false,
      bullets: [
        'Up to 2,000 booking requests a month',
        'Customers speak or type their request',
        'Up to 10 sites',
        'Support by email',
      ],
      cta: 'Start with the free pilot', slug: 'pro',
    },
    {
      name: 'Enterprise', price: '€399', period: '/ month', sub: 'For large organizations with high volume and contract terms.',
      comingSoon: false,
      bullets: [
        'Up to 6,000 booking requests a month',
        'Customers speak or type their request',
        'Unlimited sites',
        'Support by email',
      ],
      cta: 'Start with the free pilot', slug: 'enterprise',
    },
  ] as const,
} as const;

/** «Up to 50 booking requests a month» → 50 (the first bullet of the pilot tier is the one place the number is written). */
export const PILOT_REQUESTS = /\d+/.exec(PRICING.tiers[0].bullets[0])![0];
const STARTER_PRICE = PRICING.tiers[1].price;
const LANGUAGE_COUNT = LANDING_LANGUAGES.length;

export const HOME = {
  hero: {
    chip: 'AI booking assistant for your website',
    h1Lead: 'Customers just say it.',
    h1Grad: 'You get the booking request.',
    // seo-lead §2.1 (the first sentence names the category) with the card's R1: the condition on the API stays in the same sentence as
    // the booking system — «by email or, if your booking system has an API, straight into it».
    capsule: `Typelessity is an AI booking assistant for your website. Customers say what they want to book, by voice or text, in their own words. You get a booking request with the details filled in (for example service, date, time, name and phone), by email or, if your booking system has an API, straight into it. The chat window comes in ${LANGUAGE_COUNT} languages.`,
    cta: { primary: 'Get it free', secondary: 'Try the chat now' },
    trust: [
      `Free pilot: ${PILOT_REQUESTS} booking requests a month, no time limit.`,
      'Your customers are asked for consent before the chat starts.',
    ],
  },

  chain: {
    kicker: 'Behind the chat',
    h2Lead: 'What your customer says becomes',
    h2Grad: 'a booking request',
    // build-lib.mjs chainBand + «, if it has an API» (K7: a promise about the booking system carries its condition).
    lead: 'The customer just says what they need, out loud or typed, the way they would to a person. Typelessity pulls out the details your business needs, asks your booking system what is free, if it has an API, shows the answer in the chat and sends you the booking request.',
    caps: { understood: 'Understood', answered: 'Your booking system answered', delivered: 'Delivered to you' },
    cards: {
      understood: 'What the assistant understood',
      sentHead: 'After “Send”',
      sentEmail: 'By email · New booking request',
    },
    plain: [
      ['Customer says', ''],
      ['Typelessity extracts', 'Service: balayage + haircut · hair length: long · date: next Tuesday · time of day: morning.'],
      ['Your system returns', ''],
      ['You receive', 'The booking request with all its details, by email or, if you connect one, straight into your booking system through its API (REST).'],
    ] as const,
    returnsTail: 'sends back three free slots; the customer taps one, adds a name and a phone number, and checks everything before the request is sent to you.',
  },

  whatItIs: {
    kicker: 'What it is',
    h2Lead: 'A chat on your site',
    h2Grad: 'instead of a form',
    sub: 'Customers describe what they want to book, by voice or text. The assistant picks out the details, checks your booking system for what is free, if it has an API, and sends you the booking request by email or straight into your booking system.',
    stats: [
      { n: String(LANGUAGE_COUNT), l: 'Languages of the chat window' },
      { n: PRICING.tiers[0].price, l: `Free pilot, up to ${PILOT_REQUESTS} booking requests a month` },
      { n: String(HOW.phases.length), l: `Steps: ${HOW.phases.map((p) => p.name).join(' → ')}` },
    ] as const,
    // the fourth number is the lines of the embed code: derived in the component from EMBED_SNIPPET
    codeLabel: 'Of code your web developer pastes on your site',
    facts: [
      ['Replaces', 'Multi-step booking forms and dropdowns'],
      ['Works with', 'Your booking system through its API (REST), set up by your web developer. No API: you get the request by email. Nothing to migrate.'],
      ['On phones', 'The chat adapts to small screens, and voice recording has its own settings for iPhone and Safari. Customers can type or speak.'],
      ['Consent', 'Asked before the chat starts. Service and database in the EU; OpenAI and Resend in the US under the 2021 SCCs; DPA included.'],
    ] as const,
  },

  steps: {
    kicker: 'How it works',
    h2Lead: 'How a',
    h2Grad: 'booking goes',
    sub: 'The same three beats on every website — what your customer does, what the assistant does, what you get.',
    one: { title: 'Your customer says it their way', say: 'Hi! Can I come in on Saturday at 2 pm?', note: 'typed or spoken · in your customer’s own language' },
    two: { title: 'The assistant asks what’s missing', reply: 'Of course! What would you like?', options: ['Haircut', 'Beard trim', 'Colouring'], note: '…then your name and phone' },
    three: {
      title: 'You get a booking request',
      head: 'BOOKING REQUEST',
      rows: [['Service', 'Haircut'], ['When', 'Sat, 14:00'], ['Name', 'Kasia'], ['Phone', '+48 ••• ••• 200']] as const,
      // D11: the label of the details is not promised until F-111 ships
      note: 'The customer checks these details and sends them; you get them by email or in your booking system',
    },
    more: 'See the four phases and how the AI works →',
  },

  // L11 (founder 20.10): the site names no industry page and links to none; it says the setup adapts to any business that takes bookings.
  // The examples are plain text, not links.
  business: {
    kicker: 'Any business',
    h2Lead: 'One engine,',
    h2Grad: 'set up for your business',
    sub: 'Typelessity adapts to any business that takes bookings. You choose the details the chat collects, and the same engine does the rest.',
    examples: ['Hair and beauty salons', 'Auto repair shops', 'Gyms and yoga studios', 'Driving schools', 'Tutors', 'Restaurants'] as const,
    rest: 'and any other business that takes bookings',
    more: 'See how to add it to your site →',
  },

  data: {
    kicker: 'Your data',
    h2Lead: 'Consent first.',
    h2Grad: 'Service and database in the EU.',
    sub: 'Three facts from the DPA. The full list, with who processes what and where, is on its own page.',
    link: 'Your customers’ data in Typelessity',
    // Every sentence below is a sentence of /gdpr (gdpr.content.ts): home-page.spec holds that each is there.
    cards: [
      { h: 'Consent before the chat starts', p: 'The assistant needs consent to work at all, typing and speaking alike. The visitor can withdraw consent at any time from the privacy panel inside the widget.' },
      { h: 'Service and database in the EU', p: 'The service runs in the EU (Vercel, Frankfurt) and the database is in the EU (Supabase, Ireland). OpenAI processes data in the United States under the 2021 Standard Contractual Clauses, and Resend under the EU–US Data Privacy Framework and the 2021 SCCs.' },
      { h: 'No training on your conversations', p: 'Under the DPA, Typelessity does not train models on conversation content. OpenAI keeps conversation text for up to 30 days to check for abuse, then deletes it.' },
    ] as const,
  },

  plaque: {
    label: 'Free pilot',
    unit: 'booking requests a month · no time limit',
    primary: 'Get it free',
    more: `Then from ${STARTER_PRICE} a month — see all plans →`,
  },

  blog: {
    kicker: 'Blog',
    h2Lead: 'From the',
    h2Grad: 'blog',
    // title and category from the manifest (src/app/lib/blog-manifest.generated.ts); the order is this list's
    slugs: ['best-ai-booking-widgets-2026', 'best-ai-booking-beauty-salons-2026', 'single-gpt-call'] as const,
    more: 'All articles →',
    read: 'Read →',
  },

  faq: {
    kicker: 'FAQ',
    h2Lead: 'Common',
    h2Grad: 'questions',
    more: 'All answers, by topic →',
    // D8 (FL-28): six questions of /faq, found in FAQ_GROUPS by their exact text; the answer shown is the answer of /faq.
    questions: [
      'Which languages does the chat speak?',
      'Does it work on phones?',
      'What is a booking widget?',
      'Does Typelessity replace my booking system?',
      'How does Typelessity handle GDPR?',
      'How much does Typelessity cost?',
    ] as const,
  },

  languages: {
    kicker: 'Languages',
    h2Lead: 'The chat window speaks',
    h2Grad: `${LANGUAGE_COUNT} languages`,
    sub: `The same booking assistant works for a salon in Gdańsk, a garage in Munich or a restaurant in Madrid. The chat window, its buttons and its messages come in these ${LANGUAGE_COUNT} languages:`,
    facts: [
      ['The chat window', 'Buttons, prompts and messages appear in the language set for your business. Without one, the window follows the visitor’s browser language.'],
      ['The assistant’s replies', 'The assistant answers in the language you set for your business.'],
      ['The booking request', 'You get the booking request with the details filled in.'],
    ] as const,
    // the link text is the title of the article (manifest): «<title> →»
    article: { slug: '25-languages-one-prompt' },
  },

  cta: {
    eyebrow: 'Replace forms with chat',
    title: 'Try it free on your website',
    sub: `Free pilot: up to ${PILOT_REQUESTS} booking requests a month with no time limit. Set it up step by step in the Webappski portal.`,
    primary: 'Get it free',
    secondary: 'See how it works',
    install: 'See the install steps →',
    codeLabel: 'Embed code',
  },

  pricing: PRICING,
} as const;
