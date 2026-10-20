// Build-time: scan src/assets/content/blog/*.mdx, parse frontmatter,
// emit src/app/lib/blog-manifest.generated.ts with full BlogPost[] (body inlined for SSR) and, beside it, the slim
// src/app/lib/blog-index.generated.ts (no bodies: for pages that only list posts, L4).
// Run via `npm run build:blog` (also wired as a prebuild step).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { compareEditorial } from '../src/app/lib/blog-order';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC_DIR = join(ROOT, 'src/assets/content/blog');
const OUT_FILE = join(ROOT, 'src/app/lib/blog-manifest.generated.ts');

interface Frontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  category: string;
  tags: string[];
  ogImage?: string;
}

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.mdx'));

const posts = files
  .map((file) => {
    const slug = basename(file, '.mdx');
    const raw = readFileSync(join(SRC_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const fm = data as Frontmatter;
    return {
      slug,
      title: fm.title,
      description: fm.description,
      publishedAt: fm.publishedAt,
      updatedAt: fm.updatedAt,
      author: fm.author,
      category: fm.category,
      tags: fm.tags,
      ogImage: fm.ogImage,
      body: content.trim(),
    };
  })
  .sort(compareEditorial);

const banner =
  '// AUTO-GENERATED — do not edit by hand.\n' +
  '// Source: src/assets/content/blog/*.mdx\n' +
  '// Regenerate: npm run build:blog\n\n';

const out =
  banner +
  "import type { BlogPost } from './types';\n\n" +
  `export const BLOG_POSTS: BlogPost[] = ${JSON.stringify(posts, null, 2)};\n\n` +
  'export const BLOG_SLUGS: string[] = BLOG_POSTS.map((p) => p.slug);\n\n' +
  'export function getBlogPostBySlug(slug: string): BlogPost | undefined {\n' +
  '  return BLOG_POSTS.find((p) => p.slug === slug);\n' +
  '}\n';

writeFileSync(OUT_FILE, out, 'utf8');
console.log(`✓ blog manifest: ${posts.length} posts → ${OUT_FILE.replace(ROOT, '')}`);

// The slim index (L4): the same posts without their bodies, for the pages that only list articles (the home page draws three cards).
// The manifest above carries every body for SSR (~110 kB, 30 kB gzipped); a page that imported it would ship all of that to draw
// three titles. The two files are written from the same list in the same run, so a title cannot differ between them.
const INDEX_FILE = join(ROOT, 'src/app/lib/blog-index.generated.ts');
const index = posts.map(({ slug, title, description, publishedAt, updatedAt, category }) => ({ slug, title, description, publishedAt, updatedAt, category }));
writeFileSync(
  INDEX_FILE,
  banner +
    "import type { BlogIndexEntry } from './types';\n\n" +
    `export const BLOG_INDEX: BlogIndexEntry[] = ${JSON.stringify(index, null, 2)};\n\n` +
    'export function getBlogIndexEntry(slug: string): BlogIndexEntry | undefined {\n' +
    '  return BLOG_INDEX.find((p) => p.slug === slug);\n' +
    '}\n',
  'utf8',
);
console.log(`✓ blog index: ${index.length} posts → ${INDEX_FILE.replace(ROOT, '')}`);
