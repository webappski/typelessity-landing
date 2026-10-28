import { readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { getTransformedRoutes } from '@vercel/routing-utils';

// What Vercel does with vercel.json, read the way Vercel reads it. The platform does not run locally (FL-55), but the library it uses to turn
// `redirects`, `headers`, `trailingSlash` and `routes` into one ordered list of routes is published (@vercel/routing-utils, the package behind
// the `vercel` CLI). `effectiveRoutes` is that list; `respond` walks it for one path the way the platform does: a route that matches and has
// `continue` adds its headers and the walk goes on; a route that matches without `continue` ends it (a redirect, the 410, the 404). The patterns are the
// platform's own regular expressions, not a guess made from the `source` strings of the file (the readers before L13 anchored those strings by hand:
// `/assets/fonts/dm-sans.woff2`, a path that is not in dist, passed for months).
//
// THE FILESYSTEM PHASE (SEO24-TYL-1). vercel.json ends its `routes` with `{ "handle": "filesystem" }` and one route behind it that answers 404. Vercel, Build Output API
// «Configuration», «Handler route» (vercel.com/docs/build-output-api/configuration, last_updated 2026-07-27, read 2026-10-28): «The routing system has multiple
// phases. The `handle` value indicates the start of a phase. All following routes are only checked in that phase.» and, on the value, `'filesystem' // check matches after
// the filesystem misses`. So: a path with a file in dist/ is answered by the file, and only a path without one reaches the routes behind the phase. `respond(routes, path,
// filesystem)` walks it that way; without a `filesystem` it stops at the phase, as it did before (the readers that ask only about the rules in front of it).
// The same docs, vercel.com/docs/project-configuration/vercel-json «Deprecated route properties» (last_updated 2026-08-14): «`handle`: A special route type … that controls
// routing phases. Use `rewrites` instead, which checks the filesystem by default.» — deprecated, not removed; a rewrite cannot answer 404, so the file keeps it. The platform
// is the judge of whether it still does: `curl` on production after the push (card SEO24-TYL-1 §5), and `git revert` in the same hour if it does not.
// WHICH FILE ANSWERS A PATH is not in those docs. `distFilesystem` below follows the vercel CLI (vercel@52.0.0, dist/commands/dev/index.js:20760-20778, `findAsset`): the file
// of that name, else a file named `index.*` in the directory of that name — `pricing/index.html` answers `/pricing`. A model of the CLI, not of the platform; what the
// platform does is shown by production today: the 21 pages answer 200 (curl-probes-after-push.txt of L13, `/privacy` 200 from `privacy/index.html`).
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
  /** 308, 410, 404 … when a route ended the walk; undefined when the walk reached the filesystem phase (a file of dist/ answers). */
  status?: number;
  location?: string;
  dest?: string;
  /** Only when a `filesystem` was given: true when a file answered, false when the walk ended with neither a rule nor a file. */
  served?: boolean;
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

/** Does a file of the deployment answer this path? (`distFilesystem` for the real dist/; a set of names in a unit test.) */
export type Filesystem = (path: string) => boolean;

/**
 * The files of a build directory the way the vercel CLI looks them up (findAsset, see above): the file of that name, or a file named `index.<ext>` in the directory
 * of that name. `/` is the index of the directory itself. `index.csr.html` is not an index: its name without the last extension is `index.csr`. A name is matched exactly,
 * segment by segment: the disk of a developer's Mac ignores the case of a name and the platform's file lookup is taken to be exact, so `/HOW-IT-WORKS` has no file here.
 * `functions` are the addresses of the Vercel Functions of the project (api/contact.ts is `/api/contact`): they answer in the same phase. vercel.com/docs/project-configuration/vercel-json,
 * «rewrites» (last_updated 2026-08-14, read 2026-10-28): «precedence is given to the filesystem prior to rewrites being applied. Instead, you should rename your static file or Vercel Function.»
 * — a function is named as part of the filesystem there. That the legacy phase `handle: filesystem` takes a function too is not said in so many words: `curl -X POST …/api/contact` after the push.
 */
export function distFilesystem(browserDir: string, functions: string[] = []): Filesystem {
  const entries = (dir: string) => { try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; } };
  return (path) => {
    if (functions.includes(path)) return true;
    const segments = path.split('/').filter(Boolean);
    let dir = browserDir;
    for (const [i, segment] of segments.entries()) {
      const entry = entries(dir).find((e) => e.name === segment);
      if (!entry) return false;
      if (i === segments.length - 1 && entry.isFile()) return true;
      if (!entry.isDirectory()) return false;
      dir = join(dir, segment);
    }
    return entries(dir).some((e) => e.isFile() && basename(e.name, extname(e.name)) === 'index');
  };
}

export function respond(routes: VercelRoute[], path: string, filesystem?: Filesystem): Answer {
  const headers: Record<string, string> = {};
  for (const route of routes) {
    if (route.handle) {
      // The filesystem phase: a file of dist/ answers if there is one; if not, the walk goes on with the routes behind the phase. Without a filesystem to ask, or at any other
      // phase, it stops here — the readers that only ask what the rules in front of the phase do.
      if (route.handle !== 'filesystem' || !filesystem) return { headers };
      if (filesystem(path)) return { headers, served: true };
      continue;
    }
    const match = new RegExp(route.src ?? '$^').exec(path);
    if (!match) continue;
    for (const [name, value] of Object.entries(route.headers ?? {})) {
      headers[name.toLowerCase()] = value.replace(/\$(\d+)/g, (_, n: string) => match[Number(n)] ?? '');
    }
    if (route.continue) continue;
    return { status: route.status, location: headers['location'], dest: route.dest, headers, ...(filesystem ? { served: false } : {}) };
  }
  // No rule ended the walk. With a filesystem the platform serves the file after the rules when the file's phase was never named (a file with no `handle` in the list).
  return filesystem ? { headers, served: filesystem(path) } : { headers };
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
export function follow(routes: VercelRoute[], path: string, filesystem?: Filesystem): { answer: Answer; path: string; hops: number } {
  let current = path;
  for (let hops = 0; hops < 5; hops++) {
    const answer = respond(routes, current, filesystem);
    const redirects = answer.status !== undefined && answer.status >= 300 && answer.status < 400 && answer.location !== undefined;
    if (!redirects) return { answer, path: current, hops };
    current = answer.location!;
  }
  throw new Error(`${path}: redirect loop`);
}
