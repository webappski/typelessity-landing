// Build-time: scan src/assets/content/blog/*.mdx, parse frontmatter,
// emit src/app/lib/blog-manifest.generated.ts with full BlogPost[] (body inlined for SSR).
// Run via `npm run build:blog` (also wired as a prebuild step).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';

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
  faqs?: { q: string; a: string }[];
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
      faqs: fm.faqs,
      body: content.trim(),
    };
  })
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

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
