import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// A45b (founder 2026-09-25). Two kinds of claim the engine and the terms do not back:
//  - support levels: the cards sold Email / Standard / Priority Support, and the terms define
//    none of them. Every tier now says the one thing that is true: «Support by email»;
//  - the blog named models and a voice engine the engine no longer calls (gpt-4.1-nano, Whisper —
//    it calls gpt-5.4-mini and gpt-4o-mini-transcribe: typelessity constants.ts AI.DEFAULT_MODEL,
//    api/transcribe/route.ts), quoted latency percentiles and conversion results nobody measured,
//    and described voice mechanics the widget does not have (streamed audio, a Web Speech
//    fallback, a confidence prompt, per-clinic vocabulary in the transcription prompt).
// Plus three promises from the A45 list: an /agent endpoint «shipping Q3 2026» (the engine has
// no such route), a «full audit log per turn» and «GDPR-native».
//
// Reads what visitors and AI crawlers receive — prerendered HTML with its JSON-LD, the llms
// files, and every post the build emitted under blog/ (not a fixed list, so a new post is
// checked too). Run `npm run build` first.

const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);

const PAGES = ['index.html', 'pricing/index.html', 'faq/index.html', 'for-ai-agents/index.html',
  'how-it-works/index.html', 'about/index.html', 'llms.txt', 'llms-full.txt'];

const BANNED: readonly RegExp[] = [
  // support levels
  /Standard Support/i, /Priority Support/i, /\bemail support\b/i, /support level/i,
  // models and the voice engine, in the present tense
  /gpt-4\.1-nano/i, /\b(uses|using|via|runs on) (OpenAI )?Whisper\b/i, /Whisper-based/i, /\(Whisper\)/,
  /Whisper is Typelessity/i, /Whisper adds/i,
  // latency and results nobody measured
  /\bp(50|95|99)\b/i, /Real User Monitoring/i, /tracked in production telemetry/i, /telemetry window/i,
  /production window/i, /pages? on-call/i, /in-house edge endpoint/i, /headroom/i,
  /(conversion|contract)[^.]{0,60}rose (sharply|significantly)/i, /conversion (was small|is small|rises)/i,
  // voice mechanics the widget does not have
  /Web Speech fallback/i, /streaming audio chunks/i, /did you mean/i, /initial_prompt/,
  // promises and mechanics without code behind them
  /Q3 2026/, /full audit log/i, /GDPR-native/i, /callable by autonomous agents/i, /minimal form path/i,
  /phantom extractions/i, /only committed if its name appears/i, /400.650.token/, /chrono-node/, /libphonenumber/,
  /_meta\.lang/, /messages\.\{locale\}\.json/,
  // setup time nobody measured, ours or a competitor's
  /<t[dh][^>]*>\s*Setup time\s*</, /same day, not after weeks/i, /config in a few hours/i,
];

// The dated note and the truthful replacement each edited post must carry — so an empty page or
// a wrong path cannot pass the bans by accident.
const UPDATED = /Updated 2026-09-25 — what changed/;
const POST_TRUTH: Readonly<Record<string, readonly RegExp[]>> = {
  'whisper-vs-webspeech': [UPDATED, /gpt-4o-mini-transcribe/, /We have not measured/],
  'latency-budgets': [UPDATED, /a target, not a measurement/, /currently gpt-5\.4-mini/],
  '25-languages-one-prompt': [UPDATED, /currently gpt-5\.4-mini/],
  'single-gpt-call': [UPDATED, /currently gpt-5\.4-mini/],
  'best-ai-booking-widgets-2026': [UPDATED, /gpt-4o-mini-transcribe/],
  'best-ai-booking-beauty-salons-2026': [UPDATED, /gpt-4o-mini-transcribe/],
  'best-ai-booking-transfer-services-2026': [UPDATED, /gpt-4o-mini-transcribe/],
  'what-we-got-wrong': [UPDATED, /a target, not a measurement/],
  'pricing-ai-products': [UPDATED, /Starter €39/, /up to 50 submissions a month/],
};

const PAGE_TRUTH: Readonly<Record<string, readonly RegExp[]>> = {
  'pricing/index.html': [/they differ in submission volume \(see cards above\) and the number of websites/,
    /same support by email/],
  'llms.txt': [/Support is by email on every tier/],
  'llms-full.txt': [/Up to 2,000 submissions\/month, up to 10 websites, support by email/],
};

async function read(path: string): Promise<string> {
  try {
    return await readFile(new URL(path, DIST), 'utf8');
  } catch {
    throw new Error(`dist/${path} missing — run \`npm run build\` before this check.`);
  }
}

async function posts(): Promise<string[]> {
  const entries = await readdir(new URL('blog/', DIST), { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function banned(path: string, body: string): void {
  for (const re of BANNED) assert.doesNotMatch(body, re, `${path} still says ${re}`);
}

// The home page shows compact tier cards without bullets; /pricing carries the full cards.
test('every tier card on /pricing says «Support by email»', async () => {
  const body = await read('pricing/index.html');
  const cards = body.match(/<li[^>]*>\s*Support by email\s*<\/li>/g) ?? [];
  assert.equal(cards.length, 4, `expected «Support by email» on all four tier cards, found ${cards.length}`);
});

for (const path of PAGES) {
  test(`${path}: no support level, old model, unmeasured latency or dated promise`, async () => {
    const body = await read(path);
    banned(path, body);
    for (const re of PAGE_TRUTH[path] ?? []) assert.match(body, re, `${path} lost the line ${re}`);
  });
}

test('every blog post the build emitted: no old model, unmeasured latency or missing mechanics', async () => {
  const slugs = await posts();
  assert.ok(slugs.length >= 13, `expected the 13 posts under dist/blog, found ${slugs.length}`);
  for (const slug of Object.keys(POST_TRUTH)) assert.ok(slugs.includes(slug), `dist/blog/${slug} missing`);
  for (const slug of slugs) {
    const path = `blog/${slug}/index.html`;
    const body = await read(path);
    banned(path, body);
    for (const re of POST_TRUTH[slug] ?? []) assert.match(body, re, `${path} lost the line ${re}`);
  }
});
