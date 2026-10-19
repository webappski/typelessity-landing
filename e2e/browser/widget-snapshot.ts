// Where the widget snapshot lives and what is in its manifest. Written by global-setup.ts once per run,
// read by fixtures.ts in every worker. Nothing here runs Playwright: it is plain Node.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** node_modules/.cache, not test-results/: that is Playwright's outputDir and its cleaning may remove a snapshot made in globalSetup. */
export const SNAPSHOT_DIR = join(process.cwd(), 'node_modules', '.cache', 'ty-widget-snapshot');
export const SNAPSHOT_DIST = join(SNAPSHOT_DIR, 'dist');
export const MANIFEST_FILE = join(SNAPSHOT_DIR, 'manifest.json');

export interface Manifest {
  sha256: string;
  /** Response headers of the widget origin, taken from packages/widget/vercel.json: `/widget.js` and `/fonts/(.*)`. */
  widgetHeaders: { script: Record<string, string>; fonts: Record<string, string> };
  /** woff2 file name -> the family `FONT_FACES` of the widget registers it under. */
  fontFamilyByFile: Record<string, string>;
  /** What the product API answers on an unknown domain, parsed from the product's source (F5). */
  api: { status: number; body: { error: string; code: string }; headers: Record<string, string> };
}

export function readManifest(): Manifest {
  if (!existsSync(MANIFEST_FILE)) {
    throw new Error(`нет снимка виджета: ${MANIFEST_FILE} — globalSetup не отработал (запускай через playwright.config.ts)`);
  }
  return JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')) as Manifest;
}
