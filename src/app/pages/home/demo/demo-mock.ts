// The mock backend of the home-page demo (L4, D1, D2): the REAL widget calls `fetch('<api-url>/api/...')`, this module answers those
// calls with the scripted conversations of demo-script.ts. It answers ONE origin, `https://demo.invalid` (RFC 6761: a name that
// cannot resolve), and passes every other request to the original `fetch`; an unknown path on that origin is a 404 JSON, never the
// network. Ported from the mock's assets/mock-api.js (the routes, the session steps, the config shape); changed on purpose:
//   - the origin (the mock's `mock.local` is an mDNS name, not a name that cannot exist) — D2;
//   - `GET /api/session/:p` always answers 404, whatever was stored (F3): the widget then starts a new session instead of restoring
//     the last one (`api.service.ts` getSession returns null on 404, `session.controller.ts` drops the key);
//   - `/api/transcribe` answers with the sample sentence of the session's scenario in its language, in the shape of voice.service.ts
//     (`{ transcript, language, confidence, duration }`) — D1/D5;
//   - the hooks `onMessage` / `onConfirm` are one slot each, replaced by the controller and cleared on destroy, never wrapped (F6).
//
// No window, no document, no Angular at the top level: Node tests import this file (home-demo-contract). `installDemoMock` is the
// only function that touches the page.
import { DEMO_API_ORIGIN } from './demo-labels';
import { CONFIG_ID_PREFIX, SCEN_BASE, scenario, type Scenario } from './demo-script';

export { DEMO_API_ORIGIN };

/**
 * Every path the widget calls that the mock answers, in the form the product's sources give them with `${…}` written `:p`
 * (home-demo-contract compares them with packages/widget/src/services/*.ts). Query strings are not part of a path.
 */
export const ANSWERED_PATHS: readonly string[] = [
  '/api/config/:p',
  '/api/consent',
  '/api/session',
  '/api/session/:p/message',
  '/api/session/:p/confirm',
  '/api/session/:p/abort',
  '/api/session/:p/retry',
  '/api/session/:p/retry-enrichment',
  '/api/transcribe',
];

/**
 * Paths the widget can call that the mock refuses on purpose with a 404 JSON. `GET /api/session/:p` is here so that no session is ever
 * restored (F3); the config lookups by domain and by key and the Places proxy are not part of the demo (the address lookup is off in
 * the product: ADDRESS_LOOKUP_ENABLED = false). A path is in one of the two lists, never both.
 */
export const INTENTIONAL_404: readonly string[] = [
  '/api/session/:p',
  '/api/config/by-domain',
  '/api/config/by-key',
  '/api/places/autocomplete',
  '/api/places/details',
];

export interface MockHooks {
  /** a message reached the mock: `step` counts the messages of the session (1 = the customer's sentence) */
  onMessage?: ((step: number, scenarioId: string, body: Record<string, unknown>) => void) | null;
  /** the widget confirmed the request (`rid` is the reference the success screen shows, `data` what was extracted) */
  onConfirm?: ((scenarioId: string, rid: string, data: Record<string, string>) => void) | null;
}

export interface MockState extends MockHooks {
  /** the language of the chat: the same scenario in another language starts again */
  lang: string;
  /** the scenario the controller plays now (the fallback of /api/transcribe when no session header is there) */
  scenarioId: string;
  /** the pause before every answer, ms; the real API is not instant */
  delay: number;
}

export const mockState: MockState = { lang: 'en', scenarioId: 'salon', delay: 1100, onMessage: null, onConfirm: null };

interface SessionState { id: string; sid: string; lang: string; step: number; data: Record<string, string> }

const nowIso = (): string => new Date().toISOString();
const json = (o: unknown, status = 200): Response =>
  new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
const msg = (role: string, content: string, extra?: Record<string, unknown>): Record<string, unknown> => ({
  id: 'm' + Math.random().toString(36).slice(2, 9), role, content, timestamp: nowIso(), ...(extra ?? {}),
});

/** A UUID per demo business: the widget sends `organizationId` in the consent it posts, and the product API takes a UUID or `org_<12 hex>` only. */
const orgIdFor = (id: string): string => `00000000-0000-4000-8000-${String(Object.keys(SCEN_BASE).indexOf(id) + 1).padStart(12, '0')}`;

function configFor(id: string, lang: string): Record<string, unknown> {
  const s = scenario(id, lang);
  const c = s.c;
  const fields: Record<string, unknown>[] = s.fields.map((f) => ({ id: f[0], type: f[1], label: f[2], required: true, aiHint: f[2] }));
  fields.push({
    id: s.cardsField, type: 'select', label: s.cardsLabel, required: true, aiHint: s.cardsLabel,
    // plain strings, the stored shape (validation.options: z.array(z.string()) in the product); the widget reads label and value from the string
    validation: { options: s.results.map((r) => r[0] + ' · ' + r[1]) },
  });
  fields.push({ id: 'name', type: 'text', label: c.name, required: true, aiHint: 'Name' });
  fields.push({ id: 'phone', type: 'phone', label: c.phone, required: true, aiHint: 'Phone' });
  const t = nowIso();
  return {
    id: CONFIG_ID_PREFIX + id, organizationId: orgIdFor(id), version: 1, isActive: true, createdAt: t, updatedAt: t, fields,
    integration: { requestOnly: true, endpoint: '', method: 'POST', headers: {}, fieldMapping: {}, timeoutMs: 0, retryConfig: { maxRetries: 0, retryableStatuses: [] } },
    // the PUBLIC config of the product (config.service.ts toPublicConfig): `ai.customInstructions` is blanked, `integration` is publicIntegration()
    ai: { model: 'gpt-5.4-mini', temperature: 0.7, customInstructions: '' },
    ui: {
      brandName: s.brand, tagline: c.tagline, locale: s.lang, primaryColor: '#F97316', welcomeMessage: s.welcome,
      confirmationMessage: c.confirmation, successMessage: c.success, errorMessage: c.error, confirmButtonText: c.button,
    },
    session: { timeoutMs: 1800000, persistToStorage: false },
  };
}

function sessionObj(st: SessionState, state: string, over?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: st.id, configId: CONFIG_ID_PREFIX + st.sid, configVersion: 1, state, messages: [], extractedData: st.data, lastAIRequestId: null,
    retryCount: 0, editMode: false, createdAt: nowIso(), updatedAt: nowIso(), lastActivityAt: nowIso(), ...(over ?? {}),
  };
}

function bodyOf(init: RequestInit | undefined): Record<string, unknown> {
  const raw = init?.body;
  if (typeof raw !== 'string') return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

function headerOf(init: RequestInit | undefined, name: string): string | undefined {
  const h = init?.headers;
  if (!h) return undefined;
  if (h instanceof Headers) return h.get(name) ?? undefined;
  if (Array.isArray(h)) return h.find((p) => p[0]?.toLowerCase() === name.toLowerCase())?.[1];
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? (h as Record<string, string>)[key] : undefined;
}

export interface DemoFetchOptions {
  /** override the pause (tests: 0) */
  delay?: number;
}

/**
 * The fetch the page gets while the demo is on: the demo origin is answered here, every other request goes to `passthrough` untouched.
 * `passthrough` is the `fetch` that was on the page before; it is called as it was (`this` = the global object).
 */
export function createDemoFetch(passthrough: typeof fetch, options: DemoFetchOptions = {}): typeof fetch {
  const sessions: Record<string, SessionState> = {};
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  return async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    let parsed: URL | null = null;
    try { parsed = new URL(url); } catch { parsed = null; }
    if (!parsed || parsed.origin !== DEMO_API_ORIGIN) return passthrough.call(globalThis, input as RequestInfo, init);

    const p = parsed.pathname;
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase();
    await sleep(options.delay ?? mockState.delay);

    // The paths refused on purpose come first: `/api/config/by-domain` must not be taken for a config id.
    if (INTENTIONAL_404.includes(p) || /^\/api\/session\/[^/]+$/.test(p)) return json({ error: 'not found', code: 'NOT_FOUND' }, 404);

    if (p.startsWith('/api/config/') && method === 'GET') {
      const id = p.split('/').pop()!.replace(CONFIG_ID_PREFIX, '');
      return SCEN_BASE[id] ? json(configFor(id, mockState.lang)) : json({ error: 'no config', code: 'NO_CONFIG' }, 404);
    }
    if (p === '/api/consent') return json({ success: true });

    if (p === '/api/transcribe' && method === 'POST') {
      const sid = headerOf(init, 'X-Session-Id');
      const st = sid ? sessions[sid] : undefined;
      const s = scenario(st?.sid ?? mockState.scenarioId, st?.lang ?? mockState.lang);
      // the shape voice.service.ts reads: { transcript | text, language, confidence, duration }; confidence is above MIN_CONFIDENCE (0.1)
      return json({ transcript: s.phrase, language: s.lang, confidence: 0.95, duration: 3 });
    }

    if (p === '/api/session' && method === 'POST') {
      const body = bodyOf(init);
      const sid = String(body['configId'] ?? '').replace(CONFIG_ID_PREFIX, '') || 'salon';
      const st: SessionState = { id: 'ses_' + Math.random().toString(36).slice(2, 8), sid, lang: mockState.lang, step: 0, data: {} };
      sessions[st.id] = st;
      return json(sessionObj(st, 'INIT', { sessionToken: 'e'.padEnd(64, '0'), messages: [msg('assistant', scenario(sid, st.lang).welcome)] }));
    }

    const m = p.match(/^\/api\/session\/([^/]+)\/(message|confirm|abort|retry|retry-enrichment)$/);
    if (m && method === 'POST') {
      const s2 = sessions[m[1]!];
      if (!s2) return json({ error: 'gone' }, 404);
      const sc: Scenario = scenario(s2.sid, s2.lang);
      const action = m[2]!;
      if (action === 'abort') return new Response('', { status: 200 });
      if (action === 'retry-enrichment') return json({ success: true, session: sessionObj(s2, 'COLLECTING') });
      if (action === 'confirm' || action === 'retry') {
        const rid = 'REQ-' + Math.floor(1000 + Math.random() * 8999);
        if (mockState.onConfirm && action === 'confirm') {
          try { mockState.onConfirm(s2.sid, rid, JSON.parse(JSON.stringify(s2.data)) as Record<string, string>); } catch { /* a hook must not break the answer */ }
        }
        return json({ success: true, bookingId: rid, session: sessionObj(s2, 'COMPLETED', { bookingResult: { success: true } }) });
      }
      const b = bodyOf(init);
      s2.step += 1;
      if (mockState.onMessage) {
        try { mockState.onMessage(s2.step, s2.sid, b); } catch { /* same */ }
      }
      if (s2.step === 1) {
        s2.data = Object.assign({}, sc.data);
        const opts = sc.results.map((r) => ({ label: r[0], value: r[0] + ' · ' + r[1], subtitle: r[1] }));
        return json({ message: msg('assistant', sc.reply, { options: opts, optionsFieldId: sc.cardsField }), extractedData: s2.data, session: sessionObj(s2, 'COLLECTING') });
      }
      if (s2.step === 2) {
        const selection = b['selection'] as { value?: string } | undefined;
        const pick = selection?.value || String(b['text'] ?? sc.results[0]![0]);
        const hit = sc.results.filter((r) => pick.toLowerCase().indexOf(r[0].toLowerCase()) === 0)[0] ?? sc.results[0]!;
        s2.data[sc.cardsField] = hit[0] + ' · ' + hit[1];
        return json({ message: msg('assistant', sc.c.ask), extractedData: s2.data, session: sessionObj(s2, 'COLLECTING') });
      }
      s2.data['name'] = sc.c.who;
      s2.data['phone'] = sc.c.tel;
      (s2.data as Record<string, unknown>)['_optionalDeclined'] = true;
      return json({ message: msg('assistant', sc.c.review), extractedData: s2.data, session: sessionObj(s2, 'READY_TO_SUBMIT') });
    }

    return json({ error: 'not mocked', code: 'NOT_MOCKED' }, 404);
  } as typeof fetch;
}

let installed: { restore: () => void } | null = null;

/**
 * Put the demo fetch on the page. Idempotent: a second call while it is on returns the same uninstall. The uninstall puts back the
 * exact function that was there (the same reference, not a bound copy).
 */
export function installDemoMock(win: Window & typeof globalThis = window, options: DemoFetchOptions = {}): () => void {
  if (installed) return installed.restore;
  const original = win.fetch;
  const demoFetch = createDemoFetch(original, options);
  win.fetch = demoFetch;
  const restore = () => {
    if (!installed) return;
    installed = null;
    if (win.fetch === demoFetch) win.fetch = original;
  };
  installed = { restore };
  return restore;
}

/** Take the demo fetch off the page if it is on (the loader calls this when the visitor leaves before the demo started). */
export function uninstallDemoMock(): void {
  installed?.restore();
}

export function isDemoMockInstalled(): boolean {
  return installed !== null;
}
