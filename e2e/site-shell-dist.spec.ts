import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// L3 (S4): what a crawler and a no-JavaScript visitor receive of the new shell — the bytes of every .html of the build. The
// behaviour a person sees (themes, menu, fonts) is site-shell-theme.pw.ts; this reads the HTML itself.
//   (a) the header and the footer carry no link to /industries or /gdpr; the footer keeps the parents, the
//       security page and the contact address (D1, D2, F4);
//   (b) <html> carries no data-theme: nothing on the server decides a visitor's theme;
//   (c) the inline script that applies the stored theme stands in <head> BEFORE the first stylesheet or <style> (no flash),
//       and every touch of localStorage in it is inside try (D3, F13);
//   (d) the stylesheet is one blocking <link>: no media="print" swap (F10 — the critical-CSS inliner could drop the dark
//       tokens from the first paint, and the stored «dark» on a light system would flash light);
//   (e) two theme-color metas, light and dark, with the --bg values of the mock (F18-1);
//   (f) the server HTML of the header carries BOTH theme icons, the moon and the sun: the server cannot know the theme on screen,
//       so a template that chooses one icon renders something else on the client than the server sent (a hydration mismatch;
//       the production build does not report it in the console, so B1.11 cannot see it — found in the mutation run, M18).
// LANDING_DIST points the check at another copy of dist/typelessity-landing/browser (the mutation run).

const DIST = process.env['LANDING_DIST']
  ? pathToFileURL(`${process.env['LANDING_DIST']}/`)
  : new URL('../dist/typelessity-landing/browser/', import.meta.url);

async function walk(dir: URL, out: URL[] = []): Promise<URL[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await walk(url, out);
    else if (entry.name.endsWith('.html')) out.push(url);
  }
  return out;
}

const pages = new Map<string, string>();
async function load(): Promise<Map<string, string>> {
  if (pages.size) return pages;
  let files: URL[];
  try {
    files = await walk(DIST);
  } catch {
    throw new Error(`${DIST.pathname} missing — run \`npm run build\` before this check.`);
  }
  for (const f of files) pages.set(f.pathname.slice(DIST.pathname.length), await readFile(f, 'utf8'));
  assert.ok(pages.size >= 10, `expected the prerendered site (at least 10 html files), found ${pages.size}`);
  return pages;
}

const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"/gi)].map((m) => m[1]!.replace(/&#38;|&amp;/g, '&').replace(/&#64;/g, '@'));
const FORBIDDEN = /^\/(industries|gdpr)(\/|$|\?|#)/;
// A page with a body has a header and a footer; index.csr.html is the empty shell the server falls back to.
const withShell = (all: Map<string, string>) => [...all].filter(([, html]) => /<footer[^>]*class="vc-footer"/.test(html));

test('(a) the header and the footer of every page have no link to /industries or /gdpr', async () => {
  const all = withShell(await load());
  assert.ok(all.length >= 10, `${all.length} pages with a footer`);
  const offenders: string[] = [];
  for (const [path, html] of all) {
    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? '';
    const footer = html.match(/<footer[^>]*class="vc-footer"[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(header && footer, `${path}: no header or footer`);
    for (const h of [...hrefs(header), ...hrefs(footer)]) if (FORBIDDEN.test(h)) offenders.push(`${path}: ${h}`);
  }
  assert.deepEqual(offenders, []);
});

test('(a) the header and the footer of every page link to /install (L5)', async () => {
  const problems: string[] = [];
  const all = withShell(await load());
  assert.ok(all.length >= 10, `${all.length} pages with a footer`);
  for (const [path, html] of all) {
    const header = hrefs(html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? '');
    const footer = hrefs(html.match(/<footer[^>]*class="vc-footer"[\s\S]*?<\/footer>/)?.[0] ?? '');
    if (!header.includes('/install')) problems.push(`${path}: the header has no /install`);
    if (!footer.includes('/install')) problems.push(`${path}: the footer has no /install`);
  }
  assert.deepEqual(problems, []);
});

test('(a) the footer of every page keeps webappski.com, typelessform.com, /legal/security and the contact address', async () => {
  const problems: string[] = [];
  for (const [path, html] of withShell(await load())) {
    const footer = hrefs(html.match(/<footer[^>]*class="vc-footer"[\s\S]*?<\/footer>/)?.[0] ?? '');
    for (const required of ['https://webappski.com', 'https://typelessform.com', '/legal/security', 'mailto:info@webappski.com']) {
      if (!footer.includes(required)) problems.push(`${path}: no ${required}`);
    }
  }
  assert.deepEqual(problems, []);
});

test('(b) no page names a theme on <html>: data-theme is set by the visitor, not by the server', async () => {
  const offenders = [...(await load())].filter(([, html]) => /<html\b[^>]*\sdata-theme=/i.test(html)).map(([p]) => p);
  assert.deepEqual(offenders, []);
});

test('(c) the theme script is in <head> before the first stylesheet and the first <style>, and its storage access is in try', async (t) => {
  const all = await load();
  await t.test('every page has it, ahead of the styles', () => {
    const problems: string[] = [];
    for (const [path, html] of all) {
      const head = html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? '';
      const script = [...head.matchAll(/<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].find((m) => m[1]!.includes('ty-theme'));
      if (!script) { problems.push(`${path}: no inline script with ty-theme in <head>`); continue; }
      const style = head.search(/<style\b|<link\b[^>]*\srel="stylesheet"/i);
      if (style >= 0 && head.indexOf(script[0]) > style) problems.push(`${path}: the theme script stands after the first style`);
    }
    assert.deepEqual(problems, []);
  });
  await t.test('every read and write of localStorage in it is inside try', () => {
    const problems: string[] = [];
    for (const [path, html] of all) {
      const code = ([...(html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] ?? '').matchAll(/<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].find((m) => m[1]!.includes('ty-theme')) ?? [])[1] ?? '';
      if (!code) continue; // reported by the test above
      const firstTry = code.search(/\btry\s*\{/);
      const firstStore = code.indexOf('localStorage');
      if (firstStore >= 0 && (firstTry < 0 || firstTry > firstStore || !/\bcatch\b/.test(code))) problems.push(`${path}: localStorage outside try/catch`);
    }
    assert.deepEqual(problems, []);
  });
});

test('(d) the stylesheet is not swapped in with media="print": one blocking <link>, so the first paint has the tokens (F10)', async () => {
  const offenders = [...(await load())].filter(([, html]) => /media="print"/i.test(html)).map(([p]) => p);
  assert.deepEqual(offenders, [], 'an inlined critical CSS with an async rest can paint the wrong theme first');
});

test('(e) every page has two theme-color metas: #FFFFFF for light and #0A1120 for dark', async () => {
  const problems: string[] = [];
  for (const [path, html] of await load()) {
    const metas = [...html.matchAll(/<meta\b[^>]*\sname="theme-color"[^>]*>/gi)].map((m) => m[0]);
    const pick = (scheme: string) => metas.find((m) => m.includes(`(prefers-color-scheme: ${scheme})`))?.match(/\scontent="([^"]*)"/i)?.[1]?.toUpperCase();
    if (metas.length !== 2) problems.push(`${path}: ${metas.length} theme-color metas, expected 2`);
    else if (pick('light') !== '#FFFFFF' || pick('dark') !== '#0A1120') problems.push(`${path}: light ${pick('light')}, dark ${pick('dark')}`);
  }
  assert.deepEqual(problems, []);
});

test('(f) the header of every page holds both theme icons in the server HTML — CSS picks one, the template does not (hydration)', async () => {
  const problems: string[] = [];
  for (const [path, html] of withShell(await load())) {
    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? '';
    for (const icon of ['vc-theme-moon', 'vc-theme-sun']) if (!new RegExp(`class="${icon}"`).test(header)) problems.push(`${path}: no ${icon} in the header`);
  }
  assert.deepEqual(problems, []);
});
