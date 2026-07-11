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

test('organizationLd source keeps the cross-product sameAs + parentOrganization chain', () => {
  assert.ok(schemasSrc.includes("'https://typelessform.com'"), 'sameAs must link TypelessForm (Link 2 reciprocity)');
  assert.ok(schemasSrc.includes("'https://webappski.com'"), 'sameAs must link Webappski');
  assert.ok(/parentOrganization[\s\S]{0,160}name:\s*'Webappski'/.test(schemasSrc),
    'parentOrganization must be Webappski');
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
