// The words of /gdpr (L7). Every figure and name here is read from the code of the product and from the DPA (appendix B) by
// e2e/gdpr-facts.spec.ts: the hours, the years, the region, the four processors, the transfer basis, the storage the widget uses.
// This page is our description of our own data path; it is not legal advice, and it says so.

export const GDPR_DPA_URL = 'https://webappski.com/en/legal/dpa-typelessity';
export const GDPR_NOTICE_URL = 'https://webappski.com/en/legal/privacy-typelessity';

export const GDPR = {
  kicker: 'Your data',
  h1: 'Your customers’ data in Typelessity',
  // seo-lead §2.4, capsule of the mock with one correction from the DPA: Resend sits under the EU–US Data Privacy Framework and the SCCs.
  capsule:
    'Typelessity asks for consent before the chat starts. The service’s functions run in the EU (Vercel, Frankfurt) and the database is in the EU (Supabase, Ireland); Vercel’s network receives each request at the point nearest the visitor. OpenAI processes data in the United States under the 2021 Standard Contractual Clauses, and Resend under the EU–US Data Privacy Framework and the 2021 SCCs. OpenAI keeps conversation text for up to 30 days to check for abuse, longer only where the law requires it or to protect its service or others from harm. Under the DPA, Typelessity does not train models on conversation content.',

  consent: {
    h2: 'The visitor is asked before the chat starts',
    sub: 'The assistant needs consent to work at all, typing and speaking alike. If the visitor declines, the assistant closes and the rest of your website keeps working.',
    body: [
      'The question is the same in every region. The visitor can withdraw consent at any time from the privacy panel inside the widget. On your site, where the widget runs with your key, our server checks the consent record before a conversation starts and again on every message.',
      'In the visitor’s browser the widget keeps the consent record with a random visitor ID (local storage), and the session, the details collected so far and the screen state (session storage, cleared when the tab is closed). It sets no advertising or cross-site tracking storage.',
      'Until the next widget release, the widget asks Google Fonts (Google) for its typefaces as soon as it appears on your page, before the consent question; the visitor’s browser then sends Google its IP address and browser details. typelessity.com blocks that request with its Content-Security-Policy; your site blocks it only if its own policy does.',
      'You, the business, are the controller and decide the legal basis for your booking process. Typelessity is your processor under the DPA (GDPR Article 28).',
    ],
  },

  where: {
    h2: 'Who handles what, and where',
    head: ['What', 'Who', 'Where', 'Transfer basis'],
    rows: [
      ['Hosting of the service', 'Vercel Inc.', 'EU (Frankfurt)', '2021 Standard Contractual Clauses in the Vercel DPA'],
      ['Database: conversations, bookings, consent records', 'Supabase Pte. Ltd', 'EU (AWS, Ireland)', '2021 Standard Contractual Clauses in the Supabase DPA'],
      ['Understanding the conversation and speech-to-text', 'OpenAI Ireland Ltd', 'United States', '2021 Standard Contractual Clauses in the OpenAI DPA'],
      ['Delivery of request emails', 'Plus Five Five, Inc. (Resend)', 'United States', 'EU–US Data Privacy Framework and the 2021 Standard Contractual Clauses'],
    ],
    note: 'Appendix B of the Typelessity DPA names each provider and links its data processing agreement, where the Standard Contractual Clauses can be read. Changes are notified at least 30 days in advance.',
  },

  retention: {
    h2: 'How long it is kept',
    items: [
      'A conversation that produced no delivery record — no request was sent or attempted — is deleted within 48 hours of the visitor’s last message.',
      'A conversation that produced a delivery record — a booking request, an emailed request, or a failed or cancelled attempt — has no automatic expiry: it is kept until the business erases it. To have it erased, the business sends a written instruction to info@webappski.com; the portal has no erase button today. A request for several conversations is handled within 10 working days. The copy in the business’s own mailbox is the business’s to delete.',
      'Each record that the visitor answered the consent question (an ID, the answer, the time, the website, the language of the chat window, how consent was given, the version of the notice and of the widget, the browser’s user agent and the IP address) is kept for 3 years from that answer, then deleted by the nightly job.',
      'Voice audio is never saved: it exists only while it is being transcribed.',
      'OpenAI keeps conversation text for up to 30 days to check for abuse, longer only where the law requires it or to protect its service or others from harm. The speech-to-text step keeps no copy.',
    ],
  },

  limits: {
    h2: 'What we do not promise',
    items: [
      'Typelessity is not for health data: the DPA does not allow special-category data under GDPR Article 9. The service refuses a configuration that declares the medical business type; it does not check each field.',
      'We cannot shorten the 30 days that OpenAI keeps conversation text.',
      'There is no on-premise or self-hosted build.',
      'Stored integration secrets, such as the headers of your endpoint, are encrypted with AES-256-GCM. Other measures are on the security page.',
      'This page describes how our own service handles data. It is not legal advice.',
    ],
  },

  checks: {
    h2: 'Five checks for any AI booking widget',
    items: [
      { q: 'Where is the conversation processed and stored?', a: 'Ask for the service, the database and the AI provider by name, with the country of each. For Typelessity, see the table above.' },
      { q: 'Does the provider train on it?', a: 'Ask for the sentence in the contract. The Typelessity DPA says that conversation content is not used to train models; OpenAI keeps conversation text for up to 30 days to check for abuse, longer only where the law requires it or to protect its service or others from harm.' },
      { q: 'How is consent asked and withdrawn?', a: 'Before the chat starts, the same way in every region; withdrawn at any time from the privacy panel inside the widget.' },
      { q: 'How long are conversations kept, and how are they erased?', a: 'See “How long it is kept” above.' },
      { q: 'Which sub-processors does the DPA name?', a: 'Appendix B of the DPA lists each one, with where it processes and the basis for any transfer.' },
    ],
  },

  links: {
    h2: 'The documents',
    items: [
      { label: 'Read the DPA', href: GDPR_DPA_URL, external: true },
      { label: 'Privacy notice for visitors', href: GDPR_NOTICE_URL, external: true },
      { label: 'Privacy questions', href: '/faq#privacy', external: false },
      { label: 'Security', href: '/legal/security', external: false },
    ],
  },

  cta: { title: 'Try it free on your website', primary: 'Get it free', secondary: 'See how it works' },
} as const;
