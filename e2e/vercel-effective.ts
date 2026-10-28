import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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
//
// CASE OF AN ADDRESS — three sources that disagree, and what production does (test-design L13-1, observed 2026-10-21 ≈08:50 UTC by the test-design judge, repeated by `curl -sI` at 11:38 UTC):
//   (1) Vercel docs, «Case sensitivity» (vercel.com/docs/project-configuration/vercel-json, read 21.10): with `routes` the `src` property is case-INsensitive;
//       for `redirects` and `headers` the `source` is case-sensitive.
//   (2) The vercel CLI dev router (commands/dev/index.js:16913-16916) compiles `src` with the `i` flag (unless isCaseSensitive) and also tries the path
//       without its leading `/`; `respond()` below does neither — it is case-sensitive and matches the path as given.
//   (3) Production: `curl -sI https://typelessity.com/INDUSTRIES` → 200 (the home page by the fallback of FL-92), not 410; `/industries` → 410. `/Industries/Home-Cleaning`
//       and `/LEGAL/PRIVACY` → 200, not 410/308. So the platform behaves like this model (case-sensitive), not like (1) or (2). No test asserts the case of the
//       answer; it is proved by a live `curl` after each release (mixed-case probes are in the list of HANDOFF), not by faith in the model. Do not compile with `i`.

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

/**
 * The ONE place that opens vercel.json: the project's file, or the copy LANDING_VERCEL_JSON points at (mutation runs, and the run on a candidate before it replaces the file).
 * A reader asks what the site answers (`respond`, `follow`, `matching`), not what keys the file has: the keys are one way to write the rules, the list of
 * routes below is what the platform runs, and it is the same list whichever way the file is written. src/app/discovery/vercel-readers.spec.ts fails on a spec that opens
 * the file on its own. Relative to the working directory: `npm test`, the git hooks and playwright all start at the root of the repo.
 */
export function loadVercelConfig(): Record<string, unknown> {
  const path = process.env['LANDING_VERCEL_JSON'] ? resolve(process.env['LANDING_VERCEL_JSON']) : join(process.cwd(), 'vercel.json');
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

/** The rules of the file in the order the platform runs them. Throws when no rule sets a Content-Security-Policy: every page of the site has one, and a reader that took an
 *  empty list for the file would pass over «no redirect catches X» without having looked at anything. */
export function loadRoutes(): VercelRoute[] {
  const routes = effectiveRoutes(loadVercelConfig());
  const setsCsp = routes.some((r) => Object.keys(r.headers ?? {}).some((k) => k.toLowerCase() === 'content-security-policy'));
  if (!setsCsp) throw new Error('vercel.json gives no rule that sets a Content-Security-Policy: the readers would pass over an empty list');
  return routes;
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
