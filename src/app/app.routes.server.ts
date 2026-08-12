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
  // External legal docs — 308 to webappski.com.
  //
  // These never fire on the live site: the project deploys as static output, so the SSR
  // server is not in the request path and each of these paths fell through to the SPA
  // fallback index.html (HTTP 200 carrying the home page under a legal URL). The enforcing
  // layer is the `redirects` block in vercel.json, guarded by
  // src/app/discovery/legal-redirects.spec.ts — change the two together.
  //
  // Kept here deliberately: correct and inert today, correct and active if SSR is switched on.
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
