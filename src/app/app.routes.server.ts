import { RenderMode, ServerRoute } from '@angular/ssr';
import { getAllIndustrySlugs } from './lib/industries';
import { BLOG_SLUGS } from './lib/blog-manifest.generated';

const LANGS = ['en', 'de', 'ru', 'pl'];

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
    path: page ? `:lang/${page}` : ':lang',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return LANGS.map((lang) => ({ lang }));
    },
  })),
  {
    path: ':lang/industries/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const slugs = getAllIndustrySlugs();
      return LANGS.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
    },
  },
  {
    path: ':lang/blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return LANGS.flatMap((lang) => BLOG_SLUGS.map((slug) => ({ lang, slug })));
    },
  },
  {
    path: ':lang/legal/:doc',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return LANGS.flatMap((lang) => LEGAL_DOCS.map((doc) => ({ lang, doc })));
    },
  },
  { path: '**', renderMode: RenderMode.Server },
];
