import { RenderMode, ServerRoute } from '@angular/ssr';
import { BLOG_SLUGS } from './lib/blog-manifest.generated';

const STATIC_PAGES = [
  '',
  'how-it-works',
  'install',
  'pricing',
  'gdpr',
  'privacy',
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
    headers: { Location: 'https://webappski.com/en/legal/dpa-typelessity' },
  },
  {
    path: 'legal/terms',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/terms-typelessity' },
  },
  {
    path: 'legal/dpa',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/dpa-typelessity' },
  },
  {
    path: 'legal/sub-processors',
    renderMode: RenderMode.Server,
    status: 308,
    headers: { Location: 'https://webappski.com/en/legal/dpa-typelessity' },
  },
  {
    path: 'legal/security',
    renderMode: RenderMode.Prerender,
  },
  // Prerendered, then moved by tools/build-404.ts to dist/404.html (and dist/404/ removed): the page the
  // platform serves for an address with no file. The local SSR server still answers /404 itself.
  { path: '404', renderMode: RenderMode.Prerender },
  // The local mirror of the platform's 404: an unknown address answers 404 with the 404 screen instead of
  // 200 with a foreign page. It proves the Angular layer only; the platform is proved on the preview.
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
