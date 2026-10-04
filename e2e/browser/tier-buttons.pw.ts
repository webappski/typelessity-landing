import { test, expect } from '@playwright/test';

// The four tiers are compared side by side, so their start buttons are one size, on one line of
// text and on one level — the cards' bottom edge — whatever the text above them (seen uneven on
// /pricing, 2026-09-25). The paid tiers say «Start with the free pilot» (founder 25.09): 1121px is the
// narrowest viewport that still shows four columns, 1120px the widest that shows two — the label has to
// stay on one line at both ends of that edge, and on a phone.

for (const path of ['/', '/pricing']) {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 1121, height: 900 }, { width: 1120, height: 900 }, { width: 1024, height: 900 }, { width: 375, height: 812 }]) {
    test(`${path} at ${viewport.width}px: the tier buttons are one size, on one line of text`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const buttons = page.locator('.home-tiers .tier > .vc-btn');
      await expect(buttons).toHaveCount(4);
      const boxes = await buttons.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
          const content = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
          const lines = Math.round(content / lineHeight);
          const card = el.parentElement!.getBoundingClientRect();
          // nowrap keeps a too-long label on one line by letting it spill out of the button: count that too.
          return { width: r.width, height: r.height, bottom: r.bottom, lines, cardWidth: card.width, spill: el.scrollWidth - el.clientWidth };
        }),
      );
      const labels = await buttons.allTextContents();
      expect(labels.map((l) => l.trim())).toEqual(['Start free pilot', 'Start with the free pilot', 'Start with the free pilot', 'Start with the free pilot']);
      const spread = (k: 'width' | 'height') => Math.max(...boxes.map((b) => b[k])) - Math.min(...boxes.map((b) => b[k]));
      expect(spread('width')).toBeLessThanOrEqual(1);
      expect(spread('height')).toBeLessThanOrEqual(1);
      for (const b of boxes) expect(b.lines, 'button text wraps').toBe(1);
      for (const b of boxes) expect(b.spill, 'button text spills out of the button').toBeLessThanOrEqual(1);
      if (viewport.width >= 1121) {
        const bottoms = boxes.map((b) => b.bottom);
        expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
      }
    });
  }
}
