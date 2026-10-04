import { test, expect } from '@playwright/test';

// r64 frames (c8, 2026-10-04): the footer line «A product of Webappski. Sister product: TypelessForm.» wraps, and the
// links «webappski.com · typelessform.com» used to be an inline box with a 4px margin-left — once it fell onto
// the new line it started indented, as if after a space (visible at 390 and 1280). The links are a block of their
// own: on their own line, flush with the paragraph's left edge, the first link at the block's very start.
// Geometry, not a class check: whatever the CSS is, the links must not hang to the right of the text above them.

for (const width of [390, 1280]) {
  test(`footer at ${width}px — the parent-brand links sit on their own line, flush left, no leading gap`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const links = page.locator('.vc-footer-parent-links');
    await links.scrollIntoViewIfNeeded();

    const geometry = await page.evaluate(() => {
      const parent = document.querySelector('.vc-footer-parent') as HTMLElement;
      const block = parent.querySelector('.vc-footer-parent-links') as HTMLElement;
      const textAbove = document.createRange();
      textAbove.setStartBefore(parent.firstChild!);
      textAbove.setEndBefore(block);
      const parentBox = parent.getBoundingClientRect();
      const blockBox = block.getBoundingClientRect();
      const first = block.querySelector('a') as HTMLElement;
      const lastLine = [...textAbove.getClientRects()].reduce((bottom, r) => Math.max(bottom, r.bottom), 0);
      return {
        display: getComputedStyle(block).display,
        parentLeft: parentBox.left,
        blockLeft: blockBox.left,
        firstLinkLeft: first.getBoundingClientRect().left,
        blockTop: blockBox.top,
        textAboveBottom: lastLine,
        linkLines: new Set([...block.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top))).size,
      };
    });

    expect(geometry.display, 'a block-level box, not an inline one that wraps with the text').toBe('flex');
    expect(Math.abs(geometry.blockLeft - geometry.parentLeft), 'the block starts at the paragraph edge').toBeLessThan(0.5);
    expect(Math.abs(geometry.firstLinkLeft - geometry.blockLeft), 'the first link starts at the block edge — no leading gap').toBeLessThan(0.5);
    expect(geometry.blockTop, 'the links start below the last line of the text').toBeGreaterThanOrEqual(geometry.textAboveBottom - 0.5);
    expect(geometry.linkLines, 'both links on one line').toBe(1);
  });
}
