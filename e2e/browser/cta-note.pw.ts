import { test, expect, type Page } from './fixtures';
import { EN } from '../../src/app/i18n/translations.en';

// TY-INSTALL (founder 26.10 «всегда, когда юзер нажимает на get it free, надо объяснять…»; 27.10: no visible line in the header from 1021 px, the line is
// read out there). Frames: every test whose title starts with [after-cta-note-…] holds the one statement of its frame (R64, R69 rev. 3): under every button
// into the portal that stands in the page (not in the header) the line EN['nav.getStartedNote'] is visible, below the button or the row of buttons,
// 0 to 32 px from it, in both themes at 390 and 1440, and the page does not scroll sideways. The built HTML side (the line follows every button in its
// section) is e2e/install-config-first.spec.ts (K3). Chromium only.

const NOTE = EN['nav.getStartedNote'];
const PAGES = ['/', '/install', '/how-it-works', '/faq', '/gdpr', '/pricing', '/demo', '/blog/cascade-corrections'];

/** For every button into the portal inside <main>: the first line of the note after it in its section, with the gap to what stands right above the line. */
async function lineUnderButtons(page: Page) {
  return page.evaluate(() => {
    const rows: { button: string; seen: boolean; text: string; gap: number | null; below: boolean | null }[] = [];
    const buttons = [...document.querySelectorAll<HTMLAnchorElement>('main a[href*="portal/login"]')].filter((a) => /\b(vc-btn|btn)\b/.test(a.className));
    for (const a of buttons) {
      const section = a.closest('section') ?? document.body;
      const notes = [...section.querySelectorAll<HTMLElement>('.vc-cta-note')].filter((n) => a.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING);
      const n = notes[0];
      if (!n) { rows.push({ button: a.textContent!.trim(), seen: false, text: '', gap: null, below: null }); continue; }
      const nb = n.getBoundingClientRect();
      const above = n.previousElementSibling as HTMLElement | null;
      const ab = (above ?? a).getBoundingClientRect();
      const visible = nb.width > 0 && nb.height > 0 && getComputedStyle(n).visibility !== 'hidden';
      rows.push({ button: a.textContent!.trim(), seen: visible, text: n.textContent!.trim(), gap: Math.round(nb.top - ab.bottom), below: nb.top >= a.getBoundingClientRect().bottom - 1 });
    }
    return rows;
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} system theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1440]) {
      for (const path of PAGES) {
        test(`[after-cta-note-${path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')}-${width}-${scheme}] ${path} at ${width}px: the line under «Get it free» is visible, below the button, 0 to 32 px from it, and the page does not scroll sideways`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(path);
          const rows = await lineUnderButtons(page);
          expect(rows.length, `${path} has a button into the portal in its content`).toBeGreaterThanOrEqual(1);
          for (const r of rows) {
            expect(r.seen, `the line under «${r.button}» is visible`).toBe(true);
            expect(r.text).toBe(NOTE);
            expect(r.below, `the line is below «${r.button}»`).toBe(true);
            expect(r.gap!, `the gap from «${r.button}» (or its row) to the line`).toBeGreaterThanOrEqual(0);
            expect(r.gap!, `the gap from «${r.button}» (or its row) to the line`).toBeLessThanOrEqual(32);
          }
          const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
          expect(scroll, 'no horizontal scroll').toBeLessThanOrEqual(client);
        });
      }
    }

    test(`[after-cta-note-menu-390-${scheme}] the open phone menu: the line is visible under «Get it free» and the button is described by it`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/install');
      await page.getByRole('button', { name: 'Menu' }).click();
      const button = page.locator('#mobile-menu a.vc-menu-cta');
      const note = page.locator('#menu-cta-note');
      await expect(note).toBeVisible();
      await expect(note).toHaveText(NOTE);
      await expect(button).toHaveAttribute('aria-describedby', 'menu-cta-note');
      const [b, n] = await Promise.all([button.boundingBox(), note.boundingBox()]);
      expect(n!.y - (b!.y + b!.height), 'the line is right under the button').toBeGreaterThanOrEqual(0);
      expect(n!.y - (b!.y + b!.height), 'the line is right under the button').toBeLessThanOrEqual(32);
    });

    test(`[after-cta-note-header-1440-${scheme}] the header at 1440px: the button is described by the line, the line is read out and not shown, the header stays one row`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/install');
      const button = page.locator('header.vc-nav a.vc-nav-cta');
      await expect(button).toHaveAttribute('aria-describedby', 'nav-cta-note');
      const note = page.locator('#nav-cta-note');
      await expect(note).toHaveText(NOTE);
      await expect(note).toHaveCSS('position', 'absolute');
      const box = await note.boundingBox();
      expect(box!.width, 'the line takes no room in the header').toBeLessThanOrEqual(1);
      const header = await page.locator('header.vc-nav').boundingBox();
      expect(header!.height, 'the header stays one row').toBeLessThanOrEqual(80);
    });
  });
}
