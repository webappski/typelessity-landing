import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextShownIndex } from './next-scenario';
import { LANDING_LANGUAGES } from '../../../core/languages/landing-languages';
import { DEMO_LANGS, LANGNOTE, LANGS_MORE_COUNT, LANGS_MORE_HEAD, LANGS_MORE_NAMES, LANGS_MORE_TITLE } from './demo-labels';

const IDS = ['salon', 'garage', 'table', 'freight'];

test('nextShownIndex: the round goes on to the next business whose tab is drawn', () => {
  const all = () => true;
  assert.deepEqual([0, 1, 2, 3].map((i) => nextShownIndex(IDS, i, all)), [1, 2, 3, 0]);
});

test('nextShownIndex: a business whose tab is not drawn (Freight at 720 px and below) is skipped, in the middle and at the turn of the round', () => {
  const noFreight = (id: string) => id !== 'freight';
  assert.equal(nextShownIndex(IDS, 2, noFreight), 0, 'after table comes salon, not freight');
  assert.equal(nextShownIndex(IDS, 0, noFreight), 1);
  assert.equal(nextShownIndex(IDS, 3, noFreight), 0, 'a show that is playing the hidden business (the window was narrowed) goes back to salon');
  const noGarage = (id: string) => id !== 'garage';
  assert.equal(nextShownIndex(IDS, 0, noGarage), 2, 'a tab in the middle is skipped too');
});

test('nextShownIndex: no other tab is drawn — the round still moves on to the very next business, it never stalls on itself', () => {
  assert.equal(nextShownIndex(IDS, 1, () => false), 2);
  assert.equal(nextShownIndex(['salon'], 0, () => true), 0);
});

test('the language labels are computed from the 25 languages: the buttons and the tooltip partition them, the numbers are never typed', () => {
  assert.deepEqual(DEMO_LANGS.map((l) => l.code), ['en', 'pl', 'de']);
  assert.equal(LANGS_MORE_COUNT, LANDING_LANGUAGES.length - 3);
  assert.equal(LANGS_MORE_NAMES.length, LANGS_MORE_COUNT);
  const buttons = DEMO_LANGS.map((d) => LANDING_LANGUAGES.find((l) => l.code === d.code)!.native);
  assert.deepEqual([...buttons, ...LANGS_MORE_NAMES].sort(), LANDING_LANGUAGES.map((l) => l.native).sort(), 'every language once');
  assert.ok(buttons.every((n) => !LANGS_MORE_NAMES.includes(n)), 'no button language is repeated in the tooltip');
  assert.equal(LANGNOTE, `The chat window comes in ${LANDING_LANGUAGES.length} languages.`);
  assert.equal(LANGS_MORE_HEAD, `${LANGS_MORE_COUNT} more chat languages:`);
  assert.equal(LANGS_MORE_TITLE, `${LANGS_MORE_COUNT} more chat languages`);
});
