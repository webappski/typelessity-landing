import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slugify';

test('slugify: lowercases', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});

test('slugify: collapses non-alphanumerics into single hyphen', () => {
  assert.equal(slugify("What's enrichment?"), 'what-s-enrichment');
});

test('slugify: trims leading/trailing hyphens', () => {
  assert.equal(slugify('---abc---'), 'abc');
});

test('slugify: respects maxLen', () => {
  assert.equal(slugify('a'.repeat(200), 10), 'aaaaaaaaaa');
});

test('slugify: handles unicode by stripping (current ascii-only behavior)', () => {
  assert.equal(slugify('Какой вопрос?'), '');
});
