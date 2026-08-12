import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

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
