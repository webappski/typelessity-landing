import { test, expect, type Locator } from '@playwright/test';

// A131 (founder decision #62, 2026-10-03): text and icons on a tangerine fill are dark (--text-on-accent
// #282838), not white — 5.09:1 on #ff6b2b and 6.00:1 on the hover #ff8548, where white was 2.84:1 and
// 2.41:1. Same pair of colours as typelessform.com (591a1f9, A130). The spec does not list buttons: it
// finds every painted tangerine surface that carries text or an icon, on the routes below, at both
// widths, and checks it before and during hover, so a future orange button is covered without anyone
// remembering to add it. White-on-orange is webappski.com's rule (#71) and does not apply here.

const ORANGE = ['rgb(255, 107, 43)', 'rgb(255, 133, 72)'];

async function contrast(element: Locator) {
  return element.evaluate((el, orange) => {
    const luminance = (color: string) => {
      const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const linear = rgb.map((value) => {
        const s = value / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const bg = getComputedStyle(el).backgroundColor;
    if (!orange.includes(bg)) return [{ target: el.className, ratio: 0 }];
    const findings: { target: string; ratio: number }[] = [];
    for (const node of [el, ...el.querySelectorAll('*')]) {
      const style = getComputedStyle(node);
      const ownText = [...node.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      const colors = ownText ? [style.color] : [];
      if (node instanceof SVGElement && !['svg', 'defs'].includes(node.tagName)) {
        for (const color of [style.stroke, style.fill]) {
          if (color !== 'none' && color !== 'rgba(0, 0, 0, 0)') colors.push(color);
        }
      }
      for (const color of colors) {
        const a = luminance(color) + 0.05;
        const b = luminance(bg) + 0.05;
        findings.push({
          target: `${node.tagName} ${node.textContent?.trim().slice(0, 50)} (${color} on ${bg})`,
          ratio: Math.max(a, b) / Math.min(a, b),
        });
      }
    }
    return findings;
  }, ORANGE);
}

for (const width of [390, 1280]) {
  for (const path of ['/', '/pricing', '/how-it-works', '/faq', '/industries', '/blog', '/404-not-a-page']) {
    test(`${path} at ${width}px — orange fills carry dark text, 4.5:1 before and during hover`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const selectors = await page.locator('body *').evaluateAll((elements, orange) => {
        let index = 0;
        return elements
          .filter((el) => {
            const s = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            return orange.includes(s.backgroundColor) && box.width > 0 && box.height > 0 && (el.textContent?.trim() || el.querySelector('svg'));
          })
          .map((el) => {
            const id = `orange-${index++}`;
            el.setAttribute('data-contrast-probe', id);
            return `[data-contrast-probe="${id}"]`;
          });
      }, ORANGE);
      // The header call to action is painted on every route (at 390px it sits in the menu); the home and
      // pricing pages carry more.
      if (width === 1280) expect(selectors.length, 'an orange surface with text should be on this page').toBeGreaterThan(0);
      for (const selector of selectors) {
        const surface = page.locator(selector);
        await page.mouse.move(0, 0);
        const normal = await contrast(surface);
        expect(normal.length, 'text or icon probe must find a foreground').toBeGreaterThan(0);
        expect(normal.filter((x) => x.ratio < 4.5)).toEqual([]);
        if (await surface.isVisible()) {
          await surface.hover({ timeout: 2000 }).catch(() => undefined);
          await page.waitForTimeout(350);
          expect((await contrast(surface)).filter((x) => x.ratio < 4.5)).toEqual([]);
        }
      }
    });
  }
}
