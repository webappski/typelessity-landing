import { test, expect } from '@playwright/test';

// The page heroes are left-aligned, but .vc-section-sub carries `margin: 0 auto` for the centred
// section headers — so under a left-aligned h1 the subtitle floated to the middle of the column
// (seen on /pricing, 2026-09-25). The subtitle's left edge must sit on the heading's.

const HEROES = [
  { path: '/pricing', section: '.pricing-hero' },
  { path: '/faq', section: '.faq-hero' },
  { path: '/industries', section: '.industries-hero' },
  { path: '/how-it-works', section: '.how-hero' },
];

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  for (const { path, section } of HEROES) {
    test(`${path} at ${viewport.width}px: the subtitle starts where the heading starts`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const heading = await page.locator(`${section} h1`).boundingBox();
      const subtitle = await page.locator(`${section} .vc-section-sub`).first().boundingBox();
      expect(heading, `${section} h1`).not.toBeNull();
      expect(subtitle, `${section} .vc-section-sub`).not.toBeNull();
      expect(Math.abs(subtitle!.x - heading!.x)).toBeLessThanOrEqual(1);
    });
  }
}
