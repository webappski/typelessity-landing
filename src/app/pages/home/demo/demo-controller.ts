// The controller of the home-page demo (L4): it types a visitor sentence into the REAL widget, sends it, and lights the cards under it
// (extracted.json → business-system answer). Ported from the mock's assets/demo.js; the decisions of card §5 (Q-1) are marked F3…F11.
//
// This file, demo-script.ts and demo-mock.ts are ONE lazy chunk: the loader (demo-session.ts, main bundle) reaches them only through
// `import('./demo-controller')`, after `load` and an idle moment (D3). Nothing here runs at import time. Every timer, listener, observer
// and global patch the controller puts up is taken down by `destroy()` (D4, F6): a visit that comes back to `/` finds the page exactly
// as a visit that never saw the demo — the same `fetch`, `scrollIntoView` and `focus`, no timers, no keys in the storage.
//
// Time: every pause is a `setTimeout` or a `Date.now()` difference, so Playwright's `page.clock` drives the whole show (F8).
import {
  CONFIG_ID_PREFIX, CONSENT_POLICY_VERSION, CONSENT_SESSION_KEY, CONSENT_STORAGE_KEY, DEMO_TEXT, SCENARIO_IDS, SCRIPT_USER_ID,
  SESSION_KEY_PREFIX, TIP3, TIPS, scenario, type Scenario,
} from './demo-script';
import { DEMO_API_ORIGIN, installDemoMock, mockState, uninstallDemoMock } from './demo-mock';
import { SLOT_HEIGHT_MOBILE_PX, SLOT_HEIGHT_PX, SLOT_MOBILE_MAX_WIDTH_PX } from './demo-labels';
import { nextShownIndex } from './next-scenario';

export { installDemoMock, uninstallDemoMock, DEMO_API_ORIGIN };

/** What the controller tells the page (the page owns the buttons: their state is Angular's, not ours). */
export interface DemoHooks {
  /** the scenario that plays now changed (a tab was picked, or the show went on to the next business) */
  scenario(id: string): void;
  /** the language of the chat changed */
  lang(code: string): void;
  /** the tips were switched off or on */
  tips(off: boolean): void;
  /** a widget stands in the slot (called at every mount) */
  mounted(): void;
}

/** What the visitor did before the chunk was there: applied at the start instead of the first scenario's show. */
export interface DemoStart {
  scenario: string;
  lang: string;
  /** `Try the chat now`, or a click in the slot, came first */
  takeOver?: boolean;
  /** a tab or a language was picked before the chunk was there */
  picked?: boolean;
  tipsOff?: boolean;
}

export interface DemoController {
  pick(id: string): void;
  setLang(code: string): void;
  takeOver(): void;
  setTips(off: boolean): void;
  destroy(): void;
}

type Q<T extends Element = HTMLElement> = T | null;
const esc = (s: unknown): string => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface ConsentRecord { userId?: string; consentGiven?: boolean; policyVersion?: string }

/* ---------- the global patches: put up once, taken down on destroy (F6) ---------- */
let patched: { restore: () => void } | null = null;
/** true while the script plays: a programmatic focus() inside the host is then a no-op (F5, SC 3.2.1) */
let focusBlocked = false;

/** Is this element inside the widget the demo mounts (in its shadow root, or in a shadow root nested in it)? */
function inHost(el: Element): boolean {
  let root: Node | null = el.getRootNode ? el.getRootNode() : null;
  while (root && (root as ShadowRoot).host) {
    const host = (root as ShadowRoot).host;
    if (host.closest && host.closest('[data-widget-host]')) return true;
    root = host.getRootNode();
  }
  return false;
}

function patchGlobals(): void {
  if (patched) return;
  // The widget scrolls its own message list with scrollIntoView() and focus(); both would also drag the PAGE.
  // Inside the demo host they only move the widget's own list.
  const origScrollIntoView = Element.prototype.scrollIntoView;
  const origFocus = HTMLElement.prototype.focus;
  Element.prototype.scrollIntoView = function patchedScrollIntoView(this: Element, arg?: boolean | ScrollIntoViewOptions): void {
    if (inHost(this)) {
      let p = this.parentElement;
      while (p) {
        const cs = getComputedStyle(p);
        if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) { p.scrollTop = p.scrollHeight; return; }
        p = p.parentElement;
      }
      return;
    }
    return origScrollIntoView.call(this, arg);
  };
  HTMLElement.prototype.focus = function patchedFocus(this: HTMLElement, options?: FocusOptions): void {
    if (inHost(this)) {
      if (focusBlocked) return; // the show never moves the focus of the page into the widget (F5)
      return origFocus.call(this, { preventScroll: true });
    }
    return origFocus.call(this, options);
  };
  patched = {
    restore: () => {
      Element.prototype.scrollIntoView = origScrollIntoView;
      HTMLElement.prototype.focus = origFocus;
      patched = null;
      focusBlocked = false;
    },
  };
}

/* ---------- the storage the widget writes (F3, F4, F5) ---------- */
function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord) : null;
  } catch { return null; }
}
function removeKeys(storage: Storage, test: (key: string) => boolean): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && test(k)) keys.push(k); }
    keys.forEach((k) => storage.removeItem(k));
  } catch { /* storage blocked: nothing to remove */ }
}
/** The sessions the widget keeps for the demo businesses (`typelessity_session_cfg_demo_<id>`), F3. */
function dropSessions(): void {
  removeKeys(sessionStorage, (k) => k.startsWith(SESSION_KEY_PREFIX + CONFIG_ID_PREFIX));
}
/** The script's own consent record, and only that: a record of the visitor (any other userId) is never touched (F5). */
function dropScriptConsent(): void {
  try {
    if (readConsent()?.userId === SCRIPT_USER_ID) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      sessionStorage.removeItem(CONSENT_SESSION_KEY);
    }
  } catch { /* ignore */ }
}
/** What stays after the visitor leaves the page: nothing of the demo, the consent the visitor gave inside it included (D4). */
function dropEverything(): void {
  try { localStorage.removeItem(CONSENT_STORAGE_KEY); sessionStorage.removeItem(CONSENT_SESSION_KEY); } catch { /* ignore */ }
  dropSessions();
}

export function createDemoController(root: HTMLElement, hooks: DemoHooks, start: DemoStart): DemoController {
  const win = window;
  const doc = document;
  const ids = SCENARIO_IDS.slice();
  const stage = root.querySelector<HTMLElement>('[data-ty-demo]');
  const host = stage?.querySelector<HTMLElement>('[data-widget-host]') ?? null;
  const mountEl = host?.querySelector<HTMLElement>('[data-widget-mount]') ?? null;
  if (!stage || !host || !mountEl) throw new Error('home demo: the stage is not on the page');
  /** a tab is drawn when it has a box: «Freight» is `display: none` at 720 px and below (L17 D1.3) */
  const tabShown = (id: string): boolean => (stage.querySelector(`[data-scenario-tab="${id}"]`)?.getClientRects().length ?? 0) > 0;

  const note = stage.querySelector<HTMLElement>('[data-demo-note]');
  const chain = root.querySelector<HTMLElement>('[data-ty-chain]');
  const tipHostSel = stage.getAttribute('data-tip-host');
  const tipRoot = (tipHostSel && doc.querySelector<HTMLElement>(tipHostSel)) || stage;
  const tip = tipRoot.querySelector<HTMLElement>('[data-tip]');
  const ring = stage.querySelector<HTMLElement>('[data-ring]');
  const frame = stage.querySelector<HTMLElement>('.demo__frame');
  const after = stage.querySelector<HTMLElement>('[data-after]');
  const link = tipRoot !== stage ? (tipRoot.parentNode as ParentNode).querySelector<SVGSVGElement>('[data-tip-link]') : null;
  const reduced = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let idx = Math.max(0, ids.indexOf(start.scenario));
  let auto = !reduced;
  let widget: HTMLElement | null = null;
  let visible = true;
  let gen = 0;
  let destroyed = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  /** timers that are not part of one run (the chain lights, the mount poll): cleared on destroy only */
  const misc = new Set<ReturnType<typeof setTimeout>>();

  // Tips (F7): in reduced motion they are off at load — nothing starts moving without a request.
  let tipOff = start.tipsOff ?? reduced;
  const MIN_HOLD = 3600, MAX_HOLD = 12000;     // a tip stays long enough to be read before the next one replaces it
  const AFTER_DELAY = 5000, AFTER_STEP = 6500; // the customer's own «request received» screen first, then one block at a time
  let tcur = -1, tseen: Record<number, boolean> = {}, tsince = 0, raf = 0, tick: ReturnType<typeof setInterval> | 0 = 0;
  let lastFields: string[][] = [], sentOk = false, sentAt = 0, sentData: Record<string, string> | null = null, sentId = '', afterOff = false;
  let afterOnAt = 0;

  const scen = (): Scenario => scenario(ids[idx]!, mockState.lang);
  const q = (sel: string): HTMLElement | null => widget?.shadowRoot?.querySelector<HTMLElement>(sel) ?? null;

  const T = (fn: () => void, ms: number): ReturnType<typeof setTimeout> => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const later = (fn: () => void, ms: number): void => {
    const t = setTimeout(() => { misc.delete(t); if (!destroyed) fn(); }, ms);
    misc.add(t);
  };
  const clearAll = (): void => { timers.forEach(clearTimeout); timers = []; };
  /** The lights of the ribbon a message or a confirm of the OLD conversation still has on a timer: a take-over or a pick must not let them fire (B3(b)). */
  const clearMisc = (): void => { misc.forEach(clearTimeout); misc.clear(); };

  const setText = (el: Element | null, text: string): void => { if (el) el.textContent = text; };

  /* ---------- the chain band under the hero ---------- */
  function jsonHtml(obj: Record<string, string>): string {
    const lines = ['{'];
    const keys = Object.keys(obj);
    keys.forEach((k, i) => {
      lines.push('  <span class="j-k">"' + esc(k) + '"</span>: <span class="j-v">"' + esc(obj[k]) + '"</span>' + (i < keys.length - 1 ? ',' : ''));
    });
    lines.push('}');
    return lines.join('\n');
  }

  function setChain(state: 'idle' | 'json' | 'api' | 'sent'): void {
    if (!chain) return;
    const s = scen();
    const jsonCard = chain.querySelector<HTMLElement>('[data-chain-json]');
    const apiCard = chain.querySelector<HTMLElement>('[data-chain-api]');
    const body = chain.querySelector<HTMLElement>('[data-chain-json-body]');
    if (body) body.innerHTML = jsonHtml(s.data);
    setText(chain.querySelector('[data-chain-endpoint]'), s.endpoint);
    const rows = chain.querySelector<HTMLElement>('[data-chain-rows]');
    if (rows) {
      rows.innerHTML = s.results.map((r) => '<div class="chain-row"><span class="chain-row__dot"></span><span>' + esc(r[0]) + ' · ' + esc(r[1]) + '</span></div>').join('');
    }
    setText(chain.querySelector('[data-chain-source]'), s.brand);
    setText(chain.querySelector('[data-chain-say]'), '“' + s.phrase + '”');
    const sentCard = chain.querySelector<HTMLElement>('[data-chain-sent]');
    jsonCard?.classList.toggle('is-active', state === 'json' || state === 'api' || state === 'sent');
    apiCard?.classList.toggle('is-active', state === 'api' || state === 'sent');
    sentCard?.classList.toggle('is-active', state === 'sent');
    chain.classList.toggle('is-idle', state === 'idle');
  }

  /* ---------- the tips ---------- */
  function tipBody(i: number): string {
    if (i !== 2) return TIPS[i]!.body; // tip 3 carries live counts
    const r = widget?.shadowRoot;
    let n = '', m = 0;
    if (r) {
      const t = r.querySelector('.progress-bar-text');
      n = t ? (t.textContent || '').trim() : '';
      m = r.querySelectorAll('.message.user').length;
    }
    const parts = n.split('/');
    const have = parseInt(parts[0] ?? '', 10), all = parseInt(parts[1] ?? '', 10);
    const facts = have && have === all && m
      ? `${TIP3.all} ${have} ${TIP3.of} ${all} ${TIP3.cameFrom} ${m} ${m === 1 ? TIP3.message : TIP3.messages}`
      : TIP3.filled;
    return facts + '. ' + TIP3.tail;
  }

  function placeLink(tg: { left: number; top: number; height: number } | null): void { // a curve from the tip card to the block it is about
    if (!link || !tip) return;
    const path = link.querySelector('path'), dot = link.querySelector('circle');
    if (!tg || !tip.classList.contains('is-on') || getComputedStyle(link).display === 'none' || !path || !dot) { link.classList.remove('is-on'); return; }
    const h = link.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const x1 = t.right + 7 - h.left, y1 = t.top + 29 - h.top;
    const x2 = tg.left - 3 - h.left, y2 = tg.top + Math.min(tg.height / 2, 42) - h.top;
    if (x2 - x1 < 24) { link.classList.remove('is-on'); return; }
    const dx = (x2 - x1) * 0.5;
    path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2);
    dot.setAttribute('cx', String(x2)); dot.setAttribute('cy', String(y2));
    link.classList.add('is-on');
  }

  function linkTarget(): { left: number; top: number; height: number } | null {
    const t = TIPS[tcur]!;
    if (t.sel) return ring?.classList.contains('is-on') ? ring.getBoundingClientRect() : null;
    if (t.after !== undefined) {
      const c = after?.querySelector('.chain-card.is-hl');
      return c && after?.classList.contains('is-on') ? c.getBoundingClientRect() : null;
    }
    const fr = frame!.getBoundingClientRect();
    let y = fr.top + 90;
    const rs = widget?.shadowRoot; // the receipt: aim at its heading, else near the top
    if (rs) { const hd = rs.querySelector('h1,h2,h3'); if (hd) { const er = hd.getBoundingClientRect(); y = er.top + er.height / 2; } }
    return { left: fr.left, top: y, height: 0 };
  }

  function placeRing(): void {
    raf = 0;
    if (destroyed || tcur < 0 || !widget || !widget.shadowRoot || !ring || !frame) return;
    if (!TIPS[tcur]!.sel) { ring.classList.remove('is-on'); placeLink(linkTarget()); raf = requestAnimationFrame(placeRing); return; } // these tips light a block of the panel or have nothing to outline
    const r = widget.shadowRoot;
    const tg = r.querySelector(TIPS[tcur]!.sel!), area = r.querySelector('.content-area');
    const fr = frame.getBoundingClientRect();
    if (tg && area) {
      const a = tg.getBoundingClientRect(), c = area.getBoundingClientRect();
      const pad = 6, top = Math.max(a.top - pad, c.top + 2), bot = Math.min(a.bottom + pad, c.bottom - 2);
      const left = Math.max(a.left - pad, fr.left + 6), right = Math.min(a.right + pad, fr.right - 6);
      if (bot - top > 28 && right - left > 28) {
        ring.style.left = (left - fr.left) + 'px'; ring.style.top = (top - fr.top) + 'px';
        ring.style.width = (right - left - 4) + 'px'; ring.style.height = (bot - top - 4) + 'px';
        ring.classList.add('is-on');
      } else ring.classList.remove('is-on');
    } else ring.classList.remove('is-on');
    placeLink(linkTarget());
    raf = requestAnimationFrame(placeRing);
  }

  function showTip(i: number): void {
    if (!tip) return;
    tcur = i; tseen[i] = true; tsince = Date.now();
    setText(tipRoot.querySelector('[data-tip-title]'), TIPS[i]!.title);
    setText(tipRoot.querySelector('[data-tip-body]'), tipBody(i));
    setText(tipRoot.querySelector('[data-tip-steps]'), `${DEMO_TEXT.tipWord} ${i + 1} ${DEMO_TEXT.tipOf} ${TIPS.length}`);
    setText(tipRoot.querySelector('[data-tip-n]'), String(i + 1));
    setText(stage!.querySelector('[data-ring-n]'), String(i + 1));
    tip.classList.add('is-on');
    if (!raf) raf = requestAnimationFrame(placeRing);
  }
  function hideTip(): void {
    tcur = -1; tip?.classList.remove('is-on'); ring?.classList.remove('is-on'); link?.classList.remove('is-on');
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* The panel that replaces the widget after Send: the three blocks from «Behind the chat», one under the other. */
  function fillAfter(): void {
    if (!after) return;
    const s = scen();
    const data: Record<string, string> = {};
    for (const k of Object.keys(sentData ?? {})) if (k.charAt(0) !== '_') data[k] = sentData![k]!;
    setText(after.querySelector('[data-after-endpoint]'), `${DEMO_TEXT.afterAsked} (${s.endpoint})`);
    const chosen = String(data[s.cardsField] ?? '').toLowerCase();
    const rows = after.querySelector<HTMLElement>('[data-after-rows]');
    if (rows) {
      rows.innerHTML = s.results.map((r) => {
        const on = chosen.indexOf(r[0].toLowerCase()) === 0;
        return '<div class="chain-row' + (on ? ' is-chosen' : '') + '"><span class="chain-row__dot"></span><span>' + esc(r[0]) + ' · ' + esc(r[1]) + '</span></div>';
      }).join('');
    }
    const json = after.querySelector<HTMLElement>('[data-after-json]');
    if (json) json.innerHTML = jsonHtml(data);
    const labels: Record<string, string> = {};
    s.fields.forEach((f) => { labels[f[0]] = f[2]; });
    labels[s.cardsField] = s.cardsLabel; labels['name'] = s.c.name; labels['phone'] = s.c.phone;
    const list = after.querySelector<HTMLElement>('[data-after-list]');
    if (list) list.innerHTML = Object.keys(data).map((k) => '<div><span>' + esc(labels[k] || k) + '</span><b>' + esc(data[k]) + '</b></div>').join('');
    showJson(false);
    const sent = after.querySelector<HTMLElement>('[data-after-sent]');
    if (sent) {
      sent.innerHTML =
        '<div class="chain-row is-chosen"><span class="chain-row__dot"></span><span>' + esc(DEMO_TEXT.sentByEmail + ' ' + sentId) + '</span></div>' +
        '<div class="chain-row"><span class="chain-row__dot"></span><span>' + esc(DEMO_TEXT.sentToSystem) + '</span></div>';
    }
  }
  function showJson(on: boolean): void { // the booking request card: a readable list for the owner, the JSON a developer's system receives on a toggle
    const c = after?.querySelector<HTMLElement>('[data-after-card="1"]');
    if (!c) return;
    const b = c.querySelector<HTMLElement>('[data-after-toggle]');
    c.querySelector<HTMLElement>('[data-after-list]')!.hidden = on;
    c.querySelector<HTMLElement>('[data-after-json]')!.hidden = !on;
    c.querySelector<HTMLElement>('[data-after-note]')!.hidden = !on;
    if (b) { b.textContent = on ? DEMO_TEXT.jsonHide : DEMO_TEXT.jsonShow; b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  }
  function afterSet(i: number): void { // -1 hides the panel, 0..2 shows it with that block lit
    if (!after || !frame) return;
    const on = i >= 0;
    if (on && !after.classList.contains('is-on')) { fillAfter(); const need = after.scrollHeight; if (need > frame.clientHeight) frame.style.minHeight = need + 'px'; }
    if (!on && frame.style.minHeight) frame.style.minHeight = '';
    if (on && !after.classList.contains('is-on')) afterOnAt = Date.now();
    if (!on) afterOnAt = 0;
    after.classList.toggle('is-on', on);
    after.setAttribute('aria-hidden', on ? 'false' : 'true');
    after.classList.toggle('has-hl', on);
    after.querySelectorAll<HTMLElement>('[data-after-card]').forEach((c, n) => {
      c.classList.toggle('is-hl', on && n === i);
      c.setAttribute('data-n', String(5 + n));
    });
  }

  function widgetStage(): number {
    const r = widget?.shadowRoot;
    if (!r || r.querySelector('.consent-modal-container')) return -1;
    if (sentOk && lastFields.length) { // set by the mock when the widget confirms: works in any widget language
      if (afterOff) return -1;
      const t = Date.now() - sentAt;
      if (t < AFTER_DELAY) return 3; // the customer's own receipt first
      return 4 + Math.min(2, Math.floor((t - AFTER_DELAY) / AFTER_STEP));
    }
    if (r.querySelector('.progress-confirm-btn')) {
      lastFields = [...r.querySelectorAll('.review-field')].map((f) => {
        const l = f.querySelector('.review-field-label'), v = f.querySelector('.review-field-value');
        return [l ? (l.textContent ?? '').trim() : '', v ? (v.textContent ?? '').trim() : ''];
      }).filter((f) => f[0]);
      return 2;
    }
    if (r.querySelector('.extracted-fields')) return 1;
    if (r.querySelector('.welcome-badges') && !r.querySelector('.message')) return 0;
    return -1;
  }

  function tipTick(): void {
    let want = widgetStage();
    afterSet(want >= 4 ? want - 4 : -1);
    if (want >= 4 && Date.now() - afterOnAt < 900) want = 3; // let the panel finish fading in before its tip replaces the receipt tip
    if (tipOff) { if (tcur >= 0) hideTip(); return; }
    const held = Date.now() - tsince >= MIN_HOLD;
    if (want === tcur) {
      if (Date.now() - tsince > MAX_HOLD) return hideTip();
      if (want === 2) setText(tipRoot.querySelector('[data-tip-body]'), tipBody(2));
      return;
    }
    if (want >= 0 && !tseen[want] && (tcur < 0 || held)) return showTip(want);
    if (want < 0 || tseen[want]) { if (tcur >= 0 && held) hideTip(); }
  }

  function resetTips(): void {
    tip?.classList.add('is-reset'); ring?.classList.add('is-reset'); hideTip();
    requestAnimationFrame(() => requestAnimationFrame(() => { tip?.classList.remove('is-reset'); ring?.classList.remove('is-reset'); }));
    tseen = {}; lastFields = []; sentOk = false; sentData = null; sentId = ''; afterOff = false; afterSet(-1);
  }

  function setTips(off: boolean): void {
    tipOff = off;
    if (off) hideTip(); else tseen = {};
    hooks.tips(off); // the button and its text are the page's: «Hide tips» / «Show tips»
  }

  /* ---------- the consent the script lays down so the show can start (D4, F5) ---------- */
  type Seed = 'script' | 'visitor' | 'declined';
  /** Writes the script's record unless the visitor has one: a record of the visitor is never replaced and never removed here. */
  function seedConsent(): Seed {
    const cur = readConsent();
    if (cur && cur.userId !== SCRIPT_USER_ID) return cur.consentGiven ? 'visitor' : 'declined';
    try {
      const nowIso = new Date().toISOString();
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
        userId: SCRIPT_USER_ID, organizationId: 'org', firstConsentAt: nowIso, lastConsentAt: nowIso,
        policyVersion: CONSENT_POLICY_VERSION, consentGiven: true, consentMethod: 'explicit', checkboxMain: true, checkboxAge: true,
        uiLocale: mockState.lang || 'en', domain: location.hostname, userAgent: 'mock', widgetVersion: '1', consentHistory: [],
      }));
    } catch { /* private mode: the consent screen shows, that is the honest fallback */ }
    return 'script';
  }

  /* ---------- the widget ---------- */
  function mount(): void {
    gen += 1;
    if (tip) resetTips();
    dropSessions(); // F3: a session the widget kept from the last show must not be taken up again
    mountEl!.innerHTML = '';
    widget = doc.createElement('typelessity-widget');
    widget.setAttribute('api-url', DEMO_API_ORIGIN);
    widget.setAttribute('config-id', CONFIG_ID_PREFIX + ids[idx]);
    widget.setAttribute('locale', mockState.lang || 'en');
    widget.setAttribute('position', 'inline');
    mountEl!.appendChild(widget);
    const el = widget;
    let n = 0;
    (function g(): void {
      if (widget !== el) return;
      if (el.shadowRoot && el.shadowRoot.querySelector('.widget-container, .consent-modal-container')) return grow();
      if (++n < 60) later(g, 100);
    })();
    hooks.mounted();
  }

  /* Demo only: one fixed panel height from the first frame to the last, so the page does not jump while the conversation grows. */
  function grow(): void {
    try {
      const sheet = new CSSStyleSheet();
      const m = `${SLOT_HEIGHT_MOBILE_PX}px`, d = `${SLOT_HEIGHT_PX}px`;
      // border-box: the panel's own border is inside the height, so the slot ends exactly as tall as it started (CLS, widget-fonts-csp (g))
      sheet.replaceSync(`.widget-container.inline{height:${d} !important;max-height:${d} !important;box-sizing:border-box !important}@media (max-width:${SLOT_MOBILE_MAX_WIDTH_PX}px){.widget-container.inline{height:${m} !important;max-height:${m} !important}}`);
      const sr = widget!.shadowRoot!;
      if (!sr.adoptedStyleSheets.some((s) => (s as CSSStyleSheet & { __ty?: boolean }).__ty)) {
        (sheet as CSSStyleSheet & { __ty?: boolean }).__ty = true;
        sr.adoptedStyleSheets = sr.adoptedStyleSheets.concat([sheet]);
      }
    } catch { /* older browsers keep the 600px panel */ }
  }

  const inputOf = (): HTMLInputElement | null => q('.pill-input') as HTMLInputElement | null;

  /** the widget showed its own consent screen over the script's record: the show stops and the widget's screen stays (D4) */
  function rejected(): void {
    stop();
    dropScriptConsent();
  }

  function waitReady(cb: (input: HTMLInputElement) => void, myGen: number): void {
    let tries = 0;
    (function poll(): void {
      if (myGen !== gen) return;
      if (auto && q('.consent-modal-container')) return rejected();
      const i = inputOf();
      if (i && !i.disabled) { grow(); return cb(i); }
      if (++tries > 80) return;
      T(poll, 100);
    })();
  }

  function typeInto(input: HTMLInputElement, text: string, myGen: number, done: () => void): void {
    let i = 0;
    (function step(): void {
      if (myGen !== gen || !auto) return;
      i += 1;
      input.value = text.slice(0, i);
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      if (i < text.length) T(step, 55 + Math.random() * 35); else T(done, 1100);
    })();
  }

  /* wait for a widget condition, then go on; gives up quietly after `ms` */
  function until(cond: () => unknown, cb: () => void, myGen: number, ms?: number): void {
    const t0 = Date.now();
    (function poll(): void {
      if (myGen !== gen || !auto) return;
      let ok = false;
      try { ok = !!cond(); } catch { /* not there yet */ }
      if (ok) return cb();
      if (Date.now() - t0 > (ms || 12000)) return;
      T(poll, 150);
    })();
  }

  /* the review list is taller than the panel: scroll it down so the last fields (name, phone) are seen too */
  function scrollReviewDown(): void {
    const el = q('.progress-confirm-btn');
    let p = el && el.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) { p.scrollTo({ top: p.scrollHeight, behavior: 'smooth' }); return; }
      p = p.parentElement;
    }
  }

  /* One run: pause on the topics → type → pause on the fields → pick an option → contact → pause on the request. */
  function play(): void {
    if (!auto || !visible || destroyed) return;
    setChain('idle');
    mockState.scenarioId = ids[idx]!;
    const seed = seedConsent();
    if (seed === 'declined') { // the visitor refused: no show, the widget asks again (F5)
      auto = false; focusBlocked = false; mount(); return;
    }
    focusBlocked = true;
    mount();
    const myGen = gen;
    setText(note, DEMO_TEXT.noteAuto);
    T(() => {
      waitReady(() => {
        T(() => { // 1 · hold on the topics tip before anything moves
          typeInto(inputOf()!, scen().phrase, myGen, () => {
            if (myGen !== gen || !auto) return;
            q('.pill-send')?.click();
            until(() => q('.extracted-fields') && q('.option-badge'), () => {
              T(() => { // 2 · hold on the extracted fields
                const opt = q('.option-badge');
                if (myGen !== gen || !auto || !opt) return;
                hideTip(); opt.click();
                until(() => { const i2 = inputOf(); return i2 && !i2.disabled && widget!.shadowRoot!.querySelectorAll('.message.assistant').length >= 2; }, () => {
                  T(() => {
                    const i3 = inputOf();
                    if (myGen !== gen || !auto || !i3) return;
                    typeInto(i3, scen().c.contact, myGen, () => {
                      if (myGen !== gen || !auto) return;
                      q('.pill-send')?.click();
                      until(() => q('.progress-confirm-btn'), () => {
                        T(scrollReviewDown, 4200);
                        T(() => { // 3 · hold on the request, then send it and let the widget's own «sent» screen show
                          const ok = q('.progress-confirm-btn');
                          if (myGen !== gen || !auto || !ok) return;
                          hideTip(); ok.click();
                          T(() => {
                            if (myGen === gen && auto) {
                              idx = nextShownIndex(ids, idx, tabShown);
                              hooks.scenario(ids[idx]!);
                              play();
                            }
                          }, 31000);
                        }, 9000);
                      }, myGen, 15000);
                    });
                  }, 1000);
                }, myGen, 15000);
              }, 7000);
            }, myGen, 15000);
          });
        }, 3800);
      }, myGen);
    }, 1200);
  }

  /* The mock reports the first message: light the cards in step with the widget, for the script and for a human. One hook each, replaced here and cleared on destroy (F6). */
  mockState.onConfirm = (_sid, rid, data) => {
    sentOk = true; sentAt = Date.now(); sentId = rid; sentData = data || {};
    const meta = chain?.querySelector('[data-chain-sent-meta]');
    setText(meta ?? null, rid + ' · ' + DEMO_TEXT.chainSentMeta);
    later(() => setChain('sent'), 600);
  };
  mockState.onMessage = (step) => {
    if (step === 1) {
      later(() => setChain('json'), 1400);
      later(() => setChain('api'), 3600);
    }
  };

  function stop(): void {
    auto = false; focusBlocked = false; clearAll();
    setText(note, DEMO_TEXT.noteStopped);
  }

  function focusConsent(myGen: number, tries = 0): void {
    if (destroyed || myGen !== gen) return;
    const box = q('.consent-modal-container');
    if (box) {
      const first = box.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (first) { first.focus({ preventScroll: true }); return; }
    }
    if (tries < 40) later(() => focusConsent(myGen, tries + 1), 100);
  }

  /** The one handler of the three doors (the button, a click in the slot, a key of input): the show stops, the script's record goes, the widget asks. */
  function takeOver(): void {
    stop();
    clearMisc();
    setChain('idle');
    dropScriptConsent(); // before the consent screen: the visitor's own consent must not inherit the script's userId (consent.service.ts:179)
    mount();
    focusConsent(gen);
  }

  function pick(id: string): void {
    idx = Math.max(0, ids.indexOf(id)); clearAll(); clearMisc(); gen += 1;
    hooks.scenario(ids[idx]!);
    mockState.scenarioId = ids[idx]!;
    if (reduced) { auto = false; focusBlocked = false; setChain('idle'); seedFor(); mount(); return; }
    auto = true; play();
  }
  /** reduced motion: no show, the widget stands with its welcome screen (on the script's record, or the visitor's) */
  function seedFor(): void { if (seedConsent() === 'declined') { /* the widget asks again */ } }

  function setLang(code: string): void {
    if (code === mockState.lang) return;
    mockState.lang = code;
    hooks.lang(code);
    pick(ids[idx]!);
  }

  /* ---------- the doors: a click in the slot, a key of input (F5). Only while the script plays, only a person (isTrusted). ---------- */
  const isInputKey = (e: KeyboardEvent): boolean =>
    (e.key.length === 1 && !e.ctrlKey && !e.metaKey) || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete';
  const onDoor = (e: Event): void => {
    if (!auto || !e.isTrusted) return;
    if (e.type === 'keydown' && !isInputKey(e as KeyboardEvent)) return; // Tab, Escape, arrows… move through the page, they take nothing over (SC 3.2.1)
    e.stopPropagation(); e.preventDefault(); // the event must not reach the widget that is about to be replaced
    takeOver();
  };
  host.addEventListener('click', onDoor, true);
  host.addEventListener('keydown', onDoor, true);

  if (tip) {
    tick = setInterval(tipTick, 250);
  }
  const jsonTog = stage.querySelector<HTMLElement>('[data-after-toggle]');
  const onJsonTog = (): void => showJson(!!after?.querySelector<HTMLElement>('[data-after-json]')?.hidden);
  jsonTog?.addEventListener('click', onJsonTog);
  const backBtn = stage.querySelector<HTMLElement>('[data-after-back]');
  const onBack = (): void => { afterOff = true; afterSet(-1); hideTip(); };
  backBtn?.addEventListener('click', onBack);

  let observer: IntersectionObserver | null = null;
  if ('IntersectionObserver' in win) {
    observer = new IntersectionObserver((es) => {
      const was = visible;
      visible = !!es[0]?.isIntersecting;
      if (visible && !was && auto && !timers.length) play();
      if (!visible && auto) { clearAll(); gen += 1; }
    }, { threshold: 0.2 });
    observer.observe(stage);
  }

  const onPageHide = (): void => dropEverything();
  win.addEventListener('pagehide', onPageHide);

  /* ---------- start ---------- */
  patchGlobals();
  installDemoMock(win);
  mockState.lang = start.lang || 'en';
  mockState.scenarioId = ids[idx]!;
  hooks.scenario(ids[idx]!);
  hooks.lang(mockState.lang);
  setTips(tipOff);
  setChain('idle');
  if (start.takeOver) {
    takeOver();
  } else if (start.picked) {
    pick(ids[idx]!);
  } else if (auto) {
    play();
  } else {
    seedFor(); mount(); setChain('api');
  }

  return {
    pick, setLang, takeOver, setTips,
    destroy(): void {
      if (destroyed) return;
      destroyed = true; gen += 1;
      clearAll();
      clearMisc();
      if (tick) clearInterval(tick);
      if (raf) cancelAnimationFrame(raf);
      observer?.disconnect();
      host.removeEventListener('click', onDoor, true);
      host.removeEventListener('keydown', onDoor, true);
      jsonTog?.removeEventListener('click', onJsonTog);
      backBtn?.removeEventListener('click', onBack);
      win.removeEventListener('pagehide', onPageHide);
      mockState.onConfirm = null; mockState.onMessage = null;
      widget?.remove(); widget = null; mountEl.innerHTML = '';
      dropEverything();
      patched?.restore();
      uninstallDemoMock();
    },
  };
}
