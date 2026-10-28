import { test, expect, type Page } from './fixtures';
import { DEMO_CARDS, demoButton } from '../../src/app/pages/demo/demo.content';

// TYL-DEMO-LIVE (28.10): each card of /demo carries the picture of its demo site on top and the button «Open the demo site» below. What a
// person does with them: a screen reader names the button after the site, a keyboard stops once per card, a click on the picture and a click
// on the button open the same site in a new tab and leave /demo open, every picture loads, and the first one is in the first screen at 390.
// The bytes of the build (attributes, order, sizes of the files) are e2e/demo-page-dist.spec.ts. Chromium only.
//
// rel=noopener is not read here: Chromium treats target=_blank as noopener on its own, so a missing attribute cannot be seen in a browser — the bytes
// carry it (demo-page-dist.spec.ts D6, demo.content.spec.ts).
//
// The demo sites are other hosts: the fixture aborts them and fails the test, so the spec answers them itself (a route of the context that
// is registered later wins over the fixture's) — nothing leaves the machine.

const card = (page: Page, id: string) => page.locator(`article[data-demo="${id}"]`);

test.describe('the cards at 1440', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/demo');
  });

  test('C1 the accessible name of each button names the site and the new tab', async ({ page }) => {
    for (const demo of DEMO_CARDS) {
      const button = card(page, demo.id).locator('a.btn');
      await expect(button).toHaveCount(1);
      await expect(button).toHaveAccessibleName(`Open the demo site ${demo.name} (opens in a new tab)`);
    }
  });

  test('C2 the keyboard stops once per card, on the button: Tab from the hero walks glow, autopro, transedge, medbook, then the strip', async ({ page }) => {
    await page.locator('h1').click(); // a click on text sets the point Tab starts from
    const walked: string[] = [];
    for (let i = 0; i < DEMO_CARDS.length + 1; i++) {
      await page.keyboard.press('Tab');
      walked.push(await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return `${el?.closest('article')?.getAttribute('data-demo') ?? (el?.closest('.want') ? 'strip' : el?.tagName ?? 'none')}:${el?.classList.contains('card__shot') ? 'picture' : el?.textContent?.trim().slice(0, 18)}`;
      }));
    }
    expect(walked).toEqual([
      'glow:Open the demo site', 'autopro:Open the demo site', 'transedge:Open the demo site', 'medbook:Open the demo site', 'strip:Get it free',
    ]);
  });

  test('C3 a click on the picture and a click on the button open the same site in a new tab, and /demo stays open', async ({ page, context }) => {
    await context.route((url) => url.hostname.endsWith('.netlify.app'), (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>demo site</title>' }));
    for (const demo of DEMO_CARDS) {
      const href = demoButton(demo).href;
      const opened: string[] = [];
      for (const target of [card(page, demo.id).locator('a.card__shot'), card(page, demo.id).locator('a.btn')]) {
        const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 5000 }), target.click()]);
        await popup.waitForLoadState();
        opened.push(popup.url());
        await popup.close();
      }
      expect(opened, `${demo.id}: picture and button`).toEqual([href, href]);
      expect(page.url()).toMatch(/\/demo$/);
    }
  });

  test('C6 hovering a card — its picture or its button — turns the frame of the card to --border-accent (BRIEF Р3-5)', async ({ page }) => {
    const glow = card(page, 'glow');
    // the colour a border takes from a token, as the browser computes it (the token is rgba with an alpha: compare the computed value, not the text)
    const token = (name: string) => page.evaluate((n) => {
      const probe = document.createElement('div');
      probe.style.cssText = `border:1px solid var(${n});position:absolute;visibility:hidden`;
      document.body.appendChild(probe);
      const colour = getComputedStyle(probe).borderTopColor;
      probe.remove();
      return colour;
    }, name);
    await expect(glow).toHaveCSS('border-top-color', await token('--border'));
    await glow.locator('a.card__shot').hover();
    await expect(glow).toHaveCSS('border-top-color', await token('--border-accent'));
    await page.mouse.move(0, 0);
    await expect(glow).toHaveCSS('border-top-color', await token('--border'));
    await glow.locator('a.btn').hover();
    await expect(glow).toHaveCSS('border-top-color', await token('--border-accent'));
  });

  test('C7 the keyboard focus on the button of AutoPro is drawn: an outline of 2px, solid (the colour of the ring is the site\'s global rule, not this card\'s)', async ({ page }) => {
    await page.locator('h1').click();
    await page.keyboard.press('Tab'); // glow
    await page.keyboard.press('Tab'); // autopro
    const button = card(page, 'autopro').locator('a.btn');
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-style', 'solid');
    await expect(button).toHaveCSS('outline-width', '2px');
    await expect(card(page, 'autopro').locator('a.card__shot')).not.toBeFocused();
  });

  test('C4 every picture loads: HTTP 200, WebP, drawn at its size', async ({ page }) => {
    for (const demo of DEMO_CARDS) {
      const img = card(page, demo.id).locator('img.card__img');
      const response = await page.request.get(`/demo/${demo.id}.webp`);
      expect(response.status(), `${demo.id}.webp`).toBe(200);
      expect(response.headers()['content-type']).toBe('image/webp');
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth), { message: `${demo.id}: the picture did not draw` }).toBe(800);
    }
  });
});

test.describe('the first screen at 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('C5 the picture of the first card starts in the first screen: nothing is above it that would need a «jump to the demos» link', async ({ page }) => {
    await page.goto('/demo');
    const box = await card(page, 'glow').locator('img.card__img').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y, 'the top of the first picture').toBeLessThan(844);
    // the hero carries no link of its own to the cards
    await expect(page.locator('section.sec--hero a')).toHaveCount(0);
  });
});
