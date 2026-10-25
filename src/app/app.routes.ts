import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./pages/demo/demo-page.component').then((m) => m.DemoPageComponent),
  },
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./pages/how-it-works/how-it-works-page.component').then((m) => m.HowItWorksPageComponent),
  },
  {
    path: 'install',
    loadComponent: () =>
      import('./pages/install/install-page.component').then((m) => m.InstallPageComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pages/pricing/pricing-page.component').then((m) => m.PricingPageComponent),
  },
  {
    path: 'gdpr',
    loadComponent: () =>
      import('./pages/gdpr/gdpr-page.component').then((m) => m.GdprPageComponent),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/privacy/privacy-page.component').then((m) => m.PrivacyPageComponent),
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
    // Prerendered to /404 so postbuild can turn it into dist/404.html, the page Vercel serves for an
    // address with no file (tools/build-404.ts). Listed before '**' so the route is its own entry.
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
