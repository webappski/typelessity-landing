import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// robots.txt is served verbatim from public/. RFC 9309 §2.2.1: a crawler obeys ONLY the group that
// names it and falls back to «*» only when no group names it. A named group («User-agent: GPTBot /
// Allow: /») therefore takes that bot out from under «Disallow: /api/» of the «*» group. One group «*»
// keeps pages open to every bot and the private paths closed to every bot (Google, «How Google
// interprets the robots.txt specification»; RFC 9309). Reachability of pages does not change, so the
// AEO cost is zero. LANDING_ROBOTS points the guard at a mutated copy (mutation run).

// The origin of seo.service.ts SITE_URL, written out: importing that module pulls Angular into a plain node test.
const SITE_URL = 'https://typelessity.com';

const robots = readFileSync(
  process.env['LANDING_ROBOTS'] ?? new URL('../../../public/robots.txt', import.meta.url),
  'utf8',
);

interface Group { agents: string[]; rules: Array<{ allow: boolean; path: string }> }

function parse(text: string): { groups: Group[]; directives: Array<[string, string]> } {
  const groups: Group[] = [];
  const directives: Array<[string, string]> = [];
  let cur: Group | undefined;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    directives.push([key, val]);
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if ((key === 'allow' || key === 'disallow') && cur) cur.rules.push({ allow: key === 'allow', path: val });
  }
  return { groups, directives };
}

/** The group a crawler obeys: the group naming it (longest token contained in its product token), else «*». */
function groupFor(groups: Group[], ua: string): Group | undefined {
  const u = ua.toLowerCase();
  let best: Group | undefined;
  let bestLen = -1;
  for (const g of groups) for (const a of g.agents) {
    if (a !== '*' && u.includes(a) && a.length > bestLen) { best = g; bestLen = a.length; }
  }
  return best ?? groups.find((g) => g.agents.includes('*'));
}

/** Longest matching rule wins; on a tie Allow wins (RFC 9309 §2.2.2). No match means allowed. */
function allowed(group: Group | undefined, path: string): boolean {
  if (!group) return true;
  let best: { allow: boolean; len: number } | undefined;
  for (const r of group.rules) {
    if (r.path === '' || !path.startsWith(r.path)) continue;
    if (!best || r.path.length > best.len || (r.path.length === best.len && r.allow)) best = { allow: r.allow, len: r.path.length };
  }
  return best ? best.allow : true;
}

const { groups, directives } = parse(robots);

// The 16 crawler names the file carried before L1 (public/robots.txt @17870d4) plus the search engines.
const BOTS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Amazonbot', 'CCBot', 'Bytespider',
  'Applebot-Extended', 'YouBot', 'Meta-ExternalAgent', 'Diffbot', 'Googlebot', 'bingbot', 'FooBot',
];
const PAGES = ['/', '/pricing', '/blog/x', '/faq', '/legal/security', '/llms.txt', '/sitemap.xml', '/426a67efe405494f9da92670749a0f86.txt'];

test('robots.txt is exactly one group, «*», with the two private paths closed', () => {
  assert.equal(groups.length, 1, `${groups.length} groups: a named group takes its bot out from under the «*» Disallow`);
  assert.deepEqual(groups[0].agents, ['*']);
  assert.deepEqual(
    groups[0].rules.map((r) => `${r.allow ? 'Allow' : 'Disallow'}: ${r.path}`).sort(),
    ['Allow: /', 'Disallow: /admin/', 'Disallow: /api/'],
  );
});

test('every crawler is held by the «*» rules: pages open, /api/ and /admin/ closed', () => {
  for (const ua of BOTS) {
    const g = groupFor(groups, ua);
    assert.ok(g?.agents.includes('*'), `${ua} obeys a group of its own`);
    for (const p of PAGES) assert.ok(allowed(g, p), `${ua}: ${p} is closed`);
    for (const p of ['/api/contact', '/admin/x']) assert.ok(!allowed(g, p), `${ua}: ${p} is open`);
  }
});

test('robots.txt has no Host directive and one Sitemap line equal to SITE_URL/sitemap.xml', () => {
  assert.ok(!directives.some(([k]) => k === 'host'), 'Host: is a Yandex-only directive; Google and Bing ignore it');
  const sitemaps = directives.filter(([k]) => k === 'sitemap').map(([, v]) => v);
  assert.deepEqual(sitemaps, [`${SITE_URL}/sitemap.xml`]);
});

test('the parser is tolerant: lower-case keys, CRLF line ends and comments do not change the groups', () => {
  const p = parse('# c\r\nuser-agent: *\r\nallow: /\r\nDISALLOW: /api/ # private\r\n');
  assert.equal(p.groups.length, 1);
  assert.ok(!allowed(p.groups[0], '/api/x'));
  assert.ok(allowed(p.groups[0], '/pricing'));
});

test('no deprecated AI-crawler user-agent name comes back', () => {
  for (const ua of ['anthropic-ai', 'Claude-Web']) assert.ok(!robots.includes(ua), `robots.txt names deprecated ${ua}`);
});
