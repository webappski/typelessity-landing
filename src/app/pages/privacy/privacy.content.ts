// /privacy — the notice (GDPR Art. 13) for a visitor of typelessity.com itself (L13, legal verdict L-2 / gate G-3, 21.10).
// DRAFT FOR THE LAWYER: the text is the draft of the legal reviewer (pending-review/2026-10-21/typelessity-landing-batch-legal-verdict.md, L-2),
// with the three gaps of the draft closed by what was read, not guessed:
//   · the controller line is the one the question form on /pricing already prints (contact-form.component.ts, notice of 5 October 2026) — one
//     string in both places, held equal by e2e/privacy-notice.spec.ts; the requisites are not decided here (gate G-8, memory
//     project_requisites_change_codex_2026_10_07: when they change, they change in both);
//   · the transfer basis, both read at the source on 21.10: Vercel's DPA applies the 2021 Standard Contractual Clauses (vercel.com/legal/dpa, Schedule 3), and
//     its privacy policy says «Vercel has certified to the U.S. Department of Commerce that it adheres to the EU-U.S. Data Privacy Framework Principles»
//     (vercel.com/legal/privacy-policy); the form's notice makes the same statement about Vercel;
//   · the log period of Vercel is not stated in its DPA or its privacy policy (read 21.10); it is set by the plan of the project (docs vercel.com/docs/logs/runtime:
//     Hobby 1 hour, Pro 1 day), so the page names the longest of the two, one day, and for Vercel's own records the criterion of Art. 13(2)(a) (legal verdict F-2).
// L13 round of judges (legal verdict F-1…F-8, 21.10): the fonts sentence is true before and after the widget release (this site's CSP lets no font or stylesheet come from Google),
// the right to object stands in its own paragraph (Art. 21(4)), Art. 13(2)(f) is said, and the page says where the service on customers' sites is described (/gdpr).
// The notice of the assistant on a customer's site is another document (webappski.com/en/legal/privacy-typelessity); the DPA is a contract
// between a business and its processor. This page is neither.

export const CONTROLLER_SENTENCE =
  'Lizaveta Isayeuskaya, sole proprietorship (jednoosobowa działalność gospodarcza), the owner of webappski.com, ul. Leona Staniszewskiego 19a, 81-603 Gdynia, Poland, VAT ID (EU): PL5862379862';

/** The date of the page: printed under the heading and the `lastmod` of /privacy in the sitemap (tools/build-sitemap.ts imports it) — one constant, as PRICING_LAST_UPDATED. */
// 22.10 (L17, legal L17-3): the paragraph about the Webappski strip on the home page (the browser reads where the visitor came from; the link carries a campaign marker)
export const PRIVACY_LAST_UPDATED = '2026-10-22';

export const PRIVACY = {
  title: 'Privacy on typelessity.com',
  seoTitle: 'Privacy notice for typelessity.com',
  description: 'What typelessity.com collects about a visitor: what its host receives, the one choice kept in your browser, what the demo keeps. No analytics, no ads.',
  path: '/privacy',
  body: `## Who runs this website

typelessity.com is run by ${CONTROLLER_SENTENCE}. Contact: [info@webappski.com](mailto:info@webappski.com).

## What our host receives

Our host, Vercel Inc. (United States), receives your IP address and browser details with every request, to deliver the page and to protect it from abuse (legitimate interests, GDPR Art. 6(1)(f)). The request logs of this site in Vercel are kept for no longer than one day; Vercel keeps its own security and service records only as long as it needs them for those purposes. Transfers to the United States rest on the European Commission's adequacy decision of 10 July 2023 for the EU-US Data Privacy Framework, under which Vercel states it is certified, and on the Standard Contractual Clauses that Vercel's DPA applies. No automated decisions are made about you on this website.

## What stays in your browser

The site sets no analytics, advertising or tracking storage. If you choose a theme, the choice is kept in your browser (\`ty-theme\`).

When you open any page of this site, your browser reads the utm_source of the address once, as the site loads in your tab, and keeps it in memory only while the site stays open there; only the Webappski strip on the home page uses it, together with the address of the page you came from (which only the home page reads), to choose which of two texts the strip shows. Nothing is stored and nothing is sent to us. If you click the strip, the link to webappski.com carries four campaign parameters (utm_source=typelessity.com, utm_campaign=free-pilot, utm_medium=banner and utm_content=a, b, a-name or b-name), which tell webappski.com whether you came from an AI assistant; the browser sends no referrer. webappski.com is run by the same person.

Once the page has painted, the demo on the home page loads by itself. It loads the chat script from our widget host, typelessity-widget.vercel.app, which is also on Vercel. This site's Content-Security-Policy does not let your browser fetch fonts or stylesheets from Google, so typelessity.com sends no request to Google Fonts. It keeps a placeholder consent record in this site's browser storage and its session in session storage; if you click into the demo, the placeholder is replaced by your own answer to the demo's consent question. These are removed when you leave the page; one display setting of the chat window stays in session storage until you close the tab. What you type or say in the demo is answered by a script in your browser and is not sent to a server.

## The question form

The form on [/pricing](/pricing) has its own notice next to it.

## Your rights

You can ask us for access, correction, erasure, restriction, portability, and you can object: write to [info@webappski.com](mailto:info@webappski.com). You can complain to the Polish supervisory authority, UODO (uodo.gov.pl), or to your own.

**Your right to object.** Our host processes your request data on the basis of our legitimate interests. You can object to that at any time, on grounds relating to your particular situation (GDPR Art. 21(1)), by writing to [info@webappski.com](mailto:info@webappski.com).

## Other notices

This page is about the website. The Typelessity service that runs on customers' sites — where its functions and database run, Vercel's network that receives each request, and its providers — is described on [/gdpr](/gdpr).

The assistant that runs on a customer's website has its own notice: [Privacy notice: the assistant on your customers' sites](https://webappski.com/en/legal/privacy-typelessity). The contract between a business and Typelessity as its processor is the [DPA](https://webappski.com/en/legal/dpa-typelessity).
`,
} as const;
