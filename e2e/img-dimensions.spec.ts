import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// L3 D9 (S3): an <img> without width and height reserves no space, so the page jumps when the picture arrives (CLS, web.dev/vitals:
// «good» is ≤ 0.1). Today the site has no <img> at all; the guard exists for L4–L9, which add pictures. EVERY .html of the build is
// read — 404.html and index.csr.html too — and every <img> must carry a numeric width and height. The count of tags read is
// printed, so «0 found» is a number somebody sees, not a silence. LANDING_DIST points the check at another copy of
// dist/typelessity-landing/browser (the mutation run feeds it a copy with <img src=x> in it; it must go red).

const DIST = process.env['LANDING_DIST']
  ? pathToFileURL(`${process.env['LANDING_DIST']}/`)
  : new URL('../dist/typelessity-landing/browser/', import.meta.url);

async function htmlFiles(dir: URL, out: URL[] = []): Promise<URL[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await htmlFiles(url, out);
    else if (entry.name.endsWith('.html')) out.push(url);
  }
  return out;
}

/** The <img> tags of an HTML text that lack a numeric width or height. */
export function imgWithoutSize(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => !/\swidth="\d+"/i.test(tag) || !/\sheight="\d+"/i.test(tag));
}

test('the guard sees an <img> without a size and passes one with it (control)', () => {
  assert.equal(imgWithoutSize('<img src="a.png">').length, 1);
  assert.equal(imgWithoutSize('<img src="a.png" width="10">').length, 1);
  assert.equal(imgWithoutSize('<img src="a.png" width="10" height="20" alt="">').length, 0);
  assert.equal(imgWithoutSize('<p>image</p><imgx>').length, 0);
});

test('every <img> in every .html of the build has a numeric width and height', async () => {
  let files: URL[];
  try {
    files = await htmlFiles(DIST);
  } catch {
    throw new Error(`${DIST.pathname} missing — run \`npm run build\` before this check.`);
  }
  assert.ok(files.length >= 10, `expected the prerendered site (at least 10 html files), found ${files.length}`);
  let seen = 0;
  const offenders: string[] = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    seen += [...html.matchAll(/<img\b/gi)].length;
    for (const tag of imgWithoutSize(html)) offenders.push(`${file.pathname.slice(DIST.pathname.length)}: ${tag.slice(0, 80)}`);
  }
  console.log(`# img-dimensions: ${files.length} html files, ${seen} <img> tags read`);
  assert.deepEqual(offenders, [], '<img> without width and height reserves no space and shifts the page');
});
