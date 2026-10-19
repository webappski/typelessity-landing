import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// The generator is a pure function of the repository: no clock, no git, no file times. A lastmod that
// moves with the build tells a crawler nothing, and the clone Vercel builds from is not a full history.
// The module must be importable without writing into dist (it is run as a script by `postbuild`).

const ROOT = new URL('..', import.meta.url).pathname;
const DIST_SITEMAP = join(ROOT, 'dist', 'typelessity-landing', 'browser', 'sitemap.xml');

test('buildSitemap() does not depend on the clock or on git: same bytes with Date set to 2099 and no git in PATH', async () => {
  const { buildSitemap } = await import('../tools/build-sitemap');
  const before = process.env['PATH'];
  const first = buildSitemap();
  mock.timers.enable({ apis: ['Date'], now: Date.UTC(2099, 0, 1) });
  process.env['PATH'] = dirname(process.execPath);
  process.env['GIT_DIR'] = '/nonexistent';
  try {
    assert.equal(buildSitemap(), first);
  } finally {
    mock.timers.reset();
    process.env['PATH'] = before;
    delete process.env['GIT_DIR'];
  }
  assert.doesNotMatch(first, /2099/);
  assert.equal(first, readFileSync(DIST_SITEMAP, 'utf8'), 'the built sitemap.xml is what the pure function returns');
});

test('lastmodForPost(): updatedAt wins, a post without updatedAt falls back to publishedAt', async () => {
  const { lastmodForPost } = await import('../tools/build-sitemap');
  assert.equal(lastmodForPost({ publishedAt: '2026-05-01', updatedAt: '2026-06-02' }), '2026-06-02');
  assert.equal(lastmodForPost({ publishedAt: '2026-05-01' }), '2026-05-01');
});

test('importing the generator writes nothing: the file is written only when it is run as a script', () => {
  const src = readFileSync(join(ROOT, 'tools', 'build-sitemap.ts'), 'utf8');
  assert.match(src, /import\.meta\.url\s*===\s*pathToFileURL\(process\.argv\[1\]\)\.href/);
});
