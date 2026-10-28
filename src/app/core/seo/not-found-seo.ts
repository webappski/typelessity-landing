import type { SeoInput } from './seo.service';

/**
 * The head of a page that has no address of its own: the 404 screen and the article shell of /blog/<unknown slug> (SEO24-TYL-2, N-02). One definition,
 * so the two cannot drift apart. The 404 file is the body of every 404 and of the 410 of the retired pages: it names no address as its own and asks
 * not to be indexed (L12, C12).
 */
export const NOT_FOUND_SEO: SeoInput = {
  title: '404 — Page not found',
  description: 'The link you followed may be broken, or the page may have been moved.',
  path: '/404',
  robots: 'noindex',
  noCanonical: true,
};
