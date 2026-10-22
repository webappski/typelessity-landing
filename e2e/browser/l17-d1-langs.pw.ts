import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, REDUCED_MOTION, type Locator, type Page } from './fixtures';
import { LANDING_LANGUAGES } from '../../src/app/core/languages/landing-languages';

// L17 D1 (22.10, founder): the language row of the demo is ONE line «in English Polski Deutsch …+22»; on a computer the list of the other 22 is a
// tooltip of «…+22» (hover, keyboard focus, Enter pins it, Esc closes it — WCAG 1.4.13); on a touch screen there is no «…+22»; the caption under the
// row is one sentence; the «Freight» tab is not drawn at 720 px and below, and nothing scrolls sideways.
// The texts are written out here (not read from the template): a spec that took them from the code would agree with whatever the code says.
// Frames (R64) when L17_FRAMES names a folder.

const FRAMES = process.env['L17_FRAMES'];
async function shot(page: Page, name: string): Promise<void> {
  if (!FRAMES) return;
  mkdirSync(FRAMES, { recursive: true });
  await page.screenshot({ path: join(FRAMES, `${name}.png`), fullPage: false });
}
// the page of the demo stays still: reduced motion keeps the tips and the ring off, so a measure never lands in the middle of one
test.use(REDUCED_MOTION);

const MORE = '[data-langs-more]';
const TIP = '#langs-more';
const box = async (l: Locator) => (await l.boundingBox())!;
/** top of the frame of the widget on the PAGE (hover() scrolls the window, a box in the window would move with it) */
const frameTop = (page: Page): Promise<number> => page.evaluate(() => document.querySelector('.demo__frame')!.getBoundingClientRect().top + window.scrollY);
const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** the label «in» stands inside the height of English and the buttons (and «…+22», when `withMore`) share one line */
async function expectOneLine(row: Locator, codes: string[], withMore: boolean, where: string): Promise<void> {
  const label = await box(row.locator('.demo__label--lang'));
  const items = await Promise.all([...codes.map((c) => row.locator(`button[data-lang="${c}"]`)), ...(withMore ? [row.locator(MORE)] : [])].map(box));
  const tops = items.map((i) => Math.round(i.y));
  expect(Math.max(...tops) - Math.min(...tops), `the buttons share one line ${where}: ${tops.join(',')}`).toBeLessThanOrEqual(1);
  const centre = label.y + label.height / 2;
  expect(centre >= items[0]!.y && centre <= items[0]!.y + items[0]!.height, `«in» stands on the line of English ${where}: centre ${Math.round(centre)} of ${Math.round(items[0]!.y)}..${Math.round(items[0]!.y + items[0]!.height)}`).toBe(true);
}

async function openAt(page: Page, width: number, scheme?: 'light' | 'dark'): Promise<void> {
  if (scheme) await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // hydrated: the tooltip button answers a click only after Angular took the page over — wait for a signal the page sets after hydration
  await expect(page.locator('.demo__langrow')).toBeVisible();
}

// ── a computer: mouse and keyboard ─────────────────────────────────────────────────────────────────────────────────────
for (const scheme of ['light', 'dark'] as const) {
  for (const width of [360, 768, 1280, 1440]) {
    test.describe(`L17-D1 mouse ${width} ${scheme}`, () => {
      test(`[d1-${width}-${scheme}-desk] one row «in English Polski Deutsch …+22», one caption sentence, the list of 22 is a tooltip: hover, keep, Esc, Tab, Enter`, async ({ page }) => {
        await openAt(page, width, scheme);
        const row = page.locator('.demo__langrow');
        // the row near the top of the window: the tooltip (up to 130 px high, 8 px under the row) is wholly in view, so the pointer can be put on it
        await page.evaluate(() => window.scrollTo(0, Math.max(0, document.querySelector('.demo__top')!.getBoundingClientRect().top + window.scrollY - 100)));
        // ONE line: the buttons share a top, the label stands inside their height — none wraps
        await expectOneLine(row, ['en', 'pl', 'de'], true, `at ${width}`);
        await expect(row.locator('button[data-lang]')).toHaveCount(3);
        await expect(row.locator('.lang--more')).toHaveText(/…\s*\+22/);
        // the caption: one sentence, one line
        const note = page.locator('.demo__langnote');
        await expect(note).toHaveText('The chat window comes in 25 languages.');
        expect((await box(note)).height, 'the caption is one line').toBeLessThanOrEqual(22);
        // the button: no title (the browser would show a second tooltip), described by the tooltip, named by its own label
        const more = page.locator(MORE);
        await expect(more).not.toHaveAttribute('title', /.*/);
        await expect(more).toHaveAttribute('aria-describedby', 'langs-more');
        await expect(more).toHaveAttribute('aria-label', '22 more chat languages');
        await expect(page.locator(TIP)).toHaveAttribute('role', 'tooltip');
        await expect(page.locator(TIP)).not.toHaveAttribute('hidden', /.*/);
        await expect(more).toHaveAccessibleDescription(/^22 more chat languages: .*Русский.* This demo plays three of the 25\.$/);
        // closed: not visible, but in the DOM with all 22 names
        await expect(page.locator(TIP)).toBeHidden();
        const text = (await page.locator(TIP).textContent()) ?? '';
        expect(text.startsWith('22 more chat languages:')).toBe(true);
        expect(text.endsWith('This demo plays three of the 25.')).toBe(true);
        for (const l of LANDING_LANGUAGES.slice(3)) expect(text, `${l.native} is in the tooltip`).toContain(l.native);
        for (const l of LANDING_LANGUAGES.slice(0, 3)) expect(text, `${l.native} has its own button`).not.toContain(l.native);

        const frameBefore = await frameTop(page);
        // hover opens
        await shot(page, `d1-${width}-${scheme}-desk-closed`);
        await more.hover();
        await expect(page.locator(TIP)).toBeVisible();
        const tip = await box(page.locator(TIP));
        expect(tip.x, 'inside the window, left').toBeGreaterThanOrEqual(0);
        expect(tip.x + tip.width, 'inside the window, right').toBeLessThanOrEqual(width);
        for (const sel of ['.tabs', '.langs']) expect(overlap(tip, await box(page.locator(sel))), `the tooltip does not cover ${sel}`).toBe(false);
        expect(await frameTop(page), 'the frame of the widget does not move when the tooltip opens').toBe(frameBefore);
        await shot(page, `d1-${width}-${scheme}-desk-hover`);
        // the way from the button to the tooltip crosses a gap: the tooltip stays (WCAG 1.4.13 hoverable)
        const b = await box(more);
        await page.mouse.move(b.x + b.width / 2, b.y + b.height + 4, { steps: 3 });
        await expect(page.locator(TIP)).toBeVisible();
        await page.mouse.move(tip.x + tip.width / 2, tip.y + tip.height / 2, { steps: 4 });
        await expect(page.locator(TIP), 'the pointer is on the tooltip: it stays').toBeVisible();
        // Esc closes while the pointer is still over it (WCAG 1.4.13 dismissible)
        await page.keyboard.press('Escape');
        await expect(page.locator(TIP)).toBeHidden();
        // out and in again: it opens again
        await page.mouse.move(2, 2);
        await more.hover();
        await expect(page.locator(TIP)).toBeVisible();
        await page.mouse.move(2, 2);
        await expect(page.locator(TIP)).toBeHidden();

        // keyboard: Tab from the last language button reaches «…+22» and the tooltip opens; Esc closes it
        await page.locator('button[data-lang="de"]').focus();
        await page.keyboard.press('Tab');
        await expect(more).toBeFocused();
        await expect(page.locator(TIP)).toBeVisible();
        await shot(page, `d1-${width}-${scheme}-desk-focus`);
        await page.keyboard.press('Escape');
        await expect(page.locator(TIP)).toBeHidden();
        // Enter pins it: it stays after the focus has left
        await page.keyboard.press('Enter');
        await expect(more).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator(TIP)).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(more).not.toBeFocused();
        await expect(page.locator(TIP), 'pinned by Enter: stays after the focus left').toBeVisible();
        await page.locator(MORE).focus();
        await page.keyboard.press('Enter');
        await expect(more).toHaveAttribute('aria-expanded', 'false');
        await page.mouse.move(2, 2);
        await page.locator('button[data-lang="de"]').focus();
        await expect(page.locator(TIP)).toBeHidden();
      });
    });
  }
}

// ── a touch screen: no «…+22», three tabs up to 720 px, no scrolling sideways ─────────────────────────────────────────────
test.describe('L17-D1 touch', () => {
  test.use({ hasTouch: true, isMobile: true });
  for (const scheme of ['light', 'dark'] as const) {
    for (const width of [320, 360, 390, 430, 768]) {
      test(`[d1-${width}-${scheme}-touch] no «…+22», three buttons, «in» on the line of English, ${width <= 720 ? 'three tabs (no Freight)' : 'four tabs'}, nothing scrolls sideways`, async ({ page }) => {
        await openAt(page, width, scheme);
        const row = page.locator('.demo__langrow');
        await expect(row.locator(MORE)).toBeHidden();
        await expect(row.locator('button[data-lang]')).toHaveCount(3);
        await expectOneLine(row, ['en', 'pl', 'de'], false, `at ${width}`);
        const tabs = page.locator('[data-scenario-tab]');
        await expect(tabs).toHaveCount(4); // all four stay in the DOM
        await expect(page.locator('[data-scenario-tab="freight"]')).toBeVisible({ visible: width > 720 });
        const shown = await tabs.evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).map((e) => e.getAttribute('data-scenario-tab')));
        expect(shown).toEqual(width <= 720 ? ['salon', 'garage', 'table'] : ['salon', 'garage', 'table', 'freight']);
        const scroll = await page.evaluate(() => ({ page: document.documentElement.scrollWidth - innerWidth, tabs: (document.querySelector('.tabs') as HTMLElement).scrollWidth - (document.querySelector('.tabs') as HTMLElement).clientWidth }));
        expect(scroll.page, 'the page does not scroll sideways').toBeLessThanOrEqual(0);
        expect(scroll.tabs, 'the tabs do not scroll sideways').toBeLessThanOrEqual(0);
        await expect(page.locator('.demo__langnote')).toHaveText('The chat window comes in 25 languages.');
        expect((await box(page.locator('.demo__langnote'))).height, 'the caption is one line').toBeLessThanOrEqual(22);
        await shot(page, `d1-${width}-${scheme}-touch`);
      });
    }
  }

  test('300 to 720 px every 20 px: three tabs, no scroll of the page or of the tabs, the caption on one line', async ({ page }) => {
    test.setTimeout(120_000);
    await openAt(page, 300);
    for (let w = 300; w <= 720; w += 20) {
      await page.setViewportSize({ width: w, height: 900 });
      const m = await page.evaluate(() => {
        const tabs = document.querySelector('.tabs') as HTMLElement;
        const note = document.querySelector('.demo__langnote') as HTMLElement;
        return {
          page: document.documentElement.scrollWidth - innerWidth, tabs: tabs.scrollWidth - tabs.clientWidth,
          shown: [...document.querySelectorAll('[data-scenario-tab]')].filter((e) => e.getClientRects().length > 0).length,
          note: note.getBoundingClientRect().height,
        };
      });
      expect(m.page, `page scroll at ${w}`).toBeLessThanOrEqual(0);
      expect(m.tabs, `tabs scroll at ${w}`).toBeLessThanOrEqual(0);
      expect(m.shown, `tabs at ${w}`).toBe(3);
      expect(m.note, `caption at ${w}`).toBeLessThanOrEqual(22);
    }
  });
});
