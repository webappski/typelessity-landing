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

const LEGAL_DOCS = ['privacy', 'terms', 'dpa', 'security', 'sub-processors'];

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
  {
    path: 'legal/:doc',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return LEGAL_DOCS.map((doc) => ({ doc }));
    },
  },
  { path: '**', renderMode: RenderMode.Server },
];
