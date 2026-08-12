import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Only one legal document is a page on this domain: /legal/security. The rest live on
// webappski.com. app.routes.server.ts declares 308s for them, but this project deploys as
// static output — the SSR server never runs, so those routes were never executed and each
// dead path fell through to the SPA fallback index.html: HTTP 200 carrying the *home page*
// body under a legal URL. Five duplicates of the home page, four of them advertised in
// sitemap.xml, is exactly the signal that teaches a crawler our URLs are unreliable.
//
// The enforcing layer is therefore vercel.json, which this deployment does apply — the live
// responses carry its CSP and Permissions-Policy headers verbatim. Whether redirects are
// evaluated before or after static files does not matter here either way: the build emits
// nothing under dist/<project>/browser/legal/ except security/, so the four redirected paths
// have no file to be served instead, and /legal/security is matched by no rule at all.
//
// These guards pin the redirect table and keep the sitemap from advertising redirects as
// destinations.

const ROOT = new URL('../../../', import.meta.url);

interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
  statusCode?: number;
}

const vercelConfig = JSON.parse(
  readFileSync(new URL('vercel.json', ROOT), 'utf8'),
) as { redirects?: Redirect[] };

const sitemapGenerator = readFileSync(new URL('tools/build-sitemap.ts', ROOT), 'utf8');

/** Every legal path that must leave this domain, with the document it must land on. */
const OFFSITE_LEGAL: Record<string, string> = {
  '/legal/privacy': 'https://webappski.com/en/legal/product-privacy',
  '/legal/terms': 'https://webappski.com/en/legal/terms',
  '/legal/dpa': 'https://webappski.com/en/legal/dpa',
  // No standalone sub-processor page on webappski yet; the DPA carries that section.
  '/legal/sub-processors': 'https://webappski.com/en/legal/dpa',
};

/** The one legal page that is genuinely served from this domain (prerendered). */
const ONSITE_LEGAL = '/legal/security';

const redirects = vercelConfig.redirects ?? [];

test('vercel.json redirects every offsite legal path to its document', () => {
  for (const [source, destination] of Object.entries(OFFSITE_LEGAL)) {
    const rule = redirects.find((r) => r.source === source);

    assert.ok(rule, `vercel.json has no redirect for ${source} — it would serve the home page at 200`);
    assert.equal(rule.destination, destination, `${source} points at the wrong document`);
  }
});

test('offsite legal redirects are permanent (308), not temporary', () => {
  // A 302/307 tells crawlers the old URL is still the canonical one, so the duplicate
  // never fully clears. 308 also preserves the method, unlike 301.
  for (const source of Object.keys(OFFSITE_LEGAL)) {
    const rule = redirects.find((r) => r.source === source)!;
    const isPermanent = rule.permanent === true || rule.statusCode === 308;

    assert.ok(isPermanent, `${source} must redirect permanently (permanent: true => 308)`);
  }
});

test('no redirect rule can swallow the prerendered /legal/security page', () => {
  // A convenience wildcard (/legal/(.*) or /legal/:doc*) would take the real page offsite.
  for (const rule of redirects) {
    assert.notEqual(rule.source, ONSITE_LEGAL, `${ONSITE_LEGAL} is a real page here — it must not redirect`);
    assert.ok(
      !/^\/legal\/?(\(|:|\*)/.test(rule.source),
      `redirect source "${rule.source}" is a wildcard under /legal and would swallow ${ONSITE_LEGAL}`,
    );
  }
});

test('sitemap advertises the legal page we serve and none we redirect', () => {
  // Derived from the generator source: a URL cannot be listed without its literal
  // appearing here, so absence in the source is absence in sitemap.xml.
  assert.ok(
    sitemapGenerator.includes(`'${ONSITE_LEGAL}'`),
    `sitemap generator no longer lists ${ONSITE_LEGAL}, the only legal page on this domain`,
  );

  for (const source of Object.keys(OFFSITE_LEGAL)) {
    assert.ok(
      !sitemapGenerator.includes(`'${source}'`),
      `sitemap generator still lists ${source}, which is a redirect — sitemaps must list destinations, not hops`,
    );
  }
});
