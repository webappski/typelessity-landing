import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// TYL-NO-SETUP-FOR-YOU-COPY (founder 13.11 ≈12:37: «мы помогаем только… Мы не можем сделать это за него»). The landing used to promise
// «we set it up with you for free: we reply by email and arrange a call». We do not set up a site for its owner: the owner sets it up in
// the portal and our team answers questions. The classes of the guard (card §«Таблица текстов»):
//   N1  no page, llms file, structured data or source says «set it up with/for you», «we set up (your) config», «with us, for free»,
//       «for free» next to «we / us / our team», or «rather not do it yourself»;
//   N2  the replacement is there: /install says «Need a hand setting up?», its button «Ask our team» still leads to #setup-with-us,
//       and the FAQ answer about setup says «ask our team»;
//   N3  /install and the home page do not say «Two ways to get there» / «2 ways» any more (there is one way, and help);
//   N4  nowhere on the landing the deadline «same working day» (it is true only after the product's WA-TY-REPLYBY-SAME-DAY ships;
//       the day it does, this class is lifted in the same commit as the line that writes the deadline).
// It reads the bytes a visitor and an AI crawler receive (dist/typelessity-landing/browser: html and txt, JSON-LD included) and the
// sources of src/. Run `npm run build` first. LANDING_DIST / LANDING_SRC point the guard at another copy (the mutation runs feed
// them a copy with the old text put back; each must go red).

const DIST = process.env['LANDING_DIST'] ?? join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const SRC = process.env['LANDING_SRC'] ?? join(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** What a reader sees: no scripts or styles, no tags, entities decoded, whitespace collapsed. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ');
}

// ── N1: the forms, by class ──────────────────────────────────────────────────────────────────────
// A window never crosses a full stop or a tag («[^.<>]»), so one sentence cannot borrow the «we» of the next one.
const FORBIDDEN: ReadonlyArray<readonly [string, RegExp]> = [
  ['set up with/for you', /\bsets?(?: it| the config| your config| your site’s config)? up\b[^.<>]{0,40}\b(?:with|for) you\b/i],
  ['we set up (your) config', /\bwe set up (?:the |your )?(?:site’s )?config\b/i],
  ['Webappski sets it up', /\bWebappski sets (?:it )?up\b/i],
  ['with us, for free', /\bwith us\b[^.<>]{0,12}\bfor free\b/i],
  ['for free next to we/us/our team', /\b(?:we|us|our team)\b[^.<>]{0,60}\bfor free\b|\bfor free\b[^.<>]{0,60}\b(?:we|us|our team)\b/i],
  ['rather not do it yourself', /rather not do it yourself/i],
];

function offences(text: string): string[] {
  const out: string[] = [];
  for (const [name, re] of FORBIDDEN) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(g)) out.push(`${name}: «${m[0].trim()}»`);
  }
  return out;
}

test('[N1] the checker catches every old form and lets the new sentences through', () => {
  for (const mutant of [
    'set it up yourself in simple steps, or we set it up with you for free.',
    'We set up the config with you for free: we reply by email and arrange a call.',
    'We set up your config with you for free: we reply by email and arrange a call.',
    'a wizard you complete yourself, or we set it up with you for free (write to us on /install)',
    'First your site’s config in the Webappski portal, yourself or with us for free; then the code',
    'or Webappski sets it up with you for free',
    'a free account, set up by you or with us, for free',
    'No AI chat and rather not do it yourself?',
    'We build it, for free, with our team',
  ]) assert.ok(offences(mutant).length > 0, `N1 does not catch «${mutant}»`);
  for (const legal of [
    'set it up yourself in simple steps, and ask our team if you need a hand.',
    'We reply by email, and if you’d rather talk it through, we can arrange a call.',
    'a wizard you complete yourself; if a step is unclear, ask our team (write to us on /install).',
    'First your site’s config in the Webappski portal, set up by you; then the code from the Install step.',
    'Create a free account in the Webappski portal, choose Typelessity and go through the setup steps',
    'Try it free on your website',
    'checks your booking system for what is free, if it has an API',
  ]) assert.deepEqual(offences(legal), [], `N1 flags the legal form «${legal}»`);
});

let pages: Map<string, string>;
let sources: Map<string, string>;

before(() => {
  assert.ok(existsSync(DIST), `${DIST} missing — run \`npm run build\` before this check`);
  pages = new Map(
    walk(DIST)
      .filter((f) => f.endsWith('.html') || f.endsWith('.txt'))
      .filter((f) => !f.endsWith('3rdpartylicenses.txt'))
      .map((f) => [relative(DIST, f), readFileSync(f, 'utf8')] as const),
  );
  assert.ok(pages.size >= 20 && pages.has('install/index.html') && pages.has('faq/index.html') && pages.has('llms.txt'), `expected the prerendered site in ${DIST}, found ${pages.size} text files`);
  sources = new Map(
    walk(SRC)
      .filter((f) => /\.(ts|html)$/.test(f) && !/\.spec\.ts$/.test(f))
      .map((f) => [relative(SRC, f), readFileSync(f, 'utf8')] as const),
  );
  assert.ok(sources.has('app/pages/install/install.content.ts') && sources.has('app/i18n/translations.en.ts'), `expected src/ in ${SRC}`);
});

test('[N1] no page, post, llms file or structured data of the build promises to set the site up with or for the owner', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    // the raw bytes (meta, JSON-LD included) and what a reader sees: an entity in the middle of a phrase must not hide it
    for (const o of new Set([...offences(body), ...offences(visibleText(body))])) offenders.push(`${path}: ${o}`);
  }
  assert.deepEqual(offenders, [], 'the landing promises something we do not do: the owner sets the config up, our team answers questions');
});

test('[N1] no source of src/ carries the promise either (a place the prerender does not reach yet)', () => {
  const offenders: string[] = [];
  for (const [path, body] of sources) for (const o of offences(body)) offenders.push(`src/${path}: ${o}`);
  assert.deepEqual(offenders, [], 'a source file of the landing promises to set the site up with or for the owner');
});

// ── N2: the replacement is there ─────────────────────────────────────────────────────────────────
test('[N2] /install says «Need a hand setting up?», its button «Ask our team» goes to #setup-with-us, and the FAQ says «ask our team»', () => {
  const install = pages.get('install/index.html')!;
  const text = visibleText(install);
  assert.ok(text.includes('Need a hand setting up?'), '/install has no «Need a hand setting up?»');
  const button = [...install.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].find((m) => visibleText(m[2]).startsWith('Ask our team'));
  assert.ok(button, '/install has no button «Ask our team»');
  assert.ok(/#setup-with-us$/.test(button![1]), `the button «Ask our team» leads to «${button![1]}», not to #setup-with-us`);
  assert.ok(/id="setup-with-us"/.test(install), '/install lost the section #setup-with-us: the entry line of the portal links to it');
  const faq = visibleText(pages.get('faq/index.html')!);
  assert.ok(/a wizard you complete yourself; if a step is unclear, ask our team/.test(faq), 'the FAQ answer about setup does not say «ask our team»');
  assert.ok(/our team helps if you ask/i.test(visibleText(pages.get('llms.txt')!)), 'llms.txt does not say that our team helps if you ask');
});

// ── N3: one way, and help ────────────────────────────────────────────────────────────────────────
test('[N3] /install and the home page do not count «two ways» to set the config up any more', () => {
  for (const path of ['install/index.html', 'index.html', 'llms.txt', 'llms-full.txt']) {
    const t = visibleText(pages.get(path)!);
    assert.ok(!/Two ways to get there/i.test(t), `${path} still says «Two ways to get there»`);
    assert.ok(!/\b2 ways\b/i.test(t), `${path} still says «2 ways»`);
  }
});

// ── N4: no deadline yet ──────────────────────────────────────────────────────────────────────────
test('[N4] the landing does not promise «same working day» until the product answers that fast (WA-TY-REPLYBY-SAME-DAY)', () => {
  const offenders = [...pages].filter(([, body]) => /same working day/i.test(visibleText(body))).map(([p]) => p);
  assert.deepEqual(offenders, [], 'a page promises a reply deadline the product does not keep yet');
});
