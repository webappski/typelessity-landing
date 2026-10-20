// Build-time: generate sitemap.xml after `ng build`.
// Reads the blog manifest, emits to dist/<project>/browser/.
//
// Every <lastmod> is a literal in this file or an article's own date. The generator reads no clock, no
// git and no file time: a lastmod that moves with the build tells a crawler nothing (Google, «Build and
// submit a sitemap»: use it for the date of the last significant update, and only if accurate), and the
// clone Vercel builds from has no full history. <changefreq> and <priority> are ignored by Google and
// are not written. The pure functions are exported for e2e/sitemap-generator.spec.ts; the file is written
// only when this module is run as a script.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BLOG_POSTS } from '../src/app/lib/blog-manifest.generated';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = 'https://typelessity.com';

interface Url {
  path: string;
  lastmod: string;
}

// Each date is the later of two commit dates, read once when the date is set (not at build time):
//   git log -1 --format=%cs -- src/app/pages/<page>/
//   git log -1 --format=%cs -G"'seo\.<key>\." -- src/app/i18n/translations.en.ts   (title and description)
// A page rewritten by a later task sets its own date in that task. e2e/sitemap-contract.spec.ts fails
// when a date is earlier than the result of these two commands.
const STATIC_PATHS: Url[] = [
  // L11 (2026-10-20): the home page has one block for «any business that takes bookings»; L4 (2026-10-20): it was rebuilt (title, description, H1, the demo, six questions of /faq).
  { path: '/', lastmod: '2026-10-20' },
  { path: '/how-it-works', lastmod: '2026-10-19' },
  { path: '/install', lastmod: '2026-10-19' },
  // L11 (2026-10-20): the select of the question form is a short list of business types, and the SoftwareApplication markup says it adapts to any business.
  { path: '/pricing', lastmod: '2026-10-20' },
  { path: '/gdpr', lastmod: '2026-10-19' },
  // L11 (2026-10-20): the definition and the feature list say «any business that takes bookings»; one link fewer.
  { path: '/for-ai-agents', lastmod: '2026-10-20' },
  { path: '/faq', lastmod: '2026-10-19' },
  { path: '/about', lastmod: '2026-10-19' },
  // L9 (2026-10-20): the h1, the subtitle, the title and description of the list and its Blog markup changed.
  { path: '/blog', lastmod: '2026-10-20' },
  // Only /legal/security is a page on this domain. The other legal documents live on
  // webappski.com and are 308-redirected there by vercel.json, so listing them here
  // would advertise redirects as indexable URLs — see src/app/discovery/legal-redirects.spec.ts.
  { path: '/legal/security', lastmod: '2026-10-19' },
];

/** A post's date is its own: the last update, else the day it was published. */
export function lastmodForPost(post: { publishedAt: string; updatedAt?: string }): string {
  return post.updatedAt ?? post.publishedAt;
}

const dynamicPaths = (): Url[] => [
  ...BLOG_POSTS.map((p): Url => ({ path: `/blog/${p.slug}`, lastmod: lastmodForPost(p) })),
];

function urlFor(path: string): string {
  return `${SITE}${path === '/' ? '' : path}`;
}

export function buildSitemap(): string {
  const urls = [...STATIC_PATHS, ...dynamicPaths()];
  const items = urls
    .map((u) => `  <url>
    <loc>${urlFor(u.path)}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const projectName = JSON.parse(
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
  ).name as string;
  const browserDir = join(ROOT, 'dist', projectName, 'browser');

  const xml = buildSitemap();
  const urlCount = STATIC_PATHS.length + BLOG_POSTS.length;
  writeFileSync(join(browserDir, 'sitemap.xml'), xml, 'utf8');

  console.log(`✓ sitemap: ${urlCount} URLs → ${browserDir.replace(ROOT, '')}/sitemap.xml`);
}
