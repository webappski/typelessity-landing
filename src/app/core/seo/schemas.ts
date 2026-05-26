import { SITE_URL, SITE_NAME, canonicalUrl } from './seo.service';

type Json = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#organization`;
export const PERSON_ID = `${SITE_URL}/about#alex-isa`;

export function organizationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    parentOrganization: {
      '@type': 'Organization',
      '@id': 'https://webappski.com/#organization',
      name: 'Webappski',
      url: 'https://webappski.com',
    },
    sameAs: [
      'https://webappski.com',
      'https://typelessform.com',
    ],
    founder: { '@id': PERSON_ID },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@webappski.com',
    },
  };
}

export const PERSON_ALEX_ISA: Json = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Alex Isa',
  url: `${SITE_URL}/about`,
  jobTitle: 'Founder',
  worksFor: { '@id': ORG_ID, '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  sameAs: [
    'https://webappski.com',
    'https://typelessform.com',
    'https://www.linkedin.com/in/alex-isa-dev/',
  ],
};

export function websiteLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: canonicalUrl('/'),
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function softwareApplicationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    publisher: { '@id': ORG_ID },
    offers: [
      {
        '@type': 'Offer',
        name: 'Pilot',
        price: '0',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '39',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '149',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '399',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
    ],
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: canonicalUrl(item.path),
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
}): Json {
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
    inLanguage: 'en',
    ...(wordCount !== undefined ? { wordCount } : {}),
    author: PERSON_ALEX_ISA,
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: canonicalUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
  };
}

export function aboutPageLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Typelessity',
    url: canonicalUrl('/about'),
    mainEntity: PERSON_ALEX_ISA,
  };
}

export function productLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_URL}/#product`,
    name: SITE_NAME,
    description: 'AI conversational booking widget that replaces forms with chat.',
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: [
      {
        '@type': 'Offer',
        name: 'Pilot',
        price: '0',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '39',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '149',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '399',
        priceCurrency: 'USD',
        url: canonicalUrl('/pricing'),
        availability: 'https://schema.org/PreOrder',
      },
    ],
  };
}
