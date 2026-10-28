import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { loadRoutes, respond } from './vercel-effective';

// The discovery core a crawler reads before any page: robots.txt, the IndexNow key, /legal/security.
// Reads the built bytes (run `npm run build` first). LANDING_DIST points at another copy of dist.

const ROOT = new URL('..', import.meta.url).pathname;
const BROWSER = process.env['LANDING_DIST'] ?? join(ROOT, 'dist', 'typelessity-landing', 'browser');
const rd = (p: string) => readFileSync(p, 'utf8');

test('dist ships robots.txt byte-for-byte, and the sitemap its Sitemap line names', () => {
  assert.equal(rd(join(BROWSER, 'robots.txt')), rd(join(ROOT, 'public', 'robots.txt')));
  const line = rd(join(BROWSER, 'robots.txt')).match(/^Sitemap:\s*(\S+)/m)?.[1] ?? '';
  assert.match(line, /^https:\/\/typelessity\.com\/sitemap\.xml$/);
  assert.ok(existsSync(join(BROWSER, 'sitemap.xml')));
});

test('IndexNow: the key file name, its content and the default key of scripts/indexnow.sh are one value', () => {
  const key = rd(join(ROOT, 'scripts', 'indexnow.sh')).match(/INDEXNOW_KEY="\$\{INDEXNOW_KEY:-([0-9a-f]{32})\}"/)?.[1];
  assert.ok(key, 'no default key in scripts/indexnow.sh');
  for (const base of [join(ROOT, 'public'), BROWSER]) {
    assert.equal(rd(join(base, `${key}.txt`)).trim(), key, `${base}: content of ${key}.txt`);
  }
  const answer = respond(loadRoutes(), `/${key}.txt`);
  assert.equal(answer.status, undefined, `a rule of vercel.json answers ${answer.status} for the key file (${answer.location ?? 'no location'})`);
});

test('/legal/security (FL-02): a built page with one h1 «Security», canonical to itself, in the sitemap, no redirect on it', () => {
  const html = rd(join(BROWSER, 'legal', 'security', 'index.html'));
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
  assert.match(html, /<h1[^>]*>\s*Security\s*<\/h1>/);
  assert.match(html, /rel="canonical"[^>]*href="https:\/\/typelessity\.com\/legal\/security"|href="https:\/\/typelessity\.com\/legal\/security"[^>]*rel="canonical"/);
  assert.match(rd(join(BROWSER, 'sitemap.xml')), /<loc>https:\/\/typelessity\.com\/legal\/security<\/loc>/);
  const answer = respond(loadRoutes(), '/legal/security');
  assert.equal(answer.status, undefined, `a rule of vercel.json answers ${answer.status} for /legal/security (${answer.location ?? 'no location'})`);
});

// L10 (D4, FL-27): the Encryption lines of /legal/security are the two lines of the published DPA (Art. 32 measures A-2 «In transit», A-3 «At rest»).
// Taking them off the page would leave the signed document saying what the page does not; changing one of them on one side only breaks this.
// The DPA is READ from the portal clone (~/Projects/webappka, or TY_PORTAL_ROOT): a missing clone FAILS with a text, it never skips (FL-26).
test('/legal/security (FL-27): the TLS and at-rest sentences are the sentences of the DPA the portal publishes, word for word', () => {
  const portal = process.env['TY_PORTAL_ROOT'] ?? join(homedir(), 'Projects', 'webappka');
  const dpaFile = join(portal, 'public', 'assets', 'legal', 'dpa-typelessity.md');
  assert.ok(existsSync(dpaFile), `нет DPA портала: ${dpaFile}; задай TY_PORTAL_ROOT или клонируй webappka`);
  const norm = (t: string) => t.replace(/<[^>]+>/g, ' ').replace(/[*_`]/g, '').replace(/&#38;|&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').toLowerCase();
  const dpa = norm(rd(dpaFile));
  const page = norm(rd(join(BROWSER, 'legal', 'security', 'index.html')));
  for (const [name, re] of [['in transit', /TLS on every connection[^.]*\./i], ['at rest', /Database encryption at rest[^.]*\./i]] as const) {
    const sentence = page.match(new RegExp(re.source, 'i'))?.[0];
    assert.ok(sentence, `/legal/security has no «${name}» sentence`);
    assert.ok(dpa.includes(sentence!), `the «${name}» sentence of /legal/security is not in the DPA: ${sentence}`);
  }
});
