// The Content-Security-Policy values written in vercel.json. They sit in two shapes, and Vercel's schema fixes which is which (guard: src/app/discovery/vercel-schema.spec.ts):
//   headers[].headers  an array of { key, value }   (the block for every page)
//   routes[].headers   an object { "Header-Name": "value" }   (the 410 rule, L14)
// A reader that treated both as arrays broke when the rule took the object form it must have; this helper reads both, so the specs below read the file Vercel reads.

export interface VercelCspConfig {
  headers?: Array<{ headers?: Array<{ key: string; value: string }> }>;
  routes?: Array<{ headers?: Record<string, string> }>;
}

export function cspValues(config: VercelCspConfig): string[] {
  const fromBlocks = (config.headers ?? []).flatMap((b) => b.headers ?? []).filter((h) => h.key.toLowerCase() === 'content-security-policy').map((h) => h.value);
  const fromRoutes = (config.routes ?? []).flatMap((r) => Object.entries(r.headers ?? {})).filter(([name]) => name.toLowerCase() === 'content-security-policy').map(([, value]) => value);
  return [...fromBlocks, ...fromRoutes];
}
