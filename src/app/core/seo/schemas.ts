import { SITE_URL, SITE_NAME, canonicalUrl } from './seo.service';
import { HOME } from '../../pages/home/home.content';

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
    // 512 x 512 PNG written by tools/gen-favicon.mjs; Google asks for at least 112 x 112 px, crawlable and indexable.
    logo: `${SITE_URL}/logo-512.png`,
    // The id is the node Webappski publishes about itself on webappski.com (a literal from the other side of the seam):
    // webappka src/app/core/aeo-platform/aeo-platform.config.ts:25. e2e/jsonld-contract.spec.ts J4 holds the value.
    parentOrganization: {
      '@type': 'Organization',
      '@id': 'https://webappski.com/#webappski-org',
      name: 'Webappski',
      url: 'https://webappski.com',
    },
    founder: personRef(),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@webappski.com',
    },
  };
}

/** A pointer to the Organization node that reads on its own page: type, id, name and url, nothing more. */
export function orgRef(): Json {
  return { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: SITE_URL };
}

/** A pointer to the founder's Person node that reads on its own page: type, id, name and url, nothing more. */
export function personRef(): Json {
  return { '@type': 'Person', '@id': PERSON_ID, name: 'Alex Isa', url: `${SITE_URL}/about` };
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
  };
}

/**
 * The one product node (`#software`). Every page that prints it (`/`, `/pricing`, `/for-ai-agents`) prints the same
 * `offers`: the four tiers of HOME.pricing.tiers, and `priceSpecification` with `unitCode: 'MON'` on the tiers that have a
 * period (the paid ones). `MON` = month, UN/CEFACT Recommendation 20. The three pages show the prices as visible text
 * («Starter €39 a month» in the FAQ answer of `/`, the tier cards of `/pricing`, the price line of `/for-ai-agents`);
 * e2e/jsonld-contract.spec.ts J3 compares the three nodes with `offers` included, J5 holds the visible side (L12, C7).
 */
export function softwareApplicationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_NAME,
    description:
      'AI conversational booking widget that replaces multi-step booking forms with a single natural-language chat. The chat window comes in 25 languages; the assistant replies in the language you set for the business. It adapts to any business that takes bookings. Voice input via OpenAI gpt-4o-mini-transcribe, enrichment APIs; the booking goes to your endpoint (REST) or by email.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    featureList: [
      'Chat window in 25 languages',
      'Voice input via OpenAI gpt-4o-mini-transcribe',
      'Enrichment APIs (fetch mechanics, slots, routes mid-conversation)',
      'Cascade-aware corrections',
      'Consent asked before the chat starts',
      'Two-line HTML embed (web component)',
      'Booking sent to your endpoint (REST) or by email',
    ],
    publisher: orgRef(),
    offers: HOME.pricing.tiers.map((tier) => ({
      '@type': 'Offer',
      name: tier.name,
      price: tier.price.replace('€', ''),
      priceCurrency: 'EUR',
      url: canonicalUrl('/pricing'),
      availability: 'https://schema.org/InStock',
      ...('period' in tier
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: tier.price.replace('€', ''),
              priceCurrency: 'EUR',
              unitCode: 'MON',
            },
          }
        : {}),
    })),
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
    publisher: orgRef(),
    mainEntityOfPage: canonicalUrl(`/blog/${post.slug}`),
    articleSection: post.category,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
  };
}

export function blogLd(page: { name: string; description: string }): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${canonicalUrl('/blog')}#blog`,
    url: canonicalUrl('/blog'),
    name: page.name,
    description: page.description,
    inLanguage: 'en',
    publisher: orgRef(),
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
