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

// L4: the home page has no comparison table and no «differ from …» questions (HOME.comparison and the five vendor FAQs are gone;
// the vendor facts have one owner, the article best-ai-booking-widgets-2026). What these two guards held — honest text-only cells
// without outbound links, and the Cal.ai answer framed as outbound voice vs inbound widget — has no subject left on the site: the
// article does not name Cal.ai or Cal.com. The guard that remains is the one that keeps the home content free of them.
test('the home content carries no vendor comparison: no table, no Cal.ai or Cal.com, no «differ from» question', () => {
  assert.ok(!('comparison' in HOME), 'HOME.comparison is gone');
  assert.ok(!('faq' in HOME) || !Array.isArray((HOME as { faq?: unknown }).faq), 'the home content keeps no list of FAQ answers of its own');
  assert.doesNotMatch(JSON.stringify(HOME), /Cal\.ai|Cal\.com|differ from/i);
});
