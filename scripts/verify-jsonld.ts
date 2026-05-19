import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/typelessity-landing/browser';
const JSONLD_RE = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (entry === 'index.html') files.push(full);
  }
  return files;
}

const files = walk(DIST);
let totalBlocks = 0;
let parseErrors = 0;
const byType: Record<string, number> = {};
const errorPaths: string[] = [];

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(JSONLD_RE)) {
    totalBlocks++;
    try {
      const obj = JSON.parse(match[1].trim());
      const type = Array.isArray(obj) ? `Array(${obj.length})` : (obj['@type'] ?? 'unknown');
      byType[type] = (byType[type] ?? 0) + 1;
    } catch {
      parseErrors++;
      errorPaths.push(file);
    }
  }
}

console.log(`Files scanned:     ${files.length}`);
console.log(`JSON-LD blocks:    ${totalBlocks}`);
console.log(`Parse errors:      ${parseErrors}`);
console.log('By @type:');
for (const [t, n] of Object.entries(byType).sort(([, a], [, b]) => b - a)) {
  console.log(`  ${t.padEnd(24)} ${n}`);
}
if (parseErrors > 0) {
  console.log('\nFiles with errors:');
  for (const p of errorPaths.slice(0, 10)) console.log(`  ${p}`);
  process.exit(1);
}
