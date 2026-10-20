// The loader of the home-page demo (L4, D3, D4, F11): the part that lives in the MAIN bundle. It decides when the lazy chunk of the
// demo (controller + scenarios + mock, ~one file) is fetched, in which order the pieces arrive and what the slot says meanwhile:
//
//   hydration → «Loading the chat…» → load + idle → import() of the chunk → the interceptor is put on `fetch` → the <script> of the
//   widget → customElements.whenDefined (10 s) → the controller mounts the first <typelessity-widget config-id=…>
//
// A visitor who clicks a tab, a language or «Try the chat now» before the chunk is there does not wait for idle and is not lost: the
// last intent is remembered and applied at the start (the result is a take-over or a pick, never the first scenario's show).
// Failure — the chunk or the script did not load, or no definition within 10 s — says so in the slot and disables the buttons; a
// definition that arrives late still mounts the demo over the text. The session is one per visit to `/`: `destroy()` (DestroyRef)
// takes everything down.
//
// This file must not import demo-script.ts, demo-mock.ts or demo-controller.ts as values: they travel in the lazy chunk (C2(c)).
import { afterLoadAndIdle, loadWidgetScript, WIDGET_SCRIPT_ERROR, WIDGET_TAG } from '../../../widgets/typelessity-widget/typelessity-widget.component';
import { WIDGET_DEFINE_TIMEOUT_MS, type SlotState } from './demo-labels';
import type { DemoController, DemoStart } from './demo-controller';

export interface SessionHooks {
  slot(state: SlotState): void;
  scenario(id: string): void;
  lang(code: string): void;
  tips(off: boolean): void;
}

type Chunk = typeof import('./demo-controller');

export class DemoSession {
  private ctrl: DemoController | null = null;
  private chunk: Chunk | null = null;
  private destroyed = false;
  private started = false;
  private skipIdle: (() => void) | null = null;
  private readonly intent: DemoStart = { scenario: 'salon', lang: 'en' };
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly root: HTMLElement, private readonly doc: Document, private readonly hooks: SessionHooks) {}

  /** Called after hydration (afterNextRender): the slot turns from the prerender text to «Loading the chat…» and the load starts. */
  begin(): void {
    this.start(this.hasIntent());
  }

  private hasIntent(): boolean {
    return !!(this.intent.takeOver || this.intent.picked);
  }

  private start(immediate: boolean): void {
    if (this.destroyed) return;
    if (this.started) { if (immediate) this.skipIdle?.(); return; }
    this.started = true;
    this.hooks.slot('loading');
    const go = () => { this.skipIdle = null; void this.load(); };
    if (immediate) go();
    else this.skipIdle = afterLoadAndIdle(this.doc, go);
  }

  private fail(): void {
    if (!this.destroyed) this.hooks.slot('failed');
  }

  private async load(): Promise<void> {
    if (this.destroyed) return;
    let chunk: Chunk;
    try {
      chunk = await import('./demo-controller');
    } catch {
      this.started = false; // the next visit to the page asks again
      return this.fail();
    }
    if (this.destroyed) return;
    this.chunk = chunk;
    const win = this.doc.defaultView!;
    chunk.installDemoMock(win as Window & typeof globalThis); // the interceptor stands before the script of the widget is even asked for (D3)
    // an `error` of the tag of widget.js (the file is not coming: blocked, offline, a CDN down) is a refusal NOW; silence is a refusal after 10 s
    let onError: (() => void) | null = null;
    const errored = new Promise<boolean>((resolve) => {
      onError = () => resolve(false);
      this.doc.addEventListener(WIDGET_SCRIPT_ERROR, onError, { once: true });
    });
    try {
      await loadWidgetScript(this.doc, { immediate: true });
    } catch {
      this.doc.removeEventListener(WIDGET_SCRIPT_ERROR, onError!);
      chunk.uninstallDemoMock();
      this.started = false;
      return this.fail();
    }
    if (this.destroyed) { this.doc.removeEventListener(WIDGET_SCRIPT_ERROR, onError!); return; }
    const defined = win.customElements.whenDefined(WIDGET_TAG).then(() => true);
    const timedOut = new Promise<boolean>((resolve) => {
      this.timeout = setTimeout(() => resolve(false), WIDGET_DEFINE_TIMEOUT_MS);
    });
    const ok = await Promise.race([defined, timedOut, errored]);
    this.doc.removeEventListener(WIDGET_SCRIPT_ERROR, onError!);
    if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
    if (this.destroyed) return;
    if (!ok) {
      this.fail(); // the tag stays: the definition may still come, and then the demo mounts over this text
      await defined;
      if (this.destroyed) return;
    }
    this.mountDemo(chunk);
  }

  private mountDemo(chunk: Chunk): void {
    if (this.ctrl || this.destroyed) return;
    this.ctrl = chunk.createDemoController(
      this.root,
      {
        scenario: (id) => this.hooks.scenario(id),
        lang: (code) => this.hooks.lang(code),
        tips: (off) => this.hooks.tips(off),
        mounted: () => this.hooks.slot('ready'),
      },
      this.intent,
    );
  }

  /* ---------- the doors of the page: a tab, a language, «Try the chat now», the tips ---------- */
  pick(id: string): void {
    this.intent.scenario = id; this.intent.picked = true;
    this.hooks.scenario(id);
    if (this.ctrl) this.ctrl.pick(id);
    else this.start(true);
  }

  setLang(code: string): void {
    this.intent.lang = code; this.intent.picked = true;
    this.hooks.lang(code);
    if (this.ctrl) this.ctrl.setLang(code);
    else this.start(true);
  }

  takeOver(): void {
    this.intent.takeOver = true;
    if (this.ctrl) this.ctrl.takeOver();
    else this.start(true);
  }

  setTips(off: boolean): void {
    this.intent.tipsOff = off;
    this.hooks.tips(off);
    this.ctrl?.setTips(off);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
    this.skipIdle = null;
    if (this.ctrl) this.ctrl.destroy();
    else this.chunk?.uninstallDemoMock();
    this.ctrl = null;
  }
}
