import { test, expect } from './fixtures';
import { join } from 'node:path';
import { BADGE, COPY } from '../free-pilot-copy';

const HREF = 'https://webappski.com/en/free-aeo-pilot?utm_source=typelessity.com&utm_campaign=free-pilot&utm_medium=banner';
const HERO = '.home-hero__grid';

// The local app renders normally; only unrelated external services are blocked.
test.beforeEach(async ({ page }) => {
  await page.route(/cloudfunctions\.net|firestore\.googleapis\.com|ai-form-copilot-eu\.web\.app\/widget|google-analytics\.com|googletagmanager\.com/, route => route.abort());
});

test('home has the exact compact offer and a real application anchor', async ({ page }) => {
  await page.goto('/');
  const offer = page.getByTestId('free-pilot-offer');
  await expect(offer).toHaveCount(1);
  await expect(offer).toHaveAccessibleName(COPY[2]);
  await expect(offer).toHaveText(COPY.join(' '), { useInnerText: true });
  await expect(offer.locator('h1, h2, form')).toHaveCount(0);
  const link = offer.getByRole('link', { name: COPY[3], exact: true });
  await expect(link).toHaveAttribute('href', HREF);
  expect(await link.getAttribute('target')).toBeNull();
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await offer.evaluate((node, hero) => !!(node.compareDocumentPosition(document.querySelector(hero)!) & Node.DOCUMENT_POSITION_FOLLOWING), HERO)).toBe(true);
});

test('the badge names Webappski and the application link leaves for webappski.com', async ({ page }) => {
  await page.goto('/');
  // The badge comes first: it is the requirement. The host below is weaker than the exact HREF checked
  // in the test above, so it is not an independent guard; it states the brief's wording.
  await expect(page.getByTestId('free-pilot-offer').locator('.pilot-offer__badge')).toHaveText(BADGE);
  const href = await page.getByTestId('pilot-hook-button').getAttribute('href');
  expect(new URL(href!).hostname).toBe('webappski.com');
});

for (const width of [320, 390, 800, 850, 1024, 1440]) {
  test(`offer is contained, padded and separated from hero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const offer = page.getByTestId('free-pilot-offer');
    await expect(offer).toBeVisible();
    const metrics = await offer.evaluate((node, heroSelector) => {
      const card = node as HTMLElement;
      const rect = card.getBoundingClientRect();
      // L3 (F18-3): the header is in the flow (sticky) and `main` has no padding-top of its own any more, so the gap is
      // measured from the bottom edge of the header the way it always was — not from a number the old fixed header implied.
      const header = document.querySelector('header')!.getBoundingClientRect();
      const hero = document.querySelector(heroSelector)!.getBoundingClientRect();
      const copy = card.querySelector('.pilot-offer__copy')!.getBoundingClientRect();
      const action = card.querySelector('.pilot-offer__action')!.getBoundingClientRect();
      const link = card.querySelector('a')!.getBoundingClientRect();
      // Where the note's text actually sits, not its block box: it must read as the button's caption.
      const noteRange = document.createRange();
      noteRange.selectNodeContents(card.querySelector('.pilot-offer__note')!);
      const note = noteRange.getBoundingClientRect();
      const badge = card.querySelector('.pilot-offer__badge')!;
      const badgeStyle = getComputedStyle(badge);
      // The pill must not break inside: its text height without the vertical padding stays within 1.5 lines.
      const badgeTextHeight = badge.getBoundingClientRect().height - parseFloat(badgeStyle.paddingTop) - parseFloat(badgeStyle.paddingBottom);
      const badgeLineHeight = parseFloat(badgeStyle.lineHeight);
      const rgb = (color: string) => color.match(/[\d.]+/g)!.map(Number);
      const foreground = rgb(badgeStyle.color);
      const background = rgb(badgeStyle.backgroundColor);
      const base = rgb(getComputedStyle(card).backgroundColor);
      const alpha = background[3] ?? 1;
      const composite = background.slice(0, 3).map((value, i) => value * alpha + base[i] * (1 - alpha));
      const luminance = (color: number[]) => color.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const light = luminance(foreground), dark = luminance(composite);
      const badgeContrast = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
      const style = getComputedStyle(card);
      return { left: rect.left, right: rect.right, topGap: rect.top - header.bottom,
        heroGap: hero.top - rect.bottom, paddingBottom: parseFloat(style.paddingBottom),
        borderLeft: parseFloat(style.borderLeftWidth), radius: parseFloat(style.borderRadius),
        buttonHeight: link.height, buttonLeft: link.left, buttonRight: link.right,
        buttonCenter: link.left + link.width / 2, noteCenter: note.left + note.width / 2,
        noteLeft: note.left, noteRight: note.right,
        copyRight: copy.right, copyBottom: copy.bottom, actionLeft: action.left, actionTop: action.top,
        viewportWidth: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        cardOverflow: card.scrollWidth > card.clientWidth + 1, badgeContrast, badgeTextHeight, badgeLineHeight };
    }, HERO);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(width);
    expect(metrics.topGap).toBeGreaterThanOrEqual(32);
    expect(metrics.heroGap).toBeCloseTo(32, 0);
    expect(metrics.paddingBottom).toBe(width <= 850 ? 24 : 32);
    expect(metrics.borderLeft).toBe(4);
    expect(metrics.radius).toBe(12);
    expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.buttonLeft).toBeGreaterThan(metrics.left);
    expect(metrics.buttonRight).toBeLessThan(metrics.right);
    // The note is centred under the button and never wider than it (code review 2026-10-10, 768–850px).
    expect(Math.abs(metrics.noteCenter - metrics.buttonCenter)).toBeLessThanOrEqual(1);
    expect(metrics.noteLeft).toBeGreaterThanOrEqual(metrics.buttonLeft - 1);
    expect(metrics.noteRight).toBeLessThanOrEqual(metrics.buttonRight + 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.cardOverflow).toBe(false);
    expect(metrics.badgeContrast).toBeGreaterThanOrEqual(4.5);
    // `line-height: normal` parses to NaN and would let the next line pass silently.
    expect(metrics.badgeLineHeight).toBeGreaterThan(0);
    expect(metrics.badgeTextHeight).toBeLessThanOrEqual(1.5 * metrics.badgeLineHeight);
    if (width <= 850) expect(metrics.actionTop).toBeGreaterThanOrEqual(metrics.copyBottom + 16);
    else expect(metrics.actionLeft).toBeGreaterThanOrEqual(metrics.copyRight + 32);
    if (process.env['PILOT_PROOF_DIR'] && [390, 1440].includes(width)) {
      await page.screenshot({ path: join(process.env['PILOT_PROOF_DIR'], `typelessity-${width}.png`) });
    }
  });
}

// L3 (F7): the badge is measured in BOTH themes — the site follows the system theme, and Playwright's default scheme is light,
// so the test above sees only one. Same formula as the test above: the badge text against the badge fill composited on the card.
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const width of [390, 1440]) {
      test(`the badge is 4.5:1 or better at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/');
        const badgeContrast = await page.getByTestId('free-pilot-offer').evaluate((card) => {
          const badge = card.querySelector('.pilot-offer__badge')!;
          const rgb = (color: string) => color.match(/[\d.]+/g)!.map(Number);
          const foreground = rgb(getComputedStyle(badge).color);
          const background = rgb(getComputedStyle(badge).backgroundColor);
          const base = rgb(getComputedStyle(card).backgroundColor);
          const alpha = background[3] ?? 1;
          const composite = background.slice(0, 3).map((value, i) => value * alpha + base[i] * (1 - alpha));
          const luminance = (color: number[]) => color.slice(0, 3).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
          const light = luminance(foreground), dark = luminance(composite);
          return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
        });
        expect(badgeContrast).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}

test('new top offer stays home-only', async ({ page }) => {
  for (const route of ['/pricing', '/how-it-works', '/faq', '/for-ai-agents']) {
    await page.goto(route);
    await expect(page.getByTestId('free-pilot-offer')).toHaveCount(0);
  }
});

test('keyboard CTA natively requests the application without a dialog', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', dialog => { dialogs.push(dialog.message()); void dialog.dismiss(); });
  await page.goto('/');
  const link = page.getByTestId('free-pilot-offer').getByRole('link', { name: COPY[3], exact: true });
  await link.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  expect(await link.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
  // Capture the actual outgoing URL. This boundary marker does not simulate or validate the form.
  await page.route('https://webappski.com/en/free-aeo-pilot?**', route => route.fulfill({
    contentType: 'text/html', body: '<title>Application navigation boundary</title>'
  }));
  const outgoing = page.waitForRequest(request => request.isNavigationRequest() && request.url() === HREF);
  await page.keyboard.press('Enter');
  expect((await outgoing).url()).toBe(HREF);
  await expect(page).toHaveURL(HREF);
  expect(dialogs).toEqual([]);
});

test('built home exposes the compact offer and link without JavaScript', async ({ request, browser }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  const fragment = html.match(/<aside\b[^>]*data-testid="free-pilot-offer"[^>]*>[\s\S]*?<\/aside>/)?.[0];
  expect(fragment, 'offer must exist in real prerendered HTML').toBeTruthy();
  for (const text of COPY) expect(fragment).toContain(text);
  const href = fragment!.match(/href="([^"]+)"/)?.[1].replace(/&amp;/g, '&');
  expect(href).toBe('https://webappski.com/en/free-aeo-pilot?utm_source=typelessity.com&utm_campaign=free-pilot&utm_medium=banner');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: response.url() });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByTestId('free-pilot-offer')).toBeVisible();
    await expect(page.getByTestId('pilot-hook-button')).toHaveAttribute('href', href!);
  } finally { await context.close(); }
});
