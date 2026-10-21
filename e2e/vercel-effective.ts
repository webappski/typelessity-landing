import { getTransformedRoutes } from '@vercel/routing-utils';

// What Vercel does with vercel.json, read the way Vercel reads it. The platform does not run locally (FL-55), but the library it uses to turn
// `redirects`, `headers`, `trailingSlash` and `routes` into one ordered list of routes is published (@vercel/routing-utils, the package behind
// the `vercel` CLI). `effectiveRoutes` is that list; `respond` walks it for one path up to the filesystem phase — the point where a file of
// dist/ answers — the way the platform does: a route that matches and has `continue` adds its headers and the walk goes on; a route that
// matches without `continue` ends it (a redirect, or the 410). The patterns are the platform's own regular expressions, not a guess made
// from the `source` strings of the file (the readers before L13 anchored those strings by hand: `/assets/fonts/dm-sans.woff2`, a path that
// is not in dist, passed for months).
//
// A model of the order and of the matching, not of the platform: whether a deployment answers 410 or 404 is proved by `curl` on production
// after the push (card L13). LANDING_VERCEL_JSON points a reader at another copy of vercel.json (mutation runs).

export interface VercelRoute {
  src?: string;
  dest?: string;
  status?: number;
  continue?: boolean;
  headers?: Record<string, string>;
  handle?: string;
}

export interface Answer {
  /** 308, 410 … when a route ended the walk; undefined when the walk reached the filesystem phase (a file of dist/ answers). */
  status?: number;
  location?: string;
  dest?: string;
  /** every header the routes passed on the way added, later ones over earlier ones (names lower-cased) */
  headers: Record<string, string>;
}

export function effectiveRoutes(config: object): VercelRoute[] {
  const { routes, error } = getTransformedRoutes(config as never);
  if (error) throw new Error(`getTransformedRoutes rejects vercel.json: ${error.message}`);
  return (routes ?? []) as VercelRoute[];
}

export function respond(routes: VercelRoute[], path: string): Answer {
  const headers: Record<string, string> = {};
  for (const route of routes) {
    if (route.handle) return { headers }; // the filesystem phase: a file answers
    const match = new RegExp(route.src ?? '$^').exec(path);
    if (!match) continue;
    for (const [name, value] of Object.entries(route.headers ?? {})) {
      headers[name.toLowerCase()] = value.replace(/\$(\d+)/g, (_, n: string) => match[Number(n)] ?? '');
    }
    if (route.continue) continue;
    return { status: route.status, location: headers['location'], dest: route.dest, headers };
  }
  return { headers };
}

/** The routes of the pre-filesystem phase whose pattern takes the path, in order (a probe that two rules meet in is a rule that can disagree with itself). */
export function matching(routes: VercelRoute[], path: string): VercelRoute[] {
  const hit: VercelRoute[] = [];
  for (const route of routes) {
    if (route.handle) break;
    if (new RegExp(route.src ?? '$^').test(path)) hit.push(route);
    if (hit.at(-1) === route && !route.continue) break;
  }
  return hit;
}

/** The answer after redirects are followed (at most 5 hops): the status of the last route, the path it ended on and the hops. */
export function follow(routes: VercelRoute[], path: string): { answer: Answer; path: string; hops: number } {
  let current = path;
  for (let hops = 0; hops < 5; hops++) {
    const answer = respond(routes, current);
    const redirects = answer.status !== undefined && answer.status >= 300 && answer.status < 400 && answer.location !== undefined;
    if (!redirects) return { answer, path: current, hops };
    current = answer.location!;
  }
  throw new Error(`${path}: redirect loop`);
}
