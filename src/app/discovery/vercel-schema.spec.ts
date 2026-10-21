import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// L14 (2026-10-21): the 410 rule of vercel.json carried `headers` as an array of {key, value}. That is the shape of the top-level
// `headers` block, not of `routes[].headers`, which Vercel types as an object { "Header-Name": "value" }; the platform rejects the
// file, so the push of the batch would have failed at deploy. No test read the file against the platform's own schema — the guard
// of L1b compared the rule with the other block, both wrong the same way. This guard compiles Vercel's published schema
// (e2e/fixtures/vercel.schema.json, fetched 21.10.2026, date in vercel.schema.fetched.txt) with ajv and validates the WHOLE file.
// LANDING_VERCEL_JSON points it at another copy of vercel.json (the mutation run feeds it the array form; it must go red).

const require = createRequire(import.meta.url);
const Ajv = require('ajv') as new (o: object) => { compile: (s: object) => ((d: unknown) => boolean) & { errors?: Array<{ instancePath: string; message?: string }> | null } };

const ROOT = new URL('../../../', import.meta.url);
const schema = JSON.parse(readFileSync(new URL('e2e/fixtures/vercel.schema.json', ROOT), 'utf8')) as Record<string, unknown>;
delete schema['$schema']; // draft-04 marker: ajv 8 knows draft-07 and later; the keywords used are the same
const validate = new Ajv({ strict: false, allErrors: true }).compile(schema);
const vercel = JSON.parse(readFileSync(process.env['LANDING_VERCEL_JSON'] ?? new URL('vercel.json', ROOT), 'utf8')) as { routes: Array<Record<string, unknown>> };

test('the whole of vercel.json is valid against the schema Vercel publishes', () => {
  const ok = validate(vercel);
  const where = (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`);
  assert.ok(ok, `vercel.json breaks the Vercel schema:\n${where.join('\n')}`);
});

test('routes[].headers is an object of name to string, never an array (the form the 410 rule had)', () => {
  for (const [i, r] of vercel.routes.entries()) {
    if (r['headers'] === undefined) continue;
    assert.equal(Array.isArray(r['headers']), false, `routes[${i}].headers is an array; Vercel wants { "Header-Name": "value" }`);
    assert.equal(typeof r['headers'], 'object', `routes[${i}].headers is not an object`);
    for (const [k, v] of Object.entries(r['headers'] as Record<string, unknown>)) assert.equal(typeof v, 'string', `routes[${i}].headers.${k} is not a string`);
  }
});

test('the 410 rule fields status and dest are among the route fields the schema allows', () => {
  const route = (schema['properties'] as { routes: { items: { anyOf: Array<{ properties?: Record<string, { type?: string; minimum?: number; maximum?: number }> }> } } }).routes.items.anyOf[0].properties!;
  assert.equal(route['status'].type, 'integer');
  assert.ok(route['status'].minimum! <= 410 && 410 <= route['status'].maximum!, 'the schema takes no 410');
  assert.ok(route['dest'], 'the schema has no dest field in a route');
  const rule = vercel.routes.find((r) => r['status'] === 410)!;
  assert.equal(rule['dest'], '/404.html');
});
