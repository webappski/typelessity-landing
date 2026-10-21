import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WIDGET_SCRIPT_URL } from '../../core/integrations/embed-snippet';
import { SLOT_TEXT, type SlotState } from '../../pages/home/demo/demo-labels';
import { afterLoadAndIdle } from './after-load';

// Moved to after-load.ts (FL-93): the same function, importable without Angular. Re-exported: the demo loader imports it from here.
export { afterLoadAndIdle };

export const WIDGET_TAG = 'typelessity-widget';
/** Fired on the document when the <script> of the widget fails (the demo loader shows its refusal at once, not after the 10 s wait). */
export const WIDGET_SCRIPT_ERROR = 'typelessity:widget-script-error';

/**
 * Times the script failed in this document. A browser keeps the FAILED fetch of a module in its module map for the life of the document, so a
 * second tag with the same address fails again without asking the network; a visit that comes back to `/` after a failure therefore asks for
 * `widget.js?retry=<n>` (a new address, the same file), and the network is asked again (L4, B8(a)).
 */
let failures = 0;

/** Set while a request for the script is in the page (scheduled, inserted, or waiting for its definition). Reset by an `error` of the tag. */
let pending: Promise<void> | null = null;
/** Inserts the tag NOW, when the request is still waiting for its idle moment (an early click on the demo asks for it). */
let kick: (() => void) | null = null;

/**
 * Puts the <script> of the widget on the page, once. Resolves when the tag is there (the caller waits for the definition itself:
 * `customElements.whenDefined`), rejects when the tag fires `error` — and then the tag is removed and the request forgotten, so
 * the next visit to the page asks again instead of waiting for ever (F11). Idempotent: if the element is already defined or a tag
 * already stands in the page (a second visit to `/` in the same session, or a tag still on its way after a timeout), nothing is added.
 *
 * Without `immediate` it waits for `load` and an idle moment first; the demo (home page) calls it with `immediate: true`, after its
 * own chunk and the interceptor are in place (D3).
 */
export function loadWidgetScript(doc: Document, options: { immediate?: boolean } = {}): Promise<void> {
  const win = doc.defaultView;
  if (!win) return Promise.reject(new Error('widget: no window'));
  if (win.customElements.get(WIDGET_TAG)) return Promise.resolve();
  if (pending) {
    if (options.immediate) kick?.();
    return pending;
  }
  const request = new Promise<void>((resolve, reject) => {
    let inserted = false;
    const insert = () => {
      if (inserted) return;
      inserted = true;
      kick = null;
      if (win.customElements.get(WIDGET_TAG) || doc.querySelector('script[data-typelessity-widget]')) return resolve();
      const script = doc.createElement('script');
      script.type = 'module';
      script.src = failures === 0 ? WIDGET_SCRIPT_URL : `${WIDGET_SCRIPT_URL}?retry=${failures}`;
      script.setAttribute('data-typelessity-widget', '');
      script.addEventListener('error', () => {
        script.remove();
        failures += 1;
        if (pending === request) pending = null;
        doc.dispatchEvent(new Event(WIDGET_SCRIPT_ERROR));
        reject(new Error('widget.js did not load'));
      }, { once: true });
      doc.head.appendChild(script);
      resolve();
    };
    kick = insert;
    if (options.immediate) insert();
    else afterLoadAndIdle(doc, insert);
  });
  pending = request;
  return request;
}

/**
 * The place of the real widget in the hero (F11). The widget itself is not in the HTML: the demo controller mounts it into
 * `[data-widget-mount]` after hydration. What this component draws is the slot — a fixed-height frame (set by its parent from one
 * constant, so the page does not move when the widget arrives) with the status text of the three states:
 *   prerender — «The demo chat runs in the real widget and needs JavaScript.» and the link to /how-it-works;
 *   loading   — «Loading the chat…»;
 *   failed    — «The demo chat could not load.» and the same link, in a live region.
 * `[data-widget-mount]` stays EMPTY here: Angular does not own what the controller puts in it.
 */
@Component({
  selector: 'app-typelessity-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="tw-slot" data-widget-host [attr.data-slot-state]="state()">
      <div data-widget-mount></div>
      @if (state() !== 'ready') {
        <div class="tw-status" role="status" data-slot-status>
          @switch (state()) {
            @case ('loading') { <p>{{ text.loading }}</p> }
            @case ('failed') {
              <p>{{ text.failed }}</p>
              <a [routerLink]="text.linkHref">{{ text.linkText }}</a>
            }
            @default {
              <p>{{ text.prerender }}</p>
              <a [routerLink]="text.linkHref">{{ text.linkText }}</a>
            }
          }
        </div>
      }
    </div>
  `,
  styleUrl: './typelessity-widget.component.scss',
})
export class TypelessityWidgetComponent {
  readonly state = input<SlotState>('prerender');
  protected readonly text = SLOT_TEXT;
}
