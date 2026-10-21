// When the demo may start loading (L3 D6, F13.1; FL-93, L13). Kept in a file of its own, without Angular, so a unit spec can drive it with a fake window.

/**
 * Calls `run` after the `load` event, then an idle moment, then — where the browser reports paint timing — after the FIRST CONTENTFUL PAINT
 * (FL-93, L13): the prerendered HTML carries no <script> for the widget and no code of the demo, so neither costs anything to the first render,
 * and they must not be on the road either. In Google's lab (PageSpeed Insights, mobile) the chunk of the demo (~1.5 s) and widget.js (~1.65 s)
 * were requested before the first paint (observed at ~2.5 s on that machine), and the model that estimates the metrics appears to count every
 * request that starts before the paint (hypothesis of L13, read from the PSI traces of 21.10; to be confirmed by `psi.sh` after the release): home FCP 3.4 s /
 * LCP 4.7 s, against 1.7 s / 1.8 s on /how-it-works, which has no demo. The load now starts after the paint it could have delayed. Safari has no requestIdleCallback: a timer instead; a browser with no paint timing keeps the old order (load, idle); a paint that does not come in PAINT_FUSE_MS (5 s) is given up on, same order.
 * Returns a function that runs `run` at once (a visitor who clicked the demo does not wait for idle or for paint) — once, whichever comes first.
 */
/** How long the demo waits for a paint that does not come (a page restored from the back-forward cache, a prerendered page, a browser that lists `paint` and reports nothing): after it the old order (load, idle) is used. Test-design L13-7. */
export const PAINT_FUSE_MS = 5000;

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
    // whichever comes first (the paint, the fuse) lets go of the other: the observer is disconnected, the fuse is cleared, so `then` runs once
    const settle = () => { observer.disconnect(); win.clearTimeout(fuse); then(); };
    const observer = new Observer((list) => {
      if (list.getEntriesByName('first-contentful-paint').length > 0) settle();
    });
    observer.observe({ type: 'paint', buffered: true });
    // the fuse: a paint that never comes must not keep the demo away until the visitor clicks it (it would be the one case where the page is visible and the demo never loads)
    const fuse = win.setTimeout(settle, PAINT_FUSE_MS);
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
