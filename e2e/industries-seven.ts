import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// The seven industry pages the site keeps (QUEUE L1б, ТЗ §3) and the 30 addresses it takes down — written out, not
// derived. A count read from `ALL_INDUSTRIES` agrees with a build made from `ALL_INDUSTRIES`, so an eighth page kept
// by mistake or a sixth lost would pass; these lists are the one thing the data, the sitemap, the select and the API
// are held against. Production code does not import this file. The derivation of RETIRED is in
// pending-review/2026-10-19/L1b/retired-derive.log (`git grep` at d0cbafe minus SEVEN, plus the clinics address).

export const SEVEN = [
  { slug: 'beauty-hair-salons', name: 'Hair salons', category: 'Beauty & Wellness' },
  { slug: 'hospitality-restaurants', name: 'Restaurants', category: 'Hospitality' },
  { slug: 'fitness-yoga-studios', name: 'Yoga & pilates studios', category: 'Fitness & Sports' },
  { slug: 'fitness-gyms', name: 'Gyms & fitness centers', category: 'Fitness & Sports' },
  { slug: 'automotive-driving-schools', name: 'Driving schools', category: 'Automotive' },
  { slug: 'automotive-repair', name: 'Auto repair shops', category: 'Automotive' },
  { slug: 'education-tutoring', name: 'Tutoring services', category: 'Education' },
] as const;

export const SEVEN_SLUGS: string[] = SEVEN.map((i) => i.slug);
export const SEVEN_CATEGORIES: string[] = [...new Set(SEVEN.map((i) => i.category))].sort();

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

/** Categories that exist no more, and the phrases that named them. `legal` alone is not here: «legal basis» is a fair use. */
export const RETIRED_CATEGORIES = ['Professional Services', 'Home Services', 'Real Estate', 'Pet Services'] as const;
export const RETIRED_PHRASES = ['legal practice', 'law firm', 'accounting', 'real estate', 'pet services', 'home services', 'professional services'] as const;

/** Names of the retired industries and categories as a case-insensitive pattern list (the page-text guard). */
export const RETIRED_TERMS: string[] = [
  ...RETIRED_INDUSTRIES.map((i) => i.name),
  ...RETIRED_CATEGORIES,
  ...RETIRED_PHRASES,
].map((s) => s.toLowerCase());

/** The nine static paths of the sitemap (home, how-it-works, pricing, industries, for-ai-agents, faq, about, blog, security). */
export const STATIC_PATH_COUNT = 9;

/** Posts the site publishes: one `.mdx` file each in src/assets/content/blog (counted on disk, not from the generated manifest). */
export function postCount(): number {
  return readdirSync(join(process.cwd(), 'src', 'assets', 'content', 'blog')).filter((f) => f.endsWith('.mdx')).length;
}

/** Addresses in sitemap.xml: the nine static paths, the seven industry pages, the posts. */
export function expectedSitemapCount(): number {
  return STATIC_PATH_COUNT + SEVEN.length + postCount();
}

/** Floor for the text files of dist (every sitemap address is a prerendered page; the 404 shell and the txt files come on top). */
export const EXPECTED_PAGES = STATIC_PATH_COUNT + SEVEN.length + postCount();
