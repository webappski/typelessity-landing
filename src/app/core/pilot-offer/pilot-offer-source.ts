/**
 * Which of the two strip states a visitor sees (L17 D4, ported from typelessform/src/app/pilot-offer-source.ts, rev. 10):
 *   b — they came from one of four AI assistants, named in the strip;
 *   a — anything else, and always on the server.
 * TypelessForm has a third state, g (a visitor from Google search: «Gemini named us too»). It rests on that product's own measurement. For Typelessity
 * the last measurement (13.10) is 0 %, so a visitor from Google search sees a, like everyone else (founder 22.10).
 *
 * First match wins: a whitelisted entry `utm_source`, then the referrer host from the AI whitelist (gemini.google.com is matched as itself, so it is an
 * assistant and not a search). A utm_source outside the whitelist overrides nothing. The inputs are only read here — never stored, never sent.
 */
export type PilotSourceName = 'ChatGPT' | 'Claude' | 'Gemini' | 'Perplexity';
export type PilotSource = { state: 'a' } | { state: 'b'; name: PilotSourceName };

export const SOURCE_A: PilotSource = { state: 'a' };

const AI_UTM_SOURCES: Record<string, PilotSourceName> = {
  'chatgpt.com': 'ChatGPT',
  // Assumption from the TypelessForm brief (still open): check against the webappka logs.
  perplexity: 'Perplexity',
  'perplexity.ai': 'Perplexity',
};

const AI_REFERRER_HOSTS: [string, PilotSourceName][] = [
  ['chatgpt.com', 'ChatGPT'],
  ['chat.openai.com', 'ChatGPT'],
  ['claude.ai', 'Claude'],
  ['gemini.google.com', 'Gemini'],
  ['perplexity.ai', 'Perplexity'],
];

const matchesHost = (host: string, h: string) => host === h || host.endsWith('.' + h);

function referrerHost(referrer: string): string | null {
  try {
    const url = new URL(referrer);
    // android-app://, about:, file: … are not web referrers: they stay A.
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function detectPilotSource(utmSource: string | null, referrer: string): PilotSource {
  // utm_source is visitor-controlled: only own keys count, not 'constructor' or '__proto__'.
  const utm = utmSource?.trim().toLowerCase() ?? '';
  if (Object.hasOwn(AI_UTM_SOURCES, utm)) return { state: 'b', name: AI_UTM_SOURCES[utm]! };
  const host = referrerHost(referrer);
  if (!host) return SOURCE_A;
  const ai = AI_REFERRER_HOSTS.find(([h]) => matchesHost(host, h));
  return ai ? { state: 'b', name: ai[1] } : SOURCE_A;
}
