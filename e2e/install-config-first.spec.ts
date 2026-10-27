import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { INSTALL } from '../src/app/pages/install/install.content';

// TY-INSTALL (founder 26.10: «Ни в коем случае мы не должны показывать, что эти только две строчки. Сначала перед этими двумя
// строчками надо написать, что обязательно надо сделать конфиг для вашего сайта»). The classes of the guard, by the number the
// card TY-INSTALL gives them (not the K-numbers of claims-dictionary.ts, a different list):
//   K1  no sentence, stat or structured-data line says «two lines» / «2 lines» / «two-line» without saying «config»;
//   K2  the config comes before the code: the sentence that opens /install, the block #config-first, and the note
//       INSTALL.code.note above every embed code on /install, /how-it-works and /;
//   K4  the «Questions before you start?» form on /install is the form of /pricing, not a copy of it;
//   K5  what the note says about the code is read from the code of the product: the embed carries no key of a site,
//       and the API answers 404 when the address of the page has no config (R67 п.3, the seam is read, not typed).
// It reads the bytes a visitor and an AI crawler receive (dist/typelessity-landing/browser: html and txt), not the sources;
// K4 and K5 also read sources. Run `npm run build` first.
// LANDING_DIST / LANDING_SRC point the guard at another copy of the build / of src/ (the mutation runs feed them a copy with the
// old text, or a copy of the form, put back; each must go red).

const DIST = process.env['LANDING_DIST'] ?? join(process.cwd(), 'dist', 'typelessity-landing', 'browser');
const SRC = process.env['LANDING_SRC'] ?? join(process.cwd(), 'src');
const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');

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

let pages: Map<string, string>;

before(() => {
  assert.ok(existsSync(DIST), `${DIST} missing — run \`npm run build\` before this check`);
  pages = new Map(
    walk(DIST)
      .filter((f) => f.endsWith('.html') || f.endsWith('.txt'))
      .filter((f) => !f.endsWith('3rdpartylicenses.txt'))
      .map((f) => [relative(DIST, f), readFileSync(f, 'utf8')] as const),
  );
  assert.ok(pages.size >= 20 && pages.has('install/index.html') && pages.has('llms.txt'), `expected the prerendered site in ${DIST}, found ${pages.size} text files`);
});

// ── K1 ───────────────────────────────────────────────────────────────────────────────────────────
// A class, not a list: the window of the sentence (up to 80 characters on each side, stopping at a full stop or a tag) around any
// «two lines», «2 lines» or «two-line» must carry the WORD «config» (not «configuration»: the old llms.txt line «…writes the configuration), then two
// lines of HTML» had that word in its window and passed the first form of this guard). The raw bytes are read: title, meta and JSON-LD included.
// The one exception is by slug: designing-for-ai-agents quotes Google's page («Two lines from Google's page …»), a different two lines.
const TWO_LINES = /[^.<>]{0,80}\b(?:two|2)[ -]lines?\b[^.<>]{0,80}/gi;
const K1_EXEMPT_PREFIX = 'blog/designing-for-ai-agents';

function twoLinesWithoutConfig(body: string): string[] {
  return [...body.matchAll(TWO_LINES)].map((m) => m[0].trim()).filter((s) => !/\bconfig\b/i.test(s));
}

test('[K1] the checker catches «two lines» without the config and lets the config sentence through', () => {
  for (const mutant of [
    'then two lines of HTML — a web component',
    '<b>2 lines</b><span>Of code your web developer pastes on your site</span>',
    '"Two-line HTML embed (web component)"',
    'Set up Typelessity in the Webappski portal, paste two lines of HTML, and receive booking requests',
    'a setup wizard in the Webappski portal (step by step, or your own AI writes the configuration), then two lines of HTML — a web component.',
  ]) assert.ok(twoLinesWithoutConfig(mutant).length > 0, `K1 does not catch «${mutant}»`);
  for (const legal of [
    'First your site’s config in the Webappski portal, then the code from the Install step',
    'your config is published; then paste two lines of HTML',
    '<b>2 ways</b><span>To set up your site’s config: yourself in the Webappski portal, or with us for free</span>',
  ]) assert.deepEqual(twoLinesWithoutConfig(legal), [], `K1 flags the legal form «${legal}»`);
});

test('[K1] no page, post, llms file or structured data says «two lines» of the embed without the config', () => {
  const offenders: string[] = [];
  for (const [path, body] of pages) {
    if (path.startsWith(K1_EXEMPT_PREFIX)) continue;
    for (const s of twoLinesWithoutConfig(body)) offenders.push(`${path}: «${s}»`);
  }
  assert.deepEqual(offenders, [], 'a place sells the install as «two lines» and does not say the site needs its config first');
});

// ── K2 ───────────────────────────────────────────────────────────────────────────────────────────
const main = (html: string) => html.slice(html.indexOf('<main'));
// The embed code is the <pre> that holds the element itself; the CSP block names the widget's host (typelessity-widget.vercel.app) and is not code to paste.
const codeBlocks = (html: string) => [...html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi)].filter((m) => /(?:&lt;|<)typelessity-widget\b/.test(m[0]));

test('[K2] /install opens with the config: the first paragraph after the H1, then #config-first before the steps and before the code', () => {
  const html = pages.get('install/index.html')!;
  const afterH1 = html.slice(html.indexOf('</h1>'));
  const first = afterH1.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
  assert.ok(visibleText(first).startsWith('Start with your site’s config'), `the first paragraph after the H1 of /install is «${visibleText(first).slice(0, 90)}»`);
  const m = main(html);
  const at = (needle: string) => m.indexOf(needle);
  assert.ok(at('id="config-first"') >= 0, '/install has no #config-first block');
  assert.ok(at('id="config-first"') < at('install-steps'), '#config-first is not before the three steps');
  assert.ok(at('install-steps') < at('install-code'), 'the steps are not before the code');
});

test('[K2] every embed code on /install, /how-it-works and / has the note «Example … works only after your site’s config is published» before it', () => {
  for (const path of ['install/index.html', 'how-it-works/index.html', 'index.html']) {
    const m = main(pages.get(path)!);
    const blocks = codeBlocks(m);
    assert.ok(blocks.length >= 1, `${path} shows no embed code any more: the guard has nothing to hold`);
    let from = 0;
    for (const [i, b] of blocks.entries()) {
      const between = visibleText(m.slice(from, b.index));
      assert.ok(between.includes(INSTALL.code.note), `${path}: the embed code number ${i + 1} has no note before it (between the previous block and this one)`);
      from = b.index! + b[0].length;
    }
  }
});

// ── K4 ───────────────────────────────────────────────────────────────────────────────────────────
test('[K4] /install has exactly one «Questions before you start?» form and it is the component of /pricing, not a copy', () => {
  for (const path of ['install/index.html', 'pricing/index.html']) {
    const html = pages.get(path)!;
    assert.equal([...html.matchAll(/<form\b[^>]*class="[^"]*\bcf\b/g)].length, 1, `${path} has not exactly one form.cf`);
    assert.equal([...html.matchAll(/id="cf-email"/g)].length, 1, `${path}: the id cf-email is not unique`);
  }
  const install = pages.get('install/index.html')!;
  assert.ok(/id="setup-with-us"/.test(install), '/install has no #setup-with-us section');
  assert.ok(install.indexOf('id="setup-with-us"') < install.indexOf('id="cf-email"'), 'the form of /install is not inside #setup-with-us');
  const owners = walk(SRC)
    .filter((f) => /\.(ts|html)$/.test(f) && !f.endsWith('.spec.ts'))
    .filter((f) => readFileSync(f, 'utf8').includes('Privacy notice for this form'))
    .map((f) => relative(SRC, f));
  assert.deepEqual(owners, ['app/shared/contact-form/contact-form.component.ts'], 'the privacy notice of the form is printed outside its one component: a copy of the form');
});

// ── K5 ───────────────────────────────────────────────────────────────────────────────────────────
test('[K5] the note is true: the embed carries only api-url, and the product answers 404 when the address has no config', () => {
  const route = join(PRODUCT_ROOT, 'packages/api/src/app/api/config/by-domain/route.ts');
  assert.ok(existsSync(route), `нет исходника продукта: ${route}; задай TY_PRODUCT_ROOT или клонируй репозиторий`);
  const src = readFileSync(route, 'utf8');
  assert.ok(/findByDomain\(hostname\)/.test(src), 'the product no longer finds the config by the hostname of the page: fix INSTALL.code.note');
  assert.ok(/'No active widget is configured for this domain\.',\s*404/.test(src), 'the product no longer answers 404 «No active widget is configured for this domain.»: fix INSTALL.code.note');
  const attrs = (code: string) => [...(code.match(/<typelessity-widget\b([^>]*)>/)?.[1] ?? '').matchAll(/([a-z-]+)=/g)].map((m) => m[1]);
  for (const path of ['install/index.html', 'how-it-works/index.html', 'index.html']) {
    for (const b of codeBlocks(main(pages.get(path)!))) {
      assert.deepEqual(attrs(visibleText(b[0])), ['api-url'], `${path}: the embed code carries more than api-url (a key of the site would make the note false)`);
    }
  }
});
