// The addresses the site lists in its own sitemap (dist, written by `npm run build`), read at load time — never a literal
// list and never a literal count, so a page added to the site is measured by every spec that loops over this (L3 B2, B3, B1.10, B5).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITEMAP = join(process.cwd(), 'dist/typelessity-landing/browser/sitemap.xml');

function read(): string[] {
  let xml: string;
  try {
    xml = readFileSync(SITEMAP, 'utf8');
  } catch (error) {
    throw new Error(`cannot read ${SITEMAP} (${(error as Error).message}) — run npm run build first`);
  }
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  if (paths.length === 0) throw new Error(`${SITEMAP} lists no address`);
  return paths;
}

/** Every address of the sitemap, as a path. */
export const SITEMAP_PATHS: string[] = read();

/** The sitemap plus an address the site does not have: the 404 shell carries the same header and footer. */
export const SITEMAP_PATHS_WITH_404: string[] = [...SITEMAP_PATHS, '/404-not-a-page'];
