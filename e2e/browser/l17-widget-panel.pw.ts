import { test, expect, REDUCED_MOTION } from './fixtures';
import { SLOT_HEIGHT_MOBILE_PX, SLOT_HEIGHT_PX, SLOT_MOBILE_MAX_WIDTH_PX } from '../../src/app/pages/home/demo/demo-labels';

// FL-116 / FL-124 (L17): the card of the demo widget is never SEEN at a height other than the one the page fixes it to. The demo controller fixes the panel of the widget
// (`.widget-container.inline`) to the height of the slot (720 px, 640 px at 720 px and below) by an adopted style sheet. It used to do that when its poll (every 100 ms) saw
// the drawn card, so the card was seen at its own 400 px, then at 600, then at 720 and its content moved twice: a layout shift of 0.0123 at 1440×844, since the demo frame
// had come up into the first screen. The page's layout shift is held at 0 by free-ai-visibility-pilot.pw.ts, but a shift needs a frame painted between two states, and on a
// busy machine the three states can fall into one frame and the shift is not reported — a test of the shift alone passes with the defect (the mutant of this card did).
// This test does not wait for a frame: a MutationObserver on the shadow root of the widget (it runs in the microtask after the card is added, before any paint) reads the
// computed height (a string: «auto» is what an unfixed card has) of the card the first time it exists, and a sampler reads it every frame after; neither may see another height than the fixed one.
// The two numbers come from the code of the page (demo-labels.ts), the seam is the page's own constant, not a literal here.
test.use(REDUCED_MOTION);

for (const [width, height] of [[1440, 900], [1280, 800], [768, 1024], [390, 844]] as const) {
  const fixed = width <= SLOT_MOBILE_MAX_WIDTH_PX ? SLOT_HEIGHT_MOBILE_PX : SLOT_HEIGHT_PX;
  test(`the card of the widget is first seen at its fixed height (${fixed}px) and never at another, at ${width}×${height}`, async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __first: string[]; __seen: string[] };
      w.__first = []; w.__seen = [];
      const cardOf = (n: Node): Element | null => (n instanceof Element ? (n.matches('.widget-container') ? n : n.querySelector('.widget-container')) : null);
      const attach = Element.prototype.attachShadow;
      Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit): ShadowRoot {
        const root = attach.call(this, init);
        if (this.localName === 'typelessity-widget') {
          new MutationObserver((records) => {
            for (const r of records) for (const n of Array.from(r.addedNodes)) {
              const c = cardOf(n);
              if (c) w.__first.push(getComputedStyle(c).height);
            }
          }).observe(root, { childList: true, subtree: true });
          const sample = (): void => {
            const c = root.querySelector('.widget-container');
            if (c) w.__seen.push(getComputedStyle(c).height);
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }
        return root;
      };
    });
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => !!document.querySelector('typelessity-widget')?.shadowRoot?.querySelector('.widget-container')), { message: 'the widget drew its card', timeout: 20_000 }).toBe(true);
    // the old poll fixed the height up to 100 ms later: let it have its chance — not a time but 30 frames with the card in them (a frame is at least 16 ms: 480 ms, more on a busy machine)
    await page.waitForFunction(() => (window as unknown as { __seen: string[] }).__seen.length >= 30, null, { timeout: 20_000 });
    const m = await page.evaluate(() => ({ first: (window as unknown as { __first: string[] }).__first, seen: (window as unknown as { __seen: string[] }).__seen }));
    expect(m.first.length, 'the card was seen being added (the observer works)').toBeGreaterThan(0);
    expect(m.first, `the first sight of the card: ${JSON.stringify(m.first)}`).toEqual(m.first.map(() => `${fixed}px`));
    expect([...new Set(m.seen)], `every height the card had at a frame: ${JSON.stringify([...new Set(m.seen)])}`).toEqual([`${fixed}px`]);
  });
}
