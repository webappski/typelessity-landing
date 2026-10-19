import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// L3 F6 (M31): every browser spec takes `test` and `expect` — and the types — from ./fixtures, which puts the widget origin,
// the API origin and the refusal of every other host on the browser context. A spec that imports from '@playwright/test'
// directly (`import type` too) opts out of that silently: its page would load the live widget.js and call the live API from
// every pre-push, and nothing would say so. What this cannot see: a context a spec makes itself (`browser.newContext`,
// free-ai-visibility-pilot.pw.ts) has no fixture route; that one runs with JavaScript off, so it cannot fetch.

const HERE = new URL('.', import.meta.url).pathname;
const DIR = join(HERE, 'browser');
const specs = readdirSync(DIR).filter((f) => f.endsWith('.pw.ts')).sort();
const DIRECT = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)['"]@playwright\/test['"]/;

test('no *.pw.ts imports from @playwright/test — they all go through ./fixtures', () => {
  assert.ok(specs.length >= 14, `${specs.length} browser specs found in e2e/browser, expected at least 14 (12 old + site-shell-theme + widget-fonts-csp)`);
  const offenders = specs.filter((f) => DIRECT.test(readFileSync(join(DIR, f), 'utf8')));
  assert.deepEqual(offenders, [], 'a browser spec imports Playwright directly: its page is not isolated from the live widget and API');
});

test('every browser spec imports its test from ./fixtures', () => {
  const missing = specs.filter((f) => !/from\s+'\.\/fixtures'/.test(readFileSync(join(DIR, f), 'utf8')));
  assert.deepEqual(missing, []);
});

test('the guard sees a direct import in every spelling (control)', () => {
  for (const sample of [
    "import { test } from '@playwright/test';",
    "import type { Page } from '@playwright/test';",
    'import { test } from "@playwright/test";',
    "const { test } = require('@playwright/test');",
    "const m = await import('@playwright/test');",
    "import('@playwright/test').Page",
  ]) assert.ok(DIRECT.test(sample), sample);
  assert.ok(!DIRECT.test("import { test } from './fixtures';"));
});

test('the isolation is wired: the fixture is automatic, config blocks service workers and runs global-setup', () => {
  const fixtures = readFileSync(join(DIR, 'fixtures.ts'), 'utf8');
  assert.match(fixtures, /auto:\s*true/, 'the fixture must be automatic, or a spec that does not ask for it is not isolated');
  assert.match(fixtures, /context\.route\(/);
  assert.match(fixtures, /abort\(/, 'the branch that refuses a foreign host');
  const config = readFileSync(join(HERE, '..', 'playwright.config.ts'), 'utf8');
  assert.match(config, /serviceWorkers:\s*'block'/);
  assert.match(config, /globalSetup:\s*'\.\/e2e\/browser\/global-setup\.ts'/);
});

test('the fixture and the snapshot step name no value of the product API: they read it from the product source (R67 item 3)', () => {
  for (const f of ['fixtures.ts', 'global-setup.ts', 'widget-snapshot.ts']) {
    const text = readFileSync(join(DIR, f), 'utf8');
    assert.doesNotMatch(text, /NO_CONFIG_FOR_DOMAIN|No active widget/, `${f} writes down a literal of the API answer`);
  }
});
