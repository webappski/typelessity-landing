import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { CLAIM_CLASSES, countClaims } from './claims-dictionary';
import { WIDGET_API_URL } from '../src/app/core/integrations/embed-snippet';

// L4 C1 (card D6, R67 item 3): the SEAM between the home-page demo (a mock of the product API that the REAL widget talks to) and the product.
// Nothing here is a list this file retypes from the demo: every product-side value is READ from the product's source by name (never by line),
// every demo-side value is read from the demo modules or from what the interceptor answers when it is called. The product is at
// TY_PRODUCT_ROOT (default ~/Projects/typelessity); without it the run fails with a text — it never skips.
//   (a) the paths the widget calls = the paths the interceptor answers + the ones it refuses on purpose; no path in both; every answered
//       path is answered (not «NOT_MOCKED») and every refused path gives 404, called on a live session
//   (b) the states the mock returns are states of the product      (c) policyVersion and the storage keys are the product's
//   (d) the vocabulary K1–K14 over every exported string of the demo (the HTML guard cannot see text drawn in a shadow root)
//   (e) every selector the controller reads in the widget's shadow DOM exists in the widget's sources
//   (f) the config the mock serves is a WidgetConfig of the product, in the shape toPublicConfig gives     (g) the scenarios are all there

const PRODUCT_ROOT = process.env['TY_PRODUCT_ROOT'] ?? join(homedir(), 'Projects', 'typelessity');
const DEMO_DIR = join(process.cwd(), 'src/app/pages/home/demo');

function productPath(rel: string): string {
  const file = join(PRODUCT_ROOT, rel);
  if (!existsSync(file)) throw new Error(`нет исходника продукта: ${file}; задай TY_PRODUCT_ROOT или клонируй ~/Projects/typelessity (home-demo-contract не пропускается)`);
  return file;
}
const readProduct = (rel: string): string => readFileSync(productPath(rel), 'utf8');
const readDemo = (name: string): string => readFileSync(join(DEMO_DIR, name), 'utf8');

/** Non-test .ts files of a product folder, recursively. */
function productSources(rel: string): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { if (name !== '__tests__' && name !== 'node_modules') walk(full); }
      else if (name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.spec.ts')) out.push({ file: full.slice(PRODUCT_ROOT.length + 1), text: readFileSync(full, 'utf8') });
    }
  };
  walk(productPath(rel));
  return out;
}

// ── the demo modules: loaded here, and when they are not there the test says so (the cause of red before L4) ─────────────────────────
type ScriptMod = typeof import('../src/app/pages/home/demo/demo-script');
type MockMod = typeof import('../src/app/pages/home/demo/demo-mock');
type LabelsMod = typeof import('../src/app/pages/home/demo/demo-labels');
async function demo(): Promise<{ script: ScriptMod; mock: MockMod; labels: LabelsMod }> {
  try {
    const [script, mock, labels] = await Promise.all([
      import('../src/app/pages/home/demo/demo-script'),
      import('../src/app/pages/home/demo/demo-mock'),
      import('../src/app/pages/home/demo/demo-labels'),
    ]);
    return { script, mock, labels };
  } catch (e) {
    assert.fail(`демо нет: src/app/pages/home/demo/{demo-script,demo-mock,demo-labels}.ts не загружаются (${String((e as Error).message).split('\n')[0]})`);
  }
}

/** A fetch that records what reached it: the interceptor must pass everything that is not the demo origin to this. */
function recorder(): { fetch: typeof fetch; seen: string[] } {
  const seen: string[] = [];
  const f = (async (input: RequestInfo | URL) => { seen.push(String(typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url)); return new Response('passed', { status: 200 }); }) as typeof fetch;
  return { fetch: f, seen };
}

// ── what the widget calls: every `${…}/api/…` of its sources, with `${…}` written `:p` ─────────────────────────────────────────────────
function widgetPaths(): Set<string> {
  const out = new Set<string>();
  for (const { text } of productSources('packages/widget/src')) {
    for (const m of text.matchAll(/`\$\{[^}]*\}(\/api\/[^`?]*)/g)) out.add(m[1]!.replace(/\$\{[^}]*\}/g, ':p'));
  }
  return out;
}

test('C1(pre) the demo modules load in Node: script, mock and labels', async () => {
  const { script, mock, labels } = await demo();
  assert.ok(Object.keys(script.SCEN_BASE).length >= 4, 'the scripted scenarios are not exported');
  assert.equal(mock.DEMO_API_ORIGIN, labels.DEMO_API_ORIGIN, 'the mock and the labels name different origins');
  assert.equal(labels.DEMO_API_ORIGIN, 'https://demo.invalid', 'the demo origin is a name that cannot resolve (RFC 6761)');
});

test('C1(a) the paths of the widget = the paths the interceptor answers + the ones it refuses on purpose; no path in both', async () => {
  const { mock } = await demo();
  const product = widgetPaths();
  assert.ok(product.size >= 12, `only ${product.size} widget paths were read from the product sources — the extraction broke: ${[...product].join(', ')}`);
  const answered = new Set(mock.ANSWERED_PATHS);
  const refused = new Set(mock.INTENTIONAL_404);
  const both = [...answered].filter((p) => refused.has(p));
  assert.deepEqual(both, [], 'a path is in both lists: ANSWERED_PATHS and INTENTIONAL_404');
  const known = new Set([...answered, ...refused]);
  assert.deepEqual([...product].filter((p) => !known.has(p)).sort(), [], 'the widget calls a path the interceptor knows nothing about (add it to ANSWERED_PATHS or INTENTIONAL_404)');
  assert.deepEqual([...known].filter((p) => !product.has(p)).sort(), [], 'the interceptor lists a path the widget does not call');
});

/** A concrete address for a path of the lists: `:p` becomes the id the walk below made for it. */
function concrete(path: string, ids: { config: string; session: string }): string {
  let first = true;
  return path.replace(/:p/g, () => { const id = first && path.startsWith('/api/config') ? ids.config : ids.session; first = false; return id; });
}

test('C1(a) called in Node: every answered path is answered, every refused path gives 404 JSON — on a live session', async () => {
  const { mock, labels, script } = await demo();
  const { fetch: passthrough, seen } = recorder();
  const demoFetch = mock.createDemoFetch(passthrough, { delay: 0 });
  const O = labels.DEMO_API_ORIGIN;
  const post = (path: string, body?: unknown, headers?: Record<string, string>) =>
    demoFetch(O + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(headers ?? {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const cfgId = script.CONFIG_ID_PREFIX + 'salon';
  const created = await post('/api/session', { configId: cfgId, language: 'en' });
  assert.equal(created.status, 200, 'POST /api/session');
  const session = (await created.json()) as { id: string };
  const ids = { config: cfgId, session: session.id };

  // the answered paths, each with the method the widget uses (read from the product below)
  const methodOf: Record<string, string> = {
    '/api/config/:p': 'GET', '/api/consent': 'POST', '/api/session': 'POST', '/api/session/:p/message': 'POST', '/api/session/:p/confirm': 'POST',
    '/api/session/:p/abort': 'POST', '/api/session/:p/retry': 'POST', '/api/session/:p/retry-enrichment': 'POST', '/api/transcribe': 'POST',
  };
  assert.deepEqual([...mock.ANSWERED_PATHS].sort(), Object.keys(methodOf).sort(), 'ANSWERED_PATHS changed: this test names the method of each path — add the new one here, with the method the widget uses');
  const sources = productSources('packages/widget/src').map((s) => s.text).join('\n');
  for (const [path, method] of Object.entries(methodOf)) {
    const at = path.replace(/:p/g, '\\$\\{[^}]*\\}');
    const call = new RegExp('`\\$\\{[^}]*\\}' + at + '`\\s*,\\s*\\{([^}]*)\\}').exec(sources);
    assert.ok(call, `the widget source has no fetch(\`…${path}\`, {…}) call to read the method from`);
    assert.match(call[1]!, new RegExp(`method:\\s*'${method}'`), `${path}: the widget uses another method than ${method}`);
  }
  for (const path of mock.ANSWERED_PATHS) {
    const url = O + concrete(path, ids);
    const res = await demoFetch(url, { method: methodOf[path], headers: { 'content-type': 'application/json' }, body: methodOf[path] === 'POST' ? JSON.stringify(path === '/api/session/:p/message' ? { text: 'hello' } : path === '/api/session' ? { configId: cfgId } : {}) : undefined });
    const text = await res.text();
    assert.ok(!/NOT_MOCKED/.test(text), `${methodOf[path]} ${path} is listed as answered but the interceptor falls through to «not mocked»`);
    assert.ok(res.status === 200, `${methodOf[path]} ${path} answered ${res.status} ${text.slice(0, 80)}`);
  }
  // a refused path answers 404 JSON — GET /api/session/:p on a session that EXISTS must not give it back (F3, M31b)
  for (const path of mock.INTENTIONAL_404) {
    const res = await demoFetch(O + concrete(path, ids), { method: 'GET' });
    assert.equal(res.status, 404, `GET ${path} must answer 404 and answers ${res.status}`);
    const body = (await res.json()) as { code?: string };
    assert.ok(body && typeof body === 'object' && body.code, `${path}: the 404 body is not a JSON error with a code`);
  }
  assert.deepEqual(seen, [], 'something for the demo origin went to the original fetch');
});

test('C1(a) the interceptor answers the demo origin only: any other origin, the live API origin included, goes to the original fetch', async () => {
  const { mock } = await demo();
  const { fetch: passthrough, seen } = recorder();
  const demoFetch = mock.createDemoFetch(passthrough, { delay: 0 });
  const liveApi = new URL(WIDGET_API_URL).origin;
  for (const url of [`${liveApi}/api/config/by-domain`, 'https://example.invalid/api/consent', 'http://localhost:4000/api/session']) {
    const res = await demoFetch(url, { method: 'GET' });
    assert.equal(await res.text(), 'passed', `${url} was answered by the interceptor`);
  }
  assert.equal(seen.length, 3);
  const unknown = await demoFetch('https://demo.invalid/api/nothing-here', { method: 'GET' });
  assert.equal(unknown.status, 404, 'an unknown path on the demo origin is a 404 JSON');
  assert.equal(seen.length, 3, 'an unknown path on the demo origin reached the network');
});

test('C1(a) install/uninstall: the page gets the interceptor and then exactly the fetch it had', async () => {
  const { mock } = await demo();
  const orig = (async () => new Response('x')) as typeof fetch;
  const fake = { fetch: orig } as unknown as Window & typeof globalThis;
  const off = mock.installDemoMock(fake, { delay: 0 });
  assert.notEqual(fake.fetch, orig, 'the interceptor was not put on fetch');
  assert.equal(mock.installDemoMock(fake), off, 'a second install while it is on must be the same uninstall');
  off();
  assert.equal(fake.fetch, orig, 'the fetch that was there before is not back (the same reference)');
  assert.equal(mock.isDemoMockInstalled(), false);
});

test('C1(b) the states the mock returns are states of the product, and the show reaches INIT, COLLECTING, READY_TO_SUBMIT and COMPLETED', async () => {
  const { mock, labels, script } = await demo();
  const src = readProduct('packages/shared/src/state-machine/states.ts');
  const block = src.match(/export const STATES = \{([\s\S]*?)\} as const/)?.[1] ?? '';
  const states = new Set([...block.matchAll(/(\w+):\s*'(\w+)'/g)].map((m) => m[2]!));
  assert.ok(states.size >= 9, `STATES of the product not read (${states.size} found)`);
  const demoFetch = mock.createDemoFetch(recorder().fetch, { delay: 0 });
  const O = labels.DEMO_API_ORIGIN;
  const send = async (path: string, body: unknown) => (await (await demoFetch(O + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json()) as { state?: string; session?: { state?: string }; id?: string };
  const seen = new Set<string>();
  const first = await send('/api/session', { configId: script.CONFIG_ID_PREFIX + 'garage' });
  seen.add(first.state!);
  for (const text of ['one', 'two', 'three']) seen.add((await send(`/api/session/${first.id}/message`, { text })).session!.state!);
  seen.add((await send(`/api/session/${first.id}/confirm`, {})).session!.state!);
  assert.deepEqual([...seen].filter((s) => !states.has(s)), [], 'the mock returns a state the product does not have');
  assert.deepEqual([...seen].sort(), ['COLLECTING', 'COMPLETED', 'INIT', 'READY_TO_SUBMIT'], 'the scripted show passes other states than the four it is meant to');
});

test('C1(c) policyVersion of the script record = CONSENT_POLICY_VERSION of the product; the keys are the product\'s', async () => {
  const { script } = await demo();
  const version = readProduct('packages/shared/src/utils/constants.ts').match(/export const CONSENT_POLICY_VERSION\s*=\s*'([^']+)'/)?.[1];
  assert.ok(version, 'CONSENT_POLICY_VERSION not found in the product source');
  assert.equal(script.CONSENT_POLICY_VERSION, version, 'the consent record the demo lays down names another policy version than the product: the widget would reject it');
  const controller = readDemo('demo-controller.ts');
  assert.match(controller, /policyVersion:\s*CONSENT_POLICY_VERSION\b/, 'the controller writes policyVersion from something other than CONSENT_POLICY_VERSION');
  assert.doesNotMatch(controller, /policyVersion:\s*['"`]/, 'the controller writes a literal policyVersion');
  const consent = readProduct('packages/widget/src/services/consent.service.ts');
  assert.equal(script.CONSENT_STORAGE_KEY, consent.match(/const STORAGE_KEY = '([^']+)'/)?.[1], 'localStorage key of the consent record');
  assert.equal(script.CONSENT_SESSION_KEY, consent.match(/const SESSION_KEY = '([^']+)'/)?.[1], 'sessionStorage key of the consent session');
  const constants = readProduct('packages/widget/src/lib/constants.ts');
  const prefix = constants.match(/export const STORAGE = \{[\s\S]*?PREFIX:\s*'([^']+)'/)?.[1];
  assert.equal(script.SESSION_KEY_PREFIX, prefix, 'prefix of the keys the widget stores its sessions under');
  // the id the script's record carries must be one the product accepts as `userId` (consentUserIdSchema = uuid): the widget sends it in every request
  assert.match(script.SCRIPT_USER_ID, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'SCRIPT_USER_ID is not a UUID');
  assert.match(readProduct('packages/api/src/lib/schemas.ts'), /consentUserIdSchema = z\.string\(\)\.uuid\(\)/, 'the product no longer takes a UUID as userId — revisit SCRIPT_USER_ID');
  // the demo config ids fit the product's configIdSchema (cfg_demo…)
  assert.match(readProduct('packages/api/src/lib/schemas.ts'), /\/\^cfg_demo\\w\*\$\//, 'configIdSchema lost the cfg_demo… form');
  assert.match(script.CONFIG_ID_PREFIX, /^cfg_demo/, 'the demo config ids do not start with cfg_demo');
});

/** Every string value of a structure, with the path it is at. */
function strings(value: unknown, at = '$', out: { at: string; s: string }[] = []): { at: string; s: string }[] {
  if (typeof value === 'string') out.push({ at, s: value });
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${at}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) strings(v, `${at}.${k}`, out);
  return out;
}

test('C1(d) the vocabulary K1–K14 over every exported string of demo-script.ts and demo-labels.ts: 0 hits; the control sees an injected one', async () => {
  const { script, labels } = await demo();
  const exported: Record<string, unknown> = {};
  for (const [name, v] of Object.entries({ ...script, ...labels })) if (typeof v !== 'function') exported[name] = v;
  exported['staticChain()'] = labels.staticChain();
  for (const id of script.SCENARIO_IDS) for (const lang of ['en', 'pl', 'de', 'ru', 'es']) exported[`scenario(${id},${lang})`] = script.scenario(id, lang);
  const all = strings(exported);
  assert.ok(all.length > 800, `only ${all.length} strings walked — the walk lost the scenarios`);
  const hits = all.map(({ at, s }) => ({ at, found: countClaims(s) })).filter((x) => Object.keys(x.found).length);
  assert.deepEqual(hits, [], 'the demo prints a word of the dictionary (the HTML guard cannot see text drawn inside the widget)');
  // control: the same walk sees a string the dictionary refuses, and the class that is meant to catch the mock-up's note
  const injected = strings({ tips: [{ body: 'A confirmed booking arrives.' }], note: 'the replies are scripted in this prototype', lang: 'It works in Polish' });
  assert.deepEqual(injected.map((x) => Object.keys(countClaims(x.s))[0]), ['K8', 'K14', 'K1']);
  assert.ok(CLAIM_CLASSES.some((c) => c.id === 'K14' && c.patterns.some((p) => p.test('in this prototype'))), 'K14 lost its «prototype» pattern');
});

/** The class names of the selectors the controller reads inside the widget: its shadow DOM. */
function shadowClasses(): Map<string, string> {
  const controller = readDemo('demo-controller.ts');
  const script = readDemo('demo-script.ts');
  const selectors: string[] = [];
  const reader = /(?:\bq|\b(?:r|rs|f|box)\.querySelector(?:All)?|shadowRoot[!?]?\.querySelector(?:All)?)(?:<[^>]*>)?\(\s*'([^']+)'/g;
  for (const m of controller.matchAll(reader)) selectors.push(m[1]!);
  for (const m of script.matchAll(/\bsel:\s*'([^']+)'/g)) selectors.push(m[1]!);
  for (const m of controller.matchAll(/replaceSync\(`([^`]*)`/g)) for (const c of m[1]!.matchAll(/\.[A-Za-z_][\w-]*/g)) selectors.push(c[0]);
  const classes = new Map<string, string>();
  for (const sel of selectors) for (const c of sel.matchAll(/\.([A-Za-z_][\w-]*)/g)) if (!classes.has(c[1]!)) classes.set(c[1]!, sel);
  return classes;
}

test('C1(e) every class the controller reads in the widget shadow DOM is in the widget sources (the show stops silently when one goes)', () => {
  const classes = shadowClasses();
  assert.ok(classes.size >= 16, `only ${classes.size} widget selectors read from the controller (${[...classes.keys()].join(' ')}) — the extraction broke`);
  const widget = productSources('packages/widget/src/components').map((s) => s.text).join('\n');
  const missing = [...classes].filter(([c]) => !new RegExp(`(^|[^\\w-])${c.replace(/[-]/g, '\\-')}(?![\\w-])`).test(widget)).map(([c, sel]) => `.${c} (selector «${sel}»)`);
  assert.deepEqual(missing, [], 'the controller reads a class the widget no longer has');
  for (const known of ['pill-input', 'pill-send', 'option-badge', 'extracted-fields', 'progress-confirm-btn', 'review-field-label', 'review-field-value', 'consent-modal-container', 'widget-container', 'content-area', 'welcome-badges', 'progress-card', 'progress-bar-text', 'message', 'review-field', 'inline']) {
    assert.ok(classes.has(known), `the controller no longer reads .${known}: update this list or the show lost a step`);
  }
});

// ── (f) the config the mock serves ────────────────────────────────────────────────────────────────────────────────────────────────────
function typeCheckAgainstProduct(configs: Record<string, unknown>): string[] {
  const widgetConfig = productPath('packages/shared/src/types/widget-config.ts');
  const virtual = join(PRODUCT_ROOT, 'packages/shared/src/types/__demo_config_check__.ts');
  const source = `import type { WidgetConfig } from './widget-config';\n${Object.entries(configs).map(([k, v], i) => `export const c${i}: WidgetConfig = ${JSON.stringify(v)}; // ${k}`).join('\n')}\n`;
  const options: ts.CompilerOptions = {
    strict: true, exactOptionalPropertyTypes: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: [], noUncheckedIndexedAccess: true,
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (f, lang, ...rest) => (f === virtual ? ts.createSourceFile(f, source, lang) : getSourceFile(f, lang, ...rest));
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (f) => f === virtual || fileExists(f);
  const program = ts.createProgram([virtual, widgetConfig], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program, program.getSourceFile(virtual));
  return diagnostics.map((d) => `${ts.flattenDiagnosticMessageText(d.messageText, '\n').split('\n')[0]}${d.start !== undefined ? ` @${source.slice(0, d.start).split('\n').length}` : ''}`);
}

test('C1(f) the config of each scenario × language is a WidgetConfig of the product (type-checked), in the shape toPublicConfig gives', async () => {
  const { mock, labels, script } = await demo();
  const demoFetch = mock.createDemoFetch(recorder().fetch, { delay: 0 });
  const configs: Record<string, Record<string, any>> = {};
  const savedLang = mock.mockState.lang;
  try {
    for (const lang of ['en', 'pl', 'de', 'ru', 'es']) {
      mock.mockState.lang = lang;
      for (const id of script.SCENARIO_IDS) {
        const res = await demoFetch(`${labels.DEMO_API_ORIGIN}/api/config/${script.CONFIG_ID_PREFIX}${id}`, { method: 'GET' });
        assert.equal(res.status, 200, `GET /api/config/${id} (${lang})`);
        configs[`${id}/${lang}`] = (await res.json()) as Record<string, any>;
      }
    }
  } finally { mock.mockState.lang = savedLang; }
  assert.equal(Object.keys(configs).length, script.SCENARIO_IDS.length * 5);
  // the mock serves what a BROWSER may see — NOT createWidgetConfigSchema (that is the owner's input and wants an endpoint URL): the shape of toPublicConfig
  const service = readProduct('packages/api/src/services/config.service.ts');
  assert.match(service, /function publicIntegration[\s\S]*?endpoint:\s*''[\s\S]*?\}/, 'publicIntegration no longer blanks the endpoint');
  assert.match(service, /customInstructions:\s*''/, 'toClientConfig no longer blanks customInstructions');
  assert.match(service, /const \{ googleMapsApiKey: _stays, \.\.\.ui \} = config\.ui/, 'toPublicConfig no longer strips googleMapsApiKey');
  for (const [name, c] of Object.entries(configs)) {
    assert.equal(c['integration'].endpoint, '', `${name}: the public config carries an endpoint`);
    assert.equal(c['integration'].requestOnly, true, `${name}: the demo books requests only`);
    assert.deepEqual(c['integration'].headers, {}, `${name}: headers`);
    assert.deepEqual(c['integration'].fieldMapping, {}, `${name}: fieldMapping`);
    assert.equal(c['ai'].customInstructions, '', `${name}: customInstructions`);
    assert.equal('googleMapsApiKey' in c['ui'], false, `${name}: googleMapsApiKey`);
    assert.ok(new RegExp(`^${script.CONFIG_ID_PREFIX}`).test(c['id']), `${name}: id`);
    // the widget posts organizationId in the consent, and the product API takes the form its organizationIdSchema names
    assert.match(c['organizationId'], /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, `${name}: organizationId is not a UUID`);
  }
  assert.match(readProduct('packages/api/src/lib/schemas.ts'), /organizationIdSchema = z[\s\S]*?UUID_PATTERN\.test\(val\) \|\| \/\^org_\[a-f0-9\]\{12\}\$\/\.test\(val\)/, 'organizationIdSchema changed: re-read what the mock may put in organizationId');
  const problems = typeCheckAgainstProduct(configs);
  assert.deepEqual(problems, [], 'a config the mock serves is not a WidgetConfig of the product');
  // controls: the type check sees a field type the product does not have, and a missing required key, one at a time
  const fresh = () => JSON.parse(JSON.stringify(configs['salon/en'] ?? Object.values(configs)[0])) as Record<string, any>;
  const wrongType = fresh(); wrongType['fields'][0].type = 'not-a-field-type';
  assert.ok(typeCheckAgainstProduct({ wrongType }).length >= 1, 'the type check did not see a field type the product does not have');
  const noVersion = fresh(); delete noVersion['version'];
  assert.ok(typeCheckAgainstProduct({ noVersion }).length >= 1, 'the type check did not see a missing required key');
  const wrongModel = fresh(); wrongModel['ai'].model = 'gpt-0';
  assert.ok(typeCheckAgainstProduct({ wrongModel }).length >= 1, 'the type check did not see a model the product does not have');
});

test('C1(f) the answer of /api/transcribe has the shape voice.service.ts reads, in the language of the session', async () => {
  const { mock, labels, script } = await demo();
  const voice = readProduct('packages/widget/src/services/voice.service.ts');
  const minConfidence = Number(voice.match(/MIN_CONFIDENCE:\s*([\d.]+)/)?.[1]);
  assert.ok(minConfidence > 0, 'MIN_CONFIDENCE not read from the product');
  assert.match(voice, /result\.transcript|\.transcript/, 'voice.service.ts no longer reads `transcript`');
  const demoFetch = mock.createDemoFetch(recorder().fetch, { delay: 0 });
  const saved = mock.mockState.lang;
  try {
    for (const lang of ['en', 'pl', 'de', 'ru', 'es']) {
      mock.mockState.lang = lang;
      const created = (await (await demoFetch(`${labels.DEMO_API_ORIGIN}/api/session`, { method: 'POST', body: JSON.stringify({ configId: script.CONFIG_ID_PREFIX + 'table' }) })).json()) as { id: string };
      const res = await demoFetch(`${labels.DEMO_API_ORIGIN}/api/transcribe`, { method: 'POST', headers: { 'X-Session-Id': created.id }, body: new FormData() });
      assert.equal(res.status, 200, `transcribe (${lang})`);
      const body = (await res.json()) as { transcript?: string; text?: string; confidence?: number; language?: string; duration?: number };
      assert.equal(body.transcript ?? body.text, script.scenario('table', lang).phrase, `the sentence of the voice answer is not the scenario's in ${lang}`);
      assert.ok(body.confidence === undefined || body.confidence >= minConfidence, 'confidence below the product threshold: the widget would treat the answer as an error');
      assert.equal(body.language, lang);
    }
  } finally { mock.mockState.lang = saved; }
});

test('C1(g) the scripted scenarios are all there: 310 scripted lines or more between «var SCEN» and «function scenOf», no empty text in any language', async () => {
  const { script } = await demo();
  const text = readDemo('demo-script.ts');
  const from = text.search(/^var SCEN = /m), to = text.search(/^\s*function scenOf\b/m);
  assert.ok(from >= 0 && to > from, 'the region of the scenarios was not found');
  const region = text.slice(from, to);
  // 310 = the quoted runs of 12 or more characters in that region of the mock-up's assets/mock-api.js (counted 20.10, card L4 §4 item 9): the
  // demo may grow, never shrink
  const runs = [...region.matchAll(/'((?:[^'\\]|\\.){12,})'/g)].length;
  assert.ok(runs >= 310, `only ${runs} scripted lines (quoted runs of 12+ characters) in the scenarios, the mock-up had 310`);
  assert.equal(script.SCENARIO_IDS.length, 4);
  const empty = strings({ base: script.SCEN_BASE, lang: script.SCEN_LANG, common: script.SCEN_COMMON }).filter((x) => x.s.trim() === '');
  assert.deepEqual(empty, [], 'a scripted text is empty');
  for (const lang of ['en', 'pl', 'de', 'ru', 'es']) for (const id of script.SCENARIO_IDS) {
    const s = script.scenario(id, lang);
    assert.ok(s.welcome && s.phrase && s.reply && s.results.length === 3 && s.fields.length >= 4, `${id}/${lang}: incomplete scenario`);
  }
});
