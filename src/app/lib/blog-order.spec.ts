import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EDITORIAL_ORDER, compareEditorial } from './blog-order';

const DAY = '2026-05-21';
const slugs = (list: { slug: string }[]) => list.map((p) => p.slug);

test('blog order: on the same date the editorial list holds', () => {
  const posts = [...EDITORIAL_ORDER].reverse().map((slug) => ({ slug, publishedAt: DAY }));
  assert.deepEqual(slugs(posts.sort(compareEditorial)), [...EDITORIAL_ORDER]);
});

test('blog order: a post missing from the list goes after the listed ones, alphabetically', () => {
  const posts = [
    { slug: 'zeta-new-post', publishedAt: DAY },
    { slug: 'single-gpt-call', publishedAt: DAY },
    { slug: 'alpha-new-post', publishedAt: DAY },
    { slug: 'best-ai-booking-beauty-salons-2026', publishedAt: DAY },
  ];
  assert.deepEqual(slugs(posts.sort(compareEditorial)),
    ['best-ai-booking-beauty-salons-2026', 'single-gpt-call', 'alpha-new-post', 'zeta-new-post']);
});

test('blog order: a newer post comes first whether or not it is listed', () => {
  const posts = [{ slug: 'single-gpt-call', publishedAt: DAY }, { slug: 'zeta-new-post', publishedAt: '2026-10-01' }];
  assert.deepEqual(slugs(posts.sort(compareEditorial)), ['zeta-new-post', 'single-gpt-call']);
});
