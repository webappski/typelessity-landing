import { test, expect, type Page } from './fixtures';

// TY-DEMO (25.10): the «Demo» link of the header and the /demo page it leads to. Written before the code (red-before): at the
// commit that adds the page this file is green, and it stays — the nav is the one place a visitor finds the demo sites.
// It holds only what does not depend on the mock: a link whose text is «Demo» and whose address is /demo, in the nav at 1440 and in
// the open menu at 390, and an address that answers 200. Where in the row it stands, how it looks and what the page prints is the
// mock (designer, TY-DEMO/mocks/) and is held by the specs written after the mock is approved. Chromium only.

const burger = (page: Page) => page.getByRole('button', { name: /menu/i });
const desktopDemo = (page: Page) => page.locator('header.vc-nav nav[aria-label="Primary"]').getByRole('link', { name: 'Demo', exact: true });
const menuDemo = (page: Page) => page.locator('.vc-mobile-menu').getByRole('link', { name: 'Demo', exact: true });

test.describe('the header at 1440', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
  });

  test('N1 the nav has a link «Demo» to /demo', async ({ page }) => {
    await expect(desktopDemo(page)).toBeVisible();
    await expect(desktopDemo(page)).toHaveAttribute('href', '/demo');
  });

  test('N2 a click on it opens /demo', async ({ page }) => {
    await desktopDemo(page).click();
    await expect(page).toHaveURL(/\/demo$/);
  });
});

test.describe('the menu at 390', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await burger(page).click();
    await expect(page.locator('.vc-mobile-menu')).toBeVisible();
  });

  test('N3 the open menu has a link «Demo» to /demo', async ({ page }) => {
    await expect(menuDemo(page)).toBeVisible();
    await expect(menuDemo(page)).toHaveAttribute('href', '/demo');
  });

  test('N4 a click on it opens /demo and closes the menu', async ({ page }) => {
    await menuDemo(page).click();
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.locator('.vc-mobile-menu')).toHaveCount(0);
  });
});

// The platform serves the prerendered file of the address; the local server does the same for a file it has and answers an unknown
// address with the 404 screen and status 404 (app.routes.server.ts, '**'). So 200 here is a page, not the fallback.
test('N5 /demo answers 200', async ({ page }) => {
  const response = await page.goto('/demo');
  expect(response?.status()).toBe(200);
});
