// The one `test` every *.pw.ts imports (L3 F6; e2e/browser-fixture-guard.spec.ts holds that no spec imports from
// '@playwright/test' directly). It re-exports everything else of Playwright, so types (Page, Locator) come from here too.
//
// An automatic fixture puts ONE context.route on every test's browser context. The predicate is «the host is not
// localhost and not 127.0.0.1»; what it catches is answered, never sent out:
//   - the widget origin (WIDGET_SCRIPT_URL) -> the files of the snapshot made by global-setup.ts, with the headers of
//     packages/widget/vercel.json (CORS: without them the module and FontFace fail on CORS, not on CSP);
//   - the API origin (WIDGET_API_URL)       -> the answer of the product API on a domain it does not know, parsed from its
//     source (F5). The real API answers 404 with a JSON body and CORS headers; abort() would make the widget draw another branch;
//   - any other host                        -> aborted and written to `stubs.external`; the fixture then fails the test.
// Without this every spec that opens `/` would load the live widget.js and call the live API from every pre-push.
//
// Page-level page.route() in a spec takes precedence over this context route (Playwright, BrowserContext.route), so
// specs that stub their own hosts keep working. Origins are imported from the product code the site ships, not typed here.
// A context a spec makes itself (browser.newContext) is not covered; the guard spec says so.
import { test as base, expect, type Route } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { WIDGET_API_URL, WIDGET_SCRIPT_URL } from '../../src/app/core/integrations/embed-snippet';
import { SNAPSHOT_DIST, readManifest, type Manifest } from './widget-snapshot';

export * from '@playwright/test';

export const WIDGET_ORIGIN = new URL(WIDGET_SCRIPT_URL).origin;
export const API_ORIGIN = new URL(WIDGET_API_URL).origin;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

/** What the routes saw during one test. */
export interface Stubs {
  /** Times /widget.js was served. */
  widgetScriptRequests: number;
  /** Fonts served by the widget origin, with the family the widget registers the file under. */
  widgetFonts: { file: string; family: string; status: number }[];
  /** Other paths asked of the widget origin (answered 404). */
  widgetOther: string[];
  /** Requests that reached the API origin (a request that got here passed connect-src: Chromium applies CSP before routing). */
  apiRequests: { method: string; path: string; origin: string | undefined; status: number }[];
  /** Origins that were refused. Must be empty at the end of a test. */
  external: string[];
}

let manifest: Manifest | undefined;
const getManifest = () => (manifest ??= readManifest());

async function serveWidget(route: Route, url: URL, stubs: Stubs): Promise<void> {
  const m = getManifest();
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: m.widgetHeaders.script });
    return;
  }
  if (url.pathname === '/widget.js') {
    stubs.widgetScriptRequests++;
    await route.fulfill({
      status: 200,
      headers: { ...m.widgetHeaders.script, 'Content-Type': 'text/javascript; charset=utf-8' },
      body: readFileSync(join(SNAPSHOT_DIST, 'widget.js')),
    });
    return;
  }
  const font = url.pathname.match(/^\/fonts\/([^/]+\.woff2)$/)?.[1];
  if (font && existsSync(join(SNAPSHOT_DIST, 'fonts', basename(font)))) {
    stubs.widgetFonts.push({ file: font, family: m.fontFamilyByFile[font] ?? '?', status: 200 });
    await route.fulfill({
      status: 200,
      headers: { ...m.widgetHeaders.fonts, 'Content-Type': 'font/woff2' },
      body: readFileSync(join(SNAPSHOT_DIST, 'fonts', basename(font))),
    });
    return;
  }
  stubs.widgetOther.push(url.pathname);
  await route.fulfill({ status: 404, headers: m.widgetHeaders.script, body: '' });
}

async function serveApi(route: Route, url: URL, stubs: Stubs): Promise<void> {
  const m = getManifest();
  const request = route.request();
  if (request.method() === 'OPTIONS') {
    stubs.apiRequests.push({ method: 'OPTIONS', path: url.pathname, origin: request.headers()['origin'], status: 204 });
    await route.fulfill({ status: 204, headers: m.api.headers });
    return;
  }
  stubs.apiRequests.push({ method: request.method(), path: url.pathname, origin: request.headers()['origin'], status: m.api.status });
  await route.fulfill({ status: m.api.status, headers: m.api.headers, body: JSON.stringify(m.api.body) });
}

export const test = base.extend<{ stubs: Stubs }>({
  stubs: [
    async ({ context }, use) => {
      const stubs: Stubs = { widgetScriptRequests: 0, widgetFonts: [], widgetOther: [], apiRequests: [], external: [] };
      await context.route(
        (url) => /^https?:$/.test(url.protocol) && !LOCAL_HOSTS.has(url.hostname),
        async (route) => {
          const url = new URL(route.request().url());
          if (url.origin === WIDGET_ORIGIN) return serveWidget(route, url, stubs);
          if (url.origin === API_ORIGIN) return serveApi(route, url, stubs);
          stubs.external.push(url.origin);
          await route.abort('blockedbyclient');
        },
      );
      await use(stubs);
      expect(stubs.external, 'the page reached a host that is neither localhost, the widget origin nor the API origin').toEqual([]);
    },
    { auto: true },
  ],
});
