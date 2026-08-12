// Build-time: generate sitemap.xml after `ng build`.
// Reads industries (verbatim from production) + blog manifest, emits to dist/<project>/browser/.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_INDUSTRIES } from '../src/app/lib/industries';
import { BLOG_POSTS } from '../src/app/lib/blog-manifest.generated';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = 'https://typelessity.com';

type ChangeFreq = 'weekly' | 'monthly' | 'yearly';

interface Url {
  path: string;
  changefreq: ChangeFreq;
  priority: number;
  lastmod?: string;
}

const STATIC_PATHS: Url[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/how-it-works', changefreq: 'monthly', priority: 0.9 },
  { path: '/pricing', changefreq: 'monthly', priority: 0.9 },
  { path: '/industries', changefreq: 'weekly', priority: 0.9 },
  { path: '/for-ai-agents', changefreq: 'monthly', priority: 0.8 },
  { path: '/faq', changefreq: 'monthly', priority: 0.8 },
  { path: '/about', changefreq: 'yearly', priority: 0.6 },
  { path: '/blog', changefreq: 'weekly', priority: 0.7 },
  // Only /legal/security is a page on this domain. The other legal documents live on
  // webappski.com and are 308-redirected there by vercel.json, so listing them here
  // would advertise redirects as indexable URLs — see src/app/discovery/legal-redirects.spec.ts.
  { path: '/legal/security', changefreq: 'yearly', priority: 0.3 },
];

const dynamicPaths = (): Url[] => [
  ...ALL_INDUSTRIES.map((i): Url => ({
    path: `/industries/${i.slug}`,
    changefreq: 'monthly',
    priority: 0.7,
  })),
  ...BLOG_POSTS.map((p): Url => ({
    path: `/blog/${p.slug}`,
    changefreq: 'monthly',
    priority: 0.6,
    lastmod: p.updatedAt ?? p.publishedAt,
  })),
];

function urlFor(path: string): string {
  return `${SITE}${path === '/' ? '' : path}`;
}

function buildSitemap(): string {
  const urls = [...STATIC_PATHS, ...dynamicPaths()];
  const items = urls
    .map((u) => `  <url>
    <loc>${urlFor(u.path)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

const projectName = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
).name as string;
const browserDir = join(ROOT, 'dist', projectName, 'browser');

const xml = buildSitemap();
const urlCount = STATIC_PATHS.length + ALL_INDUSTRIES.length + BLOG_POSTS.length;
writeFileSync(join(browserDir, 'sitemap.xml'), xml, 'utf8');

console.log(`✓ sitemap: ${urlCount} URLs → ${browserDir.replace(ROOT, '')}/sitemap.xml`);
