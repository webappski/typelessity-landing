// The words of the Webappski strip of the home page, written out on purpose. They are NOT read from the template or the component: a spec that took its
// expected text from the code it checks would agree with whatever the code says.
//
// Source of the wording: L17 brief D4.2 (webappski-ops pending-review/2026-10-22/L17-mocks/designer-brief-L17.md). State b is the text of typelessform.com
// (typelessform/e2e/free-pilot-copy.ts, rev. 10 §3) byte for byte. State a is that text with «Typelessity» for «TypelessForm» (founder 22.10): the two
// products' a are different on purpose, so this file is no longer a copy of the TypelessForm one (the old line saying the push gate counts it in both repos is
// gone; no such gate was found in either repo, L17 point A). The template writes U+00A0 before the dash and inside «AI visibility»; the strings here use plain
// spaces and every comparison normalises U+00A0 first (`flat`).

/** The button label and accessible name, with a plain hyphen U+002D in «AI-visibility» (voice control and find-in-page type the plain hyphen). */
export const BUTTON = 'Apply for a free AI-visibility pilot';

const BECAUSE_A = "— not because it's the best, but because Webappski set up its AI visibility.";
const BECAUSE_B = "— not because we're the best, but because Webappski set up our AI visibility.";

export type StripCopy = { LINE1_LONG: string; LINE1_SHORT: string; LINE2_LONG: string; LINE2_SHORT: string };

/** State a — what the server and the prerender ship, and what every unknown source keeps (a visitor from Google search too). Line 1 has no short form. */
export const COPY: StripCopy & { BUTTON: string } = {
  LINE1_LONG: `AI named Typelessity ${BECAUSE_A}`,
  LINE1_SHORT: `AI named Typelessity ${BECAUSE_A}`,
  LINE2_LONG: 'Your customers ask AI for the best, too. Want it to name you?',
  LINE2_SHORT: 'Want AI to name you, too?',
  BUTTON,
};

export type Assistant = 'ChatGPT' | 'Claude' | 'Gemini' | 'Perplexity';
/** State b — a visitor from one of the four AI assistants. */
export function copyB(source: Assistant): StripCopy {
  return {
    LINE1_LONG: `Came from ${source}? It named us ${BECAUSE_B}`,
    LINE1_SHORT: `${source} named us ${BECAUSE_B}`,
    LINE2_LONG: `Your customers ask ${source} for the best, too. Want it to name you?`,
    LINE2_SHORT: `Want ${source} to name you, too?`,
  };
}

const UTM = 'utm_source=typelessity.com&utm_campaign=free-pilot&utm_medium=banner';
export const BUTTON_HREF = (state: 'a' | 'b') => `https://webappski.com/en/free-aeo-pilot?${UTM}&utm_content=${state}`;
export const NAME_HREF = (state: 'a' | 'b') => `https://webappski.com/en?${UTM}&utm_content=${state}-name`;

/** Raw HTML or rendered text → comparable text: tags off, U+00A0 / &nbsp; / &#160; → space. */
export function flat(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;|&#xa0;| /gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
