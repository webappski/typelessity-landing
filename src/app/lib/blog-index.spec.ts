import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOG_POSTS } from './blog-manifest.generated';
import { BLOG_INDEX, getBlogIndexEntry } from './blog-index.generated';

// L4: the home page draws three article cards from the slim index (no bodies), so it does not ship the 110 kB manifest. Both files are written by
// tools/build-blog-index.ts in one run; this holds that the index is the manifest without the bodies, in the same order, field for field.
test('the blog index lists the posts of the manifest in the same order with the same slug, title, description, dates and category', () => {
  assert.deepEqual(
    BLOG_INDEX,
    BLOG_POSTS.map(({ slug, title, description, publishedAt, updatedAt, category }) => ({ slug, title, description, publishedAt, ...(updatedAt ? { updatedAt } : {}), category })),
  );
});

test('the blog index carries no body', () => {
  for (const entry of BLOG_INDEX) assert.ok(!('body' in entry), `${entry.slug} carries a body`);
});

test('getBlogIndexEntry finds a post by slug and answers undefined for an unknown one', () => {
  assert.equal(getBlogIndexEntry('single-gpt-call')?.slug, 'single-gpt-call');
  assert.equal(getBlogIndexEntry('no-such-post'), undefined);
});
