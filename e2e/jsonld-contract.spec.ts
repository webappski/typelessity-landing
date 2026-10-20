import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import { countClaims } from './claims-dictionary';
import { SEVEN } from './industries-seven';
import { HOME } from '../src/app/pages/home/home.content';
import { PRICING_FAQ } from '../src/app/pages/pricing/pricing.content';
import { FAQ_GROUPS } from '../src/app/pages/faq/faq.content';

// L2 «Разметка JSON-LD» — the contract of the structured data a crawler receives, read from the BUILT bytes
// (run `npm run build` first). No mocks: every .html in dist, including 404.html and index.csr.html.
// LANDING_DIST points at another copy of dist/typelessity-landing/browser (the mutation run).
// Design: pending-review/2026-10-19/L2/test-design.md (scenarios J0–J8, J10–J13; J9 lives in home-smoke.spec.ts and
// schemas.spec.ts, J10 also in blog-dates-and-retired-posts.spec.ts, SC in sitemap-contract.spec.ts).
// One subtest per cause: node:test stops a test at its first failed assert, so a group of `t.test` shows each cause.
// Reference (read 2026-10-19): Google Search Central — Organization (logo ≥112 px, crawlable), publication dates
// («match between the equivalent user-visible and structured values»), sd-policies («Don't mark up content that is
// not visible to readers of the page»).

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const SITE = 'https://typelessity.com';
const BLOG_DIR = join(ROOT, 'src', 'assets', 'content', 'blog');
const ORG_ID = `${SITE}/#organization`;
const SOFTWARE_ID = `${SITE}/#software`;
// The node Webappski publishes about itself. This is the other side of the seam, so it is a literal:
// webappka `src/app/core/aeo-platform/aeo-platform.config.ts:25`; live: `curl -sL https://webappski.com/en | grep -c '"@id":"https://webappski.com/#webappski-org"'` (4 on 2026-10-19).
const WEBAPPSKI_ORG_ID = 'https://webappski.com/#webappski-org';
// What the product charges: typelessity `packages/api/src/lib/developer-tiers.ts:47-51` (other repo, 2026-10-19: 0/39/149/399).
// The name of the free tier there is different; only the numbers are compared with it.
const TIERS: ReadonlyArray<readonly [string, number]> = [['Free Pilot', 0], ['Starter', 39], ['Pro', 149], ['Enterprise', 399]];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const typesOf = (o: Obj): string[] => {
  const t = o['@type'];
  return Array.isArray(t) ? t.map(String) : t === undefined ? [] : [String(t)];
};
const hasType = (o: Obj, ...names: string[]) => typesOf(o).some((t) => names.includes(t));

const LD_RE = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

interface Ld {
  /** the raw text of each JSON-LD block, exactly as in the page (what the храповик counts) */
  raw: string[];
  /** a parse error is a failure, not a skipped block */
  errors: string[];
  /** the objects a crawler reads first: each block, or each member of an array / @graph */
  top: Obj[];
  /** every object at any depth (arrays, @graph, nested values) */
  all: Obj[];
}

/** The one helper every scenario reads JSON-LD through: JSON.parse of each block, recursive walk, @type may be an array. */
function ldNodes(html: string): Ld {
  const out: Ld = { raw: [], errors: [], top: [], all: [] };
  const visit = (v: unknown) => {
    if (Array.isArray(v)) { v.forEach(visit); return; }
    if (!isObj(v)) return;
    out.all.push(v);
    Object.values(v).forEach(visit);
  };
  for (const m of html.matchAll(LD_RE)) {
    out.raw.push(m[1]);
    let doc: unknown;
    try { doc = JSON.parse(m[1].trim()); } catch (e) { out.errors.push(`${(e as Error).message}: ${m[1].trim().slice(0, 60)}`); continue; }
    const roots = Array.isArray(doc) ? doc : isObj(doc) && Array.isArray(doc['@graph']) ? (doc['@graph'] as unknown[]) : [doc];
    for (const r of roots) if (isObj(r)) out.top.push(r);
    visit(doc);
  }
  return out;
}

function walkHtml(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkHtml(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

if (!existsSync(DIST)) throw new Error(`${DIST} missing — run \`npm run build\` before this check.`);
const HTML = new Map(walkHtml(DIST).map((f) => [relative(DIST, f).split('\\').join('/'), readFileSync(f, 'utf8')] as const));
const LD = new Map([...HTML].map(([rel, html]) => [rel, ldNodes(html)] as const));
const ARTICLES = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')).sort();
const articlePage = (slug: string) => `blog/${slug}/index.html`;
const industryPage = (slug: string) => `industries/${slug}/index.html`;
const frontmatter = (slug: string) => matter(readFileSync(join(BLOG_DIR, `${slug}.mdx`), 'utf8'));

const sortedUnique = (xs: string[]) => [...new Set(xs)].sort();

test('J0 the doors map: which JSON-LD each of the 30 pages carries, both ways', async (t) => {
  await t.test('every block of every page parses (a broken block is red, not skipped)', () => {
    const bad = [...LD].flatMap(([rel, ld]) => ld.errors.map((e) => `${rel}: ${e}`));
    assert.deepEqual(bad, []);
  });

  await t.test('the set of top-level @type per page is exactly the written map', () => {
    const expected: Record<string, string[]> = {
      'index.html': ['Organization', 'SoftwareApplication', 'WebSite'],
      'for-ai-agents/index.html': ['BreadcrumbList', 'Organization', 'SoftwareApplication'],
      'pricing/index.html': ['SoftwareApplication'],
      'about/index.html': ['AboutPage'],
      'gdpr/index.html': ['BreadcrumbList'],
      'industries/index.html': ['BreadcrumbList'],
      'legal/security/index.html': ['BreadcrumbList'],
      'faq/index.html': [],
      'blog/index.html': ['Blog', 'BreadcrumbList'],
      'how-it-works/index.html': [],
      'install/index.html': [],
      '404.html': [],
      'index.csr.html': [],
    };
    for (const slug of ARTICLES) expected[articlePage(slug)] = ['Article', 'BreadcrumbList'];
    for (const i of SEVEN) expected[industryPage(i.slug)] = ['BreadcrumbList', 'Service'];
    const bad: string[] = [];
    for (const [rel, ld] of LD) {
      const got = sortedUnique(ld.top.flatMap(typesOf));
      const want = expected[rel];
      if (!want) bad.push(`${rel}: a page that is not in the map, carries [${got}]`);
      else if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${rel}: carries [${got}], the map says [${want}]`);
    }
    for (const rel of Object.keys(expected)) if (!LD.has(rel)) bad.push(`${rel}: in the map, not in dist`);
    assert.deepEqual(bad, []);
    assert.equal(LD.size, 30, `${LD.size} .html files in dist`);
  });
});

test('J1 faqs: no article carries the key, the manifest does not hold it', async (t) => {
  await t.test('no .mdx frontmatter has a faqs key (10 files, gdpr-compliance became /gdpr)', () => {
    assert.equal(ARTICLES.length, 10);
    const bad = ARTICLES.filter((slug) => 'faqs' in frontmatter(slug).data);
    assert.deepEqual(bad, []);
  });
  await t.test('blog-manifest.generated.ts has no "faqs"', () => {
    const manifest = readFileSync(join(ROOT, 'src', 'app', 'lib', 'blog-manifest.generated.ts'), 'utf8');
    assert.equal((manifest.match(/"faqs"/g) ?? []).length, 0, 'the manifest still holds "faqs"');
  });
});

test('J2 no question-and-answer or how-to markup anywhere in dist (the class, not one name)', () => {
  const FORBIDDEN = ['FAQPage', 'QAPage', 'HowTo', 'HowToStep', 'HowToSection', 'HowToDirection', 'HowToTip', 'Question', 'Answer'];
  const bad: string[] = [];
  for (const [rel, ld] of LD) {
    const found = sortedUnique(ld.all.flatMap(typesOf).filter((x) => FORBIDDEN.includes(x)));
    if (found.length) bad.push(`${rel}: ${found}`);
  }
  assert.deepEqual(bad, []);
});

const THREE = ['index.html', 'for-ai-agents/index.html', 'pricing/index.html'];
const SOFT_TYPES = ['SoftwareApplication', 'WebApplication', 'Product', 'SoftwareSourceCode'];
const softNodes = (rel: string) => LD.get(rel)!.all.filter((n) => hasType(n, ...SOFT_TYPES));

test('J3 one product: a single #software on three pages, no Product, no #product', async (t) => {
  await t.test('product nodes live on / , /for-ai-agents and /pricing only, one each, every @id is #software', () => {
    const bad: string[] = [];
    for (const rel of LD.keys()) {
      const nodes = softNodes(rel);
      if (!THREE.includes(rel)) { if (nodes.length) bad.push(`${rel}: product node outside the three pages`); continue; }
      for (const n of nodes) if (n['@id'] !== SOFTWARE_ID) bad.push(`${rel}: ${typesOf(n)} has @id ${String(n['@id'])}, not ${SOFTWARE_ID}`);
      if (nodes.length !== 1) bad.push(`${rel}: ${nodes.length} product nodes, want 1`);
    }
    assert.deepEqual(bad, []);
  });

  await t.test('the three #software nodes are equal once offers is set aside (Р2: no offers on /for-ai-agents)', () => {
    const strip = (n: Obj) => { const { offers: _offers, ...rest } = n; return rest; };
    const nodes = THREE.map((rel) => {
      const n = LD.get(rel)!.top.find((x) => x['@id'] === SOFTWARE_ID);
      assert.ok(n, `${rel}: no top-level #software node`);
      return strip(n!);
    });
    assert.deepEqual(nodes[1], nodes[0], '/for-ai-agents differs from /');
    assert.deepEqual(nodes[2], nodes[0], '/pricing differs from /');
  });

  await t.test('no type Product and no «https://typelessity.com/#product» in any page (the #product anchor of the /faq jump list is not a node id)', () => {
    const bad = [...HTML].filter(([, html]) => html.includes(`${SITE}/#product`) || /"@type":\s*"Product"/.test(html)).map(([rel]) => rel);
    assert.deepEqual(bad, []);
  });
});

test('J4 Organization: no sameAs, parent is the real Webappski node, the logo is a real PNG of 112 px or more', async (t) => {
  const topOrgs = [...LD].flatMap(([rel, ld]) => ld.top.filter((n) => hasType(n, 'Organization')).map((n) => [rel, n] as const));
  const homeOrg = LD.get('index.html')!.top.find((n) => hasType(n, 'Organization'));
  const logoPath = (): string => {
    assert.ok(homeOrg, 'no top-level Organization on /');
    const logo = homeOrg!['logo'];
    assert.equal(typeof logo, 'string', 'logo is not a plain URL string');
    const u = new URL(logo as string);
    assert.equal(u.origin, SITE, 'the logo is not on our own host');
    return u.pathname;
  };
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  await t.test('no node with @id #organization has sameAs (full node or stub)', () => {
    const bad: string[] = [];
    for (const [rel, ld] of LD) for (const n of ld.all) if (n['@id'] === ORG_ID && 'sameAs' in n) bad.push(`${rel}: sameAs ${JSON.stringify(n['sameAs'])}`);
    assert.deepEqual(bad, []);
  });

  await t.test('parentOrganization of every top-level Organization is the Webappski node (#webappski-org)', () => {
    assert.ok(topOrgs.length >= 2, `${topOrgs.length} top-level Organization blocks`);
    const bad: string[] = [];
    for (const [rel, n] of topOrgs) {
      const p = n['parentOrganization'];
      const id = isObj(p) ? p['@id'] : undefined;
      if (id !== WEBAPPSKI_ORG_ID) bad.push(`${rel}: parent @id ${String(id)}`);
      else if (!isObj(p) || p['name'] !== 'Webappski' || p['url'] !== 'https://webappski.com') bad.push(`${rel}: parent has name/url ${JSON.stringify([isObj(p) && p['name'], isObj(p) && p['url']])}`);
    }
    assert.deepEqual(bad, []);
  });

  await t.test('the logo URL points at a file that exists in public/ and in dist and is a PNG', () => {
    const path = logoPath();
    assert.ok(existsSync(join(ROOT, 'public', path)), `public${path} does not exist`);
    assert.ok(existsSync(join(DIST, path)), `dist${path} does not exist`);
    const bytes = readFileSync(join(DIST, path));
    assert.ok(bytes.subarray(0, 8).equals(PNG_SIG), `dist${path} is not a PNG (signature ${bytes.subarray(0, 4).toString('hex')})`);
  });

  await t.test('the logo is at least 112 x 112 px (IHDR)', () => {
    const path = logoPath();
    const bytes = readFileSync(join(DIST, path));
    assert.ok(bytes.subarray(0, 8).equals(PNG_SIG) && bytes.subarray(12, 16).toString() === 'IHDR', `dist${path} is not a PNG, no IHDR to read`);
    const w = bytes.readUInt32BE(16);
    const h = bytes.readUInt32BE(20);
    assert.ok(w >= 112 && h >= 112, `${path} is ${w}x${h}`);
  });
});

const visible = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
const tierTable = (): Array<[string, number]> => {
  const html = HTML.get('pricing/index.html')!;
  const names = [...html.matchAll(/class="tier__name"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
  const prices = [...html.matchAll(/class="tier__price"[^>]*>\s*€\s*(\d+)/g)].map((m) => Number(m[1]));
  assert.equal(names.length, prices.length, 'the tier names and prices on /pricing do not pair up');
  return names.map((n, i) => [n, prices[i]]);
};

test('J5 offers: the visible table, the markup on / and /pricing, nothing where the price is not shown', async (t) => {
  await t.test('(а) offers of #software on / and /pricing = the visible tier table = the product literal; EUR, InStock, url /pricing', () => {
    assert.deepEqual(tierTable(), TIERS.map(([n, p]) => [n, p]), 'the visible table on /pricing is not the product price list');
    for (const rel of ['index.html', 'pricing/index.html']) {
      const node = LD.get(rel)!.top.find((n) => n['@id'] === SOFTWARE_ID);
      assert.ok(node, `${rel}: no top-level #software node`);
      const offers = node!['offers'];
      assert.ok(Array.isArray(offers), `${rel}: #software has no offers list`);
      const list = offers as Obj[];
      assert.deepEqual(list.map((o) => [o['name'], Number(o['price'])]), TIERS.map(([n, p]) => [n, p]), `${rel}: offers differ from the table`);
      for (const o of list) {
        assert.equal(o['priceCurrency'], 'EUR', `${rel}: ${String(o['name'])} currency`);
        assert.equal(o['availability'], 'https://schema.org/InStock', `${rel}: ${String(o['name'])} availability`);
        assert.equal(o['url'], `${SITE}/pricing`, `${rel}: ${String(o['name'])} url`);
      }
    }
  });

  await t.test('(в) offers sit on exactly / and /pricing, and every price of every offer is visible text on its page', () => {
    const bad: string[] = [];
    const withOffers: string[] = [];
    for (const [rel, ld] of LD) {
      const offered = ld.all.filter((n) => 'offers' in n);
      if (!offered.length) continue;
      withOffers.push(rel);
      const text = visible(HTML.get(rel)!);
      for (const n of offered) for (const o of (Array.isArray(n['offers']) ? n['offers'] : [n['offers']]) as Obj[]) {
        const p = String(o['price']);
        // the number needs a boundary: «€39» is also inside «€399»
        if (!new RegExp(`€${p}(?![\\d.,])`).test(text)) bad.push(`${rel}: price €${p} (${String(o['name'])}) is not shown on the page`);
      }
    }
    if (JSON.stringify(withOffers.sort()) !== JSON.stringify(['index.html', 'pricing/index.html'])) bad.push(`pages with offers: [${withOffers}], want [index.html,pricing/index.html]`);
    assert.deepEqual(bad, []);
  });

  await t.test('(г) the period is visible ⇔ it is in the markup: a tier with «/ month» on the page has priceSpecification unitCode MON (UN/CEFACT Rec 20: month), and only such a tier; no billingDuration anywhere', () => {
    const bad: string[] = [];
    for (const [rel, ld] of LD) for (const n of ld.all) if ('billingDuration' in n) bad.push(`${rel}: billingDuration`);
    for (const [rel, ld] of LD) {
      const node = ld.top.find((n) => n['@id'] === SOFTWARE_ID);
      const offers = (node && Array.isArray(node['offers']) ? node['offers'] : []) as Obj[];
      if (!offers.length) continue;
      const cards = [...HTML.get(rel)!.matchAll(/<article\b[^>]*class="[^"]*\btier\b[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);
      const shown = new Set(cards.filter((c) => /class="tier__period"[^>]*>\s*\/\s*month/.test(c)).map((c) => c.match(/class="tier__name"[^>]*>\s*([^<]*?)\s*</)?.[1] ?? '?'));
      const marked = new Set(offers.filter((o) => isObj(o['priceSpecification']) && o['priceSpecification']['unitCode'] === 'MON').map((o) => String(o['name'])));
      for (const o of offers) {
        const spec = o['priceSpecification'];
        if (spec === undefined) continue;
        assert.ok(isObj(spec) && spec['@type'] === 'UnitPriceSpecification' && String(spec['price']) === String(o['price']) && spec['priceCurrency'] === 'EUR', `${rel}: ${String(o['name'])} priceSpecification is not a UnitPriceSpecification of its own price in EUR`);
      }
      for (const n of shown) if (!marked.has(n)) bad.push(`${rel}: «/ month» is shown for ${n}, the markup has no unitCode MON`);
      for (const n of marked) if (!shown.has(n)) bad.push(`${rel}: unitCode MON for ${n}, the page does not show «/ month»`);
    }
    assert.deepEqual(bad, []);
    // on /pricing the three paid tiers (and only they) carry it; on / the period is not shown yet, so nothing is marked (L4 turns it on)
    const priced = (rel: string) => ((LD.get(rel)!.top.find((n) => n['@id'] === SOFTWARE_ID)!['offers'] as Obj[]).filter((o) => isObj(o['priceSpecification'])).map((o) => String(o['name'])));
    assert.deepEqual(priced('pricing/index.html'), ['Starter', 'Pro', 'Enterprise']);
    assert.deepEqual(priced('index.html'), []);
  });
});

test('J6 the word dictionary reads every JSON-LD block of dist, not the source', async (t) => {
  // L9 rewrote the title and description of the two articles that were allowed one word each: no exception is left.
  const EXCEPTIONS: Record<string, Record<string, number>> = {};
  const blocks = (pred: (type: string) => boolean) => {
    const out: string[] = [];
    for (const [rel, ld] of LD) {
      ld.raw.forEach((raw) => {
        let type = 'unparsed';
        try { const j = JSON.parse(raw.trim()); type = String((Array.isArray(j) ? j[0] : j)['@type']); } catch { /* J0 reports it */ }
        if (!pred(type)) return;
        const want = type === 'Article' ? EXCEPTIONS[rel] ?? {} : {};
        const got = countClaims(raw);
        if (JSON.stringify(got) !== JSON.stringify(want)) out.push(`${rel} [${type}]: ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
      });
    }
    return out;
  };

  await t.test('SoftwareApplication blocks carry no word of the dictionary', () => {
    assert.deepEqual(blocks((ty) => ty === 'SoftwareApplication'), []);
  });
  await t.test('every other block carries none either, except the two Article blocks of §2 with exactly their class and number', () => {
    assert.deepEqual(blocks((ty) => ty !== 'SoftwareApplication'), []);
  });
});

test('J7 no SearchAction; a breadcrumb is a list of real, distinct pages', async (t) => {
  await t.test('(а) no potentialAction and no SearchAction in dist', () => {
    const bad: string[] = [];
    for (const [rel, ld] of LD) for (const n of ld.all) {
      if ('potentialAction' in n || hasType(n, 'SearchAction')) bad.push(`${rel}: ${hasType(n, 'SearchAction') ? 'SearchAction' : 'potentialAction'}`);
    }
    assert.deepEqual(bad, []);
  });

  await t.test('(б) every BreadcrumbList: positions 1..n, items distinct, each item but the last is a page in dist and in the sitemap', () => {
    const sitemap = new Set([...readFileSync(join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/typelessity\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/'));
    const bad: string[] = [];
    for (const [rel, ld] of LD) for (const n of ld.all.filter((x) => hasType(x, 'BreadcrumbList'))) {
      const items = (n['itemListElement'] ?? []) as Obj[];
      const urls = items.map((it) => (isObj(it['item']) ? String(it['item']['@id']) : String(it['item'])));
      if (JSON.stringify(items.map((it) => it['position'])) !== JSON.stringify(items.map((_, i) => i + 1))) bad.push(`${rel}: positions ${JSON.stringify(items.map((it) => it['position']))}`);
      if (new Set(urls).size !== urls.length) bad.push(`${rel}: an item is repeated in [${urls}]`);
      urls.slice(0, -1).forEach((u) => {
        const path = new URL(u).pathname.replace(/\/$/, '') || '/';
        const file = path === '/' ? 'index.html' : `${path.slice(1)}/index.html`;
        if (!HTML.has(file)) bad.push(`${rel}: item ${u} is not a page in dist`);
        if (!sitemap.has(path)) bad.push(`${rel}: item ${u} is not in the sitemap`);
      });
    }
    assert.deepEqual(bad, []);
  });
});

const isInternal = (id: unknown): id is string => typeof id === 'string' && id.startsWith(`${SITE}/`);
const allObjects = () => [...LD].flatMap(([rel, ld]) => ld.all.map((o) => [rel, o] as const));

test('J8 a reference reads on its own page: no bare @id link, one name per @id, one Organization', async (t) => {
  await t.test('(1) no object in dist has an internal @id as its only key', () => {
    const bad = allObjects().filter(([, o]) => isInternal(o['@id']) && Object.keys(o).length === 1).map(([rel, o]) => `${rel}: bare {"@id":"${String(o['@id'])}"}`);
    assert.deepEqual(bad, []);
  });

  await t.test('(2) every object with an internal @id (and more than the @id) has @type and name', () => {
    const bad = allObjects()
      .filter(([, o]) => isInternal(o['@id']) && Object.keys(o).length > 1)
      .filter(([, o]) => !('@type' in o) || typeof o['name'] !== 'string' || !o['name'])
      .map(([rel, o]) => `${rel}: ${String(o['@id'])} lacks @type or name`);
    assert.deepEqual(bad, []);
  });

  await t.test('(3) all objects with the same internal @id agree on (@type, name, url) across dist', () => {
    const byId = new Map<string, Map<string, string[]>>();
    for (const [rel, o] of allObjects()) {
      if (!isInternal(o['@id']) || Object.keys(o).length === 1) continue;
      const triple = JSON.stringify([o['@type'], o['name'], o['url']]);
      const m = byId.get(o['@id']) ?? new Map<string, string[]>();
      m.set(triple, [...(m.get(triple) ?? []), rel]);
      byId.set(o['@id'], m);
    }
    const bad = [...byId].filter(([, m]) => m.size > 1).map(([id, m]) => `${id}: ${[...m].map(([tr, pages]) => `${tr} on ${sortedUnique(pages).slice(0, 3)}`).join(' | ')}`);
    assert.deepEqual(bad, []);
  });

  await t.test('(4) every Organization whose url is on typelessity.com has @id #organization', () => {
    const bad = allObjects()
      .filter(([, o]) => hasType(o, 'Organization') && typeof o['url'] === 'string' && new URL(o['url']).hostname === 'typelessity.com')
      .filter(([, o]) => o['@id'] !== ORG_ID)
      .map(([rel, o]) => `${rel}: Organization ${JSON.stringify(o['name'])} with @id ${String(o['@id'])}`);
    assert.deepEqual(bad, []);
  });
});

// ── J11 / J12: guards, green before the change; they hold what L2 must not break ──

const decode = (s: string) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const pageText = (rel: string) => decode(visible(HTML.get(rel)!).replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

test('J11 the questions stay on the page as plain text when their markup goes', async (t) => {
  await t.test('/faq shows every question of the seven groups (faq.content.ts)', () => {
    const text = pageText('faq/index.html');
    const all = FAQ_GROUPS.flatMap((g) => g.items);
    assert.ok(all.length >= 30, `${all.length} questions`);
    assert.deepEqual(all.map((x) => squash(x.q)).filter((q) => !text.includes(q)), []);
  });
  await t.test('/ shows every question of the category the home page previews (Product)', () => {
    const text = pageText('index.html');
    const preview = HOME.faq.filter((x) => x.category === 'Product');
    assert.ok(preview.length >= 9, `${preview.length} preview questions`);
    assert.deepEqual(preview.map((x) => squash(x.q)).filter((q) => !text.includes(q)), []);
  });
  await t.test('/pricing shows every PRICING_FAQ question', () => {
    const text = pageText('pricing/index.html');
    assert.deepEqual(PRICING_FAQ.map((x) => squash(x.q)).filter((q) => !text.includes(q)), []);
  });
  await t.test('each of the 10 articles has a visible h2 «FAQ»', () => {
    const bad = ARTICLES.filter((slug) => !/<h2[^>]*>\s*FAQ\s*<\/h2>/i.test(HTML.get(articlePage(slug))!));
    assert.deepEqual(bad, []);
  });
});

test('J12 the «Updated» note in the body is the same date as updatedAt in the frontmatter', () => {
  const bad: string[] = [];
  for (const slug of ARTICLES) {
    const { data, content } = frontmatter(slug);
    const notes = [...content.matchAll(/\*\*Updated (\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]).sort();
    if (!notes.length) continue; // an article without the note has nothing to compare (L9 adds none by itself)
    if (notes.at(-1) !== String(data['updatedAt'])) bad.push(`${slug}: note ${notes.at(-1)} ≠ updatedAt ${String(data['updatedAt'])}`);
  }
  assert.deepEqual(bad, []);
});

// ── J13: the taxonomy article describes the markup; L9 rewrote it. The section must be found, or an empty run would pass. ──
test('J13 designing-for-ai-agents lists only schema types that the pages it names carry', () => {
  const src = readFileSync(join(BLOG_DIR, 'designing-for-ai-agents.mdx'), 'utf8');
  const at = src.indexOf('## How does Typelessity use Schema.org JSON-LD');
  assert.ok(at > -1, 'the H2 «How does Typelessity use Schema.org JSON-LD» is not in the article');
  const section = src.slice(at);
  const body = section.slice(0, section.indexOf('\n## ', 4) > -1 ? section.indexOf('\n## ', 4) : section.length);
  const pagesFor = (label: string): string[] => {
    if (/^Home/.test(label)) return ['index.html'];
    if (/^Pricing/.test(label)) return ['pricing/index.html'];
    if (/^For AI agents/.test(label)) return ['for-ai-agents/index.html'];
    if (/^Industry/.test(label)) return SEVEN.map((i) => industryPage(i.slug));
    if (/^Blog/.test(label)) return ['blog/index.html'];
    if (/^Articles/.test(label)) return ARTICLES.map(articlePage);
    if (/^About/.test(label)) return ['about/index.html'];
    if (/^GDPR/.test(label)) return ['gdpr/index.html'];
    if (/^FAQ/.test(label)) return ['faq/index.html', 'install/index.html', 'how-it-works/index.html'];
    return [];
  };
  const bullets = body.split('\n').filter((l) => l.startsWith('- **'));
  assert.ok(bullets.length >= 5, `${bullets.length} bullets found in the section`);
  const bad: string[] = [];
  for (const line of bullets) {
    const label = line.match(/^- \*\*([^*]+)\*\*/)![1];
    const pages = pagesFor(label);
    assert.ok(pages.length, `unmapped bullet «${label}»`);
    const claimed = [...line.matchAll(/`([A-Z][A-Za-z]+)`/g)].map((m) => m[1]);
    for (const type of claimed) for (const rel of pages) {
      if (!LD.get(rel)!.all.some((n) => hasType(n, type))) bad.push(`${label}: «${type}» is not on ${rel}`);
    }
    // a bullet that names no type says «no JSON-LD»: the pages it names must carry none
    if (!claimed.length) for (const rel of pages) if (LD.get(rel)!.all.length) bad.push(`${label}: says no JSON-LD, but ${rel} carries some`);
  }
  assert.deepEqual(bad, []);
});

// ── J14 (L9): the blog list page carries Blog and its breadcrumb, built from the same strings as its <title> and meta ──
test('J14 /blog carries a Blog node and a Home → Blog breadcrumb', async (t) => {
  const html = HTML.get('blog/index.html')!;
  const ld = LD.get('blog/index.html')!;
  const blog = ld.top.find((n) => hasType(n, 'Blog'));
  await t.test('a Blog node with @id, url, name, description, inLanguage and a publisher that points at the Organization', () => {
    assert.ok(blog, 'no Blog node');
    assert.equal(blog!['@id'], `${SITE}/blog#blog`);
    assert.equal(blog!['url'], `${SITE}/blog`);
    assert.equal(blog!['inLanguage'], 'en');
    assert.equal(isObj(blog!['publisher']) ? (blog!['publisher'] as Obj)['@id'] : undefined, ORG_ID);
  });
  await t.test('name is the title and description is the meta description of the page', () => {
    const title = html.match(/<title>([^<]*)<\/title>/)![1];
    const meta = html.match(/<meta name="description" content="([^"]*)"/)![1];
    assert.equal(blog!['name'], 'Blog: AI booking guides and comparisons');
    assert.ok(title.startsWith(String(blog!['name'])), `title «${title}» does not start with the Blog name`);
    assert.equal(blog!['description'], meta);
    assert.ok(meta.length <= 155, `${meta.length} characters`);
  });
  await t.test('the breadcrumb is Home → Blog', () => {
    const crumb = ld.top.find((n) => hasType(n, 'BreadcrumbList'));
    assert.ok(crumb, 'no BreadcrumbList');
    const items = (crumb!['itemListElement'] as Obj[]).map((i) => `${String(i['position'])}:${String(i['name'])}:${String(i['item'])}`);
    assert.deepEqual(items, [`1:Home:${SITE}`, `2:Blog:${SITE}/blog`]);
  });
});
