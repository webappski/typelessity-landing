// Editorial order of /blog (A45d, c8 2026-09-27). Every post was first published the day the posts
// entered this repo (2026-05-21), so the date alone cannot order the list. Newest first; on the
// same date the order below holds; a post missing from the list goes after the listed ones,
// alphabetically — a new post shows up without editing this list and never breaks the build.
export const EDITORIAL_ORDER: readonly string[] = [
  'best-ai-booking-beauty-salons-2026',
  'best-ai-booking-transfer-services-2026',
  'best-ai-booking-widgets-2026',
  'pricing-ai-products',
  'latency-budgets',
  'designing-for-ai-agents',
  'whisper-vs-webspeech',
  'gdpr-compliance',
  'cascade-corrections',
  '25-languages-one-prompt',
  'single-gpt-call',
];

interface Dated {
  readonly slug: string;
  readonly publishedAt: string;
}

export function compareEditorial(a: Dated, b: Dated): number {
  const byDate = b.publishedAt.localeCompare(a.publishedAt);
  if (byDate !== 0) return byDate;
  const ia = EDITORIAL_ORDER.indexOf(a.slug);
  const ib = EDITORIAL_ORDER.indexOf(b.slug);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.slug.localeCompare(b.slug);
}
