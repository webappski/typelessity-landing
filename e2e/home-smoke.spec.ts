import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// R42/R36 smoke for the typelessity-landing surface. Until Playwright browser binaries are
// installed (see playwright.config.ts scaffold + e2e/README), this serves the REAL prerendered
// SSR output for "/" over a real HTTP server and asserts the bytes an AI crawler / browser
// receives. No mocks: it is the actual dist/ index.html the build produced. Covers cards
// TY-LANDING-SCHEMA (SoftwareApplication.featureList + FAQPage reach <head>) and
// TY-COMPARE-CALAI (Cal.ai/Cal.com rows render in the comparison section).
//
// Run: `npm run build` first (prerenders dist/), then `npm test` (this file is picked up by
// the src+e2e glob) or `npm run e2e`.

const DIST_INDEX = new URL(
  '../dist/typelessity-landing/browser/index.html',
  import.meta.url,
);

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  let html: string;
  try {
    html = await readFile(DIST_INDEX, 'utf8');
  } catch {
    throw new Error(
      'dist/ prerender missing — run `npm run build` before the smoke (it prerenders "/").',
    );
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

test('home page serves HTTP 200 with rendered HTML', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.ok(body.includes('Typelessity'), 'home must render the brand name');
  });
});

test('home <head> carries SoftwareApplication schema with featureList (TY-LANDING-SCHEMA)', async () => {
  await withServer(async (base) => {
    const body = await (await fetch(`${base}/`)).text();
    assert.ok(body.includes('application/ld+json'), 'home must emit JSON-LD');
    assert.ok(body.includes('SoftwareApplication'), 'home must emit SoftwareApplication schema');
    assert.ok(body.includes('featureList'), 'SoftwareApplication must carry featureList');
    assert.ok(body.includes('FAQPage'), 'home must emit FAQPage schema');
    assert.ok(body.includes('parentOrganization'), 'Organization must carry parentOrganization (Webappski)');
  });
});

test('comparison section renders Cal.ai and Cal.com columns (TY-COMPARE-CALAI)', async () => {
  await withServer(async (base) => {
    const body = await (await fetch(`${base}/`)).text();
    assert.ok(body.includes('Cal.ai'), 'comparison must render Cal.ai');
    assert.ok(body.includes('Cal.com'), 'comparison must render Cal.com');
    assert.ok(/differ from Cal\.ai/i.test(body), 'a Cal.ai differentiation FAQ must render');
  });
});
