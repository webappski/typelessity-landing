import { test, expect } from '@playwright/test';

// A107 (c8 2026-10-03): the two grey text tokens were #A3A3B8 and #7C7C92 — 541 of 754 text nodes on ten pages
// were under WCAG AA 4.5:1. They are now #a8a8bd (the value typelessform.com took in 5dafb2a) for both
// --text-secondary and --text-muted, and the two surfaces that still held them under 4.5:1 changed: the
// card hover (#434356 -> #3D3D50) and the text of our column in the comparison table (primary text colour).
// The spec reads the computed colour of every visible text node that carries the grey, finds the surface it
// really sits on (alpha layers composited, down to the page background), and fails under 4.5:1 — 3:1 for large
// text. It also hovers every phase card, the one place a surface changes under grey text.
// Text inside the animated demo (role="img") is an illustration, not content, and is skipped.

const ROUTES = ['/', '/pricing', '/how-it-works', '/faq', '/about', '/industries', '/for-ai-agents', '/blog', '/blog/gdpr-compliance', '/industries/beauty-hair-salons'];

async function lowContrast(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const parse = (s: string) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const a = m[1].split(',').map((x) => parseFloat(x));
      return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 };
    };
    const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = (c: { r: number; g: number; b: number }) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const over = (top: { r: number; g: number; b: number; a: number }, bot: { r: number; g: number; b: number }) => ({
      r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a),
    });
    // The colours of the two grey tokens as the browser resolves them — read from the page, so a token changed
    // to a darker value is still the thing being measured.
    const tokenColor = (name: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${name})`;
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    const greys = new Set([tokenColor('--text-secondary'), tokenColor('--text-muted')]);
    const page = parse(getComputedStyle(document.body).backgroundColor) ?? { r: 40, g: 40, b: 56, a: 1 };
    const bad: string[] = [];
    let seen = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const done = new Set<Element>();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || done.has(el) || !n.textContent?.trim() || el.closest('[role="img"]')) continue;
      done.add(el);
      const cs = getComputedStyle(el);
      if (!greys.has(cs.color) || cs.visibility === 'hidden' || el.getBoundingClientRect().width === 0) continue;
      seen++;
      const layers: { r: number; g: number; b: number; a: number }[] = [];
      const textY = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const style = getComputedStyle(e);
        // A vertical gradient (the featured tier card) is painted over the element's own colour: read it at the
        // height of the text. Computed form: linear-gradient(rgba(255, 107, 43, 0.08) 0%, rgb(58, 58, 76) 40%).
        const stops = [...style.backgroundImage.matchAll(/(rgba?\([^)]+\))\s*([\d.]+)%/g)].map((m) => ({ c: parse(m[1])!, at: parseFloat(m[2]) / 100 }));
        if (style.backgroundImage.startsWith('linear-gradient') && stops.length >= 2) {
          const box = e.getBoundingClientRect();
          const f = Math.min(1, Math.max(0, (textY - box.top) / box.height));
          const hi = stops.findIndex((s) => s.at >= f);
          const [s0, s1] = hi <= 0 ? [stops[0], stops[0]] : hi === -1 ? [stops[stops.length - 1], stops[stops.length - 1]] : [stops[hi - 1], stops[hi]];
          const k = s1.at === s0.at ? 0 : (f - s0.at) / (s1.at - s0.at);
          const a = s0.c.a * (1 - k) + s1.c.a * k;
          if (a > 0) {
            const mix = (x: number, y: number) => (x * s0.c.a * (1 - k) + y * s1.c.a * k) / a;
            const g = { r: mix(s0.c.r, s1.c.r), g: mix(s0.c.g, s1.c.g), b: mix(s0.c.b, s1.c.b), a };
            layers.push(g);
            if (a >= 1) break;
          }
        }
        const c = parse(style.backgroundColor);
        if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      }
      let eff: { r: number; g: number; b: number } = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop()! : page;
      for (let i = layers.length - 1; i >= 0; i--) eff = over(layers[i], eff);
      const fs = parseFloat(cs.fontSize);
      const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
      const r = ratio(parse(cs.color)!, eff);
      if (r < (large ? 3 : 4.5)) bad.push(`${el.tagName}.${String(el.className).slice(0, 30)} "${n.textContent.trim().slice(0, 30)}" ${r.toFixed(2)}:1 on rgb(${Math.round(eff.r)},${Math.round(eff.g)},${Math.round(eff.b)})`);
    }
    return { seen, bad };
  });
}

for (const width of [390, 1280]) {
  for (const path of ROUTES) {
    test(`${path} at ${width}px — grey text is 4.5:1 or better on the surface it sits on`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const { seen, bad } = await lowContrast(page);
      expect(seen, 'the page carries grey text, so the probe measures something').toBeGreaterThan(5);
      expect(bad).toEqual([]);
    });
  }
}

test('hovering a phase card keeps its grey text at 4.5:1', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const cards = page.locator('.home-phases .phase');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await cards.nth(i).hover();
    await page.waitForTimeout(350);
    const { bad } = await lowContrast(page);
    expect(bad, `phase card ${i + 1} hovered`).toEqual([]);
  }
});
