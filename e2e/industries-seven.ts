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

/** The eleven static paths of the sitemap (home, how-it-works, install, pricing, gdpr, industries, for-ai-agents, faq, about, blog, security). */
export const STATIC_PATH_COUNT = 11;

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

// L8 (2026-10-20, card D8): what each of the seven pages says, written out. The tests hold the built page against these
// literals, not against `ALL_INDUSTRIES`: a page made from the data agrees with the data whatever the data says, so a
// description copied from the wrong entry would pass. Quotes are the customer's own sentence (card D1); `null` where the
// old headline was not one. `exampleLang` is the language of the example conversation (`lang` in the data).
export const SEVEN_PAGES = [
  {
    slug: 'beauty-hair-salons', name: 'Hair salons', audience: 'hair salons',
    description: 'Online booking for hair salons by chat: clients say “balayage and a trim Tuesday morning”, the assistant fills in the details and sends you the request.',
    quote: 'I want a balayage, can you fit me in Saturday?', capsuleStart: 'Typelessity adds online booking by chat to your salon’s website.',
    article: { slug: 'best-ai-booking-beauty-salons-2026' }, deep: true, exampleLang: 'es',
  },
  {
    slug: 'hospitality-restaurants', name: 'Restaurants', audience: 'restaurants',
    description: 'Table reservations by chat on your restaurant’s website: guests say “table for 4 on Saturday at 8” and the assistant sends you the request.',
    quote: 'Table for 4 on Saturday at 8', capsuleStart: 'Typelessity adds table reservations by chat to your restaurant’s website.',
    article: { slug: 'best-ai-booking-widgets-2026' }, deep: true, exampleLang: 'en',
  },
  {
    slug: 'fitness-yoga-studios', name: 'Yoga & pilates studios', audience: 'yoga and pilates studios',
    description: 'Class booking by chat for yoga and pilates studios: students name the class, level and time, and the assistant sends you the request.',
    quote: 'Do you have a beginner class on weekday mornings?', capsuleStart: 'Typelessity adds class booking by chat to your studio’s website.',
    article: { slug: 'best-ai-booking-widgets-2026' }, deep: true, exampleLang: 'en',
  },
  {
    slug: 'fitness-gyms', name: 'Gyms & fitness centers', audience: 'gyms',
    description: 'Tour and trial-class requests by chat for gyms: prospects say what they want, and the assistant sends your team the request with the details.',
    quote: null, capsuleStart: 'Typelessity adds tour and trial-class requests by chat to your gym’s website.',
    article: { slug: 'best-ai-booking-widgets-2026' }, deep: false, exampleLang: 'en',
  },
  {
    slug: 'automotive-driving-schools', name: 'Driving schools', audience: 'driving schools',
    description: 'Lesson booking by chat for driving schools: students name the licence, package and instructor, and the assistant sends you the request.',
    quote: null, capsuleStart: 'Typelessity adds lesson booking by chat to your driving school’s website.',
    article: { slug: 'best-ai-booking-widgets-2026' }, deep: true, exampleLang: 'pl',
  },
  {
    slug: 'automotive-repair', name: 'Auto repair shops', audience: 'auto repair shops',
    description: 'Online booking for auto repair shops by chat: drivers describe the symptom and the car, and the assistant sends you a request with make, model and year.',
    quote: 'My check engine light is on', capsuleStart: 'Typelessity adds online booking by chat to your repair shop’s website.',
    article: { slug: 'best-ai-booking-widgets-2026' }, deep: true, exampleLang: 'en',
  },
  {
    slug: 'education-tutoring', name: 'Tutoring services', audience: 'tutoring services',
    description: 'Tutoring requests by chat: parents describe subject, grade and schedule in one message, and the assistant sends you the request with the details.',
    quote: null, capsuleStart: 'Typelessity adds tutoring requests by chat to your agency’s website.',
    article: { slug: 'best-ai-booking-widgets-2026' }, deep: false, exampleLang: 'en',
  },
] as const;

/** English names of the example languages the data uses, for the sentence «the example above is in <language>». */
export const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish', pl: 'Polish' };

/** The demo websites (card D6). The probe of 20.10 found no widget on either: no page links to them until it does. */
export const DEMO_HOSTS = ['glow-studio-demo.netlify.app', 'autopro-service-demo.netlify.app'] as const;

/** The order the site lists the seven in (the order of the data: hub, home grid, «Other industries»). The written list above follows SEVEN. */
export const SITE_ORDER: string[] = ['beauty-hair-salons', 'fitness-gyms', 'fitness-yoga-studios', 'automotive-repair', 'automotive-driving-schools', 'education-tutoring', 'hospitality-restaurants'];
