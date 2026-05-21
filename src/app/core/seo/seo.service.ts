import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_URL = 'https://typelessity.com';
export const SITE_NAME = 'Typelessity';

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  apply(input: SeoInput): void {
    const fullTitle = `${input.title} — ${SITE_NAME}`;
    const url = canonicalUrl(input.path);
    const ogImage = input.ogImage ?? `${SITE_URL}/og-image.jpg`;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: input.description });
    this.meta.updateTag({ property: 'og:title', content: input.title });
    this.meta.updateTag({ property: 'og:description', content: input.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:type', content: input.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: input.title });
    this.meta.updateTag({ name: 'twitter:description', content: input.description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    if (input.type === 'article') {
      if (input.publishedAt) {
        this.meta.updateTag({ property: 'article:published_time', content: input.publishedAt });
      }
      if (input.updatedAt) {
        this.meta.updateTag({ property: 'article:modified_time', content: input.updatedAt });
      }
      if (input.author) {
        this.meta.updateTag({ property: 'article:author', content: input.author });
      }
    }

    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}

export function canonicalUrl(path: string): string {
  const clean = path === '/' ? '' : path;
  return `${SITE_URL}${clean}`;
}
