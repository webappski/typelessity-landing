import { test, expect, type Page } from './fixtures';
import { SITEMAP_PATHS_WITH_404 } from './sitemap-paths';

// A131 (founder decision #62, 2026-10-03): text and icons on a tangerine fill are dark (--text-on-accent), not white. L3
// (2026-10-19, B3, F2) rebuilds the finder, because the fill is no longer one flat colour:
//   - the orange is READ from the page (the computed --accent and --accent2/--accent-hover), not typed here; the old literal
//     of two rgb() values found nothing the moment the tokens changed, and 1280 went red on «no surface» while 390 passed
//     with nothing measured;
//   - a fill may be a gradient (the mock's primary button is #F77300 → #FA8A01): its stops are parsed, an element counts as
//     an orange surface when its colour or any stop is a token colour or has an orange hue, and the text and icons on it are
//     measured against EVERY stop (the worst one decides) — a stop that is darker orange (the light --grad starts at #E26400,
//     4.08:1 for dark text) is exactly what this catches;
//   - every route of the sitemap (+ the 404 shell), at 390 and 1280, in both themes; at 390 the menu is opened and the call to
//     action inside it is measured too, and a width that measures nothing fails.
// Each surface is checked before and during hover. White-on-orange is webappski.com's rule (#71) and does not apply here.
// The site follows the system theme: both schemes are set explicitly (F7).

const HELPERS = String.raw`
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/);
    if (m) { const a = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; }
    m = s.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (m) return { r: parseFloat(m[1]) * 255, g: parseFloat(m[2]) * 255, b: parseFloat(m[3]) * 255, a: m[4] === undefined ? 1 : parseFloat(m[4]) };
    return null;
  };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = Math.max(lum(a), lum(b)), y = Math.min(lum(a), lum(b)); return (x + 0.05) / (y + 0.05); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const tokenColor = (css) => { const probe = document.createElement('span'); probe.style.backgroundColor = css; document.body.appendChild(probe); const c = parse(getComputedStyle(probe).backgroundColor); probe.remove(); return c; };
  const tokens = [tokenColor('var(--accent)'), tokenColor('var(--accent2, var(--accent-hover, transparent))')].filter((c) => c && c.a > 0);
  const same = (a, b) => Math.abs(a.r - b.r) < 1.5 && Math.abs(a.g - b.g) < 1.5 && Math.abs(a.b - b.b) < 1.5;
  const orangeHue = (c) => { const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b); if (c.r < max || max === 0 || (max - min) / max < 0.78) return false; const h = 60 * ((c.g - c.b) / (max - min)); return h >= 12 && h <= 42; };
  const isOrange = (c) => c.a >= 0.99 && (tokens.some((t) => same(t, c)) || orangeHue(c));
  const split = (s) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  // The opaque colours that can sit under the letters of el: its own fill, or every stop of its linear-gradient; null if the fill is not orange.
  const fillOf = (el) => {
    const cs = getComputedStyle(el);
    const colors = [];
    const bg = parse(cs.backgroundColor);
    if (bg && bg.a >= 0.99) colors.push(bg);
    // A gradient that is only a thin line (the underline of a link in an article: background-size 100% 1.5px) is not a fill under the letters.
    const sizeY = cs.backgroundSize.split(' ')[1] || '';
    const thin = /calc/.test(cs.backgroundSize) || (/px$/.test(sizeY) && parseFloat(sizeY) < el.getBoundingClientRect().height * 0.6);
    const open = thin ? -1 : cs.backgroundImage.indexOf('linear-gradient(');
    if (open >= 0) {
      let depth = 0, end = -1;
      for (let i = open + 15; i < cs.backgroundImage.length; i++) { if (cs.backgroundImage[i] === '(') depth++; if (cs.backgroundImage[i] === ')') { depth--; if (depth === 0) { end = i; break; } } }
      for (const arg of split(cs.backgroundImage.slice(open + 16, end))) { const c = parse(arg); if (c && c.a >= 0.99) colors.push(c); }
    }
    return colors.some(isOrange) ? colors : null;
  };
`;

const DISCOVER = String.raw`(onlyTopmost, prefix) => {
  ${HELPERS}
  let index = 0;
  const found = [];
  for (const el of document.querySelectorAll('body *')) {
    const box = el.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0) || getComputedStyle(el).visibility === 'hidden') continue;
    if (!fillOf(el) || !((el.textContent || '').trim() || el.querySelector('svg'))) continue;
    if (onlyTopmost) {
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (!top || !(el === top || el.contains(top))) continue;
    }
    const id = prefix + '-' + index++;
    el.setAttribute('data-contrast-probe', id);
    found.push(id);
  }
  return found;
}`;

const MEASURE = String.raw`(id) => {
  ${HELPERS}
  const el = document.querySelector('[data-contrast-probe="' + id + '"]');
  const stops = fillOf(el);
  const findings = [];
  for (const node of [el, ...el.querySelectorAll('*')]) {
    const style = getComputedStyle(node);
    const ownText = Array.from(node.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const colors = ownText ? [style.color] : [];
    if (node instanceof SVGElement && !['svg', 'defs'].includes(node.tagName)) {
      for (const color of [style.stroke, style.fill]) if (color !== 'none' && color !== 'rgba(0, 0, 0, 0)') colors.push(color);
    }
    for (const color of colors) {
      const fg = parse(color);
      if (!fg) continue;
      let worst = Infinity, worstStop = null;
      for (const stop of stops) { const q = ratio(over(fg, stop), stop); if (q < worst) { worst = q; worstStop = stop; } }
      findings.push({ target: node.tagName + ' ' + (node.textContent || '').trim().slice(0, 50) + ' (' + color + ' on rgb(' + Math.round(worstStop.r) + ',' + Math.round(worstStop.g) + ',' + Math.round(worstStop.b) + '), ' + stops.length + ' fill colour(s))', ratio: worst });
    }
  }
  return findings;
}`;

type Finding = { target: string; ratio: number };
const discover = (page: Page, onlyTopmost: boolean, prefix: string) => page.evaluate(`(${DISCOVER})(${onlyTopmost}, ${JSON.stringify(prefix)})`) as Promise<string[]>;
const measure = (page: Page, id: string) => page.evaluate(`(${MEASURE})(${JSON.stringify(id)})`) as Promise<Finding[]>;

async function checkSurfaces(page: Page, ids: string[]): Promise<void> {
  for (const id of ids) {
    const surface = page.locator(`[data-contrast-probe="${id}"]`);
    await page.mouse.move(0, 0);
    const normal = await measure(page, id);
    expect(normal.length, 'text or icon probe must find a foreground').toBeGreaterThan(0);
    expect(normal.filter((x) => x.ratio < 4.5)).toEqual([]);
    if (await surface.isVisible()) {
      await surface.hover({ timeout: 2000 }).catch(() => undefined);
      await page.waitForTimeout(350);
      expect((await measure(page, id)).filter((x) => x.ratio < 4.5)).toEqual([]);
    }
  }
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const width of [390, 1280]) {
      for (const path of SITEMAP_PATHS_WITH_404) {
        test(`${path} at ${width}px — orange fills carry dark text, 4.5:1 before and during hover`, async ({ page }) => {
          await page.setViewportSize({ width, height: 844 });
          await page.goto(path, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          const ids = await discover(page, false, 'page');
          // The header call to action is painted on every route (at 390px it sits in the menu, measured below); the home and
          // pricing pages carry more.
          if (width === 1280) expect(ids.length, 'an orange surface with text should be on this page').toBeGreaterThan(0);
          await checkSurfaces(page, ids);

          if (width === 390) {
            const burger = page.getByRole('button', { name: /menu/i });
            await burger.click();
            await expect(burger).toHaveAttribute('aria-expanded', 'true');
            const inMenu = await discover(page, true, 'menu');
            expect(inMenu.length, 'the call to action inside the open menu is an orange surface with text').toBeGreaterThan(0);
            await checkSurfaces(page, inMenu);
          }
        });
      }
    }
  });
}
