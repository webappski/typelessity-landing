// Playwright globalSetup, once per run (L3 F5, F6, F16).
//
// 1. The widget the landing embeds is NOT built here. Its published build (packages/widget/dist of the product repo,
//    read only, R60) is copied into node_modules/.cache/ty-widget-snapshot/, so a rebuild of the product by another
//    writer in the middle of a run cannot change the input. The sha256 of widget.js goes to the run log.
//    No snapshot (the folder or widget.js is missing) fails the run with a text, it never skips: a cloud session
//    without a clone of the product has a red e2e:browser here, by design (F16).
// 2. What the product API answers on a domain it does not know is READ from the product's source, not written down
//    here (R67 item 3): the 404 tuple of by-domain/route.ts, the body shape of ApiError.toJSON and the CORS headers
//    of the middleware. If the source stops saying one thing in one shape, the run fails and tells where to look.
// 3. The CORS headers of the widget origin and the family of every font file are read the same way.
//
// Environment: TY_PRODUCT_ROOT (default ~/Projects/typelessity), TY_WIDGET_DIST (default <root>/packages/widget/dist).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { MANIFEST_FILE, SNAPSHOT_DIR, SNAPSHOT_DIST, type Manifest } from './widget-snapshot';

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
const WIDGET_DIST = process.env['TY_WIDGET_DIST'] ?? join(PRODUCT_ROOT, 'packages', 'widget', 'dist');

function readProduct(rel: string): string {
  const file = join(PRODUCT_ROOT, rel);
  if (!existsSync(file)) {
    throw new Error(`нет исходника продукта: ${file}; задай TY_PRODUCT_ROOT или клонируй ~/Projects/typelessity`);
  }
  return readFileSync(file, 'utf8');
}

/** The one 404 the by-domain route throws: every `new ApiError('<message>', 404, '<CODE>')` in it, as a unique set. */
function parseNotFound(): { status: number; message: string; code: string } {
  const src = readProduct('packages/api/src/app/api/config/by-domain/route.ts');
  const tuples = [...src.matchAll(/new\s+ApiError\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*404\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)].map((m) => `${m[2]}\u0000${m[1]}`);
  const unique = [...new Set(tuples)];
  if (unique.length !== 1) {
    throw new Error(`by-domain/route.ts изменился — сверь фикстуру: нашёл ${unique.length} разных 404-кортежей, ожидался ровно один`);
  }
  const [code, message] = unique[0]!.split('\u0000');
  return { status: 404, message: message!, code: code! };
}

/** ApiError.toJSON returns exactly `{ error: this.message, code: this.code }`; the body of the answer is built to that shape. */
function assertErrorBodyShape(): void {
  const src = readProduct('packages/api/src/lib/errors.ts');
  const klass = src.match(/export class ApiError[\s\S]*?\n\}\n/)?.[0] ?? '';
  const literal = klass.match(/toJSON\(\)[^{]*\{\s*return\s*\{([^}]*)\}/)?.[1] ?? '';
  const pairs = literal.split(',').map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (pairs.join('|') !== 'error: this.message|code: this.code') {
    throw new Error('errors.ts изменился — сверь фикстуру: ApiError.toJSON больше не { error, code }');
  }
}

/** CORS of the public /api/* routes: the wildcard origin, the methods and ALLOWED_HEADERS of the middleware. */
function parseCors(): Record<string, string> {
  const src = readProduct('packages/api/src/middleware.ts');
  const headers = src.match(/const ALLOWED_HEADERS =\s*'([^']+)'/)?.[1];
  const methods = src.match(/'Access-Control-Allow-Methods':\s*'([^']+)'/)?.[1];
  const wildcard = /const allowOrigin = isAdmin[\s\S]*?:\s*'\*'\s*;/.test(src);
  if (!headers || !methods || !wildcard) {
    throw new Error('middleware.ts изменился — сверь фикстуру: не нашёл ALLOWED_HEADERS, Allow-Methods или общий Allow-Origin');
  }
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': methods, 'Access-Control-Allow-Headers': headers, Vary: 'Origin' };
}

/** Headers the widget origin sends for /widget.js and /fonts/(.*), from packages/widget/vercel.json. */
function parseWidgetHeaders(): Manifest['widgetHeaders'] {
  const json = JSON.parse(readProduct('packages/widget/vercel.json')) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
  const pick = (source: string): Record<string, string> => {
    const rule = json.headers.find((h) => h.source === source);
    if (!rule) throw new Error(`packages/widget/vercel.json: нет правила ${source} — сверь фикстуру`);
    return Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
  };
  const out = { script: pick('/widget.js'), fonts: pick('/fonts/(.*)') };
  for (const [name, h] of Object.entries(out)) {
    if (h['Access-Control-Allow-Origin'] !== '*') throw new Error(`packages/widget/vercel.json: у ${name} нет Access-Control-Allow-Origin: * — без него модуль и FontFace падают по CORS`);
  }
  return out;
}

/** [family, weight, file, range] rows of FONT_FACES in the widget source -> file name -> family. */
function parseFontFamilies(distFonts: string): Record<string, string> {
  const src = readProduct('packages/widget/src/lib/fonts.ts');
  const map: Record<string, string> = {};
  for (const m of src.matchAll(/\[\s*'([^']+)'\s*,\s*'[^']*'\s*,\s*'([^']+\.woff2)'/g)) map[m[2]!] = m[1]!;
  if (Object.keys(map).length === 0) throw new Error('packages/widget/src/lib/fonts.ts изменился — сверь фикстуру: FONT_FACES не разобран');
  const missing = Object.keys(map).filter((file) => !existsSync(join(distFonts, file)));
  if (missing.length) throw new Error(`fonts.ts и ${distFonts} разошлись: нет файлов ${missing.join(', ')}`);
  return map;
}

export default async function globalSetup(): Promise<void> {
  if (!existsSync(join(WIDGET_DIST, 'widget.js'))) {
    throw new Error(`нет снимка виджета: ${WIDGET_DIST}; задай TY_WIDGET_DIST или клонируй ~/Projects/typelessity`);
  }
  rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  cpSync(WIDGET_DIST, SNAPSHOT_DIST, { recursive: true, filter: (src) => !src.endsWith('.map') });
  const snapshotFonts = join(SNAPSHOT_DIST, 'fonts');
  if (!existsSync(snapshotFonts) || readdirSync(snapshotFonts).length === 0) {
    throw new Error(`нет снимка виджета: в ${WIDGET_DIST} нет fonts/; задай TY_WIDGET_DIST или клонируй ~/Projects/typelessity`);
  }

  const sha256 = createHash('sha256').update(readFileSync(join(SNAPSHOT_DIST, 'widget.js'))).digest('hex');
  assertErrorBodyShape();
  const notFound = parseNotFound();
  const manifest: Manifest = {
    sha256,
    widgetHeaders: parseWidgetHeaders(),
    fontFamilyByFile: parseFontFamilies(snapshotFonts),
    api: {
      status: notFound.status,
      body: { error: notFound.message, code: notFound.code },
      headers: { ...parseCors(), 'Content-Type': 'application/json' },
    },
  };
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`widget.js sha256 ${sha256}`);
}
