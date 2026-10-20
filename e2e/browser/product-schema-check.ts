// L4 B2(c): run by home-demo.pw.ts as `npx tsx e2e/browser/product-schema-check.ts` with a JSON list on stdin:
//   [{ "schema": "createSessionSchema" | "sendMessageSchema" | "saveConsentSchema", "body": <what the widget sent> }]
// and prints [{ ok, issues }] in the same order. The schemas are the product's own zod (packages/api/src/lib/schemas.ts of TY_PRODUCT_ROOT,
// default ~/Projects/typelessity): the widget's bodies are checked by the code that will receive them. A child process, because the product
// imports its workspace packages as ES modules, which Playwright's CommonJS loader cannot require.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

type Schema = { safeParse(v: unknown): { success: boolean; error?: { issues: unknown[] } } };
(async () => {
  const root = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
  const mod = (await import(join(root, 'packages/api/src/lib/schemas.ts'))) as Record<string, Schema>;
  const items = JSON.parse(readFileSync(0, 'utf8')) as { schema: string; body: unknown }[];
  const out = items.map(({ schema, body }) => {
    const s = mod[schema];
    if (!s) return { ok: false, issues: [`the product exports no ${schema}`] };
    const r = s.safeParse(body);
    return { ok: r.success, issues: r.success ? [] : r.error?.issues ?? [] };
  });
  process.stdout.write(JSON.stringify(out));
})().catch((e) => { process.stderr.write(String(e)); process.exit(1); });
