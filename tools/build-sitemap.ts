// Build-time: generate per-locale sitemap.xml + sitemap-index.xml after `ng build`.
// Reads industries (verbatim from production) + blog manifest, emits files to dist/<project>/browser/.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_INDUSTRIES } from '../src/app/lib/industries';
import { BLOG_POSTS } from '../src/app/lib/blog-manifest.generated';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = 'https://typelessity.com';
const LOCALES = ['en', 'ru', 'de', 'pl'] as const;

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
  { path: '/legal/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/legal/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/legal/dpa', changefreq: 'yearly', priority: 0.3 },
  { path: '/legal/security', changefreq: 'yearly', priority: 0.3 },
  { path: '/legal/sub-processors', changefreq: 'yearly', priority: 0.3 },
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

function urlFor(locale: string, path: string): string {
  // Project deploys per-locale builds under /<lang>/ — sitemap uses absolute URLs with that prefix.
  return `${SITE}/${locale}${path === '/' ? '' : path}`;
}

function alternates(path: string): string {
  return LOCALES.map(
    (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, path)}"/>`,
  ).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${urlFor('en', path)}"/>`;
}

function buildLocaleSitemap(locale: string): string {
  const urls = [...STATIC_PATHS, ...dynamicPaths()];
  const items = urls
    .map((u) => `  <url>
    <loc>${urlFor(locale, u.path)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
    ${alternates(u.path)}
  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${items}
</urlset>
`;
}

function buildIndex(): string {
  const today = new Date().toISOString().slice(0, 10);
  const items = LOCALES
    .map((l) => `  <sitemap>
    <loc>${SITE}/sitemap-${l}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

const projectName = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
).name as string;
const browserDir = join(ROOT, 'dist', projectName, 'browser');

let count = 0;
for (const locale of LOCALES) {
  const xml = buildLocaleSitemap(locale);
  const out = join(browserDir, `sitemap-${locale}.xml`);
  writeFileSync(out, xml, 'utf8');
  count++;
}
writeFileSync(join(browserDir, 'sitemap.xml'), buildIndex(), 'utf8');
writeFileSync(join(browserDir, 'sitemap-index.xml'), buildIndex(), 'utf8');

console.log(`✓ sitemap: ${count} per-locale + index → ${browserDir.replace(ROOT, '')}`);
