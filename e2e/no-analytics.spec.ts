import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

// Founder 2026-09-24: PostHog is off typelessity.com — the SDK, the CSP hosts, and the cookie
// banner that existed only to gate it. A browser network check would not guard this: the old
// service shipped with an empty key and never sent a request, so "no requests to posthog.com"
// was already true while the SDK sat in the bundle. This asserts the shipped bytes instead —
// every JS file the build produced (browser + server), the prerendered "/" over a real HTTP
// server, the CSP in vercel.json and the dependency tree.
//
// Signatures are the SDK's host and API, not the word "PostHog": latency-budgets.mdx names
// PostHog as an example of an SDK the widget does not ship, and that prose reaches the bundle
// through the blog manifest.
//
// Run: `npm run build` first, then `npm run e2e`.

const ROOT = new URL('../', import.meta.url);
const DIST = new URL('dist/typelessity-landing/', ROOT);

const SDK_SIGNATURE = /posthog\.com|posthog-js|opt_out_capturing/i;

async function listScripts(dir: URL): Promise<URL[]> {
  const out: URL[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...(await listScripts(new URL(`${entry.name}/`, dir))));
    } else if (/\.(m?js)$/.test(entry.name)) {
      out.push(new URL(entry.name, dir));
    }
  }
  return out;
}

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  let html: string;
  try {
    html = await readFile(new URL('browser/index.html', DIST), 'utf8');
  } catch {
    throw new Error('dist/ prerender missing — run `npm run build` before the smoke (it prerenders "/").');
  }
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
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

test('no script the build shipped carries the PostHog SDK or its host', async () => {
  let scripts: URL[];
  try {
    scripts = [...(await listScripts(new URL('browser/', DIST))), ...(await listScripts(new URL('server/', DIST)))];
  } catch {
    throw new Error('dist/ missing — run `npm run build` before the smoke.');
  }
  assert.ok(scripts.length > 0, 'the build must produce scripts to scan');
  const offenders: string[] = [];
  for (const file of scripts) {
    if (SDK_SIGNATURE.test(await readFile(file, 'utf8'))) offenders.push(file.pathname.split('/dist/')[1]);
  }
  assert.deepEqual(offenders, [], 'PostHog SDK or host found in shipped scripts');
});

test('prerendered "/" has no cookie-consent dialog and no PostHog script', async () => {
  await withServer(async (base) => {
    const body = await (await fetch(`${base}/`)).text();
    assert.ok(body.includes('Typelessity'), 'home must render the brand name');
    assert.ok(!body.includes('<app-consent-banner'), 'the consent banner must not render');
    assert.ok(!body.includes('id="consent-h"'), 'the cookie dialog must not render');
    assert.ok(!SDK_SIGNATURE.test(body), 'the page must not reference PostHog');
  });
});

test('CSP in vercel.json allows no PostHog host', () => {
  const config = JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as {
    headers?: { headers: { key: string; value: string }[] }[];
  };
  const csp = (config.headers ?? [])
    .flatMap((h) => h.headers)
    .filter((h) => h.key.toLowerCase() === 'content-security-policy')
    .map((h) => h.value);
  assert.ok(csp.length > 0, 'vercel.json must set a Content-Security-Policy');
  for (const value of csp) {
    assert.ok(!/posthog/i.test(value), `CSP still allows PostHog: ${value}`);
  }
});

test('posthog-js is not in the dependency tree', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', ROOT), 'utf8')) as Record<string, Record<string, string>>;
  const direct = Object.keys({ ...pkg['dependencies'], ...pkg['devDependencies'] });
  assert.ok(!direct.some((name) => /posthog/i.test(name)), 'package.json must not depend on PostHog');
  const lock = JSON.parse(readFileSync(new URL('package-lock.json', ROOT), 'utf8')) as {
    packages: Record<string, unknown>;
  };
  const locked = Object.keys(lock.packages).filter((path) => /posthog/i.test(path));
  assert.deepEqual(locked, [], 'package-lock.json must not install PostHog');
});
