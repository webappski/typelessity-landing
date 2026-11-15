import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// L16 (F-45, T3w of the product). The article "Whisper vs Web Speech API" says when the widget sends
// a recording on its own: that moment is the product's constant AUDIO_CONFIG.MAX_RECORDING_TIME
// (ms) in packages/widget/src/services/voice.service.ts. A number in prose that nobody reads off the
// code goes stale the day the constant moves (it was "two minutes" while the widget stopped at 100 s),
// so the sentence is read against the product's source, not against a literal here (R67 p.3).
// TY_PRODUCT_ROOT / TY_ARTICLE_FILE / TY_MANIFEST_FILE point at copies for the mutant runs, the
// product tree is never touched.

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
const VOICE = join(PRODUCT_ROOT, 'packages/widget/src/services/voice.service.ts');
const ARTICLE = process.env['TY_ARTICLE_FILE'] ?? new URL('../src/assets/content/blog/whisper-vs-webspeech.mdx', import.meta.url).pathname;
const MANIFEST = process.env['TY_MANIFEST_FILE'] ?? new URL('../src/app/lib/blog-manifest.generated.ts', import.meta.url).pathname;

function limitSeconds(): number {
  if (!existsSync(VOICE)) throw new Error(`нет исходника продукта: ${VOICE}; задай TY_PRODUCT_ROOT или клонируй ~/Projects/typelessity`);
  const ms = Number(readFileSync(VOICE, 'utf8').match(/MAX_RECORDING_TIME:\s*([0-9_]+)/)?.[1]?.replace(/_/g, ''));
  assert.ok(Number.isFinite(ms) && ms > 0, `${VOICE}: no MAX_RECORDING_TIME in AUDIO_CONFIG`);
  assert.equal(ms % 1000, 0, `MAX_RECORDING_TIME ${ms} ms is not a whole number of seconds: the article states seconds`);
  return ms / 1000;
}

for (const [name, file] of [['article', ARTICLE], ['manifest', MANIFEST]] as const) {
  test(`whisper-vs-webspeech ${name}: the moment the widget sends a recording on its own is the product's MAX_RECORDING_TIME`, () => {
    const seconds = limitSeconds();
    const text = readFileSync(file, 'utf8');
    assert.match(text, new RegExp(`stops — or after ${seconds} seconds —`), `${file}: the sentence about the upload must say "after ${seconds} seconds" (product limit ${seconds} s)`);
    assert.doesNotMatch(text, /after two minutes/i, `${file}: "after two minutes" is not the product's limit`);
    assert.doesNotMatch(text, /after (?:2|120) (?:minutes?|seconds)/i, `${file}: a limit other than ${seconds} s`);
  });
}
