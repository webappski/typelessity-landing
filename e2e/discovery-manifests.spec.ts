import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { LANDING_LANGUAGES, NOT_SUPPORTED_LANGUAGES } from './claims-dictionary';

// R42/R36 smoke for the discovery manifests (llms.txt / llms-full.txt). These are the first
// files an AI crawler reads, and they are served verbatim — whatever URL they print is the URL
// the crawler treats as the document's home. So the same failure 7c9acf9 fixed in sitemap.xml
// applies here with more force: four legal paths on this domain are 308s to webappski.com
// (vercel.json), and a manifest that still prints https://typelessity.com/legal/privacy is
// advertising a hop as a destination.
//
// This asserts the bytes the crawler actually receives — the copies in dist/, served over a
// real HTTP server — not the sources in public/, so a manifest that fails to reach the build
// output fails here too. The expected destinations are derived from vercel.json rather than
// hardcoded: change a redirect target without re-syncing the manifests and this goes red.
// (Same derive-don't-hardcode principle as src/app/discovery/llms-pricing.spec.ts.)
//
// Run: `npm run build` first, then `npm run e2e`.

const ROOT = new URL('../', import.meta.url);
const DIST = new URL('dist/typelessity-landing/browser/', ROOT);

const MANIFESTS = ['llms.txt', 'llms-full.txt'] as const;

/** The one legal document genuinely served from this domain (prerendered page). */
const ONSITE_LEGAL_URL = 'typelessity.com/legal/security';

interface Redirect {
  source: string;
  destination: string;
}

const vercelConfig = JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as {
  redirects?: Redirect[];
};

/** Offsite legal destinations, derived from the redirect table — never hardcoded here. */
const OFFSITE_DESTINATIONS = [
  ...new Set(
    (vercelConfig.redirects ?? [])
      .filter((r) => r.source.startsWith('/legal/'))
      .map((r) => r.destination),
  ),
];

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const files = new Map<string, string>();
  for (const name of MANIFESTS) {
    try {
      files.set(`/${name}`, await readFile(new URL(name, DIST), 'utf8'));
    } catch {
      throw new Error(
        `dist/ is missing ${name} — run \`npm run build\` before the smoke (public/ is copied into dist/).`,
      );
    }
  }
  const server = createServer((req, res) => {
    const body = files.get(req.url ?? '');
    if (body === undefined) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function fetchManifests(base: string): Promise<[string, string][]> {
  const out: [string, string][] = [];
  for (const name of MANIFESTS) {
    const res = await fetch(`${base}/${name}`);
    assert.equal(res.status, 200, `${name} must serve 200`);
    out.push([name, await res.text()]);
  }
  return out;
}

test('llms.txt + llms-full.txt reach the build output and serve as text', async () => {
  await withServer(async (base) => {
    for (const [name, body] of await fetchManifests(base)) {
      assert.ok(body.includes('Typelessity'), `${name} must name the brand`);
    }
  });
});

test('manifests advertise no typelessity.com/legal path except the page we serve', async () => {
  // A blanket sweep, not a per-path denylist: it also catches the brace shorthand
  // (…/legal/{privacy,terms,dpa,…}) that a literal-by-literal check reads straight past.
  await withServer(async (base) => {
    for (const [name, body] of await fetchManifests(base)) {
      const cited = (body.match(/typelessity\.com\/legal\/[^\s)\]]*/g) ?? []).map((url) =>
        url.replace(/[.,;:]+$/, ''),
      );
      for (const url of cited) {
        assert.equal(
          url,
          ONSITE_LEGAL_URL,
          `${name} cites ${url}, which 308s to webappski.com — manifests must print destinations, not hops`,
        );
      }
    }
  });
});

test('manifests print every offsite legal destination from the redirect table', async () => {
  await withServer(async (base) => {
    assert.ok(OFFSITE_DESTINATIONS.length > 0, 'vercel.json declares no /legal/ redirects to check');
    for (const [name, body] of await fetchManifests(base)) {
      for (const destination of OFFSITE_DESTINATIONS) {
        assert.ok(
          body.includes(destination),
          `${name} never points at ${destination}, the live home of a legal document it lists`,
        );
      }
    }
  });
});

test('manifests still link the one legal page this domain serves', async () => {
  await withServer(async (base) => {
    for (const [name, body] of await fetchManifests(base)) {
      assert.ok(body.includes(ONSITE_LEGAL_URL), `${name} dropped ${ONSITE_LEGAL_URL}, a real page here`);
    }
  });
});

// L0 (18.10): what the manifests say about languages and industries is checked against the code and the build,
// not against a list of old phrases. The 25 chat-window languages are LANDING_LANGUAGES (SUPPORTED_LOCALES of the
// product, types.ts:219-245 @ 027a177); the seven industry pages are the ones the redesign keeps (QUEUE L1б, L8).
const INDUSTRY_SLUGS = [
  'beauty-hair-salons', 'hospitality-restaurants', 'fitness-yoga-studios', 'automotive-driving-schools',
  'automotive-repair', 'fitness-gyms', 'education-tutoring',
] as const;

test('llms.txt names exactly the 25 chat-window languages of the code, with no "+" and no unsupported language', async () => {
  await withServer(async (base) => {
    const [[, short], [, full]] = await fetchManifests(base);
    const languageLine = short.split('\n').find((l) => l.startsWith('- **Languages:**')) ?? '';
    assert.ok(languageLine.includes('25 languages'), `llms.txt Languages line does not say "25 languages": ${languageLine}`);
    for (const lang of LANDING_LANGUAGES) assert.ok(languageLine.includes(lang), `llms.txt Languages line is missing ${lang}`);
    assert.equal(LANDING_LANGUAGES.length, 25);
    const listed = languageLine.match(/\(([^)]*)\)/)?.[1].split(',').map((x) => x.trim()) ?? [];
    assert.deepEqual(listed, [...LANDING_LANGUAGES], 'llms.txt lists a different set of languages than the code');
    for (const [name, body] of [['llms.txt', short], ['llms-full.txt', full]]) {
      assert.ok(!/\b25\+/.test(body), `${name} still says 25+`);
      for (const lang of NOT_SUPPORTED_LANGUAGES) assert.ok(!body.includes(lang), `${name} names ${lang}, which the code does not support`);
      assert.ok(body.includes('25 languages'), `${name} never says "25 languages"`);
    }
  });
});

test('manifests link the seven industry pages, never the bare /industries hub, and every page is in the build', async () => {
  await withServer(async (base) => {
    for (const [name, body] of await fetchManifests(base)) {
      assert.ok(!/\/industries(?![/\w-])/.test(body), `${name} still prints the bare /industries address`);
      const printed = [...new Set([...body.matchAll(/typelessity\.com\/industries\/([a-z0-9-]+)/g)].map((m) => m[1]))].sort();
      assert.deepEqual(printed, [...INDUSTRY_SLUGS].sort(), `${name} prints a different set of industry pages than the seven`);
    }
  });
  for (const slug of INDUSTRY_SLUGS) {
    assert.ok(existsSync(new URL(`industries/${slug}/index.html`, DIST)), `dist has no page for ${slug}`);
  }
});

// L9 (card D9, class «к»): the words of each blog link in llms.txt, and the start of each post line in llms-full.txt, are the
// title in the article's front matter. An article renamed in the .mdx and left in the manifests is a stale name for a crawler.
test('L9(к) the blog titles printed in llms.txt and llms-full.txt are the titles of the articles', async () => {
  const titles = new Map<string, string>();
  const blogDir = new URL('src/assets/content/blog/', ROOT);
  for (const f of readdirSync(blogDir).filter((n) => n.endsWith('.mdx'))) {
    const t = readFileSync(new URL(f, blogDir), 'utf8').match(/^title: "([^"]*)"/m)?.[1];
    assert.ok(t, `${f} has no title`);
    titles.set(f.replace(/\.mdx$/, ''), t!);
  }
  await withServer(async (base) => {
    const [[, short], [, full]] = await fetchManifests(base);
    const links = [...short.matchAll(/\[([^\]]+)\]\(https:\/\/typelessity\.com\/blog\/([a-z0-9-]+)\)/g)];
    assert.ok(links.length >= 1, 'llms.txt links no article');
    for (const [, words, slug] of links) assert.equal(words, titles.get(slug), `llms.txt: the link to /blog/${slug} says «${words}»`);
    const at = full.indexOf('## Blog — https://typelessity.com/blog');
    assert.ok(at > -1, 'llms-full.txt has no Blog section');
    const rest = full.slice(at);
    const lines = rest.slice(0, rest.indexOf('\n---') > -1 ? rest.indexOf('\n---') : rest.length).split('\n').filter((l) => l.startsWith('- '));
    for (const l of lines) assert.ok([...titles.values()].some((t) => l.startsWith(`- ${t} — `)), `llms-full.txt line does not start with an article title: ${l.slice(0, 80)}`);
    assert.equal(lines.length, 6, 'llms-full.txt lists a different number of selected posts than six');
  });
});
