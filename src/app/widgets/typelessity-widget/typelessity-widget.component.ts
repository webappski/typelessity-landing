import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, afterNextRender, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { WIDGET_API_URL, WIDGET_SCRIPT_URL } from '../../core/integrations/embed-snippet';

const WIDGET_TAG = 'typelessity-widget';
/** Set once the script tag is on the page: a visit that comes back to this page must not add a second one. */
let requested = false;

/**
 * Loads the widget script AFTER the first paint and after the load event, in an idle moment (D6, F13.1). The prerendered HTML
 * carries the element but never a <script> for it, so the widget costs nothing to the first render. Idempotent: if the element
 * is already defined or a tag is already there (a second visit to `/` in the same session), nothing is added.
 */
function loadWidgetScript(doc: Document): void {
  const win = doc.defaultView;
  if (!win || requested || win.customElements.get(WIDGET_TAG) || doc.querySelector('script[data-typelessity-widget]')) return;
  const insert = () => {
    if (requested || win.customElements.get(WIDGET_TAG)) return;
    requested = true;
    const script = doc.createElement('script');
    script.type = 'module';
    script.src = WIDGET_SCRIPT_URL;
    script.setAttribute('data-typelessity-widget', '');
    doc.head.appendChild(script);
  };
  // `load` has ended once the next task runs; then an idle moment (Safari has no requestIdleCallback: a timer instead).
  const whenIdle = () =>
    win.setTimeout(() => {
      if (typeof win.requestIdleCallback === 'function') win.requestIdleCallback(insert, { timeout: 4000 });
      else win.setTimeout(insert, 200);
    }, 0);
  if (doc.readyState === 'complete') whenIdle();
  else win.addEventListener('load', whenIdle, { once: true });
}

/**
 * The hero slot of the real widget (replaces the animated mock-up). The slot has a fixed min-height — the widget draws into it
 * after load, and the page must not move (CLS). Hero layout, suggestions and scenarios are L4's; on localhost the widget has no
 * configuration and draws its «could not load» state.
 */
@Component({
  selector: 'app-typelessity-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="tw-slot">
      <typelessity-widget position="inline" [attr.api-url]="apiUrl"></typelessity-widget>
    </div>
  `,
  styleUrl: './typelessity-widget.component.scss',
})
export class TypelessityWidgetComponent {
  protected readonly apiUrl = WIDGET_API_URL;
  private readonly document = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => loadWidgetScript(this.document));
  }
}
