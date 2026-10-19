import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { expectedSitemapCount, RETIRED_SLUGS, SEVEN_SLUGS } from './industries-seven';

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
  // the nine static paths + the seven kept industries + one per .mdx post, counted from files and written lists — not from the data the generator reads
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

test('sitemap: the industry pages are the seven kept ones and none of the 30 taken down', () => {
  const industry = entries.map((e) => pathOf(e.loc)).filter((p) => p.startsWith('/industries/')).map((p) => p.slice('/industries/'.length)).sort();
  assert.deepEqual(industry, [...SEVEN_SLUGS].sort());
  assert.ok(entries.some((e) => pathOf(e.loc) === '/industries'), 'the hub is not listed');
  assert.deepEqual(entries.filter((e) => RETIRED_SLUGS.some((s) => e.loc.endsWith(`/${s}`))).map((e) => e.loc), []);
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

function git(...args: string[]): string {
  for (const bin of ['/usr/bin/git', 'git']) {
    try { return execFileSync(bin, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* next */ }
  }
  return '';
}

test('sitemap: a page is not dated before its last edit (the formula of D7: page folder and its seo.* keys)', (t) => {
  const shallow = git('rev-parse', '--is-shallow-repository') !== 'false';
  if (shallow) return t.skip('shallow clone or no git: the formula needs history');
  // the fourth member lists files a page's text also comes from: the industry data feeds the home grid and the hub,
  // the FAQ answers live with the home content (L1б: the home date was a literal that had fallen a day behind)
  const pages: Array<[string, string, string?, string[]?]> = [
    ['/', 'home', 'home', ['src/app/lib/industries/']],
    ['/how-it-works', 'how-it-works', 'howItWorks'], ['/pricing', 'pricing', 'pricing'],
    ['/industries', 'industries', 'industries', ['src/app/lib/industries/']],
    ['/for-ai-agents', 'for-ai-agents', 'forAiAgents'], ['/faq', 'faq', 'faq', ['src/app/pages/home/home.content.ts']],
    ['/about', 'about', 'about'], ['/blog', 'blog', 'blog'],
    ['/legal/security', 'legal'],
  ];
  const bad: string[] = [];
  for (const [path, dir, key, extra] of pages) {
    const dates = [git('log', '-1', '--format=%cs', '--', `src/app/pages/${dir}/`), ...(extra ?? []).map((f) => git('log', '-1', '--format=%cs', '--', f))];
    if (key) dates.push(git('log', '-1', '--format=%cs', `-G'seo\\.${key}\\.`, '--', 'src/app/i18n/translations.en.ts'));
    const need = dates.filter(Boolean).sort().at(-1) ?? '';
    const got = entries.find((e) => pathOf(e.loc) === path)?.lastmods[0] ?? '';
    if (got < need) bad.push(`${path}: lastmod ${got || '(none)'} < last edit ${need}`);
  }
  const lib = git('log', '-1', '--format=%cs', '--', 'src/app/lib/industries/');
  for (const e of entries.filter((x) => pathOf(x.loc).startsWith('/industries/'))) {
    if ((e.lastmods[0] ?? '') < lib) bad.push(`${pathOf(e.loc)}: lastmod ${e.lastmods[0]} < industries data edit ${lib}`);
  }
  assert.deepEqual(bad, []);
});
