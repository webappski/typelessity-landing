// Build-time, after `ng build`: turn the prerendered route /404 into dist/<project>/browser/404.html.
// Vercel serves a file called 404.html, from the root of the output directory, for an address with no
// file behind it (vercel.json sets "framework": null, so there is no SPA fallback to index.html).
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
