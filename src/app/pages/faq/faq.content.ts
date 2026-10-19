// FAQ page content (EN), L6. The seven groups of the mock (build.mjs «FAQ»), each linking to the page that has the full
// answer. The answers that were on the site before are kept word for word; the ones about other vendors are gone (the
// one owner of vendor facts is the article best-ai-booking-widgets-2026, L9). Home keeps only its Product preview in
// HOME.faq (L4).
import { LANDING_LANGUAGES } from '../../core/languages/landing-languages';

export interface FaqItem { readonly q: string; readonly a: string }
export interface FaqGroup {
  /** the anchor: #product, #ai-behavior, … */
  readonly id: string;
  readonly title: string;
  /** the page that has the full answer */
  readonly more: { readonly href: string; readonly label: string; readonly external?: true };
  readonly items: readonly FaqItem[];
}

const LANGUAGES_ANSWER = `The chat window comes in 25 languages: ${LANDING_LANGUAGES.map((l) => l.english).join(', ')}. The assistant answers in the language you set for your business. Customers can type or speak their request, and you get the booking request with the details filled in.`;

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: 'product',
    title: 'Product',
    more: { href: '/how-it-works', label: 'How Typelessity works' },
    items: [
      { q: 'What is Typelessity?',
        a: 'Typelessity is an AI booking assistant, delivered as a booking widget you put on your website. It replaces multi-step booking forms with one natural-language chat, by voice or text, and sends you a booking request. Customers can speak or type in their own language. If your booking system has an API, it also checks what is free.' },
      { q: 'What is a booking widget?',
        a: 'A booking widget is a small piece of code on your website where customers ask for an appointment. Typelessity\'s widget is a chat: customers say what they want, by voice or text, and you get a booking request.' },
      { q: 'Is Typelessity an AI receptionist?',
        a: 'It does the front-desk part of taking a booking: it listens to what the customer wants, asks for what is missing and hands you a booking request. It works on your website, by voice or text, not on the phone: it does not answer calls, WhatsApp or SMS.' },
      { q: 'Does Typelessity replace my booking system?',
        a: 'No. It replaces the booking form, not the backend. Your CRM, calendar and payment processor stay exactly as they are.' },
      { q: 'Does Typelessity work for AI agents (not humans)?',
        a: 'Not through a dedicated endpoint yet. We publish the JSON shapes of a session and a booking on /for-ai-agents. A dedicated /agent endpoint (a synchronous turn-by-turn API with the same field-extraction pipeline) is designed there, but it is not built and has no release date.' },
    ],
  },
  {
    id: 'ai-behavior',
    title: 'AI behavior',
    more: { href: '/how-it-works', label: 'How the AI works' },
    items: [
      { q: 'Which languages does the chat speak?', a: LANGUAGES_ANSWER },
      { q: 'Does Typelessity support voice input?',
        a: 'Yes. Users tap the microphone and speak; the transcription goes through the same extraction as typed text.' },
      { q: 'Does it work on phones?',
        a: 'It adapts to small screens: the chat changes its layout at widths of 520 px and 380 px, and voice recording has its own settings for iPhone and Safari. Customers can type or speak.' },
      { q: 'How accurate is the data extraction?',
        a: 'Typelessity uses OpenAI (currently gpt-5.4-mini) with a unified prompt that reads each field\'s aiHint. We have not published a measured extraction accuracy for the current model, so we do not quote one. The system never uses hardcoded regex patterns — GPT reads the config and extracts based on semantic context. Code-side guards drop any field the configuration does not define, and the visitor reviews every field before the booking is sent.' },
      { q: 'What does \'enrichment\' mean?',
        a: 'Enrichment is an API call that triggers when a specific field is filled. For example: when a user asks for brake pads, Typelessity calls GET /mechanics?service=brakes, receives a list of mechanics, and presents them as interactive cards. Each call times out after 10 seconds by default (configurable). Failures are non-fatal — the AI falls back to asking the user directly.' },
      { q: 'How does Typelessity handle corrections?',
        a: 'If a user changes a previously filled field, the system detects the correction (GPT signals it via a "correction" key), then walks the dependency graph and clears any downstream fields that depended on the changed value. Destructive cascades show a confirmation: "Changing X will also clear Y, Z. Proceed?"' },
      { q: 'What is the per-turn latency?',
        a: 'We have not measured it on the current model, so we do not quote a number. Each turn makes one AI call to OpenAI (currently gpt-5.4-mini); when an enrichment triggers, a second call presents the API results, which adds time.' },
      { q: 'Will conversational booking convert better than my current form?',
        a: 'Head-to-head A/B testing is the only honest answer. Typelessity does not include A/B testing tooling — to measure lift, run the widget and your existing form side by side with your own analytics. We do not publish a hero conversion-lift number on this site because every claim of that shape we have seen in the AI-booking space is either uncited or based on a study with assumptions that do not transfer.' },
    ],
  },
  {
    id: 'integration',
    title: 'Integration',
    more: { href: '/install', label: 'Install steps' },
    items: [
      { q: 'Does it connect to Booksy, Google Calendar or Calendly?',
        a: 'Not with a ready-made connector yet. If your booking system has an API, your web developer connects it through a REST endpoint. If not, every booking request reaches you by email.' },
      { q: 'How long does integration take?',
        a: 'We have not measured a typical setup time, so we do not quote one. Setup is a wizard in the Webappski portal that you complete yourself.' },
      { q: 'Can I self-host Typelessity?',
        a: 'No. Typelessity is a hosted service: the service runs on Vercel in Frankfurt and the database on Supabase in Ireland, and there is no on-premise or self-hosted build. The widget is a Lit web component and the API is a Next.js service; conversations are understood by OpenAI through our account.' },
      { q: 'How does the widget submit to my backend?',
        a: 'From our server, not from the visitor\'s browser, in one of two ways: (a) your endpoint — we send the extracted fields as JSON, shaped by the field mapping in your config, with the headers you set (for example an API key) plus X-Idempotency-Key and X-Request-ID; (b) email — the request goes to the address you set. There is no HMAC signature.' },
      { q: 'What is the JSON shape of a submitted booking?',
        a: 'Your endpoint receives the extracted fields as JSON, shaped by the field mapping in your config; a field you did not map is sent under its own id. There is no separate booking envelope and no schemaVersion field.' },
      { q: 'Can I customize the AI prompt itself?',
        a: 'You customize via `aiHint` per field — a short instruction telling GPT what each field means semantically. The system prompt is single, unified, and not editable per tenant; that\'s the architectural guarantee behind the anti-hallucination guards.' },
      { q: 'What happens if an enrichment API call fails?',
        a: 'Non-fatal. Each enrichment times out after 10 seconds by default (configurable). On failure the widget shows "Failed to load data" with a Retry button and the conversation goes on; a failed enrichment is retried on later turns, up to 3 attempts. Errors are logged on our side.' },
      { q: 'How do I test the integration before going live?',
        a: 'Before you publish, the Webappski portal lets you try the widget as a customer. There is no separate test tenant and no synthetic test data: to check field mapping and delivery without touching production, point the booking endpoint at a test URL of your own first, then switch it to your production URL.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    more: { href: 'https://webappski.com/en/legal/dpa-typelessity', label: 'Read the DPA', external: true },
    items: [
      { q: 'How does Typelessity handle GDPR?',
        a: 'You are the controller and Typelessity is your processor under a DPA. The widget asks every visitor for consent before the chat starts; the service and database run in the EU; OpenAI and Resend process in the US under the 2021 SCCs.' },
      { q: 'Do you provide a DPA (Data Processing Agreement)?',
        a: 'Yes. The Typelessity DPA is accepted in the Webappski portal before any visitor data is processed.' },
      { q: 'Which sub-processors does Typelessity use?',
        a: 'The current list is Appendix B of the Typelessity DPA, published at /legal/sub-processors: Vercel (hosting, EU — Frankfurt), Supabase (database, EU — AWS Ireland), OpenAI (conversation understanding and speech-to-text) and Resend (delivery of request emails). Each entry names the contracting entity, where the data is processed and the transfer mechanism. Changes are notified at least 30 days in advance.' },
      { q: 'How do I handle right-to-erasure (GDPR Article 17) requests?',
        a: 'Send a written instruction to info@webappski.com naming the conversation. We erase the conversation and its messages and strip the personal content from its delivery record, leaving a skeleton with no visitor data (status and timing) so you keep proof of what was delivered. A copy already delivered to your own mailbox or system is yours to delete. Requests covering more than one conversation are handled within 10 working days.' },
      { q: 'Is Typelessity certified for US healthcare (HIPAA)?',
        a: 'No, and we do not target healthcare. The Typelessity DPA does not allow health data (special-category data under GDPR Article 9), so booking medical care is not a supported use case, in the US or in the EU. There is no HIPAA attestation and no BAA.' },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    more: { href: '/pricing', label: 'See the plans' },
    items: [
      { q: 'How much does Typelessity cost?',
        a: 'Free Pilot €0 (50 booking requests a month), Starter €39 a month, Pro €149 a month, Enterprise €399 a month. Support is by email on every plan.' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    more: { href: '/legal/security', label: 'Security details' },
    items: [
      { q: 'Is stored data encrypted?',
        a: 'Stored integration secrets, such as the headers of your endpoint, are encrypted with AES-256-GCM.' },
      { q: 'Where is conversation data physically stored?',
        a: 'Our own storage is in the EU. The service runs on Vercel in Frankfurt (fra1) and the database is Supabase on AWS in Ireland (eu-west-1). Two providers process outside the EEA: OpenAI (conversation understanding and speech-to-text) and Resend (delivery of request emails), both in the United States under the 2021 Standard Contractual Clauses. Appendix B of the Typelessity DPA names each one.' },
      { q: 'How long is conversation data retained?',
        a: 'An abandoned conversation — no booking and no activity for 24 hours — is removed by a job that runs once a night, so it is gone within 48 hours of the visitor\'s last message. A conversation that led to a booking or a forwarded request has no automatic expiry: it is kept until the business erases it. The record that the visitor consented, with their IP address and browser, is kept for 3 years and then deleted by the same nightly job. Voice audio is never saved — it exists only while it is being transcribed.' },
      { q: 'Is OpenAI training on my customer conversations?',
        a: 'No. OpenAI does not use data sent to its API to train its models unless the account opts in, and ours has not. OpenAI keeps the text for up to 30 days to check for abuse, then deletes it — the consent notice in the widget tells every visitor this. The Typelessity DPA also forbids us from using conversation content to train any AI model, ours or anyone else\'s.' },
      { q: 'What is the breach notification process?',
        a: 'We notify the business without undue delay and in any event within 48 hours of becoming aware of a personal data breach, add details in phases as they are established, and help the business meet its own 72-hour deadline to the supervisory authority. Security reports: info@webappski.com.' },
    ],
  },
  {
    id: 'competitor-migration',
    title: 'Competitor migration',
    more: { href: '/blog/best-ai-booking-widgets-2026', label: 'Compare booking tools' },
    items: [
      { q: 'We use Calendly today — how do we migrate?',
        a: 'Keep Calendly for the slot pick if you like. Typelessity does not connect to Calendly by itself: it collects the request on your site and emails it to you, or sends it to your booking system’s API.' },
    ],
  },
] as const;

export const FAQ_COUNT = FAQ_GROUPS.reduce((n, g) => n + g.items.length, 0);
