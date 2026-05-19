import { SITE_URL, SITE_NAME, canonicalUrl, type SeoLocale } from './seo.service';

type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    parentOrganization: {
      '@type': 'Organization',
      name: 'Webappski',
      url: 'https://webappski.com',
    },
    sameAs: [
      'https://webappski.com',
      'https://typelessform.com',
    ],
    founder: PERSON_ALEX_ISA,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@webappski.com',
    },
  };
}

export const PERSON_ALEX_ISA: Json = {
  '@type': 'Person',
  name: 'Alex Isa',
  url: `${SITE_URL}/about`,
  jobTitle: 'Founder',
  worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  sameAs: [
    'https://webappski.com/en',
    'https://typelessform.com',
    'https://www.linkedin.com/in/alex-isa-dev/',
  ],
};

export function websiteLd(locale: SeoLocale): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: canonicalUrl(locale, '/'),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/${locale}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function softwareApplicationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: 'Custom',
      offerCount: 2,
    },
  };
}

export function breadcrumbLd(locale: SeoLocale, trail: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: canonicalUrl(locale, item.path),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function articleLd(post: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  ogImage?: string;
  category: string;
  tags: readonly string[] | string[];
  body?: string;
}, locale: SeoLocale): Json {
  const wordCount = post.body
    ? post.body.split(/\s+/).filter(Boolean).length
    : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.ogImage ? `${SITE_URL}${post.ogImage}` : `${SITE_URL}/og-image.jpg`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: locale,
    ...(wordCount !== undefined ? { wordCount } : {}),
    author: PERSON_ALEX_ISA,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: canonicalUrl(locale, `/blog/${post.slug}`),
    articleSection: post.category,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
  };
}

export function aboutPageLd(locale: SeoLocale): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Typelessity',
    url: canonicalUrl(locale, '/about'),
    mainEntity: PERSON_ALEX_ISA,
  };
}

export function productLd(locale: SeoLocale): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: SITE_NAME,
    description: 'AI conversational booking widget that replaces forms with chat in 25+ languages.',
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'AggregateOffer',
      url: canonicalUrl(locale, '/pricing'),
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: 'Custom',
      offerCount: 2,
    },
  };
}
