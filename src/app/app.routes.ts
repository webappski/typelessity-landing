import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./pages/how-it-works/how-it-works-page.component').then((m) => m.HowItWorksPageComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pages/pricing/pricing-page.component').then((m) => m.PricingPageComponent),
  },
  {
    path: 'industries',
    loadComponent: () =>
      import('./pages/industries/industries-page.component').then((m) => m.IndustriesPageComponent),
  },
  {
    path: 'industries/:slug',
    loadComponent: () =>
      import('./pages/industries/industry-detail-page.component').then((m) => m.IndustryDetailPageComponent),
  },
  {
    path: 'for-ai-agents',
    loadComponent: () =>
      import('./pages/for-ai-agents/for-ai-agents.component').then((m) => m.ForAiAgentsComponent),
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./pages/faq/faq-page.component').then((m) => m.FaqPageComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about-page.component').then((m) => m.AboutPageComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./pages/blog/blog-list.component').then((m) => m.BlogListComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./pages/blog/blog-post.component').then((m) => m.BlogPostComponent),
  },
  // External legal docs — handled at SSR layer with 308 (see app.routes.server.ts).
  // Client routes exist only so SSR engine validates path matches; component is never rendered for these paths in production.
  { path: 'legal/privacy', loadComponent: () => import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent) },
  { path: 'legal/terms', loadComponent: () => import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent) },
  { path: 'legal/dpa', loadComponent: () => import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent) },
  { path: 'legal/sub-processors', loadComponent: () => import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent) },
  { path: 'legal/security', loadComponent: () => import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent) },
  {
    path: 'legal/:doc',
    loadComponent: () =>
      import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
