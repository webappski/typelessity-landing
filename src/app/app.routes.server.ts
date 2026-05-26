import { RenderMode, ServerRoute } from '@angular/ssr';
import { getAllIndustrySlugs } from './lib/industries';
import { BLOG_SLUGS } from './lib/blog-manifest.generated';

const STATIC_PAGES = [
  '',
  'how-it-works',
  'pricing',
  'industries',
  'for-ai-agents',
  'faq',
  'about',
  'blog',
];

export const serverRoutes: ServerRoute[] = [
  ...STATIC_PAGES.map((page): ServerRoute => ({
    path: page,
    renderMode: RenderMode.Prerender,
  })),
  {
    path: 'industries/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getAllIndustrySlugs().map((slug) => ({ slug }));
    },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return BLOG_SLUGS.map((slug) => ({ slug }));
    },
  },
  // External legal docs — true server-side 308 to webappski.com (SSR-safe; AI crawlers see proper redirect, not blank prerendered HTML).
  {
    path: 'legal/privacy',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/product-privacy' },
  },
  {
    path: 'legal/terms',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/terms' },
  },
  {
    path: 'legal/dpa',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/dpa' },
  },
  {
    path: 'legal/sub-processors',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/dpa' },
  },
  {
    path: 'legal/security',
    renderMode: RenderMode.Prerender,
  },
  { path: '**', renderMode: RenderMode.Server },
];
