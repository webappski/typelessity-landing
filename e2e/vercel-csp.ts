import type { VercelRoute } from './vercel-effective';

// The Content-Security-Policy values vercel.json sets, read from the routes the platform runs (e2e/vercel-effective.ts), not from the keys of the file: the block for
// every page and the two 410 rules each end up as a route with the header, however the file is written. A policy written three times is three values here.
export function cspValues(routes: VercelRoute[]): string[] {
  return routes.flatMap((r) => Object.entries(r.headers ?? {})).filter(([name]) => name.toLowerCase() === 'content-security-policy').map(([, value]) => value);
}
