import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

// L12 (2026-10-21), the text cards of the SEO page audit of 2026-10-20, as a crawler receives them (the built bytes; run `npm run build` first):
//   C2  the promo of Webappski on `/` is wrapped in data-nosnippet (on the div, not on the aside)
//   C3  the first block of every article is its answer; the dated notes sit at the end under «What changed in this article», order unchanged
//   C8  the author's name in the meta line of an article is a link to /about
//   C9  an article's picture is its own file or the common one, never another article's; the comparison picture is light; a large preview is allowed
//   C13 the footer's column headings are h2 (heading order), on every page
//   C14 the two headings of /for-ai-agents speak to a developer, not to a robot
// LANDING_DIST points at another copy of dist/typelessity-landing/browser (the mutation run feeds it a copy with one defect put back).

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const BLOG_DIR = join(ROOT, 'src', 'assets', 'content', 'blog');

const read = (rel: string): string => {
  const p = join(BROWSER, rel);
  if (!existsSync(p)) throw new Error(`${p} missing — run \`npm run build\` before this check.`);
  return readFileSync(p, 'utf8');
};
const SLUGS = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')).sort();
const article = (slug: string) => read(`blog/${slug}/index.html`);
// L14: the text and the list of changes are two <markdown> elements with the block «Try it free» between them; the body of the article is the two together, in order.
const markdownOf = (html: string) => [...html.matchAll(/<markdown[^>]*>([\s\S]*?)<\/markdown>/g)].map((m) => m[1]).join('\n');

function allHtml(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.html') && name !== 'index.csr.html') out.push([relative(BROWSER, full), readFileSync(full, 'utf8')]);
    }
  };
  walk(BROWSER);
  return out;
}

test('there are ten articles (the loops below are not empty)', () => {
  assert.equal(SLUGS.length, 10);
});

// ── C2 ──
test('C2 `/`: the promo wrapper is a div with data-nosnippet; the aside has none; no other element of the page carries it', () => {
  const html = read('index.html');
  const wrappers = [...html.matchAll(/<div\b[^>]*\bpilot-offer-wrap\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(wrappers.length, 1);
  assert.match(wrappers[0], /\bdata-nosnippet\b/);
  assert.equal([...html.matchAll(/data-nosnippet/g)].length, 1, 'data-nosnippet is printed once on the page');
  const aside = html.match(/<aside\b[^>]*pilot-offer[^>]*>/)?.[0] ?? '';
  assert.ok(aside, 'the promo aside is gone');
  assert.doesNotMatch(aside, /data-nosnippet/);
});

// ── C3 ──
test('C3 every article: the first block of the body is not a note (it is the answer), and no note stands before the text', async (t) => {
  for (const slug of SLUGS) {
    await t.test(slug, () => {
      const body = markdownOf(article(slug)).trimStart();
      assert.ok(body.length > 0, 'no markdown body');
      assert.doesNotMatch(body, /^<blockquote/, 'the body opens with a blockquote');
      assert.doesNotMatch(body.slice(0, body.indexOf('What changed in this article')), /Updated 20\d\d-\d\d-\d\d — what changed/, 'a note stands before the section');
      assert.match(body, /^<p><strong>/, 'the first block is the bold answer paragraph');
    });
  }
});

test('C3 every article ends with «What changed in this article»: one h2, after the FAQ, then the notes in the order of the source, newest first', async (t) => {
  for (const slug of SLUGS) {
    await t.test(slug, () => {
      const body = markdownOf(article(slug));
      const h2s = [...body.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1].trim());
      assert.equal(h2s.filter((h) => h === 'What changed in this article').length, 1);
      assert.equal(h2s.at(-1), 'What changed in this article', 'the section is the last one');
      assert.ok(h2s.indexOf('FAQ') > -1 && h2s.indexOf('FAQ') < h2s.length - 1, 'the FAQ stays before the section');
      const after = body.slice(body.indexOf('What changed in this article'));
      const dates = [...after.matchAll(/<strong>Updated (\d{4}-\d{2}-\d{2}) — what changed:<\/strong>/g)].map((m) => m[1]);
      const src = matter(readFileSync(join(BLOG_DIR, `${slug}.mdx`), 'utf8'));
      const written = [...src.content.matchAll(/^> \*\*Updated (\d{4}-\d{2}-\d{2}) — what changed:/gm)].map((m) => m[1]);
      assert.ok(written.length >= 1);
      assert.deepEqual(dates, written, 'the notes of the page are the notes of the source, in the same order');
      assert.deepEqual([...dates].sort().reverse(), dates, 'newest first');
      assert.equal(String(src.data['updatedAt']), dates[0], 'dateModified is the newest note (unchanged by the move)');
      assert.equal(after.match(/<blockquote/g)?.length, dates.length, 'every blockquote after the heading is a dated note');
    });
  }
});

test('C3 no article tells the reader how the site is built: three phrases of the old notes are gone from every page', () => {
  const bad: string[] = [];
  for (const slug of SLUGS) {
    for (const phrase of ['the site has no industry pages', 'the paths in the text are links', 'the title and summary are shorter']) {
      if (article(slug).includes(phrase)) bad.push(`${slug}: «${phrase}»`);
    }
  }
  assert.deepEqual(bad, []);
});

// ── C8 ──
test('C8 every article: «Alex Isa» in the meta line is one link to /about', async (t) => {
  for (const slug of SLUGS) {
    await t.test(slug, () => {
      const html = article(slug);
      const meta = html.match(/class="blog-post__meta"[\s\S]*?<\/div>/)?.[0] ?? '';
      const links = [...meta.matchAll(/<a\b[^>]*href="\/about"[^>]*>\s*Alex Isa\s*<\/a>/g)];
      assert.equal(links.length, 1, 'the byline is not a link to /about');
      const names = [...html.matchAll(/<a\b[^>]*href="\/about[^"]*"[^>]*>\s*Alex Isa\s*<\/a>/g)];
      assert.equal(names.length, 1, 'the link is printed once');
    });
  }
});

// ── C9 ──
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SHARED = '/og-image.jpg';
const metaContent = (html: string, attr: 'name' | 'property', key: string): string | undefined =>
  html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`))?.[1];
const ldImage = (html: string): string | undefined => {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const d = JSON.parse(m[1]) as Record<string, unknown>;
    if (d['@type'] === 'Article') return String(d['image']);
  }
  return undefined;
};

test('C9 an article\'s picture (og:image, twitter:image, Article.image) is its own file or the common one — never the file of another article', async (t) => {
  for (const slug of SLUGS) {
    await t.test(slug, () => {
      const html = article(slug);
      const own = `https://typelessity.com/og-blog-${slug}.png`;
      const shared = `https://typelessity.com${SHARED}`;
      for (const [label, value] of [['og:image', metaContent(html, 'property', 'og:image')], ['twitter:image', metaContent(html, 'name', 'twitter:image')], ['Article.image', ldImage(html)]] as const) {
        assert.ok(value === own || value === shared, `${label} is ${value}: neither ${own} nor ${shared}`);
        const file = new URL(value!).pathname;
        assert.ok(existsSync(join(BROWSER, file)), `${file} is not in dist`);
      }
      const three = new Set([metaContent(html, 'property', 'og:image'), metaContent(html, 'name', 'twitter:image'), ldImage(html)]);
      assert.equal(three.size, 1, 'the three pictures differ');
    });
  }
});

test('C9 the salon and the transfer articles use the common picture (they have none of their own yet); the comparison keeps its own', () => {
  for (const slug of ['best-ai-booking-beauty-salons-2026', 'best-ai-booking-transfer-services-2026']) {
    assert.equal(metaContent(article(slug), 'property', 'og:image'), `https://typelessity.com${SHARED}`, slug);
    assert.equal(ldImage(article(slug)), `https://typelessity.com${SHARED}`, slug);
  }
  assert.equal(metaContent(article('best-ai-booking-widgets-2026'), 'property', 'og:image'), 'https://typelessity.com/og-blog-best-ai-booking-widgets-2026.png');
});

test('C9 the comparison picture is a PNG of 1200 x 630 and at most 300 KiB (it was 1.2 MB)', () => {
  const bytes = readFileSync(join(BROWSER, 'og-blog-best-ai-booking-widgets-2026.png'));
  assert.ok(bytes.subarray(0, 8).equals(PNG_SIG), 'not a PNG');
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
  assert.ok(bytes.length <= 307_200, `${bytes.length} bytes`);
});

test('C9 every article allows a large image preview once; no other page prints a robots meta except the 404 (noindex)', () => {
  const bad: string[] = [];
  for (const [rel, html] of allHtml()) {
    const tags = [...html.matchAll(/<meta[^>]*name="robots"[^>]*>/g)].map((m) => m[0]);
    const isArticle = /^blog\/[^/]+\/index\.html$/.test(rel);
    if (isArticle) { if (tags.length !== 1 || !/content="max-image-preview:large"/.test(tags[0])) bad.push(`${rel}: ${JSON.stringify(tags)}`); }
    else if (rel === '404.html') { if (tags.length !== 1 || !/content="noindex"/.test(tags[0])) bad.push(`${rel}: ${JSON.stringify(tags)}`); }
    else if (tags.length) bad.push(`${rel}: ${JSON.stringify(tags)}`);
  }
  assert.deepEqual(bad, []);
});

// ── C13 ──
test('C13 the footer\'s three column headings are h2.vc-footer-h on every page (404 and the CSR shell included), and no h4 is left', () => {
  const bad: string[] = [];
  let seen = 0;
  for (const [rel, html] of allHtml()) {
    const footer = html.match(/<footer[^>]*class="vc-footer"[\s\S]*?<\/footer>/)?.[0];
    if (!footer) continue; // the CSR shell has no prerendered footer
    seen++;
    const h2 = [...footer.matchAll(/<h2\b[^>]*class="[^"]*\bvc-footer-h\b[^"]*"[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1].trim());
    if (h2.length !== 3) bad.push(`${rel}: ${h2.length} footer h2`);
    if (/<h[3-6]\b/.test(footer)) bad.push(`${rel}: a deeper heading in the footer`);
  }
  assert.ok(seen >= 21, `${seen} pages with a footer`);
  assert.deepEqual(bad, []);
});

// ── C14 ──
test('C14 /for-ai-agents: the two section headings say what is inside for a developer; «for LLM» is nowhere on the page', () => {
  const html = read('for-ai-agents/index.html');
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
  const h2s = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  assert.ok(h2s.includes('What Typelessity is, in plain text'), JSON.stringify(h2s));
  assert.ok(h2s.includes('Feature list: key and value'), JSON.stringify(h2s));
  assert.equal(h2s.length, 6, 'the page keeps its six sections');
  assert.equal((html.match(/for LLM extraction/gi) ?? []).length, 0);
  assert.equal((html.match(/Machine-readable feature list/gi) ?? []).length, 0);
  assert.match(html, /Typelessity is an AI conversational booking widget\./, 'the content of the section is unchanged');
  assert.match(html, /<strong[^>]*>languages_supported:<\/strong>/, 'the feature list is unchanged');
});

// ── L14 (CRO 4): the next step at the end of every article ──
test('L14 every article: the block «Try it free on your website» stands after the text and before the list of changes, with the sign-up link of the other pages', async (t) => {
  for (const slug of SLUGS) {
    await t.test(slug, () => {
      const html = article(slug);
      const blocks = [...html.matchAll(/<section\b[^>]*\bdata-article-cta\b[^>]*>([\s\S]*?)<\/section>/g)];
      assert.equal(blocks.length, 1, 'the page has one block «Try it free»');
      const block = blocks[0]![1]!;
      assert.match(block, /<h2[^>]*>Try it free on your website<\/h2>/);
      const link = block.match(/<a\b[^>]*class="[^"]*vc-btn-primary[^"]*"[^>]*href="([^"]+)"[^>]*>\s*Get it free\s*<\/a>|<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*vc-btn-primary[^"]*"[^>]*>\s*Get it free\s*<\/a>/);
      assert.ok(link, 'the block has no «Get it free» button');
      const href = (link![1] ?? link![2]!).replace(/&amp;/g, '&');
      const url = new URL(href);
      assert.equal(url.origin + url.pathname, 'https://webappski.com/en/portal/login', 'the button leads to the sign-up of the other pages');
      assert.equal(url.searchParams.get('start'), 'typelessity');
      assert.equal(url.searchParams.get('utm_medium'), 'blog');
      const at = html.indexOf('data-article-cta');
      const journal = html.indexOf('What changed in this article');
      const answer = html.indexOf('<markdown');
      assert.ok(answer > -1 && answer < at, 'the text of the article is before the block');
      assert.ok(at < journal, 'the block is before the list of changes');
      assert.equal(html.slice(journal).includes('data-article-cta'), false, 'the block is not repeated after the list');
    });
  }
});
