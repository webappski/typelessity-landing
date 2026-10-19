import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOME } from '../../pages/home/home.content';

// Schema *rendering* (does the JSON-LD reach <head>?) is proven by the Playwright smoke
// against the real SSR output. These node:test guards stay Angular-free — they derive from
// the shipped source text + the pure HOME content module — so they run in the fast pre-commit
// tier and fail loudly if an AEO-load-bearing field is silently dropped. (schemas.ts imports
// seo.service.ts, which pulls Angular's JIT-only PlatformLocation and cannot load under
// node:test; we assert against the source string instead — same derive-from-shipped-file
// principle as the neighbouring robots.spec / llms-pricing drift guards.)

const schemasSrc = readFileSync(new URL('./schemas.ts', import.meta.url), 'utf8');

test('softwareApplicationLd source carries description + featureList for AEO extraction', () => {
  const fn = schemasSrc.slice(schemasSrc.indexOf('function softwareApplicationLd'));
  const body = fn.slice(0, fn.indexOf('\nexport function') > -1 ? fn.indexOf('\nexport function') : fn.length);
  assert.ok(/applicationCategory:\s*'BusinessApplication'/.test(body), 'applicationCategory must be BusinessApplication');
  assert.ok(/\bdescription:\s*\n?\s*'/.test(body) || /\bdescription:\s*'/.test(body),
    'SoftwareApplication must carry a description field');
  assert.ok(/\bfeatureList:\s*\[/.test(body), 'SoftwareApplication must carry a featureList array');
});

// L2 (J9): Organization no longer says «sameAs Webappski and TypelessForm» (that reads as «the same thing»); the
// link to Webappski is the parent, and the parent is the node Webappski publishes about itself. typelessform.com
// stays only on the Person. The body of organizationLd is cut at the next `export` of any kind, so a helper or the
// Person constant placed after it is not read as part of it.
const exportBody = (name: string): string => {
  const at = schemasSrc.search(new RegExp(`export (?:function|const) ${name}\\b`));
  assert.ok(at > -1, `${name} is not exported from schemas.ts`);
  const rest = schemasSrc.slice(at + 1);
  const next = rest.search(/\nexport /);
  return rest.slice(0, next > -1 ? next : rest.length);
};

test('organizationLd source: no sameAs', () => {
  assert.ok(!/\bsameAs\b/.test(exportBody('organizationLd')), 'Organization must not carry sameAs');
});

test('organizationLd source: the parent is the real Webappski node, not #organization', () => {
  const body = exportBody('organizationLd');
  assert.ok(body.includes('https://webappski.com/#webappski-org'), 'parentOrganization must point at webappski.com/#webappski-org');
  assert.ok(!body.includes('https://webappski.com/#organization'), 'a node that webappski.com does not have');
  assert.ok(/parentOrganization[\s\S]{0,200}name:\s*'Webappski'/.test(body), 'parentOrganization must be Webappski');
});

test('typelessform.com stays only on the Person', () => {
  const person = exportBody('PERSON_ALEX_ISA');
  assert.ok(person.includes("'https://typelessform.com'"), 'the Person keeps typelessform.com (L2 leaves it, schema.org allows an official site)');
  assert.ok(!schemasSrc.replace(person, '').includes('typelessform.com'), 'typelessform.com appears outside the Person');
});

test('comparison section includes Cal.ai + Cal.com as columns, honest text-only cells', () => {
  const cols = HOME.comparison.columns as readonly string[];
  assert.ok(cols.includes('Cal.ai'), 'comparison must include a Cal.ai column');
  assert.ok(cols.includes('Cal.com'), 'comparison must include a Cal.com column');
  // Every row must have one cell per column (flat array indexed to columns) and no outbound links.
  for (const row of HOME.comparison.rows) {
    assert.equal(row.length, cols.length, `row "${row[0]}" cell count must match column count`);
    for (const cell of row) {
      assert.ok(typeof cell === 'string' && !cell.includes('<a '),
        `cell "${cell}" must be plain text with no outbound <a> link (R28)`);
    }
  }
});

test('a Cal.ai differentiation FAQ exists and honestly frames the layer difference', () => {
  const calai = HOME.faq.find((qa) => /Cal\.ai/i.test(qa.q));
  assert.ok(calai, 'a "differ from Cal.ai" FAQ must exist');
  assert.ok(/outbound/i.test(calai!.a) && /(inbound|widget)/i.test(calai!.a),
    'Cal.ai FAQ must honestly contrast outbound voice vs inbound widget');
});
