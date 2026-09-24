import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';

// A27 (c8, 2026-09-24): DM Sans and Space Mono came from fonts.googleapis.com / fonts.gstatic.com,
// so every visitor's IP address went to Google before any consent — the embed a German court
// found unlawful (LG München I, 20.01.2022, 3 O 17493/20). They are now served from our own
// origin (public/fonts, the files and CSS Google itself serves for the same request), and the
// CSP no longer allows the two hosts.
//
// Asserts the shipped bytes, like no-analytics.spec.ts: the prerendered HTML, every stylesheet and
// script the build produced, the CSP in vercel.json — and that every font the local stylesheet
// names is actually in the build, so self-hosting cannot quietly degrade to a system font.
//
// Run: `npm run build` first, then `npm run e2e`.

const ROOT = new URL('../', import.meta.url);
const BROWSER = new URL('dist/typelessity-landing/browser/', ROOT);

const GOOGLE_FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/i;

async function listFiles(dir: URL, pattern: RegExp): Promise<URL[]> {
  const out: URL[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...(await listFiles(new URL(`${entry.name}/`, dir), pattern)));
    } else if (pattern.test(entry.name)) {
      out.push(new URL(entry.name, dir));
    }
  }
  return out;
}

function readBuilt(path: string): string {
  const file = new URL(path, BROWSER);
  if (!existsSync(file)) {
    throw new Error(`dist/…/browser/${path} missing — run \`npm run build\` before the smoke.`);
  }
  return readFileSync(file, 'utf8');
}

test('prerendered "/" loads its fonts from our origin and names no Google font host', () => {
  const html = readBuilt('index.html');
  assert.ok(html.includes('Typelessity'), 'home must render the brand name');
  assert.ok(!GOOGLE_FONT_HOSTS.test(html), 'the page must not load anything from Google Fonts');
  assert.match(html, /<link[^>]+href="fonts\/fonts\.css"/, 'the page must link the self-hosted stylesheet');
});

test('no stylesheet or script the build shipped names a Google font host', async () => {
  const files = await listFiles(BROWSER, /\.(css|m?js|html)$/);
  assert.ok(files.length > 0, 'the build must produce files to scan');
  const offenders: string[] = [];
  for (const file of files) {
    if (GOOGLE_FONT_HOSTS.test(await readFile(file, 'utf8'))) offenders.push(file.pathname.split('/browser/')[1]);
  }
  assert.deepEqual(offenders, [], 'Google Fonts host found in shipped files');
});

test('every font the local stylesheet names is in the build, for both families', () => {
  const css = readBuilt('fonts/fonts.css');
  for (const family of ['DM Sans', 'Space Mono']) {
    assert.ok(css.includes(`font-family: '${family}'`), `fonts.css must declare ${family}`);
  }
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]!.replace(/['"]/g, ''));
  assert.ok(urls.length > 0, 'fonts.css must point at font files');
  const missing = urls.filter((u) => /^https?:/.test(u) || !existsSync(new URL(`fonts/${u}`, BROWSER)));
  assert.deepEqual(missing, [], 'fonts.css names a file that is remote or not in the build');
});

test('CSP in vercel.json allows no Google font host', () => {
  const config = JSON.parse(readFileSync(new URL('vercel.json', ROOT), 'utf8')) as {
    headers?: { headers: { key: string; value: string }[] }[];
  };
  const csp = (config.headers ?? [])
    .flatMap((h) => h.headers)
    .filter((h) => h.key.toLowerCase() === 'content-security-policy')
    .map((h) => h.value);
  assert.ok(csp.length > 0, 'vercel.json must set a Content-Security-Policy');
  for (const value of csp) {
    assert.ok(!GOOGLE_FONT_HOSTS.test(value), `CSP still allows Google Fonts: ${value}`);
  }
});
