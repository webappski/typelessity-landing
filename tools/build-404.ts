// Build-time, after `ng build`: turn the prerendered route /404 into dist/<project>/browser/404.html.
// vercel.json ends its `routes` with the filesystem phase and one route that answers 404 with this file for an address with no
// file behind it (SEO24-TYL-1; "framework": null drops the preset, and with it the SPA fallback to index.html).
// The folder 404/ is removed: left behind, /404 would be a real page that answers 200.

import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const projectName = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).name as string;
const browserDir = join(ROOT, 'dist', projectName, 'browser');
const prerendered = join(browserDir, '404', 'index.html');

if (!existsSync(prerendered)) {
  throw new Error(`${prerendered} missing — the route "404" must be prerendered (src/app/app.routes.server.ts).`);
}
renameSync(prerendered, join(browserDir, '404.html'));
rmSync(join(browserDir, '404'), { recursive: true, force: true });

console.log(`✓ 404: ${browserDir.replace(ROOT, '')}/404.html`);
