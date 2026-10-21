// /privacy — the notice (GDPR Art. 13) for a visitor of typelessity.com itself (L13, legal verdict L-2 / gate G-3, 21.10).
// DRAFT FOR THE LAWYER: the text is the draft of the legal reviewer (pending-review/2026-10-21/typelessity-landing-batch-legal-verdict.md, L-2),
// with the three gaps of the draft closed by what was read, not guessed:
//   · the controller line is the one the question form on /pricing already prints (contact-form.component.ts, notice of 5 October 2026) — one
//     string in both places, held equal by e2e/privacy-notice.spec.ts; the requisites are not decided here (gate G-8, memory
//     project_requisites_change_codex_2026_10_07: when they change, they change in both);
//   · the transfer basis, both read at the source on 21.10: Vercel's DPA applies the 2021 Standard Contractual Clauses (vercel.com/legal/dpa, Schedule 3), and
//     its privacy policy says «Vercel has certified to the U.S. Department of Commerce that it adheres to the EU-U.S. Data Privacy Framework Principles»
//     (vercel.com/legal/privacy-policy); the form's notice makes the same statement about Vercel;
//   · the log period of Vercel is not stated in its DPA (read 21.10), so the page says it is the period Vercel's terms set.
// The notice of the assistant on a customer's site is another document (webappski.com/en/legal/privacy-typelessity); the DPA is a contract
// between a business and its processor. This page is neither.

export const CONTROLLER_SENTENCE =
  'Lizaveta Isayeuskaya, sole proprietorship (jednoosobowa działalność gospodarcza), the owner of webappski.com, ul. Leona Staniszewskiego 19a, 81-603 Gdynia, Poland, VAT ID (EU): PL5862379862';

export const PRIVACY = {
  title: 'Privacy on typelessity.com',
  seoTitle: 'Privacy notice for typelessity.com',
  description: 'What typelessity.com collects about a visitor: what its host receives, the one choice kept in your browser, what the demo keeps. No analytics, no ads.',
  path: '/privacy',
  body: `## Who runs this website

typelessity.com is run by ${CONTROLLER_SENTENCE}. Contact: [info@webappski.com](mailto:info@webappski.com).

## What our host receives

Our host, Vercel Inc. (United States), receives your IP address and browser details with every request, to deliver the page and to protect it from abuse (legitimate interests, GDPR Art. 6(1)(f)). Vercel keeps its request logs for the period its own terms set. Transfers to the United States rest on the European Commission's adequacy decision of 10 July 2023 for the EU-US Data Privacy Framework, under which Vercel states it is certified, and on the Standard Contractual Clauses that Vercel's DPA applies.

## What stays in your browser

The site sets no analytics, advertising or tracking storage. If you choose a theme, the choice is kept in your browser (\`ty-theme\`). The demo on the home page keeps a placeholder record and its session in your browser storage while it plays, and removes them when you leave the page. It loads the chat script and its fonts from our widget host, typelessity-widget.vercel.app, which is also on Vercel. What you type in the demo is answered by a script in your browser and is not sent to a server.

## The question form

The form on [/pricing](/pricing) has its own notice next to it.

## Your rights

You can ask us for access, correction, erasure, restriction, portability, and you can object: write to [info@webappski.com](mailto:info@webappski.com). You can complain to the Polish supervisory authority, UODO (uodo.gov.pl), or to your own.

## Other notices

The assistant that runs on a customer's website has its own notice: [Privacy notice: the assistant on your customers' sites](https://webappski.com/en/legal/privacy-typelessity). The contract between a business and Typelessity as its processor is the [DPA](https://webappski.com/en/legal/dpa-typelessity).
`,
} as const;
