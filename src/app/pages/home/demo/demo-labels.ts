// What the prerender of the home-page demo draws and what the loader needs before the demo chunk exists (L4, F18): the labels of the
// tabs and of the five chat languages, the captions, the three texts of the empty slot (F11) and the one height of the slot (CLS).
// This file is in the main bundle. It must never import demo-script.ts, demo-mock.ts or demo-controller.ts: those three travel
// together in one lazy chunk (C2(c): the scenarios are in exactly one file of dist, and index.html does not name it).
import { LANDING_LANGUAGES } from '../../../core/languages/landing-languages';
import { nextDow } from './next-dow';

/** The one origin the demo widget is given as `api-url`. RFC 6761: `.invalid` is guaranteed not to resolve, so nothing can leave. */
export const DEMO_API_ORIGIN = 'https://demo.invalid';

/** The demo businesses, in the order of the tabs. The scenarios themselves are in demo-script.ts. */
export const DEMO_TABS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'salon', label: 'Salon' },
  { id: 'garage', label: 'Garage' },
  { id: 'table', label: 'Restaurant' },
  { id: 'freight', label: 'Freight' },
];

/** The five chat languages the demo plays, with their own names (the buttons carry `lang`). The code is the product's locale code. */
export const DEMO_LANGS: readonly { readonly code: string; readonly name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
];

/** The 25 languages of the chat window minus the five the demo plays — «+20» is computed, never typed. */
export const LANGS_MORE_COUNT = LANDING_LANGUAGES.length - DEMO_LANGS.length;
export const LANGS_MORE_NAMES: readonly string[] = LANDING_LANGUAGES.slice(DEMO_LANGS.length).map((l) => l.native);
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** The caption under the language buttons: one paragraph, two sentences about the language and one about the scripted replies (D1). */
export const LANGNOTE = `The chat window comes in ${LANDING_LANGUAGES.length} languages. Pick one to see it. The assistant answers in the language you set for your business. The replies in this demo are scripted.`;
export const LANGS_MORE_HEAD = `${LANGS_MORE_COUNT} more chat languages:`;
export const LANGS_MORE_TAIL = `This demo plays ${NUMBER_WORDS[DEMO_LANGS.length] ?? DEMO_LANGS.length} of the ${LANDING_LANGUAGES.length}.`;
export const LANGS_MORE_TITLE = `${LANGS_MORE_COUNT} more chat languages`;

export const DEMO_CAPTIONS = {
  tabsLabel: 'See it for a',
  langLabel: 'in',
  tryNow: 'Try the chat now',
  tipsHide: 'Hide tips',
  tipsShow: 'Show tips',
  note: 'Demo conversation in the real widget · click it to take over',
  afterHead: 'Behind the chat: the whole trip of one request',
  afterBack: '← Back to the chat',
  jsonShow: 'Show as JSON',
  jsonNote: 'What your system receives when it has an API. The exact shape follows your field mapping.',
};

/**
 * The three texts of the slot where the widget will be (F11). Each is true where it is shown:
 *   prerender — what a crawler, a visitor without JavaScript and everyone before hydration sees; it is indexed, so it promises nothing;
 *   loading   — after hydration, while the script and the widget load;
 *   failed    — `widget.js` did not load (an error, or no definition after 10 s) or the demo chunk did not load.
 * The link leads to the page that tells the same story without the widget.
 */
export const SLOT_TEXT = {
  prerender: 'The demo chat runs in the real widget and needs JavaScript.',
  loading: 'Loading the chat…',
  failed: 'The demo chat could not load.',
  linkText: 'See how a booking goes, step by step →',
  linkHref: '/how-it-works',
} as const;

export type SlotState = 'prerender' | 'loading' | 'failed' | 'ready';

/** How long the slot waits for the widget to define its element before it says it could not load (ms). F11. */
export const WIDGET_DEFINE_TIMEOUT_MS = 10_000;

/** ONE height for the slot: the panel of the widget is fixed to it by the controller (`grow()`), the frame holds it from the first paint (CLS). */
export const SLOT_HEIGHT_PX = 720;
export const SLOT_HEIGHT_MOBILE_PX = 640;
/** Below this width the narrow height holds (the same breakpoint as the widget panel rule and the page CSS). */
export const SLOT_MOBILE_MAX_WIDTH_PX = 720;

/**
 * The static example the «Behind the chat» band shows before the demo plays (prerender): the first scenario, in English. The demo
 * rewrites these three cards when it starts. The date is computed the way the scripted data computes it (next Tuesday, UTC).
 */
export function staticChain(): {
  json: readonly (readonly [string, string])[]; endpoint: string; rows: readonly string[]; say: string; brand: string; sentMeta: string;
} {
  return {
    json: [
      ['service', 'Balayage + haircut'],
      ['hair_length', 'Long'],
      ['date', nextDow(2)],
      ['time_window', 'Morning'],
    ],
    endpoint: 'GET /stylists',
    rows: ['Anna K. · Colour · Tue 09:30', 'Marta L. · Colour · Tue 11:00', 'Julia S. · Colour · Tue 10:15'],
    say: 'balayage and a trim next tuesday morning, long hair',
    brand: 'Glow Studio',
    sentMeta: 'Or into your booking system · REST',
  };
}
