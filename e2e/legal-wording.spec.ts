import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// L14 (legal verdict 21.10, L-1, L-4…L-10): the wording the legal reviewer gave, held on the BUILT bytes, page by page. Each finding has two sides:
// the new sentence is on every page that carries the fact, and the old phrase is on none (a mutant that brings the old phrase back is red on both).
// The phrases are the reviewer's, verbatim (pending-review/2026-10-21/typelessity-landing-batch-legal-verdict.md); they are typed here on purpose: the
// subject of this guard is that the TEXT is that text — not a value another side computes. The facts behind them (48 h, 3 years, 30 days, regions) are held
// against the code and the DPA by gdpr-facts.spec.ts. Run `npm run build` first. LANDING_DIST points at another copy of dist (the mutation run).

const DIST = process.env['LANDING_DIST'] ?? join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const decode = (s: string) =>
  s.replace(/&#38;|&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&#8217;/g, '’').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8209;/g, '-');
function raw(rel: string): string {
  const file = join(DIST, rel);
  assert.ok(existsSync(file), `${file} missing — run \`npm run build\` before this check`);
  return readFileSync(file, 'utf8');
}
const plain = (s: string) => decode(s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const page = (rel: string) => plain(raw(rel).match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? raw(rel));
const home = () => plain(raw('index.html').match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? raw('index.html'));
const txt = (rel: string) => raw(rel);

const hasAll = (where: string, text: string, phrases: string[]) => { for (const p of phrases) assert.ok(text.includes(p), `${where} lacks «${p}»`); };
const hasNone = (where: string, text: string, phrases: Array<string | RegExp>) => {
  for (const p of phrases) assert.ok(typeof p === 'string' ? !text.includes(p) : !p.test(text), `${where} still says «${String(p)}»`);
};

// the pages and files the findings name
const PAGES = { gdpr: () => page('gdpr/index.html'), faq: () => page('faq/index.html'), security: () => page('legal/security/index.html'), agents: () => page('for-ai-agents/index.html'), install: () => page('install/index.html'), home };
const FILES = { llms: () => txt('llms.txt'), llmsFull: () => txt('llms-full.txt') };

const GOOGLE_LONG =
  'Until the next widget release, the widget asks Google Fonts (Google) for its typefaces as soon as it appears on your page, before the consent question; the visitor’s browser then sends Google its IP address and browser details. typelessity.com blocks that request with its Content-Security-Policy; your site blocks it only if its own policy does.';
const GOOGLE_SHORT = 'Until the next widget release the widget requests Google Fonts unless your Content-Security-Policy blocks it; the CSP above blocks it.';
const OPENAI_30 = 'OpenAI keeps conversation text for up to 30 days to check for abuse, longer only where the law requires it or to protect its service or others from harm';
const NETWORK = 'Vercel’s network receives each request at the point nearest the visitor';

// LG-1 (legal 27.10): the widget on the CDN takes its typefaces from its own origin since 26.10 (85c8cbb), so the sentences of variant B (L-1, 21.10) are no
// longer true and no page or file keeps them. That the widget code asks no Google Fonts host is held at the seam in e2e/gdpr-facts.spec.ts.
test('L-1 / LG-1: /gdpr, /install and llms-full.txt no longer say that the widget asks Google Fonts', () => {
  const gone = [GOOGLE_LONG, GOOGLE_SHORT, /Google Fonts/];
  hasNone('/gdpr', PAGES.gdpr(), gone);
  hasNone('/install', PAGES.install(), gone);
  hasNone('llms-full.txt', FILES.llmsFull(), gone);
});

test('L-4: a conversation with a delivery record is kept; the page says what a delivery record is (gdpr, faq, llms-full)', () => {
  hasAll('/gdpr', PAGES.gdpr(), [
    'A conversation that produced no delivery record — no request was sent or attempted — is deleted within 48 hours of the visitor’s last message.',
    'A conversation that produced a delivery record — a booking request, an emailed request, or a failed or cancelled attempt — has no automatic expiry:',
  ]);
  hasAll('/faq', PAGES.faq(), ['A conversation that produced a delivery record — a booking request, an emailed request, or a failed or cancelled attempt — has no automatic expiry:']);
  hasAll('llms-full.txt', FILES.llmsFull(), ['conversations that produced a delivery record (a booking request, an emailed request, or a failed or cancelled attempt) are kept']);
  const old = [/did not lead to a booking request/, /led to a booking request/, /led to a booking or a forwarded request/, /conversations that led to a booking are kept/];
  hasNone('/gdpr', PAGES.gdpr(), old); hasNone('/faq', PAGES.faq(), old); hasNone('llms-full.txt', FILES.llmsFull(), old);
});

test('L-5: the consent record lists everything it holds and its 3 years run from each answer', () => {
  hasAll('/gdpr', PAGES.gdpr(), [
    'Each record that the visitor answered the consent question (an ID, the answer, the time, the website, the language of the chat window, how consent was given, the version of the notice and of the widget, the browser’s user agent and the IP address) is kept for 3 years from that answer, then deleted by the nightly job.',
  ]);
  hasNone('/gdpr', PAGES.gdpr(), ['The record that the visitor consented']);
});

test('L-6: /legal/security does not print a seal of conformity («GDPR-aligned»); it says who is controller and processor', () => {
  hasAll('/legal/security', PAGES.security(), ['You are the controller and Typelessity is your processor under the DPA (GDPR Article 28). Who processes what, where and on which transfer basis is on the /gdpr page; the limits above are stated in Appendix A of the Typelessity DPA.']);
  hasNone('/legal/security', PAGES.security(), [/GDPR[- ]aligned/i]);
});

test('L-7: «Consent before the chat.» on the home page, and /for-ai-agents names OpenAI and Resend with their bases', () => {
  hasAll('/', PAGES.home(), ['Consent before the chat.']);
  hasNone('/', PAGES.home(), ['Consent first']);
  hasAll('/for-ai-agents', PAGES.agents(), ['OpenAI and Resend process in the US (OpenAI under the 2021 SCCs; Resend under the EU–US Data Privacy Framework and the 2021 SCCs).']);
});

test('L-8: the functions run in the EU; the network of Vercel receives each request nearest the visitor (gdpr, home, security, faq)', () => {
  hasAll('/gdpr', PAGES.gdpr(), ['The service’s functions run in the EU (Vercel, Frankfurt) and the database is in the EU (Supabase, Ireland); ' + NETWORK]);
  hasAll('/', PAGES.home(), ['The service’s functions run in the EU (Vercel, Frankfurt) and the database is in the EU (Supabase, Ireland); ' + NETWORK]);
  hasAll('/legal/security', PAGES.security(), [NETWORK]);
  hasAll('/faq', PAGES.faq(), [NETWORK]);
  for (const [name, text] of Object.entries({ gdpr: PAGES.gdpr(), home: PAGES.home(), security: PAGES.security(), faq: PAGES.faq() })) {
    // the sentences L-8 names (they start with «The service runs …»); «the service runs on Vercel in Frankfurt» of the self-hosting answer is FL-72, not in the verdict
    hasNone(`/${name}`, text, ['The service runs in the EU (Vercel, Frankfurt)', 'The service runs on Vercel']);
  }
});

test('L-9: OpenAI’s 30 days are «up to 30 days … longer only where the law requires it», in all seven places, never «then deletes it»', () => {
  const places: Array<[string, string]> = [['/gdpr', PAGES.gdpr()], ['/', PAGES.home()], ['/faq', PAGES.faq()], ['llms.txt', FILES.llms()], ['llms-full.txt', FILES.llmsFull()]];
  for (const [name, text] of places) hasAll(name, text, [OPENAI_30]);
  const gdprCount = PAGES.gdpr().split(OPENAI_30).length - 1;
  assert.equal(gdprCount, 3, `/gdpr says the OpenAI retention ${gdprCount} times, expected 3 (capsule, retention list, check 2)`);
  for (const [name, text] of places) hasNone(name, text, [/then deletes it/i]);
});

test('L-10: the DPA answer on /faq names the mechanism — publishing a configuration is refused until the DPA is accepted', () => {
  hasAll('/faq', PAGES.faq(), ['Yes. Publishing a configuration is refused until the Typelessity DPA has been accepted in the Webappski portal.']);
  hasNone('/faq', PAGES.faq(), ['before any visitor data is processed']);
  // L-4 on the first half of the same answer: an abandoned conversation is one with no delivery record, not one with «no booking»
  hasNone('/faq', PAGES.faq(), ['no booking and no activity']);
  hasAll('/faq', PAGES.faq(), ['An abandoned conversation — no delivery record and no activity for 24 hours']);
});

test('the three old phrases are in no text file of the build: «then deletes it», «Consent first», «GDPR-aligned»', () => {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(html|txt|js|xml|json)$/.test(e) && e !== '3rdpartylicenses.txt') {
        const t = decode(readFileSync(p, 'utf8'));
        for (const re of [/then deletes it/i, /Consent first/, /GDPR[- ]aligned/i]) if (re.test(t)) found.push(`${p.slice(DIST.length)}: ${re}`);
      }
    }
  };
  walk(DIST);
  assert.deepEqual(found, []);
});
