// When the demo may start loading (L3 D6, F13.1; FL-93, L13). Kept in a file of its own, without Angular, so a unit spec can drive it with a fake window.

/** How long the demo waits for a paint that does not come (a page restored from the back-forward cache, a prerendered page, a browser that lists `paint` and reports nothing): after it the old order (load, idle) is used. */
export const PAINT_FUSE_MS = 5000;

/**
 * Calls `run` after the `load` event, an idle moment and — where the browser reports paint timing — the first contentful paint. The prerendered HTML
 * carries no <script> for the widget, so the demo costs nothing to the first render; its chunk and widget.js must not be requested before that paint either:
 * the lab model that scores the page appears to count every request that starts before it (a hypothesis, to be confirmed by a PageSpeed run after the release).
 * Safari has no requestIdleCallback: a timer instead. A browser with no paint timing, or a tab in the background, keeps the old order (load, idle). A paint
 * that does not come in PAINT_FUSE_MS is given up on, same order; so is an observer that cannot observe.
 * Returns a function that runs `run` at once (a visitor who clicked the demo does not wait for idle or for paint) — once, whichever comes first.
 */
export function afterLoadAndIdle(doc: Document, run: () => void): () => void {
  const win = doc.defaultView;
  let done = false;
  const go = () => { if (!done) { done = true; run(); } };
  if (!win) return go;
  const afterPaint = (then: () => void): void => {
    const Observer = win.PerformanceObserver;
    let supported = false;
    try { supported = !!Observer && Array.isArray(Observer.supportedEntryTypes) && Observer.supportedEntryTypes.includes('paint'); } catch { supported = false; }
    if (!supported || doc.visibilityState === 'hidden') return then(); // a tab in the background paints nothing and must not wait for it
    const painted = () => win.performance.getEntriesByName('first-contentful-paint').length > 0;
    if (painted()) return then();
    // whichever comes first (the paint, the fuse, a failed observe) lets go of the others: the observer is disconnected, the fuse is cleared, so `then` runs once
    let observer: PerformanceObserver | null = null;
    let fuse = 0; // armed before anything can call `settle`, and a paint that never comes must not keep the demo away until the visitor clicks it
    const settle = () => { observer?.disconnect(); win.clearTimeout(fuse); then(); };
    fuse = win.setTimeout(settle, PAINT_FUSE_MS);
    try {
      observer = new Observer((list) => {
        if (list.getEntriesByName('first-contentful-paint').length > 0) settle();
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch { settle(); } // an observer that cannot observe must not leave the demo without a start
  };
  const whenIdle = () =>
    win.setTimeout(() => {
      const start = () => {
        if (typeof win.requestIdleCallback === 'function') win.requestIdleCallback(go, { timeout: 4000 });
        else win.setTimeout(go, 200);
      };
      afterPaint(start);
    }, 0);
  if (doc.readyState === 'complete') whenIdle();
  else win.addEventListener('load', whenIdle, { once: true });
  return go;
}
