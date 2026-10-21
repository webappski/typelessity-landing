import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { expectedSitemapCount, GONE_SLUGS } from './retired-industries';
import { PRICING_LAST_UPDATED } from '../src/app/pages/pricing/pricing.content';

// What a crawler receives as sitemap.xml. Google, «Build and submit a sitemap» (read 2026-10-19):
// <lastmod> is the date of the last significant update and is used only if consistently and verifiably
// accurate; <changefreq> and <priority> are ignored. So: a verifiable lastmod on every URL, nothing else.
// Reads the built bytes (run `npm run build` first). LANDING_DIST points at another copy of dist.

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const SITE = 'https://typelessity.com';

function read(name: string): string {
  const p = join(BROWSER, name);
  if (!existsSync(p)) throw new Error(`${p} missing — run \`npm run build\` before this check.`);
  return readFileSync(p, 'utf8');
}
const xml = read('sitemap.xml');
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, b]) => ({
  loc: b.match(/<loc>([^<]*)<\/loc>/)![1],
  lastmods: [...b.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]),
}));
const pathOf = (loc: string) => loc.slice(SITE.length) || '/';

test('sitemap: every URL has exactly one lastmod, a real calendar date, not later than tomorrow (UTC)', () => {
  // the ten static paths + one per .mdx post, counted from files and written lists — not from the data the generator reads
  assert.equal(entries.length, expectedSitemapCount(), `${entries.length} URLs`);
  // The date of a commit is local (Warsaw); between 00:00 and 02:00 there it is already «tomorrow» in UTC.
  const limit = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const bad: string[] = [];
  for (const e of entries) {
    const d = e.lastmods[0];
    if (e.lastmods.length !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(d ?? '')) { bad.push(`${e.loc}: lastmod ${JSON.stringify(e.lastmods)}`); continue; }
    if (new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) !== d) bad.push(`${e.loc}: ${d} is not a calendar date`);
    else if (d > limit) bad.push(`${e.loc}: ${d} is in the future`);
  }
  assert.deepEqual(bad, []);
});

test('sitemap: neither the hub nor any of the 37 addresses that had an industry page is listed', () => {
  assert.deepEqual(entries.map((e) => pathOf(e.loc)).filter((p) => /^\/industries(\/|$)/.test(p)), [], 'an /industries address is listed');
  assert.deepEqual(entries.filter((e) => GONE_SLUGS.some((s) => e.loc.endsWith(`/${s}`))).map((e) => e.loc), []);
  assert.doesNotMatch(xml, /industries/i);
});

test('sitemap: no changefreq, no priority, one namespace, no duplicate or foreign URL', () => {
  assert.doesNotMatch(xml, /<changefreq>|<priority>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.equal(new Set(entries.map((e) => e.loc)).size, entries.length, 'duplicate <loc>');
  for (const e of entries) assert.match(e.loc, /^https:\/\/typelessity\.com(\/[^?#]*)?$/, `${e.loc}: foreign host, query or fragment`);
});

/** Pages the build prerenders: /index.html and /<path>/index.html; the 404 shell and the CSR shell are not pages. */
function prerenderedPaths(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === 'index.html') out.push('/' + relative(BROWSER, dir).split('\\').join('/'));
    }
  };
  walk(BROWSER);
  return out.map((p) => (p === '/.' || p === '/' ? '/' : p)).sort();
}

test('sitemap: the set of addresses is the set of prerendered pages, each page canonical to itself', () => {
  const pages = prerenderedPaths();
  const listed = entries.map((e) => pathOf(e.loc)).sort();
  assert.deepEqual(listed, pages);
  for (const p of pages) {
    const html = read(p === '/' ? 'index.html' : `${p.slice(1)}/index.html`);
    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1] ?? html.match(/<link[^>]*href="([^"]*)"[^>]*rel="canonical"/)?.[1];
    assert.equal(canonical, `${SITE}${p === '/' ? '' : p}`, `${p}: canonical`);
  }
});

// L10 (point 6 of the brief): a crawler without JavaScript reads the <title> of the file it gets. A page prerendered with the title of another page
// (the shell's, or the home page's) is a page that says nothing of its own; every address has its own, and no two are the same.
test('sitemap: every prerendered page has its own <title>, and no title is printed by two pages', () => {
  const byTitle = new Map<string, string[]>();
  for (const p of prerenderedPaths()) {
    const html = read(p === '/' ? 'index.html' : `${p.slice(1)}/index.html`);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    assert.ok(title, `${p}: no <title> in the prerendered file`);
    byTitle.set(title!, [...(byTitle.get(title!) ?? []), p]);
  }
  assert.equal(byTitle.size, expectedSitemapCount(), `the titles of ${byTitle.size} pages were read — the sitemap lists ${expectedSitemapCount()} addresses`);
  assert.deepEqual([...byTitle].filter(([, ps]) => ps.length > 1).map(([t, ps]) => `${t} ← ${ps.join(', ')}`), [], 'two pages print the same <title>');
});

test('sitemap: no address is the source of a redirect in vercel.json', () => {
  const vj = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')) as { redirects: { source: string }[] };
  for (const e of entries) for (const r of vj.redirects) {
    assert.ok(!new RegExp(`^${r.source}$`).test(pathOf(e.loc)), `${e.loc} is redirected by ${r.source}`);
  }
});

test('sitemap: posts carry updatedAt ?? publishedAt read from the article files, not from the manifest', () => {
  const dir = join(ROOT, 'src', 'assets', 'content', 'blog');
  const files = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  assert.ok(files.length >= 10);
  for (const f of files) {
    const fm = matter(readFileSync(join(dir, f), 'utf8')).data as { publishedAt: string; updatedAt?: string };
    const e = entries.find((x) => x.loc === `${SITE}/blog/${f.replace(/\.mdx$/, '')}`);
    if (!e) continue; // a retired post is not listed
    assert.equal(e.lastmods[0], String(fm.updatedAt ?? fm.publishedAt), f);
  }
});

// L12 (C15): the date printed under the tiers of /pricing and the <lastmod> of /pricing are one date. Read from the built bytes of both files,
// and from the one constant they both come from (pricing.content.ts, which tools/build-sitemap.ts imports).
test('sitemap: «Page last updated <date>» on /pricing is the lastmod of /pricing, printed once, as text', () => {
  const html = read('pricing/index.html').replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const printed = [...text.matchAll(/Page last updated (\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
  assert.equal(printed.length, 1, `«Page last updated» is printed ${printed.length} times`);
  // L14 (C15): the date moves with any edit of the page (it is the lastmod), so it is the date of the PAGE; «Prices last updated» claimed that the
  // prices changed that day, and they had not (19.10). The old label must not come back.
  assert.doesNotMatch(text, /Prices last updated/i, 'the date is labelled as the date of the prices again; it is the date of the page');
  const lastmod = entries.find((e) => pathOf(e.loc) === '/pricing')?.lastmods[0];
  assert.equal(printed[0], lastmod, 'the date on the page is not the lastmod of /pricing');
  assert.equal(printed[0], PRICING_LAST_UPDATED, 'the date on the page is not the constant of pricing.content.ts');
});

function git(...args: string[]): string {
  for (const bin of ['/usr/bin/git', 'git']) {
    try { return execFileSync(bin, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* next */ }
  }
  return '';
}

// L2 Р3: the structured data of a page lives in `src/app/core/seo/schemas.ts`, not in the page folder, so the formula also
// reads the functions of that file a page calls — by name, not the whole file (every edit of `articleLd` would otherwise
// move /about). The names are derived, never listed: (1) what the non-spec .ts files of `src/app/pages/<dir>/` import from
// `core/seo/schemas`; (2) the other exports of schemas.ts that appear in the body of a name already taken; (2) repeats
// until the set stops growing (softwareApplicationLd → orgRef → ORG_ID is two steps).
// The body of a name = from its `^export <kw> <name>` line to the next line that begins with a letter — the very range
// `git log -L` takes when the file has no diff driver.
const SCHEMAS = 'src/app/core/seo/schemas.ts';
const schemasSrc = readFileSync(join(ROOT, SCHEMAS), 'utf8').split('\n');
const schemaExports = [...schemasSrc.join('\n').matchAll(/^export [a-z]+ (\w+)/gm)].map((m) => m[1]);
function schemaBody(name: string): string {
  const at = schemasSrc.findIndex((l) => new RegExp(`^export [a-z]+ ${name}\\b`).test(l));
  if (at < 0) return '';
  let end = at + 1;
  while (end < schemasSrc.length && !/^[A-Za-z]/.test(schemasSrc[end])) end++;
  return schemasSrc.slice(at, end).join('\n');
}
function schemaNamesOf(dir: string): string[] {
  const base = join(ROOT, 'src', 'app', 'pages', dir);
  const taken = new Set<string>();
  const files = existsSync(base) ? readdirSync(base).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts')) : [];
  for (const f of files) {
    const src = readFileSync(join(base, f), 'utf8');
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']*core\/seo\/schemas'/g)) {
      for (const id of m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean)) taken.add(id);
    }
  }
  for (let grew = true; grew;) {
    grew = false;
    for (const name of [...taken]) {
      const body = schemaBody(name);
      for (const other of schemaExports) {
        if (!taken.has(other) && new RegExp(`\\b${other}\\b`).test(body.split('\n').slice(1).join('\n'))) { taken.add(other); grew = true; }
      }
    }
  }
  return [...taken].sort();
}
/** Last commit date of one function of schemas.ts. The regex is BRE, has no quotes inside (execFileSync has no shell: a quote becomes part of it) and `[a-z]*` instead of an alternation. */
const schemaNameDate = (name: string): string => git('log', '-1', '--format=%cs', '--no-patch', '-L', `:^export [a-z]* ${name}\\b:${SCHEMAS}`);

test('sitemap: a page is not dated before its last edit (the formula of D7: page folder, its seo.* keys and, by name, the schemas.ts functions it calls)', () => {
  // L14: no skip. A shallow clone or a tree without git has no history, and a green run on such a tree would say nothing about the dates (tests are not skipped).
  const shallow = git('rev-parse', '--is-shallow-repository') !== 'false';
  if (shallow) assert.fail('the date formula needs git history: clone without --depth');
  // the fourth member lists files a page's text also comes from: the home page
  // also draws its blog cards, its six questions and its languages from files of other pages (L4). The FAQ answers used to live with
  // the home content; since L4 the home page only reads them from the FAQ's own file (L1б: the home date was a literal that had fallen a day behind)
  const pages: Array<[string, string, string?, string[]?]> = [
    ['/', 'home', 'home', ['src/app/pages/faq/faq.content.ts', 'src/app/pages/how-it-works/how-it-works.content.ts', 'src/app/core/languages/landing-languages.ts']],
    ['/how-it-works', 'how-it-works', 'howItWorks'], ['/install', 'install', 'install'], ['/pricing', 'pricing', 'pricing'], ['/gdpr', 'gdpr', 'gdpr'],
    ['/for-ai-agents', 'for-ai-agents', 'forAiAgents'], ['/faq', 'faq', 'faq'],
    ['/about', 'about', 'about'], ['/blog', 'blog', 'blog'],
    ['/legal/security', 'legal'],
  ];
  const bad: string[] = [];
  // the pages whose JSON-LD is built in schemas.ts by what their component calls (Р3); /faq and /how-it-works are not in the list (L9 added /blog: blogLd)
  const SCHEMA_PAGES = new Set(['/', '/pricing', '/gdpr', '/for-ai-agents', '/about', '/blog', '/legal/security']);
  const nameDates = (dir: string, where: string): string[] => {
    const names = schemaNamesOf(dir);
    const dated = names.map((n) => [n, schemaNameDate(n)] as const);
    // a name that gave no date (a missing anchor, an unmatched regex) would drop out of the max silently. A name that is not
    // in the committed schemas.ts yet is new in the commit being made: it has no earlier date, and the page is dated by that commit.
    const committed = git('show', `HEAD:${SCHEMAS}`);
    for (const [n, d] of dated) if (!d && new RegExp(`^export [a-z]+ ${n}\\b`, 'm').test(committed)) bad.push(`${where}: schemas.ts function ${n} gave no commit date`);
    return dated.map(([, d]) => d);
  };
  for (const [path, dir, key, extra] of pages) {
    const dates = [git('log', '-1', '--format=%cs', '--', `src/app/pages/${dir}/`), ...(extra ?? []).map((f) => git('log', '-1', '--format=%cs', '--', f))];
    if (SCHEMA_PAGES.has(path)) {
      if (['/', '/pricing', '/for-ai-agents', '/about'].includes(path)) assert.ok(schemaNamesOf(dir).length > 0, `${path}: no schemas.ts function derived from src/app/pages/${dir}/`);
      dates.push(...nameDates(dir, path));
    }
    if (key) dates.push(git('log', '-1', '--format=%cs', `-G'seo\\.${key}\\.`, '--', 'src/app/i18n/translations.en.ts'));
    const need = dates.filter(Boolean).sort().at(-1) ?? '';
    const got = entries.find((e) => pathOf(e.loc) === path)?.lastmods[0] ?? '';
    if (got < need) bad.push(`${path}: lastmod ${got || '(none)'} < last edit ${need}`);
  }
  assert.deepEqual(bad, []);
});
