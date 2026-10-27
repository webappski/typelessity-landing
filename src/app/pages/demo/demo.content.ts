// /demo — TY-DEMO (25.10): four made-up businesses and what a booking looks like on each. The scenarios are the real configurations of
// the product (packages/api/src/scripts/fixtures/demos/<id>.json of ~/Projects/typelessity, checked against expected-steps.json), not the
// script of the home page (pages/home/demo/demo-script.ts). The words are the mock's, pending-review/2026-10-25/TY-DEMO/mocks/BRIEF.md §1.
//
// `live` is false on every card: on 25.10 the Typelessity widget is switched off on all four demo sites (the embeds are commented out
// before the founder's from-scratch check, Glow carries TypelessForm). A card shows its button only while `live` is true, and the page
// then also switches to the texts written for a live demo. Switching a demo on is one line here, after the founder has checked the site
// (e2e/demo-page-dist.spec.ts holds both states).

const UTM = { source: 'typelessity.com', medium: 'demo-page' } as const;

export interface DemoCard {
  readonly id: 'glow' | 'autopro' | 'transedge' | 'medbook';
  /** industry · «demo» — an example in the card, not a page or a link for that industry (rule of 20.10) */
  readonly kind: string;
  readonly name: string;
  readonly says: string;
  readonly asks: string;
  /** what the visitor picks on the form, not in the chat */
  readonly picks?: readonly string[];
  readonly requestTitle: string;
  readonly request: readonly (readonly [label: string, value: string])[];
  /** MedBook only: the visible mark that this is an example (DPA §4.4, Terms §5.1; the founder's sense, 25.10) */
  readonly note?: { readonly lead: string; readonly body: string; readonly warning: string };
  /** the address of the demo site (business.domain of the fixture) */
  readonly liveUrl: string;
  /** the Typelessity widget answers on that site; the founder has checked it */
  readonly live: boolean;
}

export const MEDBOOK_NOTE = {
  lead: 'Just an example.',
  body: 'Typelessity is not available to medical practices. This demo only shows how the widget copes with a long, complex booking.',
  warning: 'Do not enter real health data.',
} as const;

export const DEMO_CARDS: readonly DemoCard[] = [
  {
    id: 'glow',
    kind: 'Beauty salon · demo',
    name: 'Glow Studio',
    says: 'Can I come in on Saturday at 2 pm?',
    asks: "Your name, phone and e-mail. The treatment and the stylist are picked from the salon's list on the form.",
    picks: ['Haircut & Blow-dry', 'Hair Coloring', 'Marta', 'Karolina'],
    requestTitle: 'THE SALON GETS A REQUEST',
    request: [['Date', 'Saturday'], ['Time', '14:00'], ['Treatment', 'Hair Coloring'], ['Contact', 'Name, phone, e-mail']],
    liveUrl: 'https://glow-studio-demo.netlify.app',
    live: false,
  },
  {
    id: 'autopro',
    kind: 'Car service · demo',
    name: 'AutoPro Service',
    says: 'Brake pad replacement for my VW Golf 2015, Saturday',
    asks: "It shows the add-ons and the mechanics for this service, and the free times of the mechanic you pick — all from the garage's own system.",
    requestTitle: 'THE GARAGE GETS A REQUEST',
    request: [
      ['Service', 'Brake Pad Replacement'], ['Car', 'VW Golf 2015'], ['Mechanic', 'Picked from the list'],
      ['Time', 'Saturday, a free slot'], ['Contact', 'Name, phone, e-mail'],
    ],
    liveUrl: 'https://autopro-service-demo.netlify.app',
    live: false,
  },
  {
    id: 'transedge',
    kind: 'Freight shipping · demo',
    name: 'TransEdge Freight',
    says: '800 kg, 120×80×150 cm, Gdańsk to Berlin, pickup Monday, delivery Wednesday',
    asks: 'Your name, phone and e-mail — in one question. Cargo type, service and extras are ticked on the form.',
    picks: ['standard', 'fragile', 'Insurance', 'Packaging'],
    requestTitle: 'THE CARRIER GETS A REQUEST',
    request: [
      ['Route', 'Gdańsk to Berlin'], ['Cargo', '800 kg, 120×80×150 cm'], ['Pickup', 'Monday'], ['Delivery', 'Wednesday'],
      ['Contact', 'Name, phone, e-mail'],
    ],
    liveUrl: 'https://transedge-freight.netlify.app',
    live: false,
  },
  {
    id: 'medbook',
    kind: 'Clinic · example only',
    name: 'MedBook',
    says: 'A consultation next week',
    asks: "Which specialist. Then it shows that specialty's doctors and their free times from the clinic's system, and walks through a long patient form.",
    requestTitle: 'THE DEMO CLINIC GETS A REQUEST',
    request: [
      ['Specialist', 'Picked in the chat'], ['Doctor', "From the clinic's list"], ['Time', 'A free slot next week'], ['Form', 'Questionnaire, contacts'],
    ],
    note: MEDBOOK_NOTE,
    liveUrl: 'https://medbook-vue.netlify.app',
    live: false,
  },
];

/** The fixed words of the card, as the mock prints them. */
export const SCENE_LABELS = { says: 'The visitor says', asks: 'The widget asks', picked: 'Picked on the form' } as const;

export const DEMO_BUTTON = 'Open the demo site';

export interface DemoPageCopy {
  readonly eyebrow: string;
  readonly h1: string;
  readonly h1Accent: string;
  readonly lead: string;
  /** under the grid; null when there is nothing to say yet */
  readonly fine: string | null;
}

/** The mock's words, written for a demo that works: they send the reader to the site and promise a chat there. */
const COPY_LIVE: DemoPageCopy = {
  eyebrow: 'Live demos',
  h1: 'Try it on a demo website.',
  h1Accent: 'Each one asks for different things.',
  lead: 'Made-up businesses with Typelessity on their sites. Each card shows what a visitor says, what the widget asks and what the business gets. Open one and send a request in the chat — typed or spoken.',
  fine: 'Each site opens in a new tab. Use made-up details. Before it starts, the assistant asks your permission to process what you type or say with AI.',
};

/** Today's words: the same cards without the button, so nothing on the page sends the reader to a site where the chat is off. */
const COPY_SCENARIOS: DemoPageCopy = {
  eyebrow: 'Demo scenarios',
  h1: 'See how a booking goes in the chat.',
  h1Accent: 'Each business asks for different things.',
  lead: 'Made-up businesses. Each card shows what a visitor says, what the widget asks and what the business gets.',
  fine: null,
};

export function demoCopy(cards: readonly DemoCard[] = DEMO_CARDS): DemoPageCopy {
  return cards.some((c) => c.live) ? COPY_LIVE : COPY_SCENARIOS;
}

export interface DemoButton {
  readonly href: string;
  readonly label: string;
  /** read aloud after the label: the brand and the new tab */
  readonly srLabel: string;
}

/** The button of a card — null while the demo is not switched on, so that no link to a demo site is printed. */
export function demoButton(card: DemoCard): DemoButton | null {
  if (!card.live) return null;
  const url = new URL(card.liveUrl);
  url.searchParams.set('utm_source', UTM.source);
  url.searchParams.set('utm_medium', UTM.medium);
  url.searchParams.set('utm_content', card.id);
  return { href: url.toString(), label: DEMO_BUTTON, srLabel: `${card.name} (opens in a new tab)` };
}

export const DEMO_STRIP = {
  title: 'Want it on your website?',
  text: 'Set up your site’s config in the Webappski portal, then paste the code. It works next to the booking system you already use.',
  cta: 'Get it free',
} as const;
