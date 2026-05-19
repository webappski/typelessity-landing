// industries/index.ts — barrel + helper for app routing
import { medicalDental } from './medical-dental';
import { industries as batch1 } from './industries-batch-1';
import { industriesBatch2 } from './industries-batch-2';
import { industriesBatch3 } from './industries-batch-3';
import type { IndustryContent } from '../types';

export const ALL_INDUSTRIES: IndustryContent[] = [
  medicalDental,
  ...batch1,
  ...industriesBatch2,
  ...industriesBatch3,
];

// Total: 1 + 14 + 14 + 14 = 43 industry pages
// (medical-dental detailed + 42 batched verticals)

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
