import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { EMBED_SNIPPET, WIDGET_CSP } from '../src/app/core/integrations/embed-snippet';

// L5 seam guard (R67 п.3): what /install says about where the requests go and what the site must allow is READ from the
// code of the other side, not typed here. The values come from the source of the product (~/Projects/typelessity, or
// TY_PRODUCT_ROOT) and of the portal that hands out the Install step (~/Projects/webappka, or TY_PORTAL_ROOT), then are
// compared with the built page dist/typelessity-landing/browser/install/index.html. A missing source FAILS with a text,
// it never skips (the way e2e/browser/global-setup.ts does it): a cloud session with no clone has a red run, by design.
// Run `npm run build` first.

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
const PORTAL_ROOT = process.env['TY_PORTAL_ROOT'] ?? join(homedir(), 'Projects', 'webappka');
const DIST = join(process.cwd(), 'dist', 'typelessity-landing', 'browser');

function source(root: string, what: string, rel: string): string {
  const file = join(root, rel);
  assert.ok(existsSync(file), `нет исходника ${what}: ${file}; задай ${what === 'портала' ? 'TY_PORTAL_ROOT' : 'TY_PRODUCT_ROOT'} или клонируй репозиторий`);
  return readFileSync(file, 'utf8');
}
const product = (rel: string) => source(PRODUCT_ROOT, 'продукта', rel);
const portal = (rel: string) => source(PORTAL_ROOT, 'портала', rel);

function page(rel: string): string {
  const file = join(DIST, rel);
  assert.ok(existsSync(file), `${file} missing — run \`npm run build\` before this check`);
  return readFileSync(file, 'utf8')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#38;|&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
}

const INSTALL = (): string => page('install/index.html');

test('the CSP the page prints is the one the portal prints: every line and the microphone permission', () => {
  const src = portal('src/app/core/portal/pages/product-detail/typelessity-owner/typelessity-install.ts');
  const constants = new Map([...src.matchAll(/(?:export )?const ([A-Z_]+)\s*=\s*'([^']*)'/g)].map((m) => [m[1]!, m[2]!] as const));
  const lines = [...src.matchAll(/\{\s*directive:\s*'([a-z-]+)',\s*source:\s*(?:'([^']*)'|"([^"]*)"|new URL\([^)]*\)\.origin|([A-Z_]+))\s*\}/g)].map((m) => ({
    directive: m[1]!,
    source: m[2] ?? m[3] ?? (m[4] ? constants.get(m[4]) : undefined) ?? 'API-ORIGIN',
  }));
  assert.deepEqual(lines.map((l) => l.directive), ['script-src', 'connect-src', 'font-src', 'img-src', 'style-src-attr'], 'the portal changed its list of CSP lines — read the new list and fix WIDGET_CSP and /install');
  const policy = src.match(/TYPELESSITY_PERMISSIONS_POLICY\s*=\s*'([^']*)'/)?.[1];
  assert.equal(policy, 'microphone=(self)', 'the portal changed the Permissions-Policy');
  const page_ = INSTALL();
  // what WIDGET_CSP says, line by line
  const printed = WIDGET_CSP.map((l) => `${l.directive} ${l.source}`);
  for (const l of lines) {
    const want = l.source === 'API-ORIGIN' ? new URL(EMBED_SNIPPET.match(/api-url="([^"]+)"/)![1]!).origin : l.source;
    assert.ok(printed.includes(`${l.directive} ${want}`), `WIDGET_CSP lacks «${l.directive} ${want}»`);
    assert.ok(page_.includes(`${l.directive} ${want}`), `/install does not print «${l.directive} ${want}»`);
  }
  assert.ok(page_.includes('Permissions-Policy: microphone=(self)'), '/install does not print «Permissions-Policy: microphone=(self)»');
  assert.equal(WIDGET_CSP.length, lines.length, 'WIDGET_CSP has a line the portal does not');
});

test('the headers and the retry rules on the page are the ones the product sends', () => {
  const client = product('packages/api/src/services/integration-client.service.ts');
  const headers = client.match(/buildHeaders\([^)]*\)[^{]*\{\s*return\s*\{([^}]*)\}/)?.[1] ?? '';
  const names = [...headers.matchAll(/'([A-Za-z-]+)'\s*:/g)].map((m) => m[1]!);
  assert.deepEqual(names, ['Content-Type', 'X-Idempotency-Key', 'X-Request-ID'], 'buildHeaders changed — fix /install');
  const text = INSTALL();
  for (const h of names.filter((n) => n.startsWith('X-'))) assert.ok(text.includes(h), `/install does not name the header ${h}`);

  const shared = product('packages/shared/src/utils/constants.ts');
  const status = (name: string) => shared.match(new RegExp(`${name}:\\s*(\\d{3})`))?.[1];
  const schemas = product('packages/api/src/lib/schemas.ts');
  const codes = (schemas.match(/const RETRYABLE_STATUS_CODES\s*=\s*\[([^\]]*)\]/)?.[1] ?? '').split(',').map((s) => s.trim().replace('HTTP_STATUS.', '')).filter(Boolean).map((n) => status(n));
  assert.deepEqual(codes, ['502', '503', '504'], 'the retryable codes changed — fix /install');
  assert.ok(/502,? (?:503,? )?(?:or |and )?504/.test(text), '/install does not name 502, 503 and 504');

  const attempts = shared.match(/DEFAULT_ATTEMPTS:\s*(\d+)/)?.[1];
  assert.equal(attempts, '3', 'DEFAULT_ATTEMPTS changed — fix /install');
  assert.ok(/3 (?:retries|attempts|times)|three (?:retries|attempts|times)|retried 3/i.test(text), '/install does not say how many times a request is retried (3)');

  const safe = product('packages/api/src/lib/safe-fetch.ts');
  assert.ok(/function assertEncrypted[\s\S]{0,200}protocol === 'https:'/.test(safe), 'assertEncrypted no longer lets only https through — fix /install');
  assert.ok(/HTTPS/.test(text) && /private/i.test(text), '/install does not say that only HTTPS is allowed and private addresses are blocked');
});

test('the email subject and the success title on the page are the ones the product uses', () => {
  const mail = product('packages/api/src/services/email-forwarder.service.ts');
  const subject = mail.match(/const subject = `([^$`]*)\$\{brand\}`/)?.[1];
  assert.equal(subject, 'New lead from ', 'the email subject changed — fix /install');
  const en = product('packages/shared/src/i18n/en.ts');
  const title = en.match(/'widget\.success\.requestTitle':\s*'([^']*)'/)?.[1];
  assert.equal(title, 'Request Received', 'the success title of the email path changed — fix /install');
  const text = INSTALL();
  assert.ok(text.includes('New lead from'), '/install does not print the subject «New lead from»');
  assert.ok(text.includes(`“${title}”`) || text.includes(`"${title}"`), `/install does not print the success title «${title}»`);
});

test('the <title> bytes of the two pages are exact: /install carries the brand once, /how-it-works says it in its own words and gets no suffix', () => {
  const title = (rel: string) => readFileSync(join(DIST, rel), 'utf8').match(/<title>([^<]*)<\/title>/)?.[1];
  assert.equal(title('install/index.html'), 'Add an AI booking widget to your website — Typelessity');
  assert.equal(title('how-it-works/index.html'), 'How Typelessity works: from chat to booking request');
});
