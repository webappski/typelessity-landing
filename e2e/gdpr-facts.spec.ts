import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// L7 seam guard (R67 п.3): what /gdpr, /for-ai-agents and /about say about data, models and languages is READ from the other
// side of the seam, not typed here:
//   - the code of the product (~/Projects/typelessity, or TY_PRODUCT_ROOT): the hours an abandoned conversation lives, the
//     years the consent record lives, the region, the model names, the languages, the enrichment timeout, the browser storage;
//   - the DPA the portal publishes (~/Projects/webappka/public/assets/legal/dpa-typelessity.md, or TY_PORTAL_ROOT): the four
//     processors, their country and the basis for each transfer (Appendix B).
// They are compared with the built pages dist/typelessity-landing/browser/{gdpr,for-ai-agents,about}/index.html.
// A missing source FAILS with a text, it never skips (FL-26): a cloud session with no clone has a red run, by design.
// Run `npm run build` first. LANDING_DIST points at another copy of dist (the mutation run). Design: L7/card.md D13.

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
const PORTAL_ROOT = process.env['TY_PORTAL_ROOT'] ?? join(homedir(), 'Projects', 'webappka');
const DIST = process.env['LANDING_DIST'] ?? join(process.cwd(), 'dist', 'typelessity-landing', 'browser');

function source(root: string, rel: string, what: string): string {
  const file = join(root, rel);
  assert.ok(existsSync(file), `нет исходника ${what}: ${file}; задай TY_PRODUCT_ROOT / TY_PORTAL_ROOT или клонируй репозиторий`);
  return readFileSync(file, 'utf8');
}
const product = (rel: string) => source(PRODUCT_ROOT, rel, 'продукта');
const dpa = () => source(PORTAL_ROOT, 'public/assets/legal/dpa-typelessity.md', 'DPA портала');

const decode = (s: string) =>
  s.replace(/&#38;|&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&#8217;/g, '’').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8209;/g, '-');

function html(rel: string): string {
  const file = join(DIST, rel);
  assert.ok(existsSync(file), `${file} missing — run \`npm run build\` before this check`);
  return readFileSync(file, 'utf8');
}
const plain = (s: string) => decode(s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const mainOf = (rel: string) => plain(html(rel).match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '');
const gdpr = () => mainOf('gdpr/index.html');
const agents = () => mainOf('for-ai-agents/index.html');
const about = () => mainOf('about/index.html');

/** a constant of the product: `export const NAME = <expr>` as a number (`365 * 3` is evaluated) */
function numberConst(src: string, name: string): number {
  const m = src.match(new RegExp(`export const ${name}\\s*(?::[^=]+)?=\\s*([^;]+);`));
  assert.ok(m, `the product has no constant ${name} — it changed its file, fix this guard`);
  const expr = m![1]!.trim();
  assert.match(expr, /^[\d\s*+()]+$/, `${name} is not plain arithmetic: ${expr}`);
  return Function(`return (${expr})`)() as number;
}

const constants = () => product('packages/shared/src/utils/constants.ts');

test('the hours before an abandoned conversation is gone: the product’s stale hours plus the nightly job', () => {
  const stale = numberConst(constants(), 'STALE_SESSION_HOURS');
  const cron = JSON.parse(product('packages/api/vercel.json')) as { crons: { path: string; schedule: string }[] };
  const job = cron.crons.find((c) => c.path.includes('cleanup-sessions'));
  assert.ok(job, 'the product has no cleanup-sessions cron — the retention sentence of /gdpr has no source');
  assert.match(job!.schedule, /^\d+ \d+ \* \* \*$/, `the cleanup job is not daily (${job!.schedule}): re-derive the worst case`);
  const worst = stale + 24;
  assert.ok(gdpr().includes(`deleted within ${worst} hours of the visitor’s last message`), `/gdpr does not say «deleted within ${worst} hours of the visitor’s last message»`);
});

test('the consent record lives the product’s CONSENT_RETENTION_DAYS and /gdpr names what it holds', () => {
  const days = numberConst(constants(), 'CONSENT_RETENTION_DAYS');
  assert.equal(days % 365, 0, `CONSENT_RETENTION_DAYS ${days} is not whole years: /gdpr says «N years»`);
  const years = days / 365;
  const text = gdpr();
  assert.ok(text.includes(`is kept for ${years} years`), `/gdpr does not say the consent record is kept for ${years} years`);
  // the columns of the consent table (schema.ts, user_consents): the page names IP address and user agent while the table holds them
  const schema = product('packages/api/src/db/schema.ts');
  const table = schema.slice(schema.indexOf("pgTable('user_consents'"));
  assert.match(table.slice(0, 1400), /clientIp: inet\('client_ip'\)/, 'user_consents lost client_ip: /gdpr must stop naming the IP address');
  assert.match(table.slice(0, 1400), /userAgent: text\('user_agent'\)/, 'user_consents lost user_agent: /gdpr must stop naming the user agent');
  assert.ok(/IP address/.test(text) && /user agent/.test(text), '/gdpr does not name the IP address and the user agent of the consent record');
});

test('the region on /gdpr is the one the product deploys to', () => {
  const vercel = JSON.parse(product('packages/api/vercel.json')) as { regions: string[] };
  assert.deepEqual(vercel.regions, ['fra1'], 'the product deploys to another region: the sentence «EU (Frankfurt)» on /gdpr must be re-derived');
  assert.ok(gdpr().includes('EU (Frankfurt)'), '/gdpr does not say EU (Frankfurt)');
});

test('the four processors, their country and the basis of each transfer are the ones in Appendix B of the DPA', () => {
  const text = dpa();
  const appB = text.slice(text.indexOf('Appendix B'));
  const rows = appB.split('\n').filter((l) => /^\| \*\*(Vercel|Supabase|OpenAI|Plus Five)/.test(l));
  assert.equal(rows.length, 4, `Appendix B holds ${rows.length} rows for the four processors: the table on /gdpr has four`);
  const page = gdpr();
  const want: Array<[string, string, string]> = [
    ['Vercel Inc.', 'EU (Frankfurt)', '2021 Standard Contractual Clauses in the Vercel DPA'],
    ['Supabase Pte. Ltd', 'EU (AWS, Ireland)', '2021 Standard Contractual Clauses in the Supabase DPA'],
    ['OpenAI Ireland Ltd', 'United States', '2021 Standard Contractual Clauses in the OpenAI DPA'],
    ['Plus Five Five, Inc. (Resend)', 'United States', 'EU–US Data Privacy Framework and the 2021 Standard Contractual Clauses'],
  ];
  for (const [who, where, basis] of want) {
    assert.ok(page.includes(who) && page.includes(where) && page.includes(basis), `/gdpr does not carry the row ${who} · ${where} · ${basis}`);
  }
  const grep = (needle: RegExp) => rows.filter((r) => needle.test(r)).length;
  assert.equal(grep(/\*\*Vercel Inc\.\*\*.*2021 SCCs/), 1, 'the DPA row of Vercel no longer rests on the 2021 SCCs');
  assert.equal(grep(/\*\*Supabase Pte\. Ltd\*\*.*2021 SCCs/), 1, 'the DPA row of Supabase no longer rests on the 2021 SCCs');
  assert.equal(grep(/\*\*OpenAI Ireland Ltd\*\*.*2021 SCCs/), 1, 'the DPA row of OpenAI no longer rests on the 2021 SCCs');
  assert.equal(grep(/Plus Five Five.*Data Privacy Framework.*2021 SCCs/), 1, 'the DPA row of Resend no longer rests on the EU–US Data Privacy Framework and the SCCs');
});

test('every sentence and every table row of /gdpr that names Resend names the Data Privacy Framework too', () => {
  const body = html('gdpr/index.html').match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '';
  const rows = [...body.matchAll(/<tr\b[\s\S]*?<\/tr>/g)].map((m) => plain(m[0]));
  const rest = plain(body.replace(/<table\b[\s\S]*?<\/table>/g, ' '));
  const sentences = rest.split(/(?<=[.!?])\s+/);
  const named = [...rows, ...sentences].filter((x) => /Resend/.test(x));
  assert.ok(named.length >= 2, 'Resend is no longer named on /gdpr (capsule and table row): re-derive this guard');
  const bad = named.filter((x) => !/Data Privacy Framework/.test(x));
  assert.deepEqual(bad, [], 'a sentence names Resend without the Data Privacy Framework (the DPA: DPF and SCCs)');
});

test('OpenAI’s 30 days come from the DPA, and the page does not promise to shorten them', () => {
  const t = dpa();
  assert.match(t, /\*\*up to 30 days\*\*/, 'the DPA no longer says «up to 30 days» of abuse-monitoring retention');
  const page = gdpr();
  assert.ok(page.includes('up to 30 days'), '/gdpr does not say «up to 30 days»');
  assert.ok(page.includes('We cannot shorten the 30 days'), '/gdpr lost «We cannot shorten the 30 days»');
});

test('the widget stores in the browser only what /gdpr says: local storage and session storage, no cookie, no indexedDB', () => {
  const widget = join(PRODUCT_ROOT, 'packages/widget/src');
  assert.ok(existsSync(widget), `нет исходника продукта: ${widget}`);
  const used = (what: string): number => {
    // all .ts files of the widget except the specs; a grep without a shell
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSyncSafe(dir)) {
        const p = join(dir, e);
        if (isDir(p)) walk(p);
        else if (p.endsWith('.ts') && !/\.(spec|test)\.ts$/.test(p)) out.push(readFileSync(p, 'utf8'));
      }
    };
    walk(widget);
    return out.filter((s) => new RegExp(what).test(s)).length;
  };
  assert.equal(used('document\\.cookie'), 0, 'the widget now writes cookies: /gdpr says it sets no advertising or cross-site storage — re-derive');
  assert.equal(used('indexedDB'), 0, 'the widget now uses indexedDB: /gdpr names local and session storage only');
  assert.ok(used('localStorage') > 0 && used('sessionStorage') > 0, 'the widget no longer uses both storages');
  const page = gdpr();
  assert.ok(page.includes('(local storage)') && page.includes('(session storage'), '/gdpr does not name local storage and session storage');
});

function readdirSyncSafe(dir: string): string[] { try { return readdirSync(dir); } catch { return []; } }
function isDir(p: string): boolean { try { return statSync(p).isDirectory(); } catch { return false; } }

// L14 (legal L-1, founder variant B, 21.10): the live widget on the CDN (typelessity-widget.vercel.app, built before 85c8cbb) asks Google Fonts for DM Sans and
// Space Mono as soon as it appears on a page, before the consent question. /gdpr describes the widget on the CUSTOMER's site, where our Content-Security-Policy does
// not apply, so it says so (the earlier guard here, «Google appears nowhere», derived the completeness of /gdpr from the CSP of typelessity.com: another perimeter).
// The sentence goes when the widget with 85c8cbb is on the CDN (card L13 removes it together with §5 of the notice). Until then it is held here, and it is the
// ONLY place /gdpr names Google: the address lookup (Places) is off in the product, so no Google row sits in the processor table.
const GOOGLE_FONTS_SENTENCE =
  'Until the next widget release, the widget asks Google Fonts (Google) for its typefaces as soon as it appears on your page, before the consent question; the visitor’s browser then sends Google its IP address and browser details. typelessity.com blocks that request with its Content-Security-Policy; your site blocks it only if its own policy does.';

test('/gdpr says that the current widget asks Google Fonts before the consent question, and names Google nowhere else while the address lookup is off', () => {
  assert.match(constants(), /export const ADDRESS_LOOKUP_ENABLED: boolean = false;/, 'the address lookup is on: /gdpr must then name Google as a processor (DPA Appendix B, the Places row)');
  const page = gdpr();
  assert.ok(page.includes(GOOGLE_FONTS_SENTENCE), '/gdpr lost the sentence about Google Fonts: the live widget still asks Google for its typefaces before consent (FL-38)');
  assert.doesNotMatch(page.replace(GOOGLE_FONTS_SENTENCE, ' '), /Google/, '/gdpr names Google outside the Google Fonts sentence while the product has the address lookup off');
});

test('/for-ai-agents prints the model, the transcription model, the timeout and the languages of the product', () => {
  const c = constants();
  const model = c.match(/DEFAULT_MODEL:\s*'([^']+)'/)?.[1];
  assert.ok(model, 'the product has no DEFAULT_MODEL');
  const page = agents();
  assert.ok(page.includes(`extraction_model: OpenAI (currently ${model})`), `/for-ai-agents does not say «OpenAI (currently ${model})»`);
  const transcribe = product('packages/api/src/lib/model-usage.ts').match(/TRANSCRIPTION_MODEL\s*=\s*'([^']+)'/)?.[1];
  assert.ok(transcribe, 'the product has no TRANSCRIPTION_MODEL');
  assert.ok(page.includes(`voice_input: OpenAI ${transcribe}`), `/for-ai-agents does not say «voice_input: OpenAI ${transcribe}»`);
  const timeout = numberConst(product('packages/shared/src/types/enrichment.ts'), 'DEFAULT_ENRICHMENT_TIMEOUT_MS');
  assert.ok(page.includes(`enrichment_timeout_ms: ${timeout} by default`), `/for-ai-agents does not say the enrichment timeout is ${timeout}`);
  // equality of the sets of codes, not a count: «25+ … ar, zh» would have the right count of 25 plus a few that are not in the code
  const types = product('packages/shared/src/i18n/types.ts');
  const block = types.slice(types.indexOf('export const SUPPORTED_LOCALES'));
  const codes = [...block.slice(0, block.indexOf('] as const')).matchAll(/^\s*'([a-z]{2})',/gm)].map((m) => m[1]!);
  assert.equal(codes.length, 25, `the product now has ${codes.length} languages: the sites say 25 (LANDING_LANGUAGES, K1) — re-derive`);
  const line = page.match(/languages_supported: 25 \(([^)]*)\)/)?.[1];
  assert.ok(line, '/for-ai-agents has no «languages_supported: 25 (…)»');
  const listed = line!.split(',').map((x) => x.trim()).filter(Boolean);
  assert.deepEqual([...listed].sort(), [...codes].sort(), '/for-ai-agents lists other language codes than SUPPORTED_LOCALES');
  assert.ok(page.includes('reply_language: set per business, not detected'), '/for-ai-agents does not say the reply language is set per business and not detected');
});

test('/for-ai-agents keeps its honesty about the /agent endpoint (FL-32): not built, no release date', () => {
  const page = agents();
  assert.ok(/not built/i.test(page), '/for-ai-agents no longer says the endpoint is not built');
  assert.ok(/no release date/i.test(page), '/for-ai-agents no longer says there is no release date');
});

test('/gdpr, /about and /for-ai-agents: no promise of «no cookies», no «nothing … before», no language detected by the AI', () => {
  const BANNED = /no cookies|sets no cookies|nothing[^.]{0,40}before|(extracts|detects)[^.]{0,60}\bthe language\b/i;
  for (const [name, text] of [['/gdpr', gdpr()], ['/about', about()], ['/for-ai-agents', agents()]] as const) {
    assert.doesNotMatch(text, BANNED, `${name} says a thing no code backs`);
  }
});

test('/gdpr names the people it refers to: the DPA and the notice for visitors, by their exact addresses', () => {
  const body = html('gdpr/index.html').match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? '';
  for (const href of ['https://webappski.com/en/legal/dpa-typelessity', 'https://webappski.com/en/legal/privacy-typelessity']) {
    assert.ok(body.includes(`href="${href}"`), `/gdpr does not link ${href}`);
  }
  const t = plain(body);
  assert.ok(t.includes('is not for health data'), '/gdpr lost «not for health data»');
  assert.ok(t.includes('Five checks for any AI booking widget'), '/gdpr lost «Five checks for any AI booking widget»');
  assert.ok(t.includes('It is not legal advice'), '/gdpr lost «It is not legal advice»');
});
