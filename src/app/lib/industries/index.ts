// industries/index.ts — barrel + helper for app routing
import { industries as batch1 } from './industries-batch-1';
import { industriesBatch2 } from './industries-batch-2';
import { industriesBatch3 } from './industries-batch-3';
import type { IndustryContent } from '../types';

export const ALL_INDUSTRIES: IndustryContent[] = [
  ...batch1,
  ...industriesBatch2,
  ...industriesBatch3,
];

// Total: 1 + 4 + 2 = 7 industry pages (L1б, 2026-10-19: 29 thin pages were taken down and answer 410; the cosmetic-clinic
// page went earlier, it invited health data, A45e). e2e/industries-seven.ts holds the written list the tests check this against.

export function getIndustryBySlug(slug: string): IndustryContent | undefined {
  return ALL_INDUSTRIES.find((i) => i.slug === slug);
}

export function getAllIndustrySlugs(): string[] {
  return ALL_INDUSTRIES.map((i) => i.slug);
}

export function getIndustriesByCategory(): Record<string, IndustryContent[]> {
  const grouped: Record<string, IndustryContent[]> = {};
  for (const ind of ALL_INDUSTRIES) {
    if (!grouped[ind.category]) grouped[ind.category] = [];
    grouped[ind.category].push(ind);
  }
  return grouped;
}
