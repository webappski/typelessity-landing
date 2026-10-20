import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// The industry addresses the site has taken down, written out — not derived. At L1б (19.10) 29 thin pages and the clinics address went; at L11
// (20.10, founder: «we do not need industries, they can be anything») the hub and the seven pages that were kept went too. All answer 410.
// The lists are the one thing the vercel.json rule, the sitemap, the dist and the form's endpoint are held against: a count read from the code
// that built the page agrees with the page. Production code does not import this file. The derivation of the 29 is in
// pending-review/2026-10-19/L1b/retired-derive.log (`git grep` at d0cbafe minus the seven, plus the clinics address).

/** The seven pages L1б kept and L11 took down (slug and name as the data had them at dd3c9d4). */
export const SEVEN_TAKEN_DOWN = [
  { slug: 'beauty-hair-salons', name: 'Hair salons' },
  { slug: 'hospitality-restaurants', name: 'Restaurants' },
  { slug: 'fitness-yoga-studios', name: 'Yoga & pilates studios' },
  { slug: 'fitness-gyms', name: 'Gyms & fitness centers' },
  { slug: 'automotive-driving-schools', name: 'Driving schools' },
  { slug: 'automotive-repair', name: 'Auto repair shops' },
  { slug: 'education-tutoring', name: 'Tutoring services' },
] as const;

export const SEVEN_SLUGS: string[] = SEVEN_TAKEN_DOWN.map((i) => i.slug);

/** The 29 pages that were in the data at d0cbafe and are gone, then the clinics address (a redirect before L1б). */
export const RETIRED_INDUSTRIES = [
  { slug: 'beauty-nail-salons', name: 'Nail salons' },
  { slug: 'beauty-spas', name: 'Spas & wellness centers' },
  { slug: 'beauty-tattoo-studios', name: 'Tattoo & piercing studios' },
  { slug: 'professional-legal', name: 'Law firms' },
  { slug: 'professional-accounting', name: 'Accounting & tax firms' },
  { slug: 'professional-financial-advisors', name: 'Financial advisors' },
  { slug: 'professional-coaching', name: 'Coaching & consulting' },
  { slug: 'fitness-personal-training', name: 'Personal training' },
  { slug: 'fitness-martial-arts', name: 'Martial arts schools' },
  { slug: 'fitness-sports-coaching', name: 'Tennis, golf & sports coaching' },
  { slug: 'home-cleaning', name: 'Cleaning services' },
  { slug: 'home-handyman', name: 'Handyman & home repair' },
  { slug: 'home-hvac', name: 'HVAC & plumbing' },
  { slug: 'home-landscaping', name: 'Landscaping & gardening' },
  { slug: 'home-moving', name: 'Moving companies' },
  { slug: 'automotive-detailing', name: 'Auto detailing' },
  { slug: 'automotive-test-drives', name: 'Dealership test drives' },
  { slug: 'education-language-schools', name: 'Language schools' },
  { slug: 'education-music-schools', name: 'Music schools & instructors' },
  { slug: 'education-test-prep', name: 'Test prep (SAT/IELTS/etc)' },
  { slug: 'hospitality-hotels', name: 'Hotels & B&Bs' },
  { slug: 'hospitality-event-venues', name: 'Event venues' },
  { slug: 'hospitality-tours', name: 'Tours & activities' },
  { slug: 'realestate-residential', name: 'Residential real estate' },
  { slug: 'realestate-commercial', name: 'Commercial real estate' },
  { slug: 'realestate-property-management', name: 'Property management' },
  { slug: 'pet-veterinary', name: 'Veterinary clinics' },
  { slug: 'pet-grooming', name: 'Pet grooming' },
  { slug: 'pet-training', name: 'Pet training' },
] as const;

export const RETIRED_SLUGS: string[] = [...RETIRED_INDUSTRIES.map((i) => i.slug), 'beauty-aesthetic-clinics'];

/** Every slug that had a page under /industries and answers 410 now: the 30 of L1б and the seven of L11 (37). */
export const GONE_SLUGS: string[] = [...RETIRED_SLUGS, ...SEVEN_SLUGS];

/**
 * The values the form's industry select sent before L11 (the seven slugs; the 30 were never in it). Frozen: they come from the old component
 * (contact-form.component.ts at dd3c9d4), not from today's BUSINESS_TYPES — a tab opened before the release still sends them.
 */
export const PRE_L11_SELECT_VALUES: string[] = [...SEVEN_SLUGS];

/** Categories that exist no more, and the phrases that named them. `legal` alone is not here: «legal basis» is a fair use. */
export const RETIRED_CATEGORIES = ['Professional Services', 'Home Services', 'Real Estate', 'Pet Services'] as const;
export const RETIRED_PHRASES = ['legal practice', 'law firm', 'accounting', 'real estate', 'pet services', 'home services', 'professional services'] as const;

/** Names of the retired industries and categories as a case-insensitive pattern list (the page-text guard). */
export const RETIRED_TERMS: string[] = [
  ...RETIRED_INDUSTRIES.map((i) => i.name),
  ...RETIRED_CATEGORIES,
  ...RETIRED_PHRASES,
].map((s) => s.toLowerCase());

/** The ten static paths of the sitemap (home, how-it-works, install, pricing, gdpr, for-ai-agents, faq, about, blog, security). */
export const STATIC_PATH_COUNT = 10;

/** Posts the site publishes: one `.mdx` file each in src/assets/content/blog (counted on disk, not from the generated manifest). */
export function postCount(): number {
  return readdirSync(join(process.cwd(), 'src', 'assets', 'content', 'blog')).filter((f) => f.endsWith('.mdx')).length;
}

/** Addresses in sitemap.xml: the ten static paths and the posts. */
export function expectedSitemapCount(): number {
  return STATIC_PATH_COUNT + postCount();
}

/** Floor for the text files of dist (every sitemap address is a prerendered page; the 404 shell and the txt files come on top). */
export const EXPECTED_PAGES = STATIC_PATH_COUNT + postCount();
