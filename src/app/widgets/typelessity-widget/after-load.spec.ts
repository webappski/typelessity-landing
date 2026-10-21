import { test } from 'node:test';
import assert from 'node:assert/strict';
import { afterLoadAndIdle, PAINT_FUSE_MS } from './after-load';

// FL-93 (L13): the demo (its chunk and widget.js) starts loading after load, an idle moment and — where the browser reports paint timing — the first
// contentful paint. A fake window stands for the browser: its timers, its idle callback, its observer and its paint entries are driven by the test.

interface Fake { doc: Document; fire(): void; idle(): void; paint(): void; fuse(): void; observers: number; ran: () => number; asked: () => number }

function fake(opts: { paintSupported?: boolean; painted?: boolean; hidden?: boolean; idleCallback?: boolean; observeThrows?: boolean; browserTimers?: boolean } = {}): Fake {
  const timerErrors: unknown[] = [];  // browserTimers: a timer callback that throws does not stop the page, the way a browser has it; the error is kept for the test
  const timers: Array<{ fn: () => void; ms: number }> = [];  // the delay is kept: the fuse (PAINT_FUSE_MS) is told from the zero timer and the 200 ms timer of Safari
  const idles: Array<() => void> = [];
  let entries: unknown[] = opts.painted ? [{ name: 'first-contentful-paint' }] : [];
  let callback: ((l: { getEntriesByName: (n: string) => unknown[] }) => void) | null = null;
  let observers = 0;
  class Observer {
    static supportedEntryTypes = opts.paintSupported === false ? ['resource'] : ['paint', 'resource'];
    constructor(cb: (l: { getEntriesByName: (n: string) => unknown[] }) => void) { callback = cb; observers++; }
    observe(): void { if (opts.observeThrows) throw new TypeError('observe: the entry type is not supported'); /* buffered entries are read through getEntriesByName by the page itself */ }
    disconnect(): void { callback = null; }
  }
  const listeners: Array<() => void> = [];
  const win: Record<string, unknown> = {
    setTimeout: (fn: () => void, ms = 0) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: (id: number) => { const t = timers[id - 1]; if (t) t.fn = () => undefined; },
    addEventListener: (_: string, fn: () => void) => { listeners.push(fn); },
    PerformanceObserver: Observer,
    performance: { getEntriesByName: (n: string) => entries.filter((e) => (e as { name: string }).name === n) },
  };
  let asked = 0;
  if (opts.idleCallback !== false) win['requestIdleCallback'] = (fn: () => void) => { asked++; idles.push(fn); return idles.length; };
  const doc = { defaultView: win, readyState: 'loading', visibilityState: opts.hidden ? 'hidden' : 'visible' } as unknown as Document;
  let ran = 0;
  const runTimers = (take: (ms: number) => boolean) => {
    const due = timers.filter((t) => take(t.ms));
    for (const t of due) timers.splice(timers.indexOf(t), 1);
    due.forEach((t) => { if (!opts.browserTimers) return t.fn(); try { t.fn(); } catch (e) { timerErrors.push(e); } });
  };
  const api = {
    doc, observers: 0,
    fire() { listeners.splice(0).forEach((f) => f()); runTimers((ms) => ms < PAINT_FUSE_MS); },
    idle() { idles.splice(0).forEach((f) => f()); runTimers((ms) => ms < PAINT_FUSE_MS); },
    fuse() { runTimers((ms) => ms >= PAINT_FUSE_MS); },
    paint() { entries = [{ name: 'first-contentful-paint' }]; callback?.({ getEntriesByName: (n) => entries.filter((e) => (e as { name: string }).name === n) }); runTimers((ms) => ms < PAINT_FUSE_MS); },
    ran: () => ran,
    asked: () => asked,
  } as Fake;
  Object.defineProperty(api, 'observers', { get: () => observers });
  (api as unknown as { errors: unknown[] }).errors = timerErrors;
  (api as unknown as { start: () => () => void }).start = () => afterLoadAndIdle(doc, () => { ran++; });
  return api;
}
const start = (f: Fake) => (f as unknown as { start: () => () => void }).start();

test('before the first paint nothing starts: load and idle are not enough', () => {
  const f = fake();
  start(f);
  f.fire();   // load, then the zero timer: the observer is made, the idle callback is not yet asked for
  f.idle();
  assert.equal(f.ran(), 0, 'the demo started before the first contentful paint');
  assert.equal(f.observers, 1);
});

test('the paint starts it: after the paint the idle callback runs it, once', () => {
  const f = fake();
  start(f);
  f.fire();
  f.paint();
  f.idle();
  assert.equal(f.ran(), 1);
  f.paint(); f.idle();
  assert.equal(f.ran(), 1, 'once');
  assert.equal(f.asked(), 1, 'the idle callback is asked for once: the observer let go of the paint after the first report');
});

test('a paint that has already happened does not wait for a second one', () => {
  const f = fake({ painted: true });
  start(f);
  f.fire(); f.idle();
  assert.equal(f.ran(), 1);
  assert.equal(f.observers, 0, 'no observer is made for a paint that is in the entries');
});

test('a visitor who clicked does not wait for the paint, nor for idle', () => {
  const f = fake();
  const go = start(f);
  go();
  assert.equal(f.ran(), 1);
  f.fire(); f.paint(); f.idle();
  assert.equal(f.ran(), 1, 'the scheduled start does not run it a second time');
});

test('a browser with no paint timing keeps the old order: load, idle', () => {
  const f = fake({ paintSupported: false });
  start(f);
  f.fire(); f.idle();
  assert.equal(f.ran(), 1);
  assert.equal(f.observers, 0);
});

test('a tab in the background paints nothing and does not wait for it', () => {
  const f = fake({ hidden: true });
  start(f);
  f.fire(); f.idle();
  assert.equal(f.ran(), 1);
});

test('without requestIdleCallback (Safari) a timer takes its place, after the paint', () => {
  const f = fake({ idleCallback: false });
  start(f);
  f.fire();
  f.paint();
  f.idle();
  assert.equal(f.ran(), 1);
});

// Test-design L13-7: a paint that never comes. The page is visible, the browser lists `paint` and reports nothing (a page restored from the back-forward cache,
// a prerendered page): without a limit the demo would wait for the visitor's click for good.
test('a paint that never comes: the fuse starts the demo by the old order, once, and the late paint does not start it again', () => {
  const f = fake();
  start(f);
  f.fire();
  f.idle();
  assert.equal(f.ran(), 0, 'before the fuse the demo still waits for the paint');
  f.fuse();
  f.idle();
  assert.equal(f.ran(), 1, 'the fuse did not start the demo');
  f.paint(); f.idle();
  assert.equal(f.ran(), 1, 'once');
  assert.equal(f.asked(), 1, 'the idle callback is asked for once: the paint after the fuse is not a second start');
});

test('the paint before the fuse cancels it: the fuse starts nothing a second time', () => {
  const f = fake();
  start(f);
  f.fire(); f.paint(); f.idle();
  assert.equal(f.ran(), 1);
  f.fuse(); f.idle();
  assert.equal(f.ran(), 1);
  assert.equal(f.asked(), 1);
});

// An observer that cannot observe (observe() throws in a browser that lists `paint` and does not take {type, buffered}): the exception would leave through the
// timer, nothing would wait for a paint and nothing would start the demo. It starts at once, by the old order, and the fuse that was armed does not start it again.
test('observe() that throws does not leave the demo without a start: it runs by the old order at once, once, and the fuse is let go of', () => {
  const f = fake({ observeThrows: true, browserTimers: true });
  start(f);
  f.fire();
  f.idle();
  assert.deepEqual((f as unknown as { errors: unknown[] }).errors, [], 'the exception left through the timer');
  assert.equal(f.ran(), 1, 'the demo did not start without the fuse (it would wait for the visitor\'s click for good)');
  f.fuse();
  f.idle();
  assert.equal(f.ran(), 1, 'once');
  assert.equal(f.asked(), 1, 'the idle callback is asked for once: the fuse that was armed is cleared when observe() fails');
});
